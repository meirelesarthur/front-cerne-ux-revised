// src/pages/Administrativo/BaixaEstoque/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Baixa de Estoque. "Nova baixa" (`ButtonAdd`,
// gate `stock-writeoffs_create`, TASK-FE-3002) + "Relatório" (gate
// `stock_writeoffs_report`, underscore — TASK-FE-3005, mirror
// `SaldoEstoque/HeaderTable.tsx`) + `ButtonFilter`.
// -----------------------------------------------------------------------------

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
  onCreate: () => void;
  canReport: boolean;
  onReport: () => void;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
  onCreate,
  canReport,
  onReport,
}: HeaderTableProps) {
  const text = languageGB.stockWriteoffs.stockWriteoff.list;

  return (
    <>
      {canCreate && <ButtonAdd onClick={onCreate} languageGB={languageGB} />}
      {canReport && <Button title={text.reportButton} variant="outline" onClick={onReport} />}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
