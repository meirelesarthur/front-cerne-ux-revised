// src/validations/schemas/DiscountTables/discount-table-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário completo de Tabela de Desconto
// (DiscountTable — Operacional/Agricultura, F-032, TASK-DT-FE-01),
// espelhando `DiscountTableRequest::rules()` (`discount-tables-contrato-
// migracao.md` §3.2, lido diretamente em `GB.Cerne.Api`). Vive em
// `src/validations/schemas/DiscountTables/` (pasta pelo NOME DA ENTIDADE,
// NUNCA em `src/pages/`).
//
// Campos do cabeçalho — `name` (required|max:181), `calculation_base`
// (required, enum GW/PD), `is_active` (required, in:0,1). `code` NUNCA é
// campo de formulário — server-gen, imutável em update.
//
// Produtos (`products`): `required|array|min:1`; cada produto
// `product_uuid` required (uuid tenant-scoped, validado server-side).
//
// Regras (`products.*.rules.*`): 6 buckets por produto — cada linha
// ENVIADA valida os 3 percentuais `required|numeric|between:0,100`
// (SF-OVERFLOW). BR-03 NÃO migrado: abas nascem SEM linhas, só linhas
// adicionadas explicitamente entram no array — nenhuma validação `.min()`
// no nível do array de regras (pode ficar vazio para um tipo/produto).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

// Linha de regra (`RuleRowForm`) — 3 percentuais `between:0,100`, mirror
// `DiscountTableRequest::rules()` (`products.*.rules.*.initial_limit_percent`
// / `final_limit_percent` / `discount_percent`).
function ruleRowSchema(
  messages: LanguageDate['discountTables']['discountTable']['form']['validation']
) {
  return yup.object({
    initial_limit_percent: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.rulePercentRequired)
      .required(messages.rulePercentRequired)
      .min(0, messages.rulePercentRange)
      .max(100, messages.rulePercentRange),
    final_limit_percent: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.rulePercentRequired)
      .required(messages.rulePercentRequired)
      .min(0, messages.rulePercentRange)
      .max(100, messages.rulePercentRange),
    discount_percent: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.rulePercentRequired)
      .required(messages.rulePercentRequired)
      .min(0, messages.rulePercentRange)
      .max(100, messages.rulePercentRange),
  });
}

// Produto do subcadastro (`DiscountTableProductForm`) — `product_label` é
// display-only, sem regra de validação própria (nunca vai ao wire).
function productSchema(
  messages: LanguageDate['discountTables']['discountTable']['form']['validation']
) {
  const ruleRow = ruleRowSchema(messages);

  return yup.object({
    product_uuid: yup.string().trim().required(messages.productUuidRequired),
    product_label: yup.string(),
    rules: yup.object({
      impureza: yup.array().of(ruleRow),
      umidade: yup.array().of(ruleRow),
      quebrado: yup.array().of(ruleRow),
      esverdeado: yup.array().of(ruleRow),
      avariado: yup.array().of(ruleRow),
      taxa_recepcao: yup.array().of(ruleRow),
    }),
  });
}

export const discountTableSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.discountTables.discountTable.form.validation;

  return yup.object({
    name: yup.string().trim().required(messages.nameRequired).max(181, messages.nameMax),

    calculation_base: optionSchema.test(
      'required',
      messages.calculationBaseRequired,
      (value) => !!value
    ),

    is_active: optionSchema.test('required', messages.statusRequired, (value) => !!value),

    products: yup
      .array()
      .of(productSchema(messages))
      .min(1, messages.productsMin)
      .required(messages.productsMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const discountTableSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(discountTableSchema(languageGB)) as any;

export default discountTableSchemaResolver;
