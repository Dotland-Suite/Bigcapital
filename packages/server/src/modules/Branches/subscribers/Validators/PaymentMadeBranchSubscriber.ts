import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import {
  IBillPaymentCreatingPayload,
  IBillPaymentEditingPayload,
} from '@/modules/BillPayments/types/BillPayments.types';
import { ValidateBranchExistance } from '../../Integrations/ValidateBranchExistance';
import { events } from '@/common/events/events';

@Injectable()
export class PaymentMadeBranchValidateSubscriber {
  constructor(
    private readonly validateBranchExistance: ValidateBranchExistance,
  ) {}

  /**
   * Validate branch existance on estimate creating.
   * @param {ISaleEstimateCreatedPayload} payload
   */
  @OnEvent(events.billPayment.onCreating)
  async validateBranchExistanceOnPaymentCreating({
    billPaymentDTO,
  }: IBillPaymentCreatingPayload) {
    await this.validateBranchExistance.validateTransactionBranchWhenActive(
      billPaymentDTO.branchId,
    );
  }

  /**
   * Validate branch existance once estimate editing.
   * @param {ISaleEstimateEditingPayload} payload
   */
  @OnEvent(events.billPayment.onEditing)
  async validateBranchExistanceOnPaymentEditing({
    billPaymentDTO,
  }: IBillPaymentEditingPayload) {
    await this.validateBranchExistance.validateTransactionBranchWhenActive(
      billPaymentDTO.branchId,
    );
  }
}
