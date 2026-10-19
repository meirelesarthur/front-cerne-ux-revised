// src/pages/CadastrosBase/Proprietarios/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Proprietários — mesmo padrão de
// Fornecedores/HeaderTable.tsx / Contador/index.tsx (HeaderGrid+HeaderTable).
//
// SÓ os botões de ação (adicionar / abrir filtro). O botão "Novo Proprietário"
// respeita `proprietaries_create`. Navega para
// `/cadastros-base/proprietarios/novo` — a ROTA do formulário chega em
// TASK-PY-FE-03 (hoje cai no catch-all `/cadastros-base/*`/`RoutePlaceholder`,
// mesmo padrão incremental já usado por Fornecedores quando listagem e
// formulário são fatiados em Tarefas separadas).
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
      {can('proprietaries_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/proprietarios/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
