// src/validations/schemas/DietBeats/diet-beat-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Batida (DietBeat —
// Operacional/Pecuária, TASK-FE-DIET-04), espelhando
// `DietBeatRequest::rules()` (`arquitetura-api-dieta.md` TASK-DIET-API-02,
// lido diretamente no worktree `diet-api`). Vive em
// `src/validations/schemas/DietBeats/` (pasta pelo NOME DA ENTIDADE, NUNCA
// em `src/pages/`).
//
// UM ÚNICO schema (create === update) — confirmado por leitura direta:
// `DietBeatRequest::rules()` é o MESMO conjunto em `store()`/`update()`
// (diferente de `FoodBeatRequest`, que bifurca create/update). `diet_id` é
// readonly em modo edição na TELA (TASK-FE-DIET-06), não neste schema — o
// valor sempre está presente no form (hidratado), então a validação
// `required` não precisa saber do modo.
//
// `quantity_realized`/`percentage`/`dry_matter`/`cost_value`/`quantity` dos
// itens são aceitos SEM recompute server-side além de `total` (AD-06 CV-07)
// — este schema valida presença/tipo/min, mirror `DietBeatRequest`, sem
// validar coerência de saldo real (isso é onBlur client-side no editor de
// itens, TASK-FE-DIET-06, cap ao saldo — CL-030).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';
import type { DietBeatItemForm } from '@/@types/v2/DietBeats';
import type Shape from '@/@types/validations/shape';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const dietBeatSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.dietBeats.dietBeat.form.validation;

  return yup.object({
    equipment_id: optionSchema.test('required', messages.equipmentRequired, (value) => !!value),

    diet_id: optionSchema.test('required', messages.dietRequired, (value) => !!value),

    measurement_id: optionSchema.test('required', messages.measurementRequired, (value) => !!value),

    date: yup.string().trim().required(messages.dateRequired),

    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityRequired)
      .required(messages.quantityRequired)
      .min(0.01, messages.quantityMin),

    items: yup
      .array()
      .of(
        yup.object().shape<Shape<DietBeatItemForm>>({
          stock_id: yup.object().nullable().required(messages.itemStockRequired),
          // CL-030 — cap ao saldo disponível é onBlur client-side no editor
          // (TASK-FE-DIET-06), não neste `.max()` — o saldo é dinâmico por
          // linha (cache `Map<uuid, StockListItem>`), fora do alcance
          // estático do Yup.
          quantity_realized: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.numberType)
            .moreThan(0, messages.itemQuantityRealizedMin)
            .required(messages.itemQuantityRealizedRequired),
        })
      )
      .min(1, messages.itemsMin)
      .required(messages.itemsMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const dietBeatSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(dietBeatSchema(languageGB)) as any;

export default dietBeatSchemaResolver;
