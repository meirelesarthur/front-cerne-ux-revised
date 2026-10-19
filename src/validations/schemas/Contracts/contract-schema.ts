// src/validations/schemas/Contracts/contract-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário único de Gestão de Contratos
// (Contract — Financeiro, esteira 97-Esteiras/023, TASK-CTR-FE-04). Fábrica
// `(languageGB) => yupResolver(...)`, mirror mecânico de
// `requestPurchaseSchemaResolver`
// (`src/validations/schemas/RequestPurchases/request-purchase-schema.ts`).
//
// Localização: `src/validations/schemas/Contracts/`, NUNCA em `pages/`
// (regra inviolável da Tarefa).
//
// Mensagens 100% via `languageGB.contracts.contract.form.validation.*`
// (`TASK-CTR-FE-02`), zero string literal.
//
// Fonte normativa: Contract-FrontEnd-contrato.md §3 (ContractRequest real —
// cabeçalho `provider_uuid`/`employee_uuid`/`number`/`date`/`expiration_date`/
// `installments`/`quantity`/`unit_value_sc` todos `required`; `items[]`
// mínimo 1, cada linha exige `warehouse_uuid`/`product_uuid`/`quantity`).
//
// -- Diferença deliberada frente ao mecanismo de `request-purchase-schema` --
// Contract NÃO tem enum de `type`/status (Riscos + solução da própria
// Tarefa) — não há campo condicionante no formulário pai que mude a
// obrigatoriedade de campos de `items[]`. Por isso `itemRowSchema` usa
// `.required()` direto por campo (sem `.test()` de array lendo
// `context.parent`, sem matriz `REQUIRED_ITEM_FIELDS_BY_TYPE`) — replicar o
// mecanismo condicional aqui seria over-engineering (risco já sinalizado na
// Tarefa).
//
// `amount`/`code` NUNCA aparecem neste schema — são sempre recalculados/
// gerados server-side (DA-CT-06), nunca campos de formulário (só leitura,
// `InputReadOnly` em `TASK-CTR-FE-08`).
//
// -- Correção de vazamento de `typeError` em inglês (`installments`/
//    `quantity`/`unit_value_sc`/item `quantity`) -----------------------------
// Sem `.nullable()`, o Yup dispara o `typeError` padrão em inglês ("must be a
// `number` type...") ANTES do `.required()` mesmo com `transform()` já
// convertendo `''`/`null` para `null` — o `isType()` interno do Yup só aceita
// `null` como válido quando o schema está marcado `.nullable()`. Corrigido
// nos 4 campos numéricos: `.transform()` (agora também cobre `Number.isNaN`,
// caso de texto não-numérico) + `.nullable()` + `.typeError()`. Mensagem de
// `.typeError()` reaproveita a MESMA chave `*Required` já traduzida (mesmo
// padrão de `account-schema.ts`/`tax-rule-schema.ts` — campo obrigatório não
// precisa de mensagem de tipo separada da de obrigatoriedade), zero chave
// nova de i18n.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

export const contractSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.contracts.contract.form.validation;

  const itemRowSchema = yup.object({
    // Controle (mirror `item_uuid` de RequestPurchase/DA-CT-08) — `null`/
    // ausente = item novo. Fora da validação.
    item_uuid: yup.string().nullable(),
    warehouse_uuid: yup.mixed<Option<string> | null>().required(messages.itemWarehouseRequired),
    product_uuid: yup.mixed<Option<string> | null>().required(messages.itemProductRequired),
    quantity: yup
      .number()
      .typeError(messages.itemQuantityRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.itemQuantityRequired)
      .min(0.01, messages.itemQuantityMin),
  });

  return yup.object({
    // -- Cabeçalho --
    provider_uuid: yup.mixed<Option<string> | null>().required(messages.providerRequired),
    employee_uuid: yup.mixed<Option<string> | null>().required(messages.employeeRequired),
    number: yup
      .string()
      .trim()
      .required(messages.numberRequired)
      .max(191, messages.numberMaxLength),
    date: yup.string().nullable().required(messages.dateRequired),
    expiration_date: yup.string().nullable().required(messages.expirationDateRequired),
    installments: yup
      .number()
      .typeError(messages.installmentsRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.installmentsRequired)
      .min(1, messages.installmentsMin),
    quantity: yup
      .number()
      .typeError(messages.quantityRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.quantityRequired)
      .min(0.01, messages.quantityMin),
    unit_value_sc: yup
      .number()
      .typeError(messages.unitValueScRequired)
      .transform((value, original) =>
        original === '' || original === null || Number.isNaN(value) ? null : value
      )
      .nullable()
      .required(messages.unitValueScRequired)
      .min(0, messages.unitValueScMin),

    // -- Itens (mínimo 1, sem condicional por tipo — Contract não tem enum) --
    items: yup.array().of(itemRowSchema).min(1, messages.itemsMinOne),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const contractSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(contractSchema(languageGB));

export default contractSchemaResolver;
