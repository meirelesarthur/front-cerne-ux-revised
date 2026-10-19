// src/validations/schemas/Devolutions/devolution-create-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CRIAÇÃO de Devolução/Entrada
// (Devolution — Estoque, escrita, 97-Esteiras/037, Tarefa 08), mirror 1:1
// `requisition-create-schema.ts`, MENOS `warehouse_id.required(...)` no item
// (aqui é opcional/client-only, sem mensagem de erro — não é campo de
// validação de negócio, só UX de busca, `StoreDevolutionItemData` não tem
// `warehouse_uuid`).
//
// `date` é EDITÁVEL real (divergência #3 do módulo) — `required`, string
// (`type="date"` nativo do input já garante formato, sem `.matches`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { DevolutionItemForm } from '@/@types/v2/Devolutions';
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
export const devolutionCreateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.devolutions.devolution.form.validation;

  return yup.object({
    date: yup.string().trim().required(messages.dateRequired),

    // CORRECAO-R1/D1 — `SelectAsyncPaginate` de Employee (`label=value=name`),
    // `classification`/`area_id` REMOVIDOS (API deixou de exigir).
    requester: optionSchema.required(messages.requesterRequired),

    items: yup
      .array()
      .of(
        yup.object().shape<Shape<DevolutionItemForm>>({
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
          // CLIENT-ONLY — filtro de busca da cascata de estoque desta linha,
          // NUNCA persiste (`StoreDevolutionItemData` sem `warehouse_uuid`).
          // Sem `.required()` — não é campo de validação de negócio.
          warehouse_id: optionSchema,
          // Exige `class=Analítico` (mirror `Requisition`/`GAP-RS-08`).
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
export const devolutionCreateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(devolutionCreateSchema(languageGB)) as any;
