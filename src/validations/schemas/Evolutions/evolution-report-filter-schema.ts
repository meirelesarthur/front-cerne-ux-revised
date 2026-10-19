// src/validations/schemas/Evolutions/evolution-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Evolução/Rebanho
// (Tarefa 27, spa-contract-evolucao-rebanho.md §5.3). Vive em
// `src/validations/schemas/Evolutions/` (pasta pelo NOME DA ENTIDADE, mirror
// `RelatorioSla/relatorio-sla-filter-schema.ts` — aqui as 2 datas são
// SEMPRE obrigatórias, sem `.when()` condicional, mirror do `required` que
// o próprio HTML legado já tinha (`FLD-06`/`FLD-07`) e do 422 real da API
// (`start_date`/`end_date` obrigatórios, `end_date >= start_date`).
//
// `format` acrescentado na esteira 060 (ajuste UX do dono: 1 select de
// Formato + 1 botão único "Gerar relatório", em vez de 2 botões separados)
// — sempre populado por default ('pdf'), mirror `batch` obrigatório de
// `AnimalMovementAnalysisReport/animal-movement-analysis-report-filter-schema.ts`.
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

const optionSchema = yup
  .object({ value: yup.mixed(), label: yup.string() })
  .nullable()
  .default(null);

export const evolutionReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.evolutions.evolution.report.hint;
  const requiredFieldMessage = languageGB.defaltStrings.validations.requiredField;

  return yup.object().shape({
    start_date: yup.string().nullable().required(messages.datesRequired),
    end_date: yup
      .string()
      .nullable()
      .required(messages.datesRequired)
      .test('end-date-after-start-date', messages.datesRequired, (value, context) => {
        const parent = context.parent as { start_date?: string | null };
        const startDate = parent.start_date;
        if (!value || !startDate) return true;
        return value >= startDate;
      }),
    format: optionSchema.required(requiredFieldMessage),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Evolução/Rebanho.
 */
export const evolutionReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(evolutionReportFilterSchema(languageGB)) as any;

export default evolutionReportFilterSchemaResolver;
