// src/pages/Administrativo/Funcoes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Funções (mesmo padrão de
// Marcadores/HeaderTable.tsx/FamiliaBens/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Nova Função" respeita `functions_create` (permissão
// global — reuso legado do slug `functions_*`, DEC-006).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

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
      {can('functions_create') && (
        <ButtonAdd
          onClick={() => navigate('/administrativo/funcoes/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
