// src/pages/CadastrosBase/CentroCusto/centro-custo-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de Centro de Custo — campos centrais
// (TASK-FE-003) + seção de Rateio/`apportionments` (TASK-FE-004) — padrão da
// empresa: FUNÇÃO que recebe `languageGB` e devolve o schema (mensagens i18n).
// Mirror mecânico de Perfil/perfil-schema.ts.
//
// `condition` é validado como STRING ('1'|'2'|'3') — mesma convenção de
// `CostCenterFilterForm.type`/`is_enabled` (o componente `Select` trabalha
// com valores string). A conversão para o `number` real do payload
// (`CostCenterPayload.condition`) acontece só em `CreateOrUpdateCentroCusto.tsx`.
//
// `parent_uuid` NÃO entra neste schema (mesmo racional de `perfil-schema.ts`
// não validar `uuid`): guarda um objeto `Option` (não uma folha simples) e não
// é obrigatório.
//
// `apportionments` É obrigatório (array não-vazio, cada item validado) SOMENTE
// quando `type === 'apportioned'` — via `.when('type', ...)`. Confirmado nesta
// rodada de execução (node_modules/yup@0.32.11 — `Condition.js` linha 39:
// `if (typeof branch === 'function') return branch(schema);`) que a forma
// `then: (schema) => schema.min(...)` — e não só `then: <schema pronto>` — é
// suportada em tempo de execução por esta versão do Yup (o `.d.ts` já
// documentava as duas formas; validado contra o JS compilado para não assumir
// a API "v1" do Yup sem confirmação). `percentage` valida 0–100 SEMPRE que o
// item existir (independente do `type`) — na prática só há itens quando
// `apportioned`, já que a tela zera o array ao trocar para `productive`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const centroCustoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.costCenters.costCenter.form.validation;

  const apportionmentItemSchema = yup.object({
    cost_center_uuid: yup.string().required(messages.apportionmentCostCenterRequired),
    percentage: yup
      .number()
      .typeError(messages.apportionmentPercentageRequired)
      .min(0, messages.apportionmentPercentageRange)
      .max(100, messages.apportionmentPercentageRange)
      .required(messages.apportionmentPercentageRequired),
  });

  return yup.object({
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(40, messages.descriptionMaxLength),
    condition: yup
      .string()
      .oneOf(['1', '2', '3'], messages.conditionRequired)
      .required(messages.conditionRequired),
    is_enabled: yup.boolean().required(),
    allow_pointing: yup.boolean(),
    type: yup.string().oneOf(['productive', 'apportioned']),
    apportionments: yup
      .array()
      .of(apportionmentItemSchema)
      .when('type', {
        is: 'apportioned',
        then: (schema) => schema.min(1, messages.apportionmentsRequired),
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const centroCustoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(centroCustoSchema(languageGB));

export default centroCustoSchemaResolver;
