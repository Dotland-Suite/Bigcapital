import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import {
  ISaleInvoiceDeletePayload,
  ISaleInvoiceDeletedPayload,
  ISaleInvoiceDeletingPayload,
} from '../SaleInvoice.types';
import { ItemEntry } from '@/modules/Items/models/ItemEntry';
import { SaleInvoice } from '../models/SaleInvoice';
import { UnlinkConvertedSaleEstimate } from '@/modules/SaleEstimates/commands/UnlinkConvertedSaleEstimate.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';
import { events } from '@/common/events/events';
import { PaymentReceivedEntry } from '@/modules/PaymentReceived/models/PaymentReceivedEntry';
import { CreditNoteAppliedInvoice } from '@/modules/CreditNotes/models/CreditNoteAppliedInvoice';

@Injectable()
export class DeleteSaleInvoice {
  constructor(
    private unlockEstimateFromInvoice: UnlinkConvertedSaleEstimate,
    private eventPublisher: EventEmitter2,
    private uow: UnitOfWork,

    @Inject(PaymentReceivedEntry.name)
    private paymentReceivedEntryModel: typeof PaymentReceivedEntry,

    @Inject(CreditNoteAppliedInvoice.name)
    private creditNoteAppliedInvoiceModel: typeof CreditNoteAppliedInvoice,

    @Inject(SaleInvoice.name)
    private saleInvoiceModel: typeof SaleInvoice,
  ) {}

  /**
   * Validate the sale invoice has no payment entries.
   * @param {number} saleInvoiceId
   */
  private async validateInvoiceHasNoPaymentEntries(saleInvoiceId: number) {
    // Retrieve the sale invoice associated payment receive entries.
    const entries = await this.paymentReceivedEntryModel
      .query()
      .where('invoice_id', saleInvoiceId);

    if (entries.length > 0) {
      throw new ServiceError(ERRORS.INVOICE_HAS_ASSOCIATED_PAYMENT_ENTRIES);
    }
    return entries;
  }

  /**
   * Validate the sale invoice has no applied to credit note transaction.
   * @param {number} invoiceId - Invoice id.
   * @returns {Promise<void>}
   */
  public validateInvoiceHasNoAppliedToCredit = async (
    invoiceId: number,
  ): Promise<void> => {
    const appliedTransactions = await this.creditNoteAppliedInvoiceModel
      .query()
      .where('invoiceId', invoiceId);

    if (appliedTransactions.length > 0) {
      throw new ServiceError(ERRORS.SALE_INVOICE_HAS_APPLIED_TO_CREDIT_NOTES);
    }
  };

  /**
   * Deletes the given sale invoice with associated entries
   * and journal transactions.
   * @param {Number} saleInvoiceId - The given sale invoice id.
   * @param {ISystemUser} authorizedUser -
   */
  public async deleteSaleInvoice(saleInvoiceId: number): Promise<void> {
    // Retrieve the given sale invoice with associated entries
    // or throw not found error.
    const oldSaleInvoice = await this.saleInvoiceModel
      .query()
      .findById(saleInvoiceId)
      .withGraphFetched('entries')
      .withGraphFetched('paymentMethods')
      .throwIfNotFound();

    // Validate the sale invoice has no associated payment entries.
    await this.validateInvoiceHasNoPaymentEntries(saleInvoiceId);

    // Validate the sale invoice has applied to credit note transaction.
    await this.validateInvoiceHasNoAppliedToCredit(saleInvoiceId);

    // Triggers `onSaleInvoiceDelete` event.
    await this.eventPublisher.emitAsync(events.saleInvoice.onDelete, {
      oldSaleInvoice,
      saleInvoiceId,
    } as ISaleInvoiceDeletePayload);

    // Deletes sale invoice transaction and associate transactions with UOW env.
    return this.uow.withTransaction(async (trx: Knex.Transaction) => {
      // Triggers `onSaleInvoiceDeleting` event.
      await this.eventPublisher.emitAsync(events.saleInvoice.onDeleting, {
        oldSaleInvoice,
        saleInvoiceId,
        trx,
      } as ISaleInvoiceDeletingPayload);

      // Unlink the converted sale estimates from the given sale invoice.
      await this.unlockEstimateFromInvoice.unlinkConvertedEstimateFromInvoice(
        saleInvoiceId,
        trx,
      );
      await ItemEntry.query(trx)
        .where('reference_id', saleInvoiceId)
        .where('reference_type', 'SaleInvoice')
        .delete();

      await SaleInvoice.query(trx).findById(saleInvoiceId).delete();

      // Triggers `onSaleInvoiceDeleted` event.
      await this.eventPublisher.emitAsync(events.saleInvoice.onDeleted, {
        oldSaleInvoice,
        saleInvoiceId,
        trx,
      } as ISaleInvoiceDeletedPayload);
    });
  }
}
