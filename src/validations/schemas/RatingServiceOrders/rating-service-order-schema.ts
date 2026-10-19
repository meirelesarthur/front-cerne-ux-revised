// src/validations/schemas/RatingServiceOrders/rating-service-order-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Avaliação de Ordem de Serviço
// (RatingServiceOrder) — TASK-FE-041-AVL-01. Fábrica `(languageGB) =>
// resolver`, mirror `service-order-schema.ts`. Schema NUNCA em `pages/`
// (SEVERIDADE inviolável).
//
// `assessment_grade` — `between(1,5)`, mesma melhoria de fidelidade aplicada
// no lado API (`RatingServiceOrderRequest::rules()`, `between:1,5`,
// `plano-api-avaliacoes.md` item #12, fecha DIV-003 do contrato legado).
// `rating_date` — `datetime-local` nativo (FLD-034), formato
// `yyyy-MM-ddTHH:mm`; NÃO usa `fv.date()` (que exige `yyyy-MM-dd` puro,
// formato de `<input type="date">`) — regra própria abaixo.
// `feedback` — obrigatório (FLD-036). `recommendations` — opcional/nullable
// (FLD-037).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const ratingServiceOrderSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;

  return yup.object({
    assessment_grade: fv
      .option<number>()
      .test(
        'between-1-5',
        genericMessages.invalidValue,
        (value) =>
          !value || (typeof value.value === 'number' && value.value >= 1 && value.value <= 5)
      ),
    // `datetime-local` — string `yyyy-MM-ddTHH:mm` (RHF/DOM nativo).
    rating_date: yup
      .string()
      .trim()
      .nullable()
      .required(genericMessages.requiredField)
      .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, {
        message: genericMessages.invalidValue,
        excludeEmptyString: true,
      }),
    feedback: fv.string(),
    recommendations: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror
 * `serviceOrderSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const ratingServiceOrderSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(ratingServiceOrderSchema(languageGB) as any);

export default ratingServiceOrderSchemaResolver;
