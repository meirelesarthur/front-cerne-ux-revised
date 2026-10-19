// src/validations/schemas/FeedlotMap/syncBatches-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo Gerenciar Lotes do Curral —
// TASK-FE-042-209. Mirror 1:1 `SyncFeedlotCorralBatchesRequest::rules()`:
// `entry_date`/`exit_date` required (`exit_date > entry_date`, cross-field),
// `expected_adg` required/min:0. `batch_ids` (array de linhas) é validado no
// COMPONENTE (dedupe + `min:0` — `present` no backend aceita array vazio),
// não aqui, mirror do racional de `troughs-schema.ts` (regra estrutural de
// array fica no componente, não em Yup).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export interface SyncBatchesFormValues {
  entry_date: string | null;
  exit_date: string | null;
  diet_id: Option<string> | null;
  feed_intake: number | '';
  expected_adg: number | '';
  batches: { batch_uuid: Option<string> | null }[];
}

export const syncBatchesSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.batches.validation;

  return yup.object({
    entry_date: yup.string().nullable().required(msgs.entryDateRequired),
    exit_date: yup
      .string()
      .nullable()
      .required(msgs.exitDateRequired)
      .test('after-entry', msgs.exitDateAfterEntry, (value, context) => {
        const entryDate = (context?.parent as { entry_date?: string } | undefined)?.entry_date;
        if (!value || !entryDate) return true;
        return new Date(value) > new Date(entryDate);
      }),
    diet_id: yup.object().nullable(),
    feed_intake: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? null : Number(original)
      )
      .nullable()
      .min(0),
    expected_adg: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.expectedAdgRequired)
      .required(msgs.expectedAdgRequired)
      .min(0, msgs.expectedAdgMin),
  });
};

export const syncBatchesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(syncBatchesSchema(languageGB) as any);

export default syncBatchesSchemaResolver;
