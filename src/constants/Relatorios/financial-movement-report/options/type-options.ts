// src/constants/relatorios/financial-movement-report/options/type-options.ts
// -----------------------------------------------------------------------------
// Fábrica de opções do campo `types` (Tipo de Movimento) do relatório
// "Movimento Bancário" (F-264, esteira 97-Esteiras/060, ROTEIRO-FILT-02,
// achado C-P1-03). REPORT-SCOPED (E/S/T/F/I) — NÃO edita/reaproveita a lista
// `movementTypeCategoryOptions`
// (`@/constants/Financial/movement/options/movement-type-category-options.ts`),
// que é COMPARTILHADA com `NewMovementModal`/`CreateOrUpdateMovimento` e não
// pode ganhar um 5º valor selecionável (Saldo Inicial é tipo de SISTEMA,
// tratado por `OpenMovementController` — nunca criável/editável via CRUD de
// Movimento). Reaproveita os RÓTULOS E/S/T/F por LEITURA
// (`movementTypeCategoryOptions.getLabel`, sem mutar o arquivo compartilhado)
// e soma o rótulo local "Saldo Inicial"
// (`languageGB.financialMovementReport.report.typeOptions.initialBalance`).
// O backend já aceita `type_category=I`
// (`App\Enums\MovementTypeCategory::INITIAL_BALANCE`,
// `FinancialMovementReportRequest` valida `types.*` contra o enum completo).
// -----------------------------------------------------------------------------

import { movementTypeCategoryOptions } from '@/constants/Financial/movement/options/movement-type-category-options';

import type { LanguageDate } from '@/@types/language';
import { Option } from '@/@types/option';

export type FinancialMovementReportTypeCode = 'E' | 'S' | 'T' | 'F' | 'I';

const FINANCIAL_MOVEMENT_REPORT_TYPES: FinancialMovementReportTypeCode[] = [
  'E',
  'S',
  'T',
  'F',
  'I',
];

const labels = (languageGB: LanguageDate): Map<FinancialMovementReportTypeCode, string> =>
  new Map([
    ['E', movementTypeCategoryOptions.getLabel('E', languageGB)],
    ['S', movementTypeCategoryOptions.getLabel('S', languageGB)],
    ['T', movementTypeCategoryOptions.getLabel('T', languageGB)],
    ['F', movementTypeCategoryOptions.getLabel('F', languageGB)],
    ['I', languageGB.financialMovementReport.report.typeOptions.initialBalance],
  ]);

const getLabel = (value: FinancialMovementReportTypeCode, languageGB: LanguageDate): string =>
  labels(languageGB).get(value)!;

const getOption = (
  value: FinancialMovementReportTypeCode | null | undefined,
  languageGB: LanguageDate
): Option<FinancialMovementReportTypeCode> | null =>
  value == null ? null : { label: getLabel(value, languageGB), value };

const options = (languageGB: LanguageDate): Option<FinancialMovementReportTypeCode>[] =>
  FINANCIAL_MOVEMENT_REPORT_TYPES.map((value) => ({ value, label: getLabel(value, languageGB) }));

export const financialMovementReportTypeOptions = { getLabel, getOption, options };
