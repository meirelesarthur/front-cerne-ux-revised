// src/pages/Operacional/FeedlotSectors/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Setores — TASK-FS-FE-01. Só os botões de ação
// (adicionar / abrir filtro) — as colunas vivem no index.tsx (mirror exato
// `FeedlotYards/HeaderTable.tsx`). Botão "Novo" respeita `feedlot-sectors_create`.
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
      {can('feedlot-sectors_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/setores/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
