// src/pages/Operacional/FeedlotYards/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Pátios — TASK-PT-FE-01. Só os botões de ação
// (adicionar / abrir filtro) — as colunas vivem no index.tsx (mirror
// `CentroCusto/HeaderTable.tsx`, sem a exceção `hasRole('Gestor_Plataf')`
// — `FeedlotYard` não tem essa regra de negócio, ver DoD/contrato).
// Botão "Novo" respeita `feedlot-yards_create`.
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
      {can('feedlot-yards_create') && (
        <ButtonAdd onClick={() => navigate('/operacional/patios/novo')} languageGB={languageGB} />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
