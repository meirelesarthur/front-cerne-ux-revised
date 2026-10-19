// src/pages/CadastrosBase/Produtos/Classes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Classes de Produto (mesmo padrão de
// GruposProduto/HeaderTable.tsx e Racas/HeaderTable.tsx).
//
// SÓ os botões de ação (adicionar / abrir filtro) — as colunas vivem no
// index.tsx. O botão "Nova Classe" respeita `kinds_create` (a permissão
// REAL do backend, confirmada contra o banco — TASK-BE-897/TASK-FE-916:
// `product_kinds_create` era nome FANTASMA, nunca existiu na tabela
// `permissions`, GAP-FE-123 tratava a suposição errada como se fosse a
// grafia real). Ao selecionar uma linha, navega para a edição.
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
      navigate(`/cadastros-base/produtos/classes/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('kinds_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/produtos/classes/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
