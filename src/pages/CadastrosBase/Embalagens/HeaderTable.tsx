// src/pages/CadastrosBase/Embalagens/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Embalagens (mesmo padrão de
// Classes/HeaderTable.tsx). SÓ os botões de ação (adicionar / abrir filtro)
// — as colunas vivem no index.tsx. O botão "Nova Embalagem" respeita
// `product-packages_create` (grafia com hífen, idêntica ao backend — sem
// divergência, ao contrário do precedente GAP-FE-123 de Kind). Ao selecionar
// uma linha, navega para a edição.
//
// Rota real de edição registrada em TASK-FE-523 (roteamento) — o path usado
// aqui (`/cadastros-base/embalagens/:packageId`) é o definido no Contrato de
// Tela §3.1 (path FLAT, mirror UnidadeMedida — não `produtos/embalagens`).
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
      navigate(`/cadastros-base/embalagens/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('product-packages_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/embalagens/novo`)}
          languageGB={languageGB}
        />
      )}
    </>
  );
}
