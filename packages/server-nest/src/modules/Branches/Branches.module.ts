import { Module } from '@nestjs/common';
import { TenancyContext } from '../Tenancy/TenancyContext.service';
import { TenancyDatabaseModule } from '../Tenancy/TenancyDB/TenancyDB.module';
import { TransformerInjectable } from '../Transformer/TransformerInjectable.service';
import { BranchesController } from './Branches.controller';
import { CreateBranchService } from './commands/CreateBranch.service';
import { DeleteBranchService } from './commands/DeleteBranch.service';
import { EditBranchService } from './commands/EditBranch.service';
import { MarkBranchAsPrimaryService } from './commands/MarkBranchAsPrimary.service';
import { GetBranchService } from './queries/GetBranch.service';
import { GetBranchesService } from './queries/GetBranches.service';
import { ActivateBranches } from './commands/ActivateBranchesFeature.service';
import { BranchesApplication } from './BranchesApplication.service';
import { BranchesSettingsService } from './BranchesSettings';
import { BranchCommandValidator } from './commands/BranchCommandValidator.service';
import { BranchTransactionDTOTransformer } from './integrations/BranchTransactionDTOTransform';
import { ManualJournalBranchesDTOTransformer } from './integrations/ManualJournals/ManualJournalDTOTransformer.service';
import { BillBranchValidateSubscriber } from './subscribers/Validators/BillBranchSubscriber';
import { InventoryAdjustmentBranchValidateSubscriber } from './subscribers/Validators/InventoryAdjustmentBranchValidatorSubscriber';
import { ExpenseBranchValidateSubscriber } from './subscribers/Validators/ExpenseBranchSubscriber';
import { CreditNoteBranchValidateSubscriber } from './subscribers/Validators/CreditNoteBranchesSubscriber';
import { CreditNoteRefundBranchValidateSubscriber } from './subscribers/Validators/CreditNoteRefundBranchSubscriber';
import { ContactBranchValidateSubscriber } from './subscribers/Validators/ContactOpeningBalanceBranchSubscriber';
import { ManualJournalBranchValidateSubscriber } from './subscribers/Validators/ManualJournalBranchSubscriber';
import { SaleEstimateBranchValidateSubscriber } from './subscribers/Validators/SaleEstimateMultiBranchesSubscriber';
import { PaymentMadeBranchValidateSubscriber } from './subscribers/Validators/PaymentMadeBranchSubscriber';
import { PaymentReceiveBranchValidateSubscriber } from './subscribers/Validators/PaymentReceiveBranchSubscriber';
import { SaleReceiptBranchValidateSubscriber } from './subscribers/Validators/SaleReceiptBranchesSubscriber';
import { VendorCreditBranchValidateSubscriber } from './subscribers/Validators/VendorCreditBranchSubscriber';
@Module({
  imports: [TenancyDatabaseModule],
  controllers: [BranchesController],
  providers: [
    CreateBranchService,
    EditBranchService,
    DeleteBranchService,
    GetBranchService,
    GetBranchesService,
    MarkBranchAsPrimaryService,
    ActivateBranches,
    BranchesApplication,
    BranchesSettingsService,
    TenancyContext,
    TransformerInjectable,
    BranchCommandValidator,
    BranchTransactionDTOTransformer,
    ManualJournalBranchesDTOTransformer,
    BillBranchValidateSubscriber,
    CreditNoteBranchValidateSubscriber,
    CreditNoteRefundBranchValidateSubscriber,
    ContactBranchValidateSubscriber,
    ExpenseBranchValidateSubscriber,
    InventoryAdjustmentBranchValidateSubscriber,
    ManualJournalBranchValidateSubscriber,
    PaymentMadeBranchValidateSubscriber,
    PaymentReceiveBranchValidateSubscriber,
    SaleEstimateBranchValidateSubscriber,
    SaleReceiptBranchValidateSubscriber,
    VendorCreditBranchValidateSubscriber,
  ],
  exports: [
    BranchesSettingsService,
    BranchTransactionDTOTransformer,
    ManualJournalBranchesDTOTransformer,
  ],
})
export class BranchesModule {}
