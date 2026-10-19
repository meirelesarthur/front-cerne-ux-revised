// src/pages/CadastrosBase/CategoriasProduto/category-product-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Categoria de Produto (TASK-CP-FE-02)
// — mirror mecânico de GruposProduto/product-group-schema.ts / CausaMortePerda/
// death-loss-schema.ts (FUNÇÃO que recebe `languageGB` e devolve o schema,
// mensagens i18n).
//
// `description`/`is_enabled`/`type`/`group_uuid`/`financial_category_uuid` são
// todos `required` — fidelidade ao legado (Admin/CategoryProductController::rules()
// exige `financial_category_id` e o Blade marca `->required()`); o backend
// (`CategoryProductRequest::rules()`) também passou a exigir o campo e validar que
// é uma categoria GLOBAL (`whereNull('tenant_id')`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const categoryProductSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.categoryProducts.categoryProduct.form.validation;

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    is_enabled: yup.mixed().required(messages.isEnabledRequired),
    type: yup.mixed().required(messages.typeRequired),
    group_uuid: yup.mixed().required(messages.groupRequired),
    financial_category_uuid: yup.mixed().required(messages.financialCategoryRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const categoryProductSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(categoryProductSchema(languageGB));

export default categoryProductSchemaResolver;
