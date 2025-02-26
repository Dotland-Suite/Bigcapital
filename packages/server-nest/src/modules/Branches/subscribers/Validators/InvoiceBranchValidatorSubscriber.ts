import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { events } from '@/common/events/events';
import { ValidateBranchExistance } from '../../Integrations/ValidateBranchExistance';
import {
  ISaleInvoiceCreatingPaylaod,
  ISaleInvoiceEditingPayload,
} from '@/modules/SaleInvoices/SaleInvoice.types';

@Injectable()
export class InvoiceBranchValidateSubscriber {
  constructor(
    private readonly validateBranchExistance: ValidateBranchExistance,
  ) {}

  /**
   * Validate branch existance on invoice creating.
   * @param {ISaleInvoiceCreatingPayload} payload
   */
  @OnEvent(events.saleInvoice.onCreating)
  async validateBranchExistanceOnInvoiceCreating({
    saleInvoiceDTO,
  }: ISaleInvoiceCreatingPaylaod) {
    await this.validateBranchExistance.validateTransactionBranchWhenActive(
      saleInvoiceDTO.branchId,
    );
  }

  /**
   * Validate branch existance once invoice editing.
   * @param {ISaleInvoiceEditingPayload} payload
   */
  @OnEvent(events.saleInvoice.onEditing)
  async validateBranchExistanceOnInvoiceEditing({
    saleInvoiceDTO,
  }: ISaleInvoiceEditingPayload) {
    await this.validateBranchExistance.validateTransactionBranchWhenActive(
      saleInvoiceDTO.branchId,
    );
  }
}
