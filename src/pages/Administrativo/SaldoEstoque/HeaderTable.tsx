// src/pages/Administrativo/SaldoEstoque/HeaderTable.tsx
// -----------------------------------------------------------------------------
// Header de AÇÕES da grid de Saldo de Estoque (Stock, TASK-STK-FE-01) — mirror
// de `Administrativo/Solicitacao/HeaderTable.tsx` (canário `GridSettings`,
// protocolo de padrão v2), SEM `ButtonAdd` — módulo é 100% leitura, nunca
// existiu criação (`Stock-contrato.md ## 0`).
//
// Botão "Relatório" (mesma permissão `stocks_view` da tela, contrato de tela
// §3.3) navega para `/administrativo/saldo-estoque/relatorio`
// (TASK-STK-FE-03, ainda não conectada nesta Tarefa — a navegação em si já
// fica correta).
// -----------------------------------------------------------------------------

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonFilter } from '@/components/ButtonFilter';
import { GridSettingsFloatingPanel } from '@/components/GridSettings/GridSettingsFloatingPanel';
import type { GridSettingsFloatingPanelProps } from '@/components/GridSettings/GridSettingsFloatingPanel';

import type { LanguageDate } from '@/@types/language';

interface HeaderTableProps {
  onOpenFilter: () => void;
  filtersApplied: number;
  languageGB: LanguageDate;
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  /** `can('stocks_view')` — resolvido no `index.tsx`, fiel ao legado (não
   *  gateia por permissão de grupo-de-produtos). Esconde por completo o
   *  botão "Agrupar" (UX; enforcement real é o 403 do backend). */
  canGroup: boolean;
  /** Prévia (`GET`) em voo — mostra `loading` no botão "Agrupar". */
  isFetchingPreview: boolean;
  /** Clique em "Agrupar" — valida contagem/dispara prévia no `index.tsx`. */
  onClickGroup: () => void;
}

export function HeaderTable({
  onOpenFilter,
  filtersApplied,
  languageGB,
  gridSettings,
  canGroup,
  isFetchingPreview,
  onClickGroup,
}: HeaderTableProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* "Agrupar" (Consolidação de Estoque, TASK-STK-FE-04) — gated por
          `stocks_view` (fiel ao legado: checkbox + botão visíveis para quem
          vê a tela de estoque, decisão do dono 2026-08-06). NÃO desabilita
          por contagem: o alerta "≥ 2" é disparado no clique (fiel ao legado). */}
      {canGroup && (
        <Button
          title={languageGB.stocks.stock.consolidation.groupButton}
          variant="outline"
          loading={isFetchingPreview}
          onClick={onClickGroup}
        />
      )}
      <Button
        title={languageGB.stocks.stock.list.report}
        variant="outline"
        onClick={() => navigate('/administrativo/saldo-estoque/relatorio')}
      />
      <GridSettingsFloatingPanel
        gridSettings={gridSettings}
        triggerLabel={languageGB.defaltStrings.gridSettings.trigger}
      />
      <ButtonFilter filtersApplied={filtersApplied} onClick={onOpenFilter} />
    </>
  );
}
