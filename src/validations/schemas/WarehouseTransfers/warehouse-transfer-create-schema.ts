// src/validations/schemas/WarehouseTransfers/warehouse-transfer-create-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Trans. Armazém
// (WarehouseTransfer — Estoque, escrita, TASK-WT-FE-01), espelhando
// `WarehouseTransferRequest::rules()` (ramo `store`, lido no código real) +
// a fidelidade de UX ao Blade legado (`_forms.blade.php`). Vive em
// `src/validations/schemas/WarehouseTransfers/` (pasta pelo NOME DA
// ENTIDADE, NUNCA em `src/pages/` — instrução explícita do task-packet).
//
// Builder DISTINTO do de edição (`warehouse-transfer-update-schema.ts`) —
// os 2 formulários têm shapes estruturalmente diferentes (array `items[]`
// em lote × flat de 1 linha), não um único schema com `.when(...)` (mesmo
// racional de bifurcação restrita já usado por `food-beat-schema.ts`).
//
// `amount` é `sometimes` na API, mas este schema o marca OBRIGATÓRIO e
// numérico >= 0 — decisão de UX (campo sempre calculado no client,
// `quantity × value`, nunca digitado à mão), não reabre nenhum gate de "quem
// calcula".
//
// `cost_center_id` é OBRIGATÓRIO em criação (fiel ao Blade
// `_forms.blade.php:73`, `.required()`), embora a API aceite `sometimes` —
// decisão de UX documentada, não é gap.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { WarehouseTransferItemForm } from '@/@types/v2/WarehouseTransfers';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

/**
 * Schema de criação (lote) — cabeçalho + array `items[]`, mínimo 1 item.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de criação em lote.
 */
export const warehouseTransferCreateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.warehouseTransfers.warehouseTransfer.form.validation;

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    // Filtro client-side ÚNICO e COMPARTILHADO por todas as linhas
    // (`DA-WT-12`) — NUNCA vai ao payload, mas é obrigatório na UX (fiel ao
    // Blade, `required()` em `_forms.blade.php:19`).
    origin_warehouse_id: optionSchema.required(messages.originWarehouseRequired),

    destination_warehouse_id: optionSchema.required(messages.destinationWarehouseRequired),

    items: yup
      .array()
      .of(
        yup.object().shape<Shape<WarehouseTransferItemForm>>({
          stock_id: yup.object().nullable().required(messages.itemStockRequired),
          quantity: yup
            .number()
            .typeError(messages.numberType)
            .moreThan(0, messages.quantityMin)
            .required(messages.itemQuantityRequired),
          amount: yup
            .number()
            .typeError(messages.numberType)
            .min(0, messages.quantityMin)
            .required(),
          cost_center_id: yup.object().nullable().required(messages.itemCostCenterRequired),
        })
      )
      .min(1, messages.itemsMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — modo criação (lote).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de criação do módulo.
 */
export const warehouseTransferCreateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(warehouseTransferCreateSchema(languageGB)) as any;
