// src/validations/schemas/Appropriations/appropriation-equipment-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Apontamento Máquina
// (Tarefa 46, frontend-contract-apontamento-maquina.md §6). Mirror EXATO de
// `evolution-report-filter-schema.ts`/`sanitaries-batch-report-filter-
// schema.ts`: as 2 datas são SEMPRE obrigatórias, sem `.when()` condicional,
// mirror do 422 real da API (`start_date`/`end_date` obrigatórios,
// `end_date >= start_date`).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const appropriationEquipmentReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.appropriations.appropriation.report.hint;

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
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Apontamento Máquina.
 */
export const appropriationEquipmentReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(appropriationEquipmentReportFilterSchema(languageGB)) as any;

export default appropriationEquipmentReportFilterSchemaResolver;
