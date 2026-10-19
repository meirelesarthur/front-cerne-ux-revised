// src/validations/schemas/Requisitions/requisition-create-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Requisição/Saída
// (Requisition — Estoque, escrita, 97-Esteiras/002, Tarefa 05), espelhando
// `RequisitionRequest::rules()` (lido no código real, `GB.Cerne.Api`) + a
// fidelidade de UX ao mirror `warehouse-transfer-create-schema.ts`. Vive em
// `src/validations/schemas/Requisitions/` (pasta pelo NOME DA ENTIDADE,
// NUNCA em `src/pages/`, mesma convenção dos irmãos).
//
// `amount` é OBRIGATÓRIO e numérico >= 0 (decisão de UX, campo sempre
// calculado no client, `quantity × value`, nunca digitado à mão — mesmo
// racional de `warehouse-transfer-create-schema.ts`).
//
// `classification` é do CABEÇALHO. `area_id` é OPCIONAL (mirror
// `RequisitionRequest::rules()`, `area_uuid: sometimes`). Desde `GAP-RS-11`,
// `cost_center_id`/`warehouse_id` são POR ITEM (dentro de `items[]`), mirror
// do irmão `WarehouseTransfer` para `cost_center_id` — não mais campos do
// cabeçalho.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { RequisitionItemForm } from '@/@types/v2/Requisitions';
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
export const requisitionCreateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.requisitions.requisition.form.validation;

  return yup.object({
    requester: yup.string().trim().required(messages.requesterRequired).max(250),

    classification: optionSchema.required(messages.classificationRequired),

    // Opcional (mirror `RequisitionRequest::rules()`, `area_uuid: sometimes`).
    area_id: optionSchema,

    items: yup
      .array()
      .of(
        yup.object().shape<Shape<RequisitionItemForm>>({
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
          // Filtro CLIENT-ONLY da cascata de estoque DESTA linha
          // (`GAP-RS-02`, preservado) — NUNCA persiste em coluna própria,
          // mas É obrigatório e validado pelo `RequisitionRequest`
          // (`items.*.warehouse_uuid`).
          warehouse_id: optionSchema.required(messages.warehouseRequired),
          // Exige `class=Analítico` (`GAP-RS-08`, preservado) — validação
          // client-side é só feedback antecipado.
          cost_center_id: optionSchema.required(messages.costCenterRequired),
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
export const requisitionCreateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(requisitionCreateSchema(languageGB)) as any;
