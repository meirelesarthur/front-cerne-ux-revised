// src/validations/schemas/FeedlotMap/multipleWeighings-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup da Pesagem Manual — TASK-FE-042-213. `date`
// required; `rows` — ao menos 1 peso `current_weight > 0` (mirror
// `[[08-front-pesagem-import]]` §1, "Submit só envia linhas com
// current_weight > 0"). As demais colunas da linha são READONLY (vêm da
// API), não precisam de regra própria.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export interface WeighingRowFormValues {
  animal_uuid: string;
  identification: string;
  batch_description: string;
  last_weighing_date: string | null;
  last_weight: number | null;
  current_weight: number | null;
}

export interface MultipleWeighingsFormValues {
  date: string | null;
  rows: WeighingRowFormValues[];
}

export const multipleWeighingsSchema = (languageGB: LanguageDate) => {
  const msgs = languageGB.feedlotMap.feedlotMap.weighing.validation;

  return yup.object({
    date: yup.string().nullable().required(),
    rows: yup
      .array()
      .of(
        yup.object({
          animal_uuid: yup.string().required(),
          identification: yup.string().required(),
          batch_description: yup.string().required(),
          last_weighing_date: yup.string().nullable(),
          last_weight: yup.number().nullable(),
          current_weight: yup.number().nullable(),
        })
      )
      .test('at-least-one-weight', msgs.atLeastOneWeight, (rows) =>
        (rows ?? []).some((row) => (row.current_weight ?? 0) > 0)
      ),
  });
};

export const multipleWeighingsSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(multipleWeighingsSchema(languageGB) as any);

export default multipleWeighingsSchemaResolver;
