// src/validations/schemas/BaseRegistrations/grouper-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Agrupador (TASK-FE-031) — mirror
// mecânico de GruposProduto/product-group-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n já entregues por
// TASK-FE-029 em `languageGroupers.grouper.form.validation`).
//
// `type`/`condition` guardam o valor NUMÉRICO do Enum no form (GrouperForm,
// TASK-FE-029) — não o Option `{label,value}` inteiro (diferente de
// `is_enabled`, que segue o padrão ProductGroups/CentroCusto de guardar a
// STRING crua 'true'/'false'). O `Select` da tela converte `Option<string>`
// para `Number(...)` no `onChange` — aqui só validamos o valor final.
//
// D5 do contrato (Grouper-contrato.md §5): `condition` é OBRIGATÓRIO
// (backend já valida via `Rule::in`, `GrouperRequest`) — replicado aqui como
// `.required()`, não é decisão nova.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const grouperSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.groupers.grouper.form.validation;

  return yup.object({
    type: yup
      .number()
      .transform((_, originalValue) =>
        originalValue === '' || originalValue === null || originalValue === undefined
          ? undefined
          : Number(originalValue)
      )
      .oneOf([1, 2, 3, 4], messages.typeRequired)
      .required(messages.typeRequired),

    name: yup.string().trim().required(messages.nameRequired).max(60, messages.nameMaxLength),

    description: yup.string().trim().max(50, messages.descriptionMaxLength),

    // D5 — obrigatório (fidelidade à validação já existente no backend).
    condition: yup
      .number()
      .transform((_, originalValue) =>
        originalValue === '' || originalValue === null || originalValue === undefined
          ? undefined
          : Number(originalValue)
      )
      .oneOf([1, 2], messages.conditionRequired)
      .required(messages.conditionRequired),

    is_enabled: yup.mixed().required(messages.isEnabledRequired),

    order: yup
      .number()
      .transform((_, originalValue) =>
        originalValue === '' || originalValue === null || originalValue === undefined
          ? undefined
          : Number(originalValue)
      )
      .typeError(messages.orderRequired)
      .required(messages.orderRequired)
      .integer(messages.orderRequired)
      .min(1, messages.orderMin),

    formula: yup.string().trim().max(191, messages.formulaMaxLength),

    // Antecessor — sem validação de obrigatoriedade (raiz é um valor válido,
    // `null`). A validação definitiva de profundidade/ciclo é 100% do
    // backend (D4/D6, TASK-BE-051) — client só filtra o óbvio (o próprio nó,
    // ver `listGroupersForParent` em CreateOrUpdateAgrupador.tsx).
    parent_uuid: yup.string().nullable(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const grouperSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(grouperSchema(languageGB));

export default grouperSchemaResolver;
