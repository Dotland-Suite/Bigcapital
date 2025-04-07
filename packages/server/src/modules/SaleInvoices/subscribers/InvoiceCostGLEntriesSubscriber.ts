import { Injectable } from '@nestjs/common';
import { IInventoryCostLotsGLEntriesWriteEvent } from '@/modules/InventoryCost/types/InventoryCost.types';
import { SaleInvoiceCostGLEntries } from '../SaleInvoiceCostGLEntries';

@Injectable()
export class InvoiceCostGLEntriesSubscriber {
  constructor(private readonly invoiceCostEntries: SaleInvoiceCostGLEntries) {}

  /**
   * Writes the invoices cost GL entries once the inventory cost lots be written.
   * @param {IInventoryCostLotsGLEntriesWriteEvent}
   */
  async writeInvoicesCostEntriesOnCostLotsWritten({
    trx,
    startingDate,
  }: IInventoryCostLotsGLEntriesWriteEvent) {
    await this.invoiceCostEntries.writeInventoryCostJournalEntries(
      startingDate,
      trx,
    );
  }
}
