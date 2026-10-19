// src/validations/schemas/RequestQuotations/request-quotation-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do Dialog Criar/Editar Cotação (RequestQuotation —
// Administrativo / Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-01).
// Fábrica `(languageGB) => yupResolver(...)`, mirror mecânico de
// `requestPurchaseSchemaResolver`
// (`src/validations/schemas/RequestPurchases/request-purchase-schema.ts`).
//
// Localização: `src/validations/schemas/RequestQuotations/`, NUNCA em
// `pages/` (regra inviolável da Tarefa).
//
// Valida SÓ os 4 campos que o form interno edita (FIELD-01..04, mirror
// CL-025/026 — `RequestQuotationRequest::rules()` real, backend,
// `provider_uuid`/`branch_uuid`/`requires_file`/`note`). `request_purchase_uuid`
// NÃO entra neste schema — é contexto injetado pela tela-pai (a solicitação
// já aberta), nunca um campo preenchido pelo usuário no Dialog.
//
// Mensagens 100% via `languageGB.requestQuotations.requestQuotation.form.*`
// (`get_pwa_validation_and_utils_pattern` §1.7) — zero string literal.
//
// -- `requires_file` como `Option<boolean>` (Select "Sim/Não"), não checkbox --
// FIELD-03 do contrato legado é um widget "select (Sim/Não)", não um
// checkbox/switch — mirror do único precedente real de campo booleano
// exposto como Select no fork (`tenantBooleanOptions`,
// `src/constants/BaseRegistrations/options/tenant-boolean-options.ts`):
// valor nativo `boolean` dentro de um `Option<boolean>`, fábrica dedicada em
// `@/constants/RequestQuotations/options/request-quotation-requires-file-options.ts`.
// `fieldValidationSchema(languageGB).option<boolean>()` valida o objeto
// inteiro como obrigatório — `value: false` é um valor DEFINIDO (não
// `undefined`/`null`), então `.required()` do Yup não rejeita a opção "Não"
// (mesmo racional já usado em `tenant-schema.ts` para os 6 campos booleanos
// daquele módulo).
//
// -- `branch_uuid` sempre opcional neste schema --
// FIELD-02 (`branch_id`) é `required: false` no contrato (cascata
// CL-021/022, dependente de `provider_uuid`) — a UI decide `disabled`
// (CL-024, default de engenharia do roteiro frontend §2), não este schema.
//
// -- `note` sem `.max()` --
// Coluna real `request_quotations.note` é `longText` (migration
// `2024_10_08_165852_add_note_to_request_quotations.php`), sem limite no
// Form Request (`RequestQuotationRequest::rules()['note'] = ['nullable',
// 'string']`) — nenhum `.max()` client-side é adicionado aqui para não
// inventar uma restrição que o contrato/backend não impõe (regra "SEM MOCK",
// só o que o contrato tem).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import fieldValidationSchema from '@/validations/field-validation-schema';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const requestQuotationSchema = (languageGB: LanguageDate) => {
  const v = fieldValidationSchema(languageGB);
  const messages = languageGB.requestQuotations.requestQuotation.form.validation;

  return yup.object({
    // FIELD-01 — `provider_id`, required, SelectAsyncPaginate (CL-021).
    provider_uuid: v.option<string>().required(messages.providerRequired),

    // FIELD-02 — `branch_id`, opcional, dependente de `provider_uuid`
    // (cascata CL-021/022). `disabled`/re-hidratação ficam no componente
    // (Dialog, TASK-CQ-FE-04), não neste schema.
    branch_uuid: yup.mixed<Option<string> | null>().nullable(),

    // FIELD-03 — `requires_file`, required, Select "Sim/Não" (ver nota no
    // cabeçalho do arquivo — `Option<boolean>`, não checkbox).
    requires_file: v.option<boolean>().required(messages.requiresFileRequired),

    // FIELD-04 — `note`, opcional, textarea, sem limite server-side (ver
    // nota no cabeçalho do arquivo).
    note: yup.string().trim().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const requestQuotationSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requestQuotationSchema(languageGB));

export default requestQuotationSchemaResolver;
