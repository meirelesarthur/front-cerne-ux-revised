// src/validations/schemas/ServiceOrders/service-order-cancel-schema.ts
// -----------------------------------------------------------------------------
// Schema Yup do diálogo "Cancelar OS" (execução 086, FE-01). Fábrica
// `(languageGB) => resolver`, mirror `service-order-schema.ts`. Motivo
// obrigatório, 5..1000 caracteres (mirror `CancelServiceOrderRequest`); os
// limites vêm de `constants/serviceOrders/service-order-cancel-rules.ts` e as
// mensagens da tradução (`{min}`/`{max}` interpolados), nunca literais.
// A autoridade final é o 422 da API.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import {
  SERVICE_ORDER_CANCELLATION_REASON_MAX,
  SERVICE_ORDER_CANCELLATION_REASON_MIN,
} from '@/constants/serviceOrders/service-order-cancel-rules';

import type { LanguageDate } from '@/@types/language';

export const cancelServiceOrderSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.serviceOrders.serviceOrder.cancel.validation;

  return yup.object({
    cancellation_reason: yup
      .string()
      .trim()
      .required(messages.reasonRequired)
      .min(
        SERVICE_ORDER_CANCELLATION_REASON_MIN,
        messages.reasonMin.replace('{min}', String(SERVICE_ORDER_CANCELLATION_REASON_MIN))
      )
      .max(
        SERVICE_ORDER_CANCELLATION_REASON_MAX,
        messages.reasonMax.replace('{max}', String(SERVICE_ORDER_CANCELLATION_REASON_MAX))
      ),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` do diálogo de cancelamento.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens i18n).
 * @return {Function} Resolver ligado ao schema do diálogo "Cancelar OS".
 */
export const cancelServiceOrderSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cancelServiceOrderSchema(languageGB)) as any;

export default cancelServiceOrderSchemaResolver;
