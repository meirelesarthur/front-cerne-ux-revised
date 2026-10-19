// src/validations/schemas/Dashboards/cashbookDashboard-filter-schema.ts
// Schema do filtro de Livro Caixa (execução 048, TASK-03-FE) — os 3 campos
// são opcionais no contrato de tela (default do servidor quando ausentes:
// `year` = ano atual, `operation` = 'A'). Derivado de `fieldValidationSchema`
// (SEVERIDADE inviolável), mirror `assetsDashboard-filter-schema.ts`.

import * as yup from 'yup';

// Sem parâmetro `languageGB`: os 3 campos são `Option` opcionais sem
// mensagem de validação própria (nenhum é obrigatório) — diferente de
// `assetsDashboardFilterSchema`, que usa `fieldValidationSchema(languageGB)`
// só para o campo `months` (obrigatório). Divergência documentada (mesma
// classe de decisão de `cash-book-period.ts`): um parâmetro não utilizado
// falharia `@typescript-eslint/no-unused-vars` (sem `argsIgnorePattern`
// neste projeto, nem prefixo `_` perdoa).
export const cashbookDashboardFilterSchema = () => {
  return yup.object({
    year: yup.object().nullable().default(null),
    proprietary: yup.object().nullable().default(null),
    operation: yup.object().nullable().default(null),
  });
};
