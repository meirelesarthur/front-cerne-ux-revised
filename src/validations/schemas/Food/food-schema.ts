// src/validations/schemas/Food/food-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário completo de Formulação (Food —
// Fábrica/Ração, TASK-FOOD-FE-02), espelhando `FoodRequest::rules()`
// (Food-contrato.md §4.1, RECONCILIADO pós-`GAP-22`) + a trava client-side
// de soma=100% (`feedstocks-sum-schema.ts`). Vive em
// `src/validations/schemas/Food/` (pasta pelo NOME DA ENTIDADE, NUNCA em
// `src/pages/` — instrução explícita do task-packet).
//
// ⚠️ DIVERGÊNCIA DOCUMENTADA DO PADRÃO GERAL (ver TASK-FOOD-FE-02, "Riscos +
// solução"): o protocolo `padrao-frontend-gb-cerne-v2` prefere alertas que
// NUNCA bloqueiam submit (mirror `MovementAllocationEditor`, badge
// cosmético sobre um `.test()` real — aliás o PRÓPRIO `movement-schema.ts`
// hoje bloqueia por reversão pontual, TASK-MV-FE-08 Ajuste 2). Este módulo é
// uma EXCEÇÃO EXPLÍCITA, autorizada pelo requisito do dono (fidelidade ao
// Blade legado, `handleTotal()`/`.btn-save-food`,
// `_forms.blade.php:158-178`) e já espelhada na Decisão 4 (APROVADA) do
// `Food-contrato.md §9` — o backend TAMBÉM valida soma=100 server-side
// quando `type='P'` (`FeedstocksPercentageSumRule`, `TASK-FOOD-05` ✅). NÃO
// "corrigir" silenciosamente para o padrão genérico de alerta não-bloqueante
// — o bloqueio aqui é requisito, não dívida.
//
// Convenção de valor RHF (mirror `movement-schema.ts`): `product_id`/
// `measurement_id` (cabeçalho) e `feedstock_product_id`/`measurements`
// (composição) guardam o `Option{label,value}` INTEIRO — nomes de campo
// EXATOS ao legado (fidelidade, `Food-contrato.md §6`). `type` é a única
// exceção — union literal `FoodType` cru (`'P' | 'U'`, ver
// `@/@types/v2/Foods/index.d.ts`), NÃO um `Option` — mirror o toggle de 2
// valores do legado (RadioGroup/ButtonGroup, não Select buscável). A
// extração do uuid cru de `product_id.value`/`measurement_id.value` para
// `FoodPayload.product_uuid`/`measurement_uuid` (GAP-22) acontece na tela do
// formulário (`TASK-FOOD-FE-06`), nunca neste schema.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

import { feedstocksSumIsValid } from './feedstocks-sum-schema';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const foodSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.foods.food.form.validation;

  return yup.object({
    product_id: optionSchema.test('required', messages.productRequired, (value) => !!value),

    date: yup.string().trim().required(messages.dateRequired),

    is_enabled: yup.boolean().default(true).required(),

    // Union literal crua ('P' | 'U'), NÃO um `Option` — ver cabeçalho do arquivo.
    type: yup.string().oneOf(['P', 'U']).required(messages.typeRequired),

    // Nullable no contrato (`measurement_uuid`, Food-contrato.md §4.1) —
    // sem `.test('required', ...)`.
    measurement_id: optionSchema,

    // `FoodRequest` §4.1: required|numeric|min:0.01.
    quantity: yup
      .number()
      .transform((value, original) => (original === '' || original === null ? undefined : value))
      .typeError(messages.quantityMin)
      .required(messages.quantityMin)
      .min(0.01, messages.quantityMin),

    feedstocks: yup
      .array()
      .of(
        yup.object({
          feedstock_product_id: optionSchema.test(
            'required',
            messages.feedstockProductRequired,
            (value) => !!value
          ),
          // Nullable no contrato (`feedstocks.*.measurement_uuid`) — sem `.test('required', ...)`.
          measurements: optionSchema,
          // Nome do campo mantido `percentage` (Decisão 1 do contrato) — a
          // mensagem usa o RÓTULO dinâmico do form (P/U), não o nome do campo.
          percentage: yup
            .number()
            .transform((value, original) =>
              original === '' || original === null ? undefined : value
            )
            .typeError(messages.percentageMin)
            .required(messages.percentageMin)
            .min(0, messages.percentageMin),
        })
      )
      // Trava de soma=100% (EXCEÇÃO documentada, ver cabeçalho do arquivo) —
      // roda ANTES do `.min(1)` (array vazio já falha ali, sem duplicar
      // mensagem — `feedstocksSumIsValid` já trata isso). `context.parent`
      // é o objeto irmão do MESMO `yup.object()` raiz (`type` é campo de
      // topo do form completo, união literal crua). Arrow function (não
      // `function`/`this`), mesma técnica de `movement-schema.ts`/
      // `parameterWeights-schema.ts` para evitar `no-invalid-this` do
      // eslint do projeto.
      .test('sum-100-when-percentage-type', messages.percentageSumMustBe100, (items, context) =>
        feedstocksSumIsValid(items, context.parent?.type)
      )
      .min(1, messages.feedstocksMin)
      .required(messages.feedstocksMin),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const foodSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(foodSchema(languageGB)) as any;

export default foodSchemaResolver;
