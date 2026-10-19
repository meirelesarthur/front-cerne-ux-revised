// src/validations/schemas/Nutrition/nutrition-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Nutrição (TASK-NT-FE-01),
// espelhando `NutritionRequest::rules()` (`Nutrition-contrato.md DA-NT-08`).
// Vive em `src/validations/schemas/Nutrition/` (pasta pelo NOME DA ENTIDADE,
// NUNCA em `src/pages/` — instrução explícita do task-packet).
//
// Schema ÚNICO (`nutritionSchema`), SEM bifurcação create×edit — `DA-NT-11`
// unifica o shape do formulário (diferente da bifurcação restrita que
// `FoodBeat` precisou por causa da Decisão 1 de `update()` só aceitar
// `date`; aqui `update()` aceita o MESMO payload completo de `create()`).
//
// Toda mensagem vem de `languageGB.nutritions.nutrition.form.validation`
// (nunca string literal), mirror `fieldValidationSchema` do padrão vigente.
//
// Fora de escopo deste schema (fundação, `TASK-NT-FE-01`): a regra de
// exclusão mútua de UI entre `area_id`/`grazing_id` e a decisão de qual
// campo aparece (produto vs. dieta automática) são resolvidas na tela do
// formulário (`TASK-NT-FE-03`) — este schema só garante que UM dos dois
// (`product_id`/`diet_beat_id`) está presente, mirror `CALC-01`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { NutritionEmployeeForm, NutritionItemForm } from '@/@types/v2/Nutritions';
import type Shape from '@/@types/validations/shape';

/**
 * Schema único de Nutrição (criar+editar, `DA-NT-11`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {yup.ObjectSchema<any>} Schema Yup do formulário completo.
 */
export const nutritionSchema = (languageGB: LanguageDate) => {
  const v = languageGB.nutritions.nutrition.form.validation;

  return yup.object({
    date: yup.string().trim().required(v.dateRequired),

    time_control: yup.boolean().required(),

    items: yup
      .array()
      .of(
        yup.object().shape<Shape<NutritionItemForm>>({
          // `FLD-11`, obrigatório.
          trough_id: yup.object().nullable().required(v.itemTroughRequired),

          // `FLD-09`.
          quantity: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(v.numberType)
            .moreThan(0, v.quantityMin)
            .required(v.itemQuantityRequired),

          // Mutuamente exclusivo com `diet_beat_id` (`CALC-01`) — um dos
          // dois é obrigatório.
          product_id: yup
            .object()
            .nullable()
            .when('diet_beat_id', {
              is: (dietBeat: Option | null) => !dietBeat,
              then: (schema) => schema.required(v.itemProductOrDietRequired),
            }),

          // TASK-095-FE-R2-01 — armazém obrigatório quando há produto
          // (espelha `required_with:items.*.product_uuid` da API). Item de
          // dieta automática (sem produto) segue sem armazém.
          warehouse_id: yup
            .object()
            .nullable()
            .when('product_id', {
              is: (product: Option | null) => !!product,
              then: (schema) => schema.required(v.itemWarehouseRequired),
            }),

          // Mutuamente exclusivo com `product_id` — regra de exclusão de UI
          // (não union de tipo) fica para `TASK-NT-FE-03`.
          diet_beat_id: yup.object().nullable(),

          // `FLD-10` — mutuamente exclusivos, regra de UI em TASK-NT-FE-03.
          area_id: yup.object().nullable(),
          grazing_id: yup.object().nullable(),

          // `FLD-13` — legado trava só no cliente, sem exigir no server
          // (`DA-NT-08`).
          cost_center_id: yup.object().nullable(),

          // `FLD-14` — mirror `hasBatchValidate()` do cliente legado, agora
          // também no server (`DA-NT-08`).
          batches: yup.array().of(yup.string().required()).min(1, v.itemBatchesMin),
        })
      )
      .min(1, v.itemsMin),

    // Bloco "Controle de Horas" — só validado/enviado quando
    // `time_control=true` (`strip()` remove o campo do valor casteado
    // quando desligado, mirror ausência de validação server pré-`DA-NT-08`).
    employees: yup.array().when('time_control', {
      is: true,
      then: (schema) =>
        schema.of(
          yup.object().shape<Shape<NutritionEmployeeForm>>({
            // `FLD-16` — `Option<FuncType>`, nunca string/number cru.
            func_type: yup.object().nullable().required(v.employeeFuncTypeRequired),
            // `FLD-17`.
            func_executor_id: yup.object().nullable().required(v.employeeFuncExecutorRequired),
            // `FLD-18`.
            func_um: yup.object().nullable().required(v.employeeFuncUmRequired),
            // `FLD-19`.
            func_total_quantity: yup
              .number()
              .transform((value, original) =>
                original === '' || original === null ? undefined : value
              )
              .typeError(v.numberType)
              .required(v.employeeFuncTotalRequired),
          })
        ),
      otherwise: (schema) => schema.strip(),
    }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })` — schema único
 * (criar+editar, `DA-NT-11`).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de Nutrição.
 */
export const nutritionSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(nutritionSchema(languageGB)) as any;
