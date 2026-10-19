// src/pages/Operacional/Appropriations/appropriationStatus.ts
// -----------------------------------------------------------------------------
// Dicionário ÚNICO de status→cor/transição de Apontamento (Appropriation) —
// TASK-FE-2706. Fonte única de verdade consumida por Listagem (legenda +
// badge de linha), Form (badge do cabeçalho em modo edição), Ocorrências
// (visibilidade dos botões de transição, `TASK-FE-2710`) e Visualização
// (`TASK-FE-2712`).
//
// `AppropriationStatus` no backend expõe hex cru (`status_color`,
// `#ff4136`/`#1cc872`/`#0074d9`) — o front NÃO consome esse hex direto
// (proibição "hex fixo fora dos tokens" do Passo UX). Mapeamento por
// `Record<AppropriationStatusValue, ...>`, mirror `STATUS_BADGE_VARIANT` de
// `Financeiro/MercadoPago/index.tsx`, mas com tokens de cor (não Badge
// `colorPalette`) porque o componente real de status na SPA é `Status.tsx`
// (dot + label), não `Badge.tsx` do Storybook.
// -----------------------------------------------------------------------------

import type { AppropriationStatusValue } from '@/@types/v2/Appropriations';

export interface AppropriationStatusMeta {
  /** Token de cor Chakra para o dot do `Status.tsx` — NUNCA hex cru. */
  badgeColor: string;
  /** Próximo status ao clicar "Voltar Status" a partir deste — `null` no
   *  piso da máquina (`O`, Aberto, não tem "Voltar Status"). */
  nextStatusOnRevert: AppropriationStatusValue | null;
}

export const APPROPRIATION_STATUS_META: Record<AppropriationStatusValue, AppropriationStatusMeta> =
  {
    O: { badgeColor: 'red.500', nextStatusOnRevert: null },
    F: { badgeColor: 'green.500', nextStatusOnRevert: 'O' },
    A: { badgeColor: 'blue.500', nextStatusOnRevert: 'F' },
  };

/**
 * Label de legenda/badge por status — mirror da ordem O→F→A.
 * @param {object} languageGB - Pacote de idioma ativo (só a fração usada aqui).
 * @return {Array<{status: AppropriationStatusValue, label: string}>} Legenda ordenada O→F→A.
 */
export function getAppropriationStatusLegend(languageGB: {
  appropriations: {
    appropriation: {
      list: { statusLegend: Record<'opened' | 'finished' | 'appropriated', string> };
    };
  };
}) {
  const legend = languageGB.appropriations.appropriation.list.statusLegend;
  return [
    { status: 'O' as AppropriationStatusValue, label: legend.opened },
    { status: 'F' as AppropriationStatusValue, label: legend.finished },
    { status: 'A' as AppropriationStatusValue, label: legend.appropriated },
  ];
}

/**
 * Regra de edição do Apontamento (fidelidade ao legado, decisão 096): só o status
 * Aberto (`O`) é editável. Finalizado/Apropriado exigem "Voltar Status" antes.
 * @param {AppropriationStatusValue | null | undefined} status - Status atual do apontamento.
 * @return {boolean} `true` quando o apontamento pode ser editado.
 */
export function isAppropriationEditable(
  status: AppropriationStatusValue | null | undefined
): boolean {
  return status === 'O';
}
