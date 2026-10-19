// src/validations/schemas/RequestQuotations/request-quotation-saving-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do Dialog "Aplicar Saving" (RequestQuotation —
// Administrativo / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-06).
// Fábrica `(languageGB, totalValue) => yupResolver(...)` — mesmo mecanismo de
// fábrica com parâmetro extra além de `languageGB` já usado em
// `userSchemaResolver(languageGB, isEditing)`
// (`src/validations/schemas/Users/user-schema.ts`), aqui para poder reproduzir
// a guarda de negócio server-side como PREVIEW client-side (CV-04): o servidor
// (`ApplyRequestQuotationSavingAction::guardLiquidoNotGreaterThanTotal`,
// roteiro API TASK-CQ-API-04) é quem de fato aplica/persiste a regra —
// `total_value <= discount` (onde `discount` recebido é o VALOR LÍQUIDO,
// CL-045) rejeita com `BusinessRuleException` (422, campo `discount`). Este
// teste client-side só evita um round-trip óbvio; o `onError` do Dialog
// SEMPRE mapeia a mensagem literal devolvida pelo backend via `setError`
// (nunca hardcoda o texto do backend aqui).
//
// Localização: `src/validations/schemas/RequestQuotations/`, NUNCA em
// `pages/` (regra inviolável da Tarefa).
//
// Valida os 2 campos do payload real (`RequestQuotationSavingRequest::rules()`
// — `responsible_uuid`/`discount`, ambos `required`). Mensagens 100% via
// `languageGB.requestQuotations.requestQuotation.saving.validation.*`
// (`get_pwa_validation_and_utils_pattern` §1.7) — zero string literal.
//
// -- `discount` é o "Valor com Desconto" (valor líquido), não o desconto --
// Mesma armadilha semântica do legado preservada de propósito (CL-045,
// mirror do comentário em `@/@types/v2/RequestQuotations`,
// `RequestQuotationSavingForm`/`RequestQuotationSavingPayload`): o campo
// digitado pelo usuário é o VALOR FINAL após desconto, não o desconto em si.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';

export const requestQuotationSavingSchema = (languageGB: LanguageDate, totalValue: number) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.requestQuotations.requestQuotation.saving.validation;

  return yup.object({
    // FIELD-14 — `responsible_id`, required, SelectAsyncPaginate sobre
    // `listUsers` (lookup já existente na SPA, mirror
    // `FilterSideSolicitacao.tsx` campo `responsible_uuid`).
    responsible_uuid: v.option<string>().required(messages.responsibleRequired),

    // FIELD-15 — `discount` (rótulo "Valor com Desconto" = valor líquido,
    // CV-04/CL-045). `.test()` reproduz a guarda server-side como PREVIEW —
    // só ativa quando `totalValue` é um número positivo conhecido (defesa
    // contra o Dialog abrir sem uma cotação carregada).
    discount: v
      .number()
      .min(0, messages.discountMin)
      .test(
        'discount-less-than-total-value',
        messages.discountMustBeLessThanTotal,
        (value) => !(totalValue > 0) || value == null || value < totalValue
      ),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @param {number} totalValue - `quotation.total_value` — usado só para o preview client-side da guarda CL-045.
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestQuotationSavingSchemaResolver = (
  languageGB: LanguageDate,
  totalValue: number
) => yupResolver(requestQuotationSavingSchema(languageGB, totalValue));

export default requestQuotationSavingSchemaResolver;
