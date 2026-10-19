// src/pages/Operacional/FeedlotCorrals/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Currais — TASK-043-CUR-T02 (AC-002/AC-003,
// `02-Tela-Lista-Currais.md`). Só os botões de ação (Novo/Filtrar) — as
// colunas vivem no `index.tsx`. Mirror exato `FeedlotSectors/HeaderTable.tsx`.
// Botão "Novo" respeita `feedlot-corrals_create`.
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

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
      {can('feedlot-corrals_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/currais/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
