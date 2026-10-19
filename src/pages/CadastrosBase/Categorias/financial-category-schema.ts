// src/pages/CadastrosBase/Categorias/financial-category-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Categoria Financeira (TASK-FE-312)
// — mirror mecânico de Agrupadores/grouper-schema.ts: FUNÇÃO que recebe
// `languageGB` e devolve o schema (mensagens i18n).
//
// `type_uuid`/`grouper_uuid` guardam o par
// `{label, value}` completo (`Option`, componente `SelectAsyncPaginate`) —
// mesma convenção de `parent_uuid` em CostCenter/Grouper. Só a PRESENÇA do
// objeto é validada aqui; a conversão para `uuid` cru do payload acontece na
// tela (`CreateOrUpdateFinancialCategory.tsx`).
//
// `classification` é sempre validado como obrigatório no schema — a REGRA de
// "travado quando Sintético" (contrato §5.2) é só de UI (`disabled` no
// campo), não uma isenção de validação: ao editar um grupo Sintético, o
// campo chega desabilitado mas com o valor real já preenchido pelo servidor
// (sempre "Não Classificado"/'N'), então a validação nunca falha nesse caso.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const financialCategorySchema = (languageGB: LanguageDate) => {
  const messages = languageGB.financialCategories.financialCategory.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(120, messages.descriptionMaxLength),
    is_enabled: yup.boolean().required(),
    type_uuid: yup
      .object({ label: yup.string().required(), value: yup.string().required() })
      .nullable()
      .required(messages.typeRequired),
    grouper_uuid: yup
      .object({ label: yup.string().required(), value: yup.string().required() })
      .nullable()
      .required(messages.grouperRequired),
    generates_obligation_or_right: yup.boolean().required(),
    classification: yup
      .string()
      .oneOf(['N', 'C', 'O'], messages.classificationRequired)
      .required(messages.classificationRequired),
    // GAP-FE-103 — seleção em memória, sem regra de obrigatoriedade (o campo
    // nem chega a ser enviado no payload enquanto o Gap não for resolvido).
    center_uuids: yup.array().of(yup.string().required()),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const financialCategorySchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(financialCategorySchema(languageGB));

export default financialCategorySchemaResolver;
