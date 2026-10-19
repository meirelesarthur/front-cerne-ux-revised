// src/validations/schemas/Animals/animal-family-tree-report-filter-schema.ts
// -----------------------------------------------------------------------------
// Schema de validação Yup do filtro do relatório de Registro Genealógico
// (esteira 055, F-222, TASK-055-F222-FE-01). Mirror estrutural de
// `reproductive-history-report-filter-schema.ts`, porém com um único campo:
// `animal` (Option do `SelectAsyncPaginate`), SEMPRE obrigatório — fiel ao
// único filtro do legado (`animal_id`), com validação client endurecida
// (o legado não tinha guarda server; a API nova devolve 422/404 quando
// ausente ou inválido).
// -----------------------------------------------------------------------------

import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import type { LanguageDate } from '@/@types/language';

export const animalFamilyTreeReportFilterSchema = (languageGB: LanguageDate) => {
  const messages = languageGB.animalFamilyTreeReport.report.validation;

  return yup.object().shape({
    animal: yup.object().nullable().required(messages.animalRequired),
  });
};

/**
 * Resolver pronto para o `useForm({ resolver })`.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (mensagens de validação i18n).
 * @return {Function} Resolver ligado ao schema de filtro do relatório de Registro Genealógico.
 */
export const animalFamilyTreeReportFilterSchemaResolver = (languageGB: LanguageDate) =>
  yupResolver(animalFamilyTreeReportFilterSchema(languageGB)) as any;

export default animalFamilyTreeReportFilterSchemaResolver;
