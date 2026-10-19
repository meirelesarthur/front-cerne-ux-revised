// src/validations/schemas/Fiscal/cte-correcao-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do dialog "Carta de Correção" do CT-e (execução 045, Onda 2,
// TASK-CTE-FE-11), espelhando `CorrectCteRequest::rules()` (GB.Cerne.Api):
// `grupo`/`campo` required, `motivo` required + min(15) + max(1000) — NOVA
// exigência do contrato desta Onda (`CONTRATO-API-CTE-ONDA2.md §1`, não
// fidelidade ao legado, que só validava via JS solto).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { CteCorrecaoFormValues } from '@/@types/v2/Fiscal/cteEmissao';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const cteCorrecaoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.ctes.cte.emission.correcaoDialog;

  return yup.object().shape<Shape<CteCorrecaoFormValues>>({
    grupo: optionSchema.required(messages.grupoRequired),
    campo: yup.string().trim().required(messages.campoRequired).max(255),
    motivo: yup
      .string()
      .trim()
      .required(messages.motivoRequired)
      .min(15, messages.motivoRequired)
      .max(1000),
  });
};

export const cteCorrecaoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cteCorrecaoSchema(languageGB)) as any;

export default cteCorrecaoSchemaResolver;
