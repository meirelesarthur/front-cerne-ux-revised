// src/pages/CadastrosBase/CicloProducao/ciclo-producao-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do formulário de CICLO DE PRODUÇÃO — TASK-FE-02
// (97-Esteiras/033). Mirror mecânico de `Safra/safra-schema.ts`: FUNÇÃO que
// recebe `languageGB` e devolve o schema (mensagens i18n do próprio módulo,
// `languageGB.productionCycles.productionCycle.form.validation`, já
// reservadas pela TASK-FE-01).
//
// `date`/`start_date`/`end_date` são 3 campos DISTINTOS (L2, FID-G3F §2.3) —
// cada um com sua própria mensagem, nunca compartilhada. `end_date >=
// start_date` é validado via `.test()` comparando strings 'YYYY-MM-DD'
// (formato nativo de `<input type="date">`), mesmo racional documentado em
// `safra-schema.ts` (paridade client-side com `after_or_equal:start_date`
// do backend, D1 do contrato de API) — NUNCA `yup.date()` aqui, que casta
// para `Date` e quebraria tanto o valor do `<input>` quanto o payload
// (`ProductionCyclePayload.end_date: string`).
//
// `harvest_uuid`/`cultivation_uuid`/`center_uuid` são validados como STRING
// (uuid) — os componentes de Select da tela (`Select` nativo para Safra,
// `SelectCultivation`/`SelectAsyncPaginate` para Cultura/Centro de Custo) já
// fazem o unwrap de `.value` no `onChange` antes de chamar `field.onChange`,
// então o valor que chega aqui já é o primitivo puro do `ProductionCycleForm`
// (mesmo racional de `herd_control`/`first_month` em `safra-schema.ts`).
//
// `areas` (multiselect, D-FE-2) é `string[]` (uuid[]) — `.min(1)` espelha o
// `required|min:1` do backend (`ProductionCycleRequest`, FID-G3F §2.4/C48).
//
// `employee_uuid` é OPCIONAL de verdade (backend aceita `nullable`, D-FE-6) —
// sem `.required()`.
//
// `code`/`user_id`/`farm_id` NUNCA entram neste schema — nunca fazem parte
// do payload (R4/R5/R7, FID-G3F §3.4).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const cicloProducaoSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.productionCycles.productionCycle.form.validation;

  return yup.object({
    date: yup
      .string()
      .required(messages.dateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.dateRequired, excludeEmptyString: true }),
    start_date: yup
      .string()
      .required(messages.startDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.startDateRequired, excludeEmptyString: true }),
    end_date: yup
      .string()
      .required(messages.endDateRequired)
      .matches(ISO_DATE_REGEX, { message: messages.endDateRequired, excludeEmptyString: true })
      // Mirror client-side de `after_or_equal:start_date` do backend (D1).
      // 2º parâmetro (`ctx`) em vez de `this.parent` — mesma convenção de
      // `safra-schema.ts` (evita `no-invalid-this` do ESLint).
      .test('end-after-or-equal-start', messages.endDateBeforeStart, (value, ctx) => {
        const { start_date: startDate } = ctx.parent;
        if (!value || !startDate) return true; // ausência já é responsabilidade do `.required()`
        return value >= startDate;
      }),
    harvest_uuid: yup
      .string()
      .required(messages.harvestRequired)
      .matches(UUID_REGEX, { message: messages.harvestRequired, excludeEmptyString: true }),
    cultivation_uuid: yup
      .string()
      .required(messages.cultivationRequired)
      .matches(UUID_REGEX, { message: messages.cultivationRequired, excludeEmptyString: true }),
    // Centro de Custo ANALÍTICO (L4) — a validação de que é de fato analítico
    // é responsabilidade do servidor (422 se sintético); aqui só uuid+required.
    center_uuid: yup
      .string()
      .required(messages.costCenterRequired)
      .matches(UUID_REGEX, { message: messages.costCenterRequired, excludeEmptyString: true }),
    description: yup
      .string()
      .trim()
      .required(messages.descriptionRequired)
      .max(100, messages.descriptionMaxLength),
    // `areas` (D-FE-2) — uuid[], min 1 (C48/backend `required|min:1`).
    areas: yup
      .array()
      .of(yup.string().required())
      .min(1, messages.areasRequired)
      .required(messages.areasRequired),
    // Opcional de verdade (D-FE-6) — sem `.required()`; `nullable()` cobre o
    // estado inicial/"limpo" do `SelectAsyncPaginate`.
    employee_uuid: yup.string().nullable().defined(),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema do módulo.
 */
export const cicloProducaoSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(cicloProducaoSchema(languageGB));

export default cicloProducaoSchemaResolver;
