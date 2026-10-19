// src/validations/schemas/RelatorioSla/relatorio-sla-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do Relatório SLA (SupplyStatusSlaReport —
// Administrativo / Suprimentos, TASK-SLA-FE-01, esteira 97-Esteiras/037).
// Vive em `src/validations/schemas/RelatorioSla/` (pasta pelo NOME DA TELA,
// mirror `Compras/inform-request-purchase-status-schema.ts` — schema de
// FILTRO/ação dedicado, não de entidade).
//
// Mirror EXATO de `RequestPurchaseSlaReportRequest::rules()` (API,
// confirmado por leitura direta): `start_date`/`end_date` `required_with`
// MÚTUO, `sometimes`; `uuid`/`status` totalmente opcionais. Nenhum campo é
// `required` de forma incondicional — sem `uuid` E sem par de datas, o
// backend não dá 422, dá `BusinessRuleException` de negócio (RN-02); o
// client só bloqueia client-side o SUBMIT (botão "Gerar" desabilitado,
// TASK-SLA-FE-02), esta validação cobre apenas o par de datas incompleto.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

/** Mirror `inform-request-purchase-status-schema.ts`/`movement-allocation-schema.ts`
 *  — objeto `Option<T>` validado como opcional (uuid/status são sempre
 *  opcionais neste filtro, nenhum `.test('required', ...)` aplicado aqui). */
const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const supplyStatusSlaReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.supplyStatusSlaReport.validation;

  // `start_date` e `end_date` se referenciam mutuamente via `.when(...)`. O Yup
  // resolve o grafo de dependências dos campos do objeto para decidir a ordem
  // de avaliação; duas referências cruzadas dentro do MESMO nível sem
  // declaração explícita formam um ciclo que o resolver não sabe quebrar
  // ("Cyclic dependency, node was: end_date"), estourando em runtime no
  // submit ("Gerar") — não é pego por `tsc`/lint (schema válido em tipo), só
  // ao `.validate()`/`yupResolver` resolver de fato. `yup.object(spec)` só
  // aceita o shape (o construtor não tem overload `(shape, deps)`); o par
  // mútuo precisa ser declarado no 2º argumento (`excludedEdges`) do método
  // `.shape(...)` chamado explicitamente, para o Yup permitir o ciclo
  // controlado (semântica preservada: um sem o outro reprova, ambos ou
  // nenhum passam).
  return yup.object().shape(
    {
      uuid: optionSchema,
      start_date: yup
        .string()
        .nullable()
        .when('end_date', {
          is: (value: string | null | undefined) => !!value,
          then: (schema) => schema.required(messages.dateRangeRequired),
        }),
      end_date: yup
        .string()
        .nullable()
        .when('start_date', {
          is: (value: string | null | undefined) => !!value,
          then: (schema) => schema.required(messages.dateRangeRequired),
        }),
      status: optionSchema,
    },
    [['start_date', 'end_date']]
  );
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de filtro do Relatório SLA.
 */
export const supplyStatusSlaReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(supplyStatusSlaReportFilterSchema(languageGB)) as any;

export default supplyStatusSlaReportFilterSchemaResolver;
