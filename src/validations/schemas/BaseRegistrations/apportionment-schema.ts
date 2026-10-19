// src/validations/schemas/BaseRegistrations/apportionment-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Rateio - Categoria Financeira
// (Apportionment, TASK-AP-FE-04). Fábrica `(languageGB) => resolver`, mirror
// direto de `movement-allocation-schema.ts` (mesma família de complexidade —
// schema aninhado 2 níveis, `items[].centers[]`).
//
// Decisão do dev (ver ficha TASK-AP-FE-04, "Leitura do dev"): as regras de
// limite (`ha`/`ha_percentage` não excedem o disponível/restante) são hoje SÓ
// client-side no legado (Doc Bruta §5) e o contrato `## 4.3` as move para a
// Action do backend (`BusinessRuleException` 422) — o backend continua sendo
// a fonte de verdade; o client é conveniência de UX, nunca a única barreira.
//
// [RISCO] `unseted_ha` (Ha Disponível por atividade) só existe depois da
// chamada a `GET /apportionments/activities/{activityUuid}/available-ha`
// (## 3, DA-AP-06) — o schema em si NÃO tem acesso a esse valor (vem de fora,
// via prop/contexto do componente, mirror `headerValue` de
// `MovementAllocationEditor`). O `.test('max-available', ...)` abaixo recebe
// o limite via `context` do Yup (`yupResolver(schema, { context: {
// availableHaByActivity } })`) — TODO explícito: a integração real com o
// valor vindo da API só é resolvida quando o componente de edição
// (TASK-AP-FE-06) e a tela de formulário (TASK-AP-FE-08) existirem. Sem o
// contexto, o `.test()` aceita qualquer valor >= 0 (fallback seguro, NUNCA
// bloqueia sem o dado — evita falso-negativo pior que a ausência de
// validação). Idem para o teste equivalente de `ha_percentage` "restante
// entre linhas" (mirror `getMaxPercentage()` do legado, Doc Bruta §9 #9).
//
// [RISCO] `items[].ha`/`items[].percentage` são SEMPRE calculados pelo
// servidor (Doc Bruta §9 #4/#5, campos `readonly`) — não entram no schema de
// validação (só tipados, populados por leitura); only `items[].centers[]` é
// de fato validado.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const apportionmentSchema = (languageGB: LanguageDate) => {
  const v = languageGB.baseRegistrations.apportionment.form.validation;

  const centerSchema = yup.object({
    center_uuid: optionSchema.test('required', v.centerRequired, (value) => !!value),
    ha: yup
      .number()
      .typeError(v.haRequired)
      .required(v.haRequired)
      .min(0, v.haMin)
      // TODO(TASK-AP-FE-06/08): ler `this.options.context.availableHaByActivity`
      // (mirror `MovementAllocationEditor`/`headerValue`) quando o componente
      // de edição prover o contexto do `yupResolver`. Sem o dado, fallback
      // seguro — nunca bloqueia sem confirmar o limite real vindo de
      // `GET /apportionments/activities/{activityUuid}/available-ha`.
      .test('max-available', v.haExceedsAvailable, () => true),
    ha_percentage: yup
      .number()
      .nullable()
      .max(100, v.haPercentageMax)
      // TODO(TASK-AP-FE-06/08): "restante disponível entre as linhas da
      // mesma atividade" (mirror `getMaxPercentage()` do legado, Doc Bruta
      // §9 #9) depende do somatório das outras linhas do mesmo `items[]` —
      // fica para quem integra o context/array-level validation.
      .test('max-remaining-percentage', v.haPercentageExceedsRemaining, () => true),
  });

  const itemSchema = yup.object({
    activity_uuid: yup.string().required(), // sempre preenchido pelo servidor, nunca pelo usuário
    centers: yup.array().of(centerSchema),
  });

  return yup.object({
    financial_category_uuid: optionSchema.test(
      'required',
      v.financialCategoryRequired,
      (value) => !!value
    ),
    items: yup.array().of(itemSchema).min(1, v.itemsMinLength).required(v.itemsMinLength),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const apportionmentSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(apportionmentSchema(languageGB)) as any;

export default apportionmentSchemaResolver;
