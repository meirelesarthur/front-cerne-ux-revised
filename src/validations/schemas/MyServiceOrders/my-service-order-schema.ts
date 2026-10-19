// src/validations/schemas/MyServiceOrders/my-service-order-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Execução de Ordem de Serviço
// (MyServiceOrder) — esteira 063 (TASK-MOS-FE-03). Fábrica `(languageGB) =>
// resolver`, mirror `rating-service-order-schema.ts`. Schema NUNCA em
// `pages/` (SEVERIDADE inviolável).
//
// `status` — restrito a `[2,3]` (LK-01, `getMyServiceOrderExecutionStatusOptions`).
// `execution_start_date` — `datetime-local` nativo (`yyyy-MM-ddTHH:mm`),
// mesma regra de `rating_date` (`rating-service-order-schema.ts`), SEMPRE
// obrigatório.
// `execution_end_date` — `datetime-local`, obrigatório SOMENTE quando
// `status.value===3` (DEF-02 — regra é 100% do backend
// `required_if:status,3`; este `.when()` replica no client só para feedback
// imediato, fonte de verdade continua o servidor).
// `attachments[].name` — obrigatório apenas quando há `file` novo na mesma
// linha (mirror `required_with:attachments.*.file` do
// `MyServiceOrderExecutionRequest` real).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export const myServiceOrderSchema = (languageGB: LanguageDate) => {
  const fv = fieldValidationSchema(languageGB);
  const genericMessages = languageGB.defaltStrings.validations;
  const formText = languageGB.myServiceOrders.myServiceOrder.form;

  const attachmentRowSchema = yup.object({
    uuid: yup.string().nullable(),
    name: yup
      .string()
      .trim()
      .nullable()
      .test('name-required-with-file', formText.attachmentRow.nameRequired, (value, ctx) => {
        // Arrow function + `ctx.parent` (não `function(){...}`/`this.parent`)
        // — evita `no-invalid-this` (mirror `advance-schema.ts`/
        // `request-authorization-approve-schema.ts`).
        const file = ctx.parent?.file;
        if (!file) return true;
        return !!value && value.trim() !== '';
      }),
    file: yup.mixed().nullable(),
  });

  return yup.object({
    // LK-01 — só `2`/`3` (`getMyServiceOrderExecutionStatusOptions`).
    status: fv.option<2 | 3>(),

    // `datetime-local` — string `yyyy-MM-ddTHH:mm` (RHF/DOM nativo), SEMPRE
    // obrigatório (FLD-34).
    execution_start_date: yup
      .string()
      .trim()
      .nullable()
      .required(genericMessages.requiredField)
      .matches(DATETIME_LOCAL_PATTERN, {
        message: genericMessages.invalidValue,
        excludeEmptyString: true,
      }),

    // `required` somente quando `status.value===3` (DEF-02 — fonte de
    // verdade continua sendo `required_if:status,3` no backend).
    execution_end_date: yup
      .string()
      .trim()
      .nullable()
      .when('status', {
        is: (status: { value?: number } | null) => status?.value === 3,
        then: (schema) =>
          schema.required(genericMessages.requiredField).matches(DATETIME_LOCAL_PATTERN, {
            message: genericMessages.invalidValue,
            excludeEmptyString: true,
          }),
        otherwise: (schema) => schema.nullable(),
      }),

    execution_problems: yup.string().trim().nullable(),
    corrective_actions: yup.string().trim().nullable(),

    // Sempre presentes, mesmo vazios (RN-07 — "desmarcar tudo" é operação
    // válida) — `required()` aqui garante o ARRAY (não o conteúdo).
    employees_checked_ids: yup.array().of(yup.number().required()).required(),
    equipments_checked_ids: yup.array().of(yup.number().required()).required(),
    products_checked_ids: yup.array().of(yup.number().required()).required(),
    productions_checked_ids: yup.array().of(yup.number().required()).required(),
    protections_checked_ids: yup.array().of(yup.number().required()).required(),

    attachments: yup.array().of(attachmentRowSchema).default([]),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — mirror
 * `ratingServiceOrderSchemaResolver`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const myServiceOrderSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(myServiceOrderSchema(languageGB) as any);

export default myServiceOrderSchemaResolver;
