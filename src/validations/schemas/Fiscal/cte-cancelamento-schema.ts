// src/validations/schemas/Fiscal/cte-cancelamento-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do dialog "Cancelamento" do CT-e (execução 045, Onda 2,
// TASK-CTE-FE-11), espelhando `CancelCteRequest::rules()` (GB.Cerne.Api):
// `motivo` required + min(15) + max(1000) — mesma exigência NOVA do
// contrato desta Onda usada em `cte-correcao-schema.ts`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { CteCancelamentoFormValues } from '@/@types/v2/Fiscal/cteEmissao';
import type Shape from '@/@types/validations/shape';

export const cteCancelamentoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.ctes.cte.emission.cancelamentoDialog;

  return yup.object().shape<Shape<CteCancelamentoFormValues>>({
    motivo: yup
      .string()
      .trim()
      .required(messages.motivoRequired)
      .min(15, messages.motivoRequired)
      .max(1000),
  });
};

export const cteCancelamentoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cteCancelamentoSchema(languageGB)) as any;

export default cteCancelamentoSchemaResolver;
