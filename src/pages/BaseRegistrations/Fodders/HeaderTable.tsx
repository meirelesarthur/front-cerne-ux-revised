// src/pages/BaseRegistrations/Fodders/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Forragem — mirror de
// IdentificationTypes/HeaderTable.tsx (molde estrutural primário desta
// Tarefa) — SEM `ButtonFilter` (DA-FD-11, decisão do dono: esta tela NÃO tem
// filtro de busca).
//
// SÓ o botão de adicionar + o painel de personalização de colunas — as
// colunas vivem no index.tsx. O botão "Nova Forragem" respeita
// `fodder_create` (UX; o enforcement real é o 403 do backend). Forragem não
// tem hierarquia — catálogo flat. Ao selecionar uma linha, navega para a
// edição (rota registrada pela Tarefa irmã TASK-FD-FE-02).
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
      navigate(`/cadastros-base/forragem/${selected.uuid}`);
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('fodder_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/forragem/novo`)}
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
