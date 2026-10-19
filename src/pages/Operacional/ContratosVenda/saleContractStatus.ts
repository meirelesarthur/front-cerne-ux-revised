// src/pages/Operacional/ContratosVenda/saleContractStatus.ts
// -----------------------------------------------------------------------------
// Dicionário status → cor de Badge / rótulo (Contratos de Venda, esteira 036,
// TASK-FE-036-205/206) — mirror `STATUS_BADGE_VARIANT` de
// `Financeiro/MercadoPago/index.tsx` e do padrão de `Badge colorPalette
// variant="subtle"` já aplicado em `Operacional/Appropriations/
// appropriationStatus.ts` (Passo UX do contrato de tela §5.2). Corrige
// DIV-007 (rótulo fixo "Em Aberto" do legado) — status real via Badge por
// token, nunca hex cru.
//
// A API devolve `status` como objeto `{ value, label, color }`
// (`SaleContractStatus`, ver `@types/v2/SaleContracts`) — este dicionário
// segue indexado pelo INTEIRO de domínio (`status.value`), e o front
// continua com seu próprio i18n/tokens Chakra, nunca o `label`/`color`
// (hex) que a API manda (evita acoplamento a nomenclatura interna do
// backend, mesmo racional de `Financeiro/MercadoPago`). Rework de
// fidelidade pós-auditoria (`SC-LST-001`/`SC-LST-002`, P0): o `[object
// Object]` e o sumiço de Editar/Excluir vinham de callsites comparando o
// objeto inteiro contra `number` — a correção é em `index.tsx`/
// `CreateOrUpdateContratoVenda.tsx` (sempre `status.value`), este arquivo
// já estava correto internamente.
// -----------------------------------------------------------------------------

import type { LanguageDate } from '@/@types/language';

/** 1=Aguardando Envio, 2=Em Andamento, 3=Próximo da Conclusão,
 *  4=Concluído, 9=Cancelado — contrato de tela §5.2, contrato-api §3.2.
 *  Chave = `status.value` (nunca o objeto `status` inteiro). */
export const SALE_CONTRACT_STATUS_BADGE_VARIANT: Record<number, string> = {
  1: 'gray',
  2: 'blue',
  3: 'orange',
  4: 'green',
  9: 'red',
};

/**
 * Token de cor concreto (escala `.500`) para o dot da legenda global
 * (`Status.tsx`, mirror `Operacional/Appropriations`) — derivado do MESMO
 * dicionário de `colorPalette` acima, nunca duplicado/hex cru.
 * @param {number} status - Código do status (1/2/3/4/9).
 * @return {string} Token Chakra concreto (ex.: `"gray.500"`).
 */
export function getSaleContractStatusDotColor(status: number): string {
  return `${SALE_CONTRACT_STATUS_BADGE_VARIANT[status] ?? 'gray'}.500`;
}

/** Ordem de exibição da legenda global (`SC-LST-010`) — mirror da ordem do
 *  legado (`\App\SaleContract::statusOptions()`, 1→2→3→4→9). */
const SALE_CONTRACT_STATUS_LEGEND_ORDER = [1, 2, 3, 4, 9] as const;

/**
 * Legenda global dos 5 status (rótulo + cor), sempre visível acima da
 * grid — mirror do bloco `<b>Legenda:</b>` do `index.blade.php` legado
 * (`SC-LST-010`, P2). Nunca tooltip/hover.
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {Array<{status: number, label: string, dotColor: string}>} Legenda
 * ordenada 1→2→3→4→9.
 */
export function getSaleContractStatusLegend(languageGB: LanguageDate) {
  return SALE_CONTRACT_STATUS_LEGEND_ORDER.map((status) => ({
    status,
    label: getSaleContractStatusLabel(status, languageGB),
    dotColor: getSaleContractStatusDotColor(status),
  }));
}

/**
 * Rótulo traduzido do status — nunca hardcoded no componente.
 * @param {number} status - Código do status (1/2/3/4/9).
 * @param {LanguageDate} languageGB - Pacote de idioma ativo.
 * @return {string} Rótulo traduzido; o próprio código (como string) se o
 * valor não for reconhecido (guarda defensiva, nunca deveria ocorrer com a
 * API real).
 */
export function getSaleContractStatusLabel(status: number, languageGB: LanguageDate): string {
  const options = languageGB.saleContracts.saleContract.list.statusOptions;

  const labels: Record<number, string> = {
    1: options.awaitingDelivery,
    2: options.inProgress,
    3: options.nearCompletion,
    4: options.completed,
    9: options.cancelled,
  };

  return labels[status] ?? String(status);
}
