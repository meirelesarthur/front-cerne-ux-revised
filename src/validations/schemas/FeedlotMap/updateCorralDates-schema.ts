// src/validations/schemas/FeedlotMap/updateCorralDates-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo Atualizar Datas/GMD previsto —
// TASK-FE-042-211. Mirror 1:1 `UpdateFeedlotCorralDatesRequest::rules()`:
// `entry_date`/`exit_date`/`expected_adg` todos NULLABLE (mirror `IG22` — sem
// histórico dedicado, update direto, sem forçar preenchimento como no diálogo
// de Lotes). `exit_date > entry_date` só quando AMBAS presentes (cross-field,
// mirror `syncBatches-schema.ts`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export interface UpdateCorralDatesFormValues {
  entry_date: string | null;
  exit_date: string | null;
  expected_adg: number | '';
}

export const updateCorralDatesSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.dates.validation;

  return yup.object({
    entry_date: yup.string().nullable(),
    exit_date: yup
      .string()
      .nullable()
      .test('after-entry', msgs.exitDateAfterEntry, (value, context) => {
        const entryDate = (context?.parent as { entry_date?: string } | undefined)?.entry_date;
        if (!value || !entryDate) return true;
        return new Date(value) > new Date(entryDate);
      }),
    expected_adg: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? null : Number(original)
      )
      .nullable()
      .min(0, msgs.expectedAdgMin),
  });
};

export const updateCorralDatesSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(updateCorralDatesSchema(languageGB) as any);

export default updateCorralDatesSchemaResolver;
