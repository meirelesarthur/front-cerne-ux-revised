// src/pages/Operacional/Appropriations/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Apontamentos (Appropriation) — TASK-FE-2706.
// "Adicionar Novo" (`ButtonAdd`, gate `appropriations_create`) +
// `GridSettingsFloatingPanel` (regra 8 do protocolo v2) + `ButtonFilter` +
// 2 botões desabilitados "Saiba +"/"Pagamentos" (D4 do contrato de API —
// geração de Contas a Pagar deferida; "Saiba +" abre vídeo externo, fora de
// escopo desta execução). Ambos entram DESABILITADOS com tooltip "Disponível
// em breve", mirror o padrão já usado em `TASK-FE-2702` para Selects
// bloqueados por Gap — não é Gap de frontend, é escopo de produto deferido.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { FiCreditCard, FiHelpCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { ButtonAdd } from '@/components/ButtonAdd';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';
import { Tooltip } from '@/components/TooLtip';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  canCreate: boolean;
  onCreate: () => void;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  canCreate,
  onCreate,
  gridSettings,
}: HeaderTableProps) {
  const text = languageGB.appropriations.appropriation.list;

  return (
    <>
      {canCreate && <ButtonAdd onClick={onCreate} languageGB={languageGB} />}

      <Tooltip label={text.extraButtons.comingSoonHint} placement="top">
        <Button
          title={text.extraButtons.learnMore}
          variant="ghost"
          icon={FiHelpCircle as ElementType}
          disabled
        />
      </Tooltip>

      <Tooltip label={text.extraButtons.comingSoonHint} placement="top">
        <Button
          title={text.extraButtons.payments}
          variant="ghost"
          icon={FiCreditCard as ElementType}
          disabled
        />
      </Tooltip>

      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
