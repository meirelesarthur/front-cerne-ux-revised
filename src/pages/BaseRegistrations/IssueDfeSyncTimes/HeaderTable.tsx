// src/pages/BaseRegistrations/IssueDfeSyncTimes/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Sincronização DFe (mesmo padrão de
// MotivosBaixa/HeaderTable.tsx/Contador/HeaderTable.tsx).
//
// SÓ o botão de adicionar — as colunas vivem no index.tsx. SEM `ButtonFilter`
// (achado #3 de TASK-DFE-FE-01 — o contrato não documenta nenhum parâmetro
// de filtro em `index()`, esta tela não tem drawer de filtro). Ao selecionar
// uma linha, navega para a edição.
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
      navigate(`/cadastros-base/sincronizacao-dfe/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('issue-dfe-sync-time_create') && (
        <ButtonAdd
          onClick={() => navigate('/cadastros-base/sincronizacao-dfe/novo')}
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
