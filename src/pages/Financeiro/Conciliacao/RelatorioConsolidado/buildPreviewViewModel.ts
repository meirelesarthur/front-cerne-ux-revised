// src/pages/Financeiro/Conciliacao/RelatorioConsolidado/buildPreviewViewModel.ts
// -----------------------------------------------------------------------------
// Adaptador client-side da prévia em tela do Relatório de Conciliação de
// Contas Consolidadas (F-213, lote 079, rework FE, Fatia 3 §3.2). Mirror
// LITERAL de `GenerateAccountReconciliationReportAction::buildColumns()/
// buildRows()` (GB.Cerne.Api) — usada hoje SÓ no caminho PDF/Excel
// (`/generated`); a rota de prévia (`report()`) devolve linhas CRUAS
// (`AccountReconciliationReportRawRow`), então o front replica aqui a MESMA
// apresentação para a tabela em tela bater com o PDF/Excel.
//
// QUALQUER MUDANÇA em `GenerateAccountReconciliationReportAction` (API)
// exige revisão deste arquivo — risco #1 documentado no plano de rework
// (duplicação de regra de apresentação front↔back, aceita como decisão de
// escopo FRONT-only; oportunidade de conformidade futura: alinhar `report()`
// ao padrão `/preview` já formatado no servidor).
//
// Decisões de fidelidade herdadas da API (NÃO decididas aqui, ver §0.4 do
// plano de rework):
//   - Participante = type==='E' ? client_name : provider_name (mirror
//     `buildRows()` — client em Entrada, provider nos demais).
//   - Tipo de Movimento = enum completo (`movementTypeLabel`), rótulo do
//     cabeçalho CORRIGIDO de "Tipo de Conta" (achado OQD-04/AF-213-01).
//   - Valor = SEMPRE `movements.value` — NUNCA `allocation_value`, mesmo com
//     `condition=1` (resolve o bug de colisão OQD-09/C33 do legado SEM
//     reproduzi-lo — a API já expõe os 2 campos separados).
//   - Categoria/Centro só aparecem quando `condition=1`.
//   - Rótulo da coluna de data = "Data da Consolidação" (OQD-05).
// `allocation_value`/`allocation_interest` NÃO são exibidos (nem no
// PDF/Excel atual) — não inventar coluna nova para eles.
// -----------------------------------------------------------------------------

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { movementTypeLabel } from '@/constants/Financial/movement/movement-type-labels';

import type { AccountReconciliationReportRawRow } from '@/services/v2/OfxImport/account-reconciliation-report-service';

import type { LanguageDate } from '@/@types/language';

export interface AccountReconciliationPreviewColumn {
  key: string;
  label: string;
  align: 'start' | 'end';
}

export interface AccountReconciliationPreviewRow {
  cells: Record<string, string>;
}

// Mirror LITERAL de `GenerateAccountReconciliationReportAction::FIXED_COLUMNS`/
// `CONDITIONAL_COLUMNS` — 6 colunas fixas + 2 (Categoria/Centro) só quando
// `condition=1`.
export function buildAccountReconciliationColumns(
  condition: 0 | 1,
  table: LanguageDate['financial']['ofxImport']['consolidatedReport']['table']
): AccountReconciliationPreviewColumn[] {
  const fixed: AccountReconciliationPreviewColumn[] = [
    { key: 'document', label: table.document, align: 'start' },
    { key: 'participant', label: table.participant, align: 'start' },
    { key: 'movement_type', label: table.movementType, align: 'start' },
    { key: 'date', label: table.date, align: 'start' },
    { key: 'account', label: table.account, align: 'start' },
    { key: 'value', label: table.value, align: 'end' },
  ];
  if (condition === 1) {
    return [
      ...fixed,
      { key: 'category', label: table.category, align: 'start' },
      { key: 'center', label: table.center, align: 'start' },
    ];
  }
  return fixed;
}

// Mirror LITERAL de `GenerateAccountReconciliationReportAction::buildRows()`
// — `participant`/`movement_type` computados igual ao PDF/Excel; `value`
// SEMPRE `movements.value` (nunca `allocation_value`, mesmo com
// `condition=1` — ver §0.4 do plano de rework).
export function buildAccountReconciliationRows(
  rows: AccountReconciliationReportRawRow[],
  condition: 0 | 1,
  languageGB: LanguageDate
): AccountReconciliationPreviewRow[] {
  return rows.map((item) => {
    const rawValue = Number(item.value);
    const cells: Record<string, string> = {
      document: item.document ?? '-',
      participant: (item.type === 'E' ? item.client_name : item.provider_name) ?? '-',
      movement_type: movementTypeLabel(item.type, languageGB),
      date: formatDate(item.date),
      account: item.account,
      // `value` chega como STRING do Postgres (DB::table() sem cast) —
      // `Number()` explícito; linha malformada (NaN) exibe R$ 0,00, nunca
      // "NaN" na tela (risco #2 do plano de rework).
      value: formatCurrencyBRL(Number.isFinite(rawValue) ? rawValue : 0),
    };
    if (condition === 1) {
      cells.category = item.category ?? '-';
      cells.center = item.center ?? '-';
    }
    return { cells };
  });
}
