// src/validations/schemas/FoodBeats/food-beat-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Batida (FoodBeat — Fábrica,
// TASK-FB-FE-02), espelhando `FoodBeatRequest::rules()`
// (FoodBeat-contrato.md §4.1) + a bifurcação por `type` (F/E). Vive em
// `src/validations/schemas/FoodBeats/` (pasta pelo NOME DA ENTIDADE, NUNCA em
// `src/pages/` — instrução explícita do task-packet).
//
// DOIS builders distintos (`foodBeatCreateSchema`/`foodBeatUpdateSchema`) em
// vez de 1 schema com `.when('mode', ...)` — porque a Decisão 1 do contrato
// (`## 9`) faz o `update()` só validar/enviar `date`; manter o contrato de
// `update` isolado deixa essa restrição auditável sozinha, sem se misturar
// com as ~10 regras de `create` (mesmo racional de bifurcação restrita já
// usado por outros módulos do projeto para o mesmo tipo de assimetria
// create/edit).
//
// Fora de escopo deste schema (ver "Leitura do dev" da Tarefa): validação de
// "saldo insuficiente" (regra de runtime, resolvida via onBlur client-side
// nos editores, `TASK-FB-FE-04`) e de "lote duplicado" (regra de negócio
// server-side, 422 mapeado, `TASK-FB-FE-06`). Yup aqui só valida
// presença/tipo/shape, mirror do próprio `FoodBeatRequest::rules()` (que
// também não valida essas duas coisas em `rules()`).
//
// `amount`/`total`/`percentage` dos itens são aceitos pelo contrato SEM
// recompute server-side (`DA-FB-08`) — este schema valida que são
// `numeric`/`min` (mesma exigência do `FoodBeatRequest`), mas NÃO valida
// coerência com o saldo real (isso seria uma correção server-side rejeitada
// pelo dono). Não "corrigir por design" aqui — replicar a permissividade
// aprovada.
//
// `provider_lot`/`shelf_life`: obrigatoriedade condicional a `has_lot` do
// produto selecionado, resolvida via `options.context.hasLot` (flag
// assíncrona, não campo do form) — o chamador (`TASK-FB-FE-06`) deve passar
// `yupResolver(schema, {}, { context: { hasLot } })`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { FoodBeatFormulationItemForm, FoodBeatStockItemForm } from '@/@types/v2/FoodBeats';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const foodBeatCreateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.foodBeats.foodBeat.form.validation;

  return yup.object({
    warehouse_id: optionSchema.required(messages.warehouseRequired),

    date: yup.string().trim().required(messages.dateRequired),

    // Union literal crua ('F' | 'E'), NÃO um `Option` — mirror `FoodForm.type`
    // (`@/@types/v2/FoodBeats`, `FoodBeatForm.type: FoodBeatType`).
    type: yup.string().oneOf(['F', 'E']).required(messages.typeRequired),

    food_id: optionSchema.when('type', {
      is: 'F',
      then: (schema) => schema.required(messages.foodRequired),
    }),

    product_id: optionSchema.when('type', {
      is: 'E',
      then: (schema) => schema.required(messages.productRequired),
    }),

    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityRequired)
      .required(messages.quantityRequired)
      .moreThan(0, messages.quantityMin),

    // Obrigatoriedade condicional a `has_lot` do produto selecionado — flag
    // resolvida por fetch assíncrono do Produto, não campo do form (ver
    // cabeçalho do arquivo). Ambos (`provider_lot`/`shelf_life`) exigidos
    // juntos quando `has_lot=true` (Doc Bruta §12.1 linha 14-15).
    provider_lot: yup
      .string()
      .nullable()
      .max(15, messages.providerLotMax)
      .test(
        'provider-lot-required-if-has-lot',
        messages.providerLotRequiredWhenHasLot,
        (value, context) => {
          const hasLot = (context?.options?.context as { hasLot?: boolean } | undefined)?.hasLot;
          if (!hasLot) return true;
          return !!value;
        }
      ),

    shelf_life: yup
      .string()
      .nullable()
      .test(
        'shelf-life-required-if-has-lot',
        messages.shelfLifeRequiredWhenHasLot,
        (value, context) => {
          const hasLot = (context?.options?.context as { hasLot?: boolean } | undefined)?.hasLot;
          if (!hasLot) return true;
          return !!value;
        }
      ),

    formulationItems: yup
      .array()
      .of(
        yup.object().shape<Shape<FoodBeatFormulationItemForm>>({
          stock_id: yup.object().nullable().required(messages.itemStockRequired),
          feedstock_quantity_realized: yup
            .number()
            .typeError(messages.numberType)
            .min(0, messages.quantityMin)
            .required(messages.itemQuantityRequired),
        })
      )
      .when('type', {
        is: 'F',
        then: (schema) => schema.min(1, messages.itemsMin),
      }),

    stockItems: yup
      .array()
      .of(
        yup.object().shape<Shape<FoodBeatStockItemForm>>({
          warehouse_id: yup.object().nullable().required(messages.itemWarehouseRequired),
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
            .required(messages.itemAmountRequired),
          total: yup
            .number()
            .typeError(messages.numberType)
            .min(0, messages.quantityMin)
            .required(messages.itemTotalRequired),
        })
      )
      .when('type', {
        is: 'E',
        then: (schema) => schema.min(1, messages.itemsMin),
      }),
  });
};

/**
 * `PUT /food-beats/{uuid}` — SOMENTE `date` validado.
 *
 * ⚠️ `## 9` Decisão 1 do `FoodBeat-contrato.md` (dono, 2026-08-11): `update()`
 * é fiel ao legado — só a data é persistida/validada em modo edição. Nenhum
 * outro campo do `FoodBeatForm` passa por este schema — mirror direto de
 * `UpdateFoodBeatPayload` (`TASK-FB-FE-01`, `@/@types/v2/FoodBeats`). Não
 * "corrigir" para validar os demais campos — a Decisão 1 é requisito, não
 * dívida.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup de edição (só `date`).
 */
export const foodBeatUpdateSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.foodBeats.foodBeat.form.validation;

  return yup.object({
    date: yup.string().required(messages.dateRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — modo create.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de criação do módulo.
 */
export const foodBeatCreateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(foodBeatCreateSchema(languageGB)) as any;

/**
 * Resolver pronto para o `useForm({ resolver })` — modo edição (só `date`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de edição do módulo.
 */
export const foodBeatUpdateSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(foodBeatUpdateSchema(languageGB)) as any;
