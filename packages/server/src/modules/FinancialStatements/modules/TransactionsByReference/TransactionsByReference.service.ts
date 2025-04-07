import { Injectable } from '@nestjs/common';
import {
  ITransactionsByReferencePojo,
  ITransactionsByReferenceQuery,
} from './TransactionsByReference.types';
import { TransactionsByReferenceRepository } from './TransactionsByReferenceRepository';
import { TransactionsByReference } from './TransactionsByReferenceReport';
import { getTransactionsByReferenceQuery } from './_utils';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';

@Injectable()
export class TransactionsByReferenceService {
  constructor(
    private readonly repository: TransactionsByReferenceRepository,
    private readonly tenancyContext: TenancyContext
  ) {}

  /**
   * Retrieve accounts transactions by given reference id and type.
   * @param {ITransactionsByReferenceQuery} filter - Transactions by reference query.
   * @returns {Promise<ITransactionsByReferencePojo>}
   */
  public async getTransactionsByReference(
    query: ITransactionsByReferenceQuery
  ): Promise<ITransactionsByReferencePojo> {
    const filter = {
      ...getTransactionsByReferenceQuery(),
      ...query,
    };
    const tenantMetadata = await this.tenancyContext.getTenantMetadata();

    // Retrieve the accounts transactions of the given reference.
    const transactions = await this.repository.getTransactions(
      Number(filter.referenceId),
      filter.referenceType
    );
    // Transactions by reference report.
    const report = new TransactionsByReference(
      transactions,
      filter,
      tenantMetadata.baseCurrency
    );

    return {
      transactions: report.reportData(),
    };
  }
}
