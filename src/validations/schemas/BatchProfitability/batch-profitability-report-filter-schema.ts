// src/validations/schemas/BatchProfitability/batch-profitability-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Performance Animal (F-234,
// TASK-FE-PA-01). Diferente do mirror estrutural `pregnant-cows-report-filter-
// schema.ts` (2 datas SEMPRE obrigatórias), esta tela replica em `.when()` o
// gate OU real do Form Request do backend
// (`BatchProfitabilityReportRequest::rules()`, `GB.Cerne.Api`):
//   sale_id    => required_without_all:start_date,end_date
//   start_date => required_without:sale_id
//   end_date   => required_without:sale_id, after_or_equal:start_date
//   batch_id   => sempre opcional, combinável com qualquer um dos 2 caminhos
// `sale`/`batch` aqui são os campos de TELA (`Option<string>|null`, widgets
// `SelectAsyncPaginate`) — o Yup valida a PRESENÇA da seleção, não o uuid
// bruto (a conversão para `sale_id`/`batch_id` acontece no submit da página).
// Autoridade final continua sendo o 422 do backend (mirror da nota de topo do
// schema de `VacasPrenhas`) — o Yup é UX antecipada, não a fonte da verdade.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const batchProfitabilityReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.batches.batch.report.hint;

  return yup.object().shape({
    // `sale` NÃO usa `.when(['start_date','end_date'])` de volta para não
    // formar dependência cíclica com os dois campos abaixo (que já
    // dependem de `sale`) — Yup resolve o grafo de `.when()` e lança
    // "Cyclic dependency" se A depende de B e B depende de A. O gate OU
    // (sale XOR período) continua garantido: quando `sale` está vazio,
    // `start_date`/`end_date` ficam obrigatórios abaixo, já cobrindo o caso
    // de tudo vazio sem precisar que `sale` também vire obrigatório.
    sale: yup.mixed().nullable().notRequired(),
    batch: yup.mixed().nullable().notRequired(),
    start_date: yup
      .string()
      .nullable()
      .when('sale', {
        is: (sale: unknown) => !sale,
        then: (schema) => schema.required(messages.saleOrPeriodRequired),
        otherwise: (schema) => schema.notRequired(),
      }),
    end_date: yup
      .string()
      .nullable()
      .when('sale', {
        is: (sale: unknown) => !sale,
        then: (schema) => schema.required(messages.saleOrPeriodRequired),
        otherwise: (schema) => schema.notRequired(),
      })
      .test('end-date-after-start-date', messages.saleOrPeriodRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Performance Animal.
 */
export const batchProfitabilityReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(batchProfitabilityReportFilterSchema(languageGB)) as any;

export default batchProfitabilityReportFilterSchemaResolver;
