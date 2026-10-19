// src/pages/BaseRegistrations/Ibpts/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de IBPT — execução 032, TASK-FE-2411. Mirror
// `BaseRegistrations/SystemUpdates/HeaderTable.tsx`, SEM `ButtonFilter`/busca
// (contrato de tela §7.1: dataset estruturalmente pequeno — no máximo 27
// linhas, 1 por UF — filtro omitido por default).
//
// SÓ os botões de ação (Nova Tabela / configurar grid) — as colunas vivem no
// index.tsx. Botão "Nova Tabela" gated `ibpts_create`. Sem navegação por
// seleção de linha (diferente de `SystemUpdate`/`Bank`) — não há rota de
// Edição nesta tela (contrato de API §10).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { ButtonAdd } from '@/components/ButtonAdd';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({ languageGB, gridSettings }: HeaderTableProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  return (
    <>
      {can('ibpts_create') && (
        <ButtonAdd onClick={() => navigate('/cadastros-base/ibpt/novo')} languageGB={languageGB} />
      )}
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
    </>
  );
}
