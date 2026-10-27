// src/pages/CadastrosBase/Autorizadores/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Autorizadores (mesmo padrão de
// CentroCusto/HeaderTable.tsx). SÓ os botões de ação (adicionar / abrir
// filtro) — as colunas vivem no index.tsx.
//
// Botão "Novo" respeita `request-authorizers_create` (permissão real do
// backend, ver `authorize()` do Controller — cabeçalho de
// `request-authorizer-service.ts`). Navega para `/cadastros-base/
// autorizadores/novo` — path só como STRING nesta SLICE 1 (o form/Slice 2
// ainda não registra a rota; até lá cai no `RoutePlaceholder`, ver Tarefa
// §6). Ao selecionar uma linha, navega para a edição (padrão do projeto).
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
  const { can } = usePermissions();
  const { table } = useTable();

  // Ao selecionar uma linha da grid, abre a edição (padrão do projeto) ou, sem
  // `request-authorizers_edit`, a tela Visualizar (que exige só `view`).
  useEffect(() => {
    const selected = table?.getSelectedRowModel()?.rows[0]?.original as any;
    if (selected?.uuid) {
      navigate(
        can('request-authorizers_edit')
          ? `/cadastros-base/autorizadores/${selected.uuid}`
          : `/cadastros-base/autorizadores/${selected.uuid}/visualizar`
      );
    }
  }, [table?.getSelectedRowModel()?.rows[0]?.original]);

  return (
    <>
      {can('request-authorizers_create') && (
        <ButtonAdd
          onClick={() => navigate(`/cadastros-base/autorizadores/novo`)}
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
