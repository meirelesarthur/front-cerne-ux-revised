// src/pages/BaseRegistrations/SystemUpdates/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Atualizações do Sistema — execução 031,
// TASK-FE-1101. Mirror `BaseRegistrations/Parameters/HeaderTable.tsx` /
// `BaseRegistrations/Warehouses/HeaderTable.tsx`, SEM `ButtonFilter` — esta
// tela não tem filtro lateral (contrato de tela §1.1: o legado nunca teve
// busca/filtro em `SystemUpdate`, "não inventar filtro").
//
// SÓ os botões de ação (adicionar / configurar grid) — as colunas vivem no
// index.tsx. Botão "Novo" gated `system_updates_create`. Ao selecionar uma
// linha da grid, navega para a edição (padrão do projeto).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';
import { useTable } from '@/hooks/useTable';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({ languageGB, gridSettings }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, navega para a edição (padrão do projeto).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(`/cadastros-base/atualizacoes-sistema/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('system_updates_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/atualizacoes-sistema/novo`)}
          languageGB={languageGB}
        />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
    </>
  );
}
