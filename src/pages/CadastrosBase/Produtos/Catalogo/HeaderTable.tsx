// src/pages/CadastrosBase/Produtos/Catalogo/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Produtos (Catálogo) — mesmo padrão de
// Classes/HeaderTable.tsx / Embalagens/HeaderTable.tsx. SÓ os botões de ação
// (adicionar / abrir filtro) — as colunas vivem no index.tsx.
//
// ⚠️ Diferença deliberada do precedente Kind/Package: aqueles módulos NÃO
// têm tela de detalhe separada (o form de edição serve para os dois casos),
// então o clique na linha navega direto para a edição. Produto TEM uma tela
// de detalhe view-only dedicada (`ProdutoDetalhe`, `TASK-FE-505`, contrato
// §3.4) — usada quando o usuário só tem `products_view` (sem `products_edit`).
// Por isso o clique na linha aqui navega para o DETALHE (rota que qualquer
// usuário com `products_view` pode acessar), nunca direto para a edição — a
// ação "Editar" fica explícita no menu de Ações da linha (`index.tsx`),
// gated por `products_edit`. Evita navegar usuários sem permissão de edição
// para uma rota que eles não podem usar.
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

  // Ao selecionar uma linha da grid, navega para o DETALHE (view-only) — ver
  // nota de topo do arquivo sobre a diferença deliberada do precedente.
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/produtos/${selected.uuid}/detalhe`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('products_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/produtos/novo`)}
          languageGB={languageGB}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
