// src/pages/Operacional/Rastreabilidade/Traceability/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Produtos (Rastreabilidade) — mirror
// `Operacional/Monitoring/HeaderTable.tsx` (versão enxuta, sem relatórios):
//   - "Adicionar" (`ButtonAdd`, gate `traceab_create`, AM-01) — navega para
//     `/operacional/rastreabilidade/produtos/create` (rota nasce em
//     `TASK-TR-FE-11`; até lá cai no catch-all — mesmo comportamento aceito
//     de `ChargeActionsMenu.tsx` para fatiamento incremental).
//   - `ButtonFilter` (badge de contagem dos 3 filtros do drawer, `## 4.1`).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

const TRACEABILITY_CREATE_ROUTE = '/operacional/rastreabilidade/produtos/create';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('traceab_create') && (
        <ButtonAdd onClick={() => navigate(TRACEABILITY_CREATE_ROUTE)} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
