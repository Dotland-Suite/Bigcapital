import { Inject, Injectable } from '@nestjs/common';
import { GetCreditNoteService } from './GetCreditNote.service';
import { CreditNoteBrandingTemplate } from './CreditNoteBrandingTemplate.service';
import { transformCreditNoteToPdfTemplate } from '../utils';
import { CreditNote } from '../models/CreditNote';
import { ChromiumlyTenancy } from '@/modules/ChromiumlyTenancy/ChromiumlyTenancy.service';
import { TemplateInjectable } from '@/modules/TemplateInjectable/TemplateInjectable.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PdfTemplateModel } from '@/modules/PdfTemplate/models/PdfTemplate';
import { CreditNotePdfTemplateAttributes } from '../types/CreditNotes.types';
import { events } from '@/common/events/events';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';

@Injectable()
export class GetCreditNotePdf {
  /**
   * @param {ChromiumlyTenancy} chromiumlyTenancy - Chromiumly tenancy service.
   * @param {TemplateInjectable} templateInjectable - Template injectable service.
   * @param {GetCreditNote} getCreditNoteService - Get credit note service.
   * @param {CreditNoteBrandingTemplate} creditNoteBrandingTemplate - Credit note branding template service.
   * @param {EventEmitter2} eventPublisher - Event publisher service.
   * @param {typeof CreditNote} creditNoteModel - Credit note model.
   * @param {typeof PdfTemplateModel} pdfTemplateModel - Pdf template model.
   */
  constructor(
    private readonly chromiumlyTenancy: ChromiumlyTenancy,
    private readonly templateInjectable: TemplateInjectable,
    private readonly getCreditNoteService: GetCreditNoteService,
    private readonly creditNoteBrandingTemplate: CreditNoteBrandingTemplate,
    private readonly eventPublisher: EventEmitter2,

    @Inject(CreditNote.name)
    private readonly creditNoteModel: TenantModelProxy<typeof CreditNote>,

    @Inject(PdfTemplateModel.name)
    private readonly pdfTemplateModel: TenantModelProxy<
      typeof PdfTemplateModel
    >,
  ) {}

  /**
   * Retrieves sale invoice pdf content.
   * @param {number} creditNoteId - Credit note id.
   * @returns {Promise<[Buffer, string]>}
   */
  public async getCreditNotePdf(
    creditNoteId: number,
  ): Promise<[Buffer, string]> {
    const brandingAttributes =
      await this.getCreditNoteBrandingAttributes(creditNoteId);
    const htmlContent = await this.templateInjectable.render(
      'modules/credit-note-standard',
      brandingAttributes,
    );
    const filename = await this.getCreditNoteFilename(creditNoteId);

    const document =
      await this.chromiumlyTenancy.convertHtmlContent(htmlContent);
    const eventPayload = { creditNoteId };

    // Triggers the `onCreditNotePdfViewed` event.
    await this.eventPublisher.emitAsync(
      events.creditNote.onPdfViewed,
      eventPayload,
    );
    return [document, filename];
  }

  /**
   * Retrieves the filename pdf document of the given credit note.
   * @param {number} creditNoteId
   * @returns {Promise<string>}
   */
  public async getCreditNoteFilename(creditNoteId: number): Promise<string> {
    const creditNote = await this.creditNoteModel()
      .query()
      .findById(creditNoteId);
    return `Credit-${creditNote.creditNoteNumber}`;
  }

  /**
   * Retrieves credit note branding attributes.
   * @param {number} creditNoteId - The ID of the credit note.
   * @returns {Promise<CreditNotePdfTemplateAttributes>} The credit note branding attributes.
   */
  public async getCreditNoteBrandingAttributes(
    creditNoteId: number,
  ): Promise<CreditNotePdfTemplateAttributes> {
    const creditNote =
      await this.getCreditNoteService.getCreditNote(creditNoteId);

    // Retrieve the invoice template id of not found get the default template id.
    const templateId =
      creditNote.pdfTemplateId ??
      (
        await this.pdfTemplateModel().query().findOne({
          resource: 'CreditNote',
          default: true,
        })
      )?.id;
    // Retrieves the credit note branding template.
    const brandingTemplate =
      await this.creditNoteBrandingTemplate.getCreditNoteBrandingTemplate(
        templateId,
      );
    return {
      ...brandingTemplate.attributes,
      ...transformCreditNoteToPdfTemplate(creditNote),
    };
  }
}
