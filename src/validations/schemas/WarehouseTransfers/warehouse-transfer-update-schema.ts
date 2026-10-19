// src/validations/schemas/WarehouseTransfers/warehouse-transfer-update-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de EDIÇÃO de Trans. Armazém
// (WarehouseTransfer — Estoque, escrita, TASK-WT-FE-01), espelhando
// `WarehouseTransferRequest::rules()` (ramo `update`, lido no código real) +
// a fidelidade de UX ao Blade legado (`_forms-edit.blade.php`). Vive em
// `src/validations/schemas/WarehouseTransfers/` (pasta pelo NOME DA
// ENTIDADE, NUNCA em `src/pages/`).
//
// Builder DISTINTO do de criação (`warehouse-transfer-create-schema.ts`) —
// FLAT (sem `.of(...)`), 1 linha só. `cost_center_id` é OPCIONAL aqui
// (fiel a `_forms-edit.blade.php:57`, sem `.required()`) — diverge do
// create de propósito (fidelidade ao Blade em cada modo, não é
// inconsistência).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema de edição — 1 linha, FLAT. `cost_center_id` opcional (fiel ao
 * Blade de edição).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de edição de 1 linha.
 */
export const warehouseTransferUpdateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.warehouseTransfers.warehouseTransfer.form.validation;

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    // Exibição/filtro client-side, NUNCA no payload (`DA-WT-12`) — mesma
    // obrigatoriedade de UX do modo criação.
    origin_warehouse_id: optionSchema.required(messages.originWarehouseRequired),

    stock_id: yup.object().nullable().required(messages.itemStockRequired),

    quantity: yup
      .number()
      .typeError(messages.numberType)
      .moreThan(0, messages.quantityMin)
      .required(messages.itemQuantityRequired),

    value: yup.number().typeError(messages.numberType).min(0, messages.quantityMin).required(),

    amount: yup.number().typeError(messages.numberType).min(0, messages.quantityMin).required(),

    destination_warehouse_id: optionSchema.required(messages.destinationWarehouseRequired),

    // Opcional em edição — fiel a `_forms-edit.blade.php:57` (sem
    // `.required()`), diverge do create de propósito.
    cost_center_id: optionSchema,
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — modo edição (1 linha).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de edição do módulo.
 */
export const warehouseTransferUpdateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(warehouseTransferUpdateSchema(languageGB)) as any;
