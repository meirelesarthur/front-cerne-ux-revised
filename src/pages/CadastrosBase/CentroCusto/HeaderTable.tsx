// src/pages/CadastrosBase/CentroCusto/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Centros de Custo (mesmo padrão de
// Perfil/HeaderTable.tsx).
//
// SÓ os botões de ação (abrir filtro / configurar grid) — as colunas vivem no
// index.tsx. O botão "Novo(a)" (criava centro de TOPO) foi removido por
// completo do cabeçalho, para TODOS os papéis (inclusive Gestor_Plataf) —
// decisão do dono 2026-09-28 (OD-074-004): criação de centro de custo só por
// "Cadastrar descendente" (ação de linha, `can_create_descendant`, em
// index.tsx) — essa ação NÃO muda. Ao selecionar uma linha, navega para a
// edição.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
}: HeaderTableProps) {
  const navigate = useNavigate();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/centros-custo/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
