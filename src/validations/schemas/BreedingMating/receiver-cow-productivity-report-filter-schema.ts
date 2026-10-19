// src/validations/schemas/BreedingMating/receiver-cow-productivity-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Produtividade de Vaca
// Receptora (lote 079, F-307-plano-frontend.md §5 TASK-F307-FE-01). Mirror
// EXATO `reproductive-history-report-filter-schema.ts`, MAS com `animal`
// também obrigatório (não só as datas) — fiel ao contrato-alvo da API real
// (`ReceiverCowProductivityReportRequest::rules()`, `animal_id` required),
// mais estrito que os 2 irmãos (`VacasPrenhas`/`HistoricoReprodutivo`, onde
// `animal`/`batch` são opcionais).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const receiverCowProductivityReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.breedingMatings.receiverCowProductivityReport.hint;

  return yup.object().shape({
    animal: yup.object().nullable().required(messages.animalRequired),
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
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Produtividade de Vaca Receptora.
 */
export const receiverCowProductivityReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(receiverCowProductivityReportFilterSchema(languageGB)) as any;

export default receiverCowProductivityReportFilterSchemaResolver;
