// src/pages/CadastrosBase/CategoriasAnimais/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Categorias Animais (mesmo padrão de
// Racas/HeaderTable.tsx e Produtos/Classes/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Nova Categoria" respeita `categoryanimals_create` (a
// permissão REAL do backend, confirmada contra o banco em TASK-FE-916 —
// `category_animals_create`, COM underscore entre "category" e "animals",
// era nome FANTASMA — `CategoryAnimal-Frontend-Contrato.md` §3.3). Ao
// selecionar uma linha, navega para a edição.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
}

export function HeaderTable({ onOpenFilter, filtersApplied, languageGB }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/categorias-animais/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('categoryanimals_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/categorias-animais/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
