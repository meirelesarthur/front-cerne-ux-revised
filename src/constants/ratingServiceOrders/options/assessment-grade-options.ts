// src/constants/ratingServiceOrders/options/assessment-grade-options.ts
// -----------------------------------------------------------------------------
// Fábrica de options do select "Nota" (`assessment_grade`, form de
// Avaliação de Ordem de Serviço) — TASK-FE-041-AVL-01. Domínio ESTÁTICO
// (1..5, mirror legado `<select>` hardcoded, FLD-035/CLM-009) — SEM endpoint
// remoto, mesma fábrica estática de `getServiceOrderCategoryOptions`.
//
// Números puros (SEM tradução por item, mirror a leitura do dev na Tarefa)
// — `label`/`value` iguais, `(languageGB) => Option<number>[]` só para
// manter a assinatura canônica das fábricas de options do projeto (recebe
// `languageGB` por padrão, mesmo sem usá-lo aqui).
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';

/**
 * @param {LanguageDate} languageGB - Pacote de idioma ativo (assinatura
 *   canônica das fábricas de options do projeto — não usado aqui, nota é
 *   numérica, sem tradução por item).
 * @return {Option<number>[]} Options do select "Nota" (1..5).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getAssessmentGradeOptions(languageGB: LanguageDate): Option<number>[] {
  return [1, 2, 3, 4, 5].map((grade) => ({ value: grade, label: String(grade) }));
}
