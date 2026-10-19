// src/pages/CadastrosBase/PlanAccount/plan-account-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Plano de Contas (TASK-PA-03b) —
// mirror mecânico de `CentroCusto/centro-custo-schema.ts` (mesma convenção:
// FUNÇÃO que recebe `languageGB` e devolve o schema, mensagens i18n).
//
// Diferenças conscientes vs. `centro-custo-schema.ts`:
//   - `description` valida `max:150` (contrato, Seção 2/4 — `varchar` +
//     `required|string|max:150`), não `max:40` como Centro de Custo;
//   - sem seção de Rateio (`apportionments`) — não existe para PlanAccount;
//   - `type` é OPCIONAL (DA-PA-14, nullable) — aceita string vazia (form usa
//     `''` como "nenhum selecionado", convertido para `null` só no submit);
//   - `parent_uuid`/`category_uuids` NÃO entram neste schema (mesmo racional
//     de `centro-custo-schema.ts` não validar `parent_uuid`): guardam
//     objetos `Option`/array de `Option`, não são obrigatórios, e a
//     conversão para o payload cru acontece só em
//     `CreateOrUpdatePlanAccount.tsx`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const planAccountSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.planAccounts.planAccount.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(150, messages.descriptionMaxLength),
    condition: yup
      .string()
      .oneOf(['1', '2', '3'], messages.conditionRequired)
      .required(messages.conditionRequired),
    is_enabled: yup.boolean().required(),
    // Enum int-backed no backend (CAPEX=1/OPEX=2, DA-PA-14, TASK-PA-FIX-02) —
    // o form guarda o valor NUMÉRICO de backing (`''` = nenhum selecionado);
    // `yup.mixed` evita a coerção de `yup.number()` (que transformaria ''
    // em NaN e quebraria a validação de um campo opcional).
    type: yup.mixed<1 | 2 | ''>().oneOf([1, 2, '']),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const planAccountSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(planAccountSchema(languageGB));

export default planAccountSchemaResolver;
