// src/pages/Operacional/DeathAnimals/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Mortes — TASK-DA-FE-01. Só os botões de ação
// (adicionar / abrir filtro) — as colunas vivem no index.tsx (mirror
// `FeedlotYards/HeaderTable.tsx`). Botão "Nova" respeita `death_animals_create`.
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
      {can('death_animals_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/mortes/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
