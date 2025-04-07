import bluebird from 'bluebird';
import * as R from 'ramda';
import { first } from 'lodash';
import { ImportFileDataValidator } from './ImportFileDataValidator';
import { Knex } from 'knex';
import {
  ImportInsertError,
  ImportOperError,
  ImportOperSuccess,
  ImportableContext,
} from './interfaces';
import { getUniqueImportableValue, trimObject } from './_utils';
import { ImportableResources } from './ImportableResources';
import { ResourceService } from '../Resource/ResourceService';
import { Import } from '@/system/models';
import { Injectable } from '@nestjs/common';
import { ServiceError } from '../Items/ServiceError';

@Injectable()
export class ImportFileCommon {
  constructor(
    private readonly importFileValidator: ImportFileDataValidator,
    private readonly importable: ImportableResources,
    private readonly resource: ResourceService,
  ) {}

  /**
   * Imports the given parsed data to the resource storage through registered importable service.
   * @param {string} resourceName - Resource name.
   * @param {Record<string, any>} parsedData - Parsed data.
   * @param {Knex.Transaction} trx - Knex transaction.
   * @returns {Promise<[ImportOperSuccess[], ImportOperError[]]>}
   */
  public async import(
    importFile: Import,
    parsedData: Record<string, any>[],
    trx?: Knex.Transaction,
  ): Promise<[ImportOperSuccess[], ImportOperError[]]> {
    const resourceFields = this.resource.getResourceFields2(
      importFile.resource,
    );
    const ImportableRegistry = this.importable.registry;
    const importable = ImportableRegistry.getImportable(importFile.resource);

    const concurrency = importable.concurrency || 10;

    const success: ImportOperSuccess[] = [];
    const failed: ImportOperError[] = [];

    const importAsync = async (objectDTO, index: number): Promise<void> => {
      const context: ImportableContext = {
        rowIndex: index,
        import: importFile,
      };
      const transformedDTO = importable.transform(objectDTO, context);
      const rowNumber = index + 1;
      const uniqueValue = getUniqueImportableValue(resourceFields, objectDTO);
      const errorContext = {
        rowNumber,
        uniqueValue,
      };
      try {
        // Validate the DTO object before passing it to the service layer.
        await this.importFileValidator.validateData(
          resourceFields,
          transformedDTO,
        );
        try {
          // Run the importable function and listen to the errors.
          const data = await importable.importable(
            tenantId,
            transformedDTO,
            trx,
          );
          success.push({ index, data });
        } catch (err) {
          if (err instanceof ServiceError) {
            const error: ImportInsertError[] = [
              {
                errorCode: 'ServiceError',
                errorMessage: err.message || err.errorType,
                ...errorContext,
              },
            ];
            failed.push({ index, error });
          } else {
            const error: ImportInsertError[] = [
              {
                errorCode: 'UnknownError',
                errorMessage: 'Unknown error occurred',
                ...errorContext,
              },
            ];
            failed.push({ index, error });
          }
        }
      } catch (errors) {
        const error = errors.map((er) => ({ ...er, ...errorContext }));
        failed.push({ index, error });
      }
    };
    await bluebird.map(parsedData, importAsync, { concurrency });

    return [success, failed];
  }

  /**
   *
   * @param {string} resourceName
   * @param {Record<string, any>} params
   */
  public async validateParamsSchema(
    resourceName: string,
    params: Record<string, any>,
  ) {
    const ImportableRegistry = this.importable.registry;
    const importable = ImportableRegistry.getImportable(resourceName);

    const yupSchema = importable.paramsValidationSchema();

    try {
      await yupSchema.validate(params, { abortEarly: false });
    } catch (validationError) {
      const errors = validationError.inner.map((error) => ({
        errorCode: 'ParamsValidationError',
        errorMessage: error.errors,
      }));
      throw errors;
    }
  }

  /**
   *
   * @param {string} resourceName
   * @param {Record<string, any>} params
   */
  public async validateParams(
    tenantId: number,
    resourceName: string,
    params: Record<string, any>,
  ) {
    const ImportableRegistry = this.importable.registry;
    const importable = ImportableRegistry.getImportable(resourceName);

    await importable.validateParams(tenantId, params);
  }

  /**
   *
   * @param {string} resourceName
   * @param {Record<string, any>} params
   * @returns
   */
  public transformParams(resourceName: string, params: Record<string, any>) {
    const ImportableRegistry = this.importable.registry;
    const importable = ImportableRegistry.getImportable(resourceName);

    return importable.transformParams(params);
  }

  /**
   * Retrieves the sheet columns from the given sheet data.
   * @param {unknown[]} json
   * @returns {string[]}
   */
  public parseSheetColumns(json: unknown[]): string[] {
    return R.compose(Object.keys, trimObject, first)(json);
  }
}
