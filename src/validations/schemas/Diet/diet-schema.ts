// src/validations/schemas/Diet/diet-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário completo de Dieta (Diet —
// Operacional/Pecuária, TASK-FE-DIET-01), espelhando `DietRequest::rules()`
// (`arquitetura-api-dieta.md` TASK-DIET-API-01, lido diretamente no worktree
// `diet-api`) + a trava client-side de soma=100%
// (`diet-ingredients-sum-schema.ts`). Vive em
// `src/validations/schemas/Diet/` (pasta pelo NOME DA ENTIDADE, NUNCA em
// `src/pages/`).
//
// Campos do cabeçalho — TODOS obrigatórios no servidor exceto `observation`
// (confirmado por leitura direta de `DietRequest.php`): `product_uuid`,
// `measurement_uuid` (⚠️ divergência de `Food`: aqui é OBRIGATÓRIO, não
// nullable), `quantity` (min 0.01), `date`, `objective` (enum), `type`
// (enum). `observation` — `nullable|string|max:1500` (CL-024, validação
// movida ao servidor; client-side replica o `max:1500`).
//
// Convenção de valor RHF (mirror `food-schema.ts`): `product_id`/
// `measurement_id` (cabeçalho) e `product_id`/`measurement_id` (linha de
// composição) guardam o `Option{label,value}` INTEIRO. `objective`/`type`
// são uniões literais cruas (`DietObjective`/`DietType`), NÃO `Option` —
// mirror o Select de poucas opções estáticas de `FoodForm.type`.
//
// Trava de soma=100% (`type==='P'`) é EXCLUSIVAMENTE client-side — ver
// cabeçalho de `diet-ingredients-sum-schema.ts` (achado confirmado: não há
// `FeedstocksPercentageSumRule` equivalente para Diet no backend).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

import { dietIngredientsSumIsValid } from './diet-ingredients-sum-schema';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const dietSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.diets.diet.form.validation;

  return yup.object({
    product_id: optionSchema.test('required', messages.productRequired, (value) => !!value),

    // ⚠️ Divergência de `Food` (nullable ali): `measurement_uuid` é
    // OBRIGATÓRIO em `DietRequest::rules()` — confirmado por leitura direta.
    measurement_id: optionSchema.test('required', messages.measurementRequired, (value) => !!value),

    date: yup.string().trim().required(messages.dateRequired),

    objective: yup.string().oneOf(['AD', 'CR', 'TE']).required(messages.objectiveRequired),

    // Union literal crua ('P' | 'U'), NÃO um `Option` — mirror `FoodForm.type`.
    type: yup.string().oneOf(['P', 'U']).required(messages.typeRequired),

    // `FoodRequest` §4.1 equivalente: required|numeric|min:0.01.
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityMin)
      .required(messages.quantityMin)
      .min(0.01, messages.quantityMin),

    // CL-024 — nullable|string|max:1500 (validação movida ao servidor,
    // replicada aqui client-side).
    observation: yup.string().nullable().max(1500, messages.observationMax),

    ingredients: yup
      .array()
      .of(
        yup.object({
          product_id: optionSchema.test(
            'required',
            messages.ingredientProductRequired,
            (value) => !!value
          ),
          measurement_id: optionSchema.test(
            'required',
            messages.ingredientMeasurementRequired,
            (value) => !!value
          ),
          dry_matter: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.dryMatterMin)
            .required(messages.dryMatterMin)
            .min(0, messages.dryMatterMin),
          cost_value: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.costValueMin)
            .required(messages.costValueMin)
            .min(0, messages.costValueMin),
          // Nome do campo mantido `quantity` (mirror `Food.percentage`) — a
          // mensagem usa o RÓTULO dinâmico do form (P/U), não o nome do campo.
          quantity: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.ingredientQuantityMin)
            .required(messages.ingredientQuantityMin)
            .min(0.01, messages.ingredientQuantityMin),
        })
      )
      // Trava de soma=100% (client-side ONLY, ver cabeçalho do arquivo) —
      // roda ANTES do `.min(1)` (array vazio já falha ali, sem duplicar
      // mensagem). Arrow function (não `function`/`this`), mesma técnica de
      // `food-schema.ts` para evitar `no-invalid-this` do eslint do projeto.
      .test('sum-100-when-percentage-type', messages.ingredientsSumMustBe100, (items, context) =>
        dietIngredientsSumIsValid(items, context.parent?.type)
      )
      .min(1, messages.ingredientsMin)
      .required(messages.ingredientsMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const dietSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(dietSchema(languageGB)) as any;

export default dietSchemaResolver;
