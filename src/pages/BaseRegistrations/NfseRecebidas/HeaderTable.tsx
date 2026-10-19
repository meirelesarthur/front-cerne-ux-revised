// src/pages/BaseRegistrations/NfseRecebidas/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de NFSe Recebidas (Nfse — domínio Fiscal, execução
// 033, TASK-FE-2732). SÓ os botões de ação — as colunas vivem no
// `index.tsx`. Botão "Buscar DFe" (navega para a tela de `TASK-FE-2734`,
// `POST /nfses` síncrono) + `ButtonFilter` (este módulo TEM filtro,
// diferente do sibling `IssueDfeSyncTimes` que declarou "SEM filtro" —
// não copiar essa ausência aqui) + `GridSettingsFloatingPanel` (mirror
// `IssueDfeSyncTimes/HeaderTable.tsx`).
//
// Gate `nfse_create` no botão "Buscar DFe" (`POST /nfses` exige essa
// permissão no backend, contrato §1).
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import { usePermissions } from '@/hooks/usePermissions';

import type { LanguageDate } from '@/@types/language';

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

  return (
    <>
      {can('nfse_create') && (
        <Button
          title={languageGB.baseRegistrations.nfse.syncScreen.submitButton}
          icon={FiSearch as ElementType}
          onClick={() => navigate('/cadastros-base/nfse-recebidas/buscar-dfe')}
        />
      )}
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
    </>
  );
}
