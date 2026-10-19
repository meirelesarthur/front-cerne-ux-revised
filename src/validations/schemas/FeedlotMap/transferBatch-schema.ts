// src/validations/schemas/FeedlotMap/transferBatch-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo Transferir Lote — TASK-FE-042-210.
// Mirror 1:1 `TransferFeedlotCorralBatchRequest::rules()`: `batch_uuid`,
// `destination_type` (`corral`/`area`/`grazing`), `destination_uuid`,
// `transfer_date` — todos required.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { FeedlotCorralTransferDestinationType } from '@/@types/v2/FeedlotMap/transfer';

export interface TransferBatchFormValues {
  batch_uuid: Option<string> | null;
  destination_type: Option<FeedlotCorralTransferDestinationType> | null;
  destination_uuid: Option<string> | null;
  transfer_date: string | null;
}

export const transferBatchSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.transfer.validation;

  return yup.object<Record<keyof TransferBatchFormValues, yup.AnySchema>>({
    batch_uuid: yup.object().nullable().required(msgs.batchRequired),
    destination_type: yup.object().nullable().required(msgs.destinationTypeRequired),
    destination_uuid: yup.object().nullable().required(msgs.destinationRequired),
    transfer_date: yup.string().nullable().required(msgs.transferDateRequired),
  });
};

export const transferBatchSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(transferBatchSchema(languageGB) as any);

export default transferBatchSchemaResolver;
