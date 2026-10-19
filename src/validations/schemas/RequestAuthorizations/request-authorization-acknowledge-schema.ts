// src/validations/schemas/RequestAuthorizations/request-authorization-acknowledge-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do payload `POST /request-authorizations/{uuid}/acknowledge`
// (RequestAuthorizationAcknowledgePayload, TASK-AUTH-FE-01). Fábrica
// `(languageGB, options) => yupResolver(...)`, mirror `request-authorization-
// approve-schema.ts` (aceita gate de rateio externo, calculado pela tela de
// detalhe a partir de `authorization_context.requires_ratio_block`,
// TASK-AUTH-FE-04).
//
// Regras (fonte: `RequestAuthorizationAcknowledgeRequest.php`, ler antes de
// alterar):
// - `status` sempre obrigatório — subconjunto de avanço
//   (`authorization_context.next_status_candidates`, ∈ {2,3,4}).
// - `authorizer_uuid` `required_if(status===3)` — envio direto para
//   autorização (BR-05, "enviar para autorização").
// - `justify` `required_unless(status===3)` — obrigatória para os demais
//   ramos (avançar condicional/bloquear); máximo de 400 caracteres (T-081-API-01).
// - `status` aceita também `auto_promote` na API; este schema valida só o envio
//   com `status` (a promoção automática não passa por formulário).
// - Rateio (3 arrays paralelos) só validado quando `options.requiresRatio`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export interface RequestAuthorizationAcknowledgeSchemaOptions {
  requiresRatio?: boolean;
}

const STATUS_SEND_FOR_AUTHORIZATION = 3;
const RATIO_SUM_TOLERANCE = 0.01;
const SECOND_LEVEL_JUSTIFY_MAX = 400;

export const requestAuthorizationAcknowledgeSchema = (
  languageGB: LanguageDate,
  options: RequestAuthorizationAcknowledgeSchemaOptions = {}
) => {
  const v = languageGB.requestAuthorizations.requestAuthorization.validation;
  const { requiresRatio = false } = options;

  return yup.object({
    status: yup.number().typeError(v.statusRequired).required(v.statusRequired),
    authorizer_uuid: yup
      .string()
      .trim()
      .nullable()
      .when('status', {
        is: STATUS_SEND_FOR_AUTHORIZATION,
        then: (schema) => schema.required(v.authorizerRequired),
        otherwise: (schema) => schema.nullable(),
      }),
    responsible_uuid: yup.string().trim().nullable(),
    // Máx. 400 (T-081-API-01, legado `secondUpdate`).
    justify: yup
      .string()
      .trim()
      .max(SECOND_LEVEL_JUSTIFY_MAX, v.justifyTooLong)
      .nullable()
      .when('status', {
        is: STATUS_SEND_FOR_AUTHORIZATION,
        then: (schema) => schema.nullable(),
        otherwise: (schema) => schema.required(v.justifyRequired),
      }),
    classification: yup.string().trim().nullable(),
    harvest_uuid: yup.string().trim().nullable(),
    categories: yup.array().of(yup.string().required(v.categoryRequired)).nullable(),
    centers: yup.array().of(yup.string().required(v.centerRequired)).nullable(),
    category_percent_values: yup
      .array()
      .of(yup.number().typeError(v.percentRequired).required(v.percentRequired))
      .nullable()
      // Arrow function + `ctx.parent` (não `function(){...}`/`this.parent`) —
      // evita `no-invalid-this` do ESLint do projeto (mesma convenção de
      // `advance-schema.ts`/`invoice-schema.ts`).
      .test('ratio-sum-100', v.percentSumInvalid, (values, ctx) => {
        if (!requiresRatio) return true;
        const { categories, centers } = ctx.parent as {
          categories?: string[] | null;
          centers?: string[] | null;
        };
        const rows = values ?? [];
        if (
          rows.length === 0 ||
          rows.length !== (categories?.length ?? 0) ||
          rows.length !== (centers?.length ?? 0)
        ) {
          return false;
        }
        const sum = rows.reduce<number>((total, value) => total + (value ?? 0), 0);
        return Math.abs(sum - 100) <= RATIO_SUM_TOLERANCE;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @param {RequestAuthorizationAcknowledgeSchemaOptions} options - Gate de rateio calculado a
 *   partir de `authorization_context.requires_ratio_block`.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestAuthorizationAcknowledgeSchemaResolver = (
  languageGB: LanguageDate,
  options?: RequestAuthorizationAcknowledgeSchemaOptions
) => yupResolver(requestAuthorizationAcknowledgeSchema(languageGB, options)) as any;

export default requestAuthorizationAcknowledgeSchemaResolver;
