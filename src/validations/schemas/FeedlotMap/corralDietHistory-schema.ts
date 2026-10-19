// src/validations/schemas/FeedlotMap/corralDietHistory-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do diálogo Alterar Dieta — TASK-FE-042-212. Mirror
// 1:1 `feedlot-corral-diet-histories` (`[[07-front-lotes-sync-transfer]]`
// §5): `date`/`diet_id`/`feed_intake` REQUIRED — `D09`, o servidor exige
// mesmo sendo "opcionais" no legado, front marca `*` (asterisco visual).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export interface CorralDietHistoryFormValues {
  date: string | null;
  diet_id: Option<string> | null;
  feed_intake: number | '';
}

export const corralDietHistorySchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.diet.validation;

  return yup.object({
    date: yup.string().nullable().required(msgs.dateRequired),
    diet_id: yup.object().nullable().required(msgs.dietRequired),
    feed_intake: yup
      .number()
      .transform((_value, original) =>
        original === '' || original == null ? undefined : Number(original)
      )
      .typeError(msgs.feedIntakeRequired)
      .required(msgs.feedIntakeRequired)
      .min(0, msgs.feedIntakeMin),
  });
};

export const corralDietHistorySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(corralDietHistorySchema(languageGB) as any);

export default corralDietHistorySchemaResolver;
