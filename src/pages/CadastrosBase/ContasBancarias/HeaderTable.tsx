// src/pages/CadastrosBase/ContasBancarias/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Contas Bancárias (mirror `Embalagens/HeaderTable.tsx`/
// `CategoriasAnimais/HeaderTable.tsx`/`Fornecedores/HeaderTable.tsx`) — SÓ os
// botões de ação (adicionar / abrir filtro), as colunas vivem em `index.tsx`.
//
// Botão "Nova Conta Bancária" respeita `accounts_create` (permissão REAL,
// confirmada em `PermissionTree.php:530-540`/`Account-contrato.md §13`, D10).
// Navega para `/cadastros-base/contas-bancarias/novo` — rota real (CHOKEPOINT
// isolado) chega em `TASK-FE-563`, fora do escopo desta Tarefa.
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
      {can('accounts_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/contas-bancarias/novo')}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
