// src/validations/schemas/Compras/inform-request-purchase-status-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do dialog "Informar Status" da fila Compras
// (`PUT /request-purchases/{uuid}/inform-status`, TASK-CP-API-02,
// TASK-CPS-FE-01, esteira 97-Esteiras/036). Vive em
// `src/validations/schemas/Compras/` — pasta pelo NOME DA TELA (não da
// entidade, que já tem `src/validations/schemas/RequestPurchases/` para o
// cabeçalho/itens da Solicitação): este schema é de AÇÃO, específico da fila
// Compras, mirror `movement-allocation-schema.ts` (schema DEDICADO de ação,
// extraído do form completo).
//
// `justify` `max(400, ...)` é MIRROR EXATO do backend
// (`RequestPurchaseInformStatusRequest::rules()`, `justify` `max:400`) — NÃO
// confundir com o `max:800`/sem limite do `change-status` genérico já
// existente em `request-purchase-schema.ts` (schema de OUTRA ação, outro
// endpoint, outro limite real).
//
// `item_delivery_dates` é o RepeaterList de datas de previsão por item
// (`RequestItemDeliveryDateFormRow[]`, `@/@types/v2/RequestPurchases`) — cada
// `delivery_date` é OPCIONAL (nullable), mirror do achado de leitura direta
// da Tarefa (o backend aceita o objeto parcial, nem toda linha precisa de
// data). `item_uuid`/`item_label` são de controle (readonly, vêm do
// `RequestItemRow` da solicitação) — não são editáveis pelo usuário, mas
// participam do shape para o `useFieldArray` funcionar.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

/** Mirror `movement-allocation-schema.ts` — objeto `Option<T>` validado por
 *  `.test()` (mensagem customizada da tela, em vez do genérico
 *  `fieldValidationSchema(languageGB).option()`, que só tem a mensagem
 *  global `defaltStrings.validations.requiredField`). */
const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const informRequestPurchaseStatusSchema = (languageGB: LanguageDate) => {
  const messages =
    languageGB.requestPurchases.requestPurchase.inPurchase.dialogs.informStatus.validation;

  return yup.object({
    status: optionSchema.test('required', messages.statusRequired, (value) => !!value),
    financial_due_date: yup.string().trim().nullable(),
    justify: yup.string().trim().required(messages.justifyRequired).max(400, messages.justifyMax),
    item_delivery_dates: yup
      .array()
      .of(
        yup.object({
          item_uuid: yup.string().required(),
          item_label: yup.string(),
          delivery_date: yup.string().trim().nullable(),
        })
      )
      .default([]),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do dialog "Informar Status".
 */
export const informRequestPurchaseStatusSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(informRequestPurchaseStatusSchema(languageGB)) as any;

export default informRequestPurchaseStatusSchemaResolver;
