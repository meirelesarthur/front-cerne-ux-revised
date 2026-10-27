// src/pages/CadastrosBase/CategoriasProduto/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Categorias de Produto (mesmo padrão de
// GruposProduto/HeaderTable.tsx e Racas/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Nova Categoria de Produto" respeita `categoryproducts_create`
// (DEC-006, legado — UX; o enforcement real é o 403 do backend). Ao selecionar
// uma linha, navega para a edição.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';

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
      navigate(`/cadastros-base/produtos/categorias/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('categoryproducts_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/produtos/categorias/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
