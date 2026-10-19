// src/pages/Financeiro/MovCaixaBancario/movement-list-totals.ts
// -----------------------------------------------------------------------------
// UT-000796 r2 (L2/L3) — funções PURAS da listagem de Mov. Caixa/Bancário:
// valor com sinal e totais da PÁGINA corrente (rodapé). Legado
// (`index.blade.php:178,235-242`): linha S mostra `value * -1`; rodapé soma
// `interest` (soma crua, sem sinal) e `$total` líquido (E +, S −) só dos itens
// da página devolvida.
//
// A API r2 expõe `signed_value` por item e `meta.page_totals`; estas funções
// preferem o campo da API e caem numa derivação segura quando ele não vem.
// Somas em CENTAVOS inteiros (sem acumular erro de ponto flutuante); `value` e
// `interest` chegam como string decimal.
// -----------------------------------------------------------------------------

import type { MovementListItem, MovementsPageTotals } from '@/@types/v2/Movements';

type SignedValueInput = Pick<MovementListItem, 'type' | 'value'> &
  Partial<Pick<MovementListItem, 'signed_value'>>;

function toCents(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

// E => +valor, S => −valor. Prefere `signed_value` da API quando presente.
export function signedMovementValue(item: SignedValueInput): number {
  if (hasValue(item.signed_value)) return toCents(item.signed_value) / 100;
  const cents = toCents(item.value);
  return (item.type === 'S' ? -cents : cents) / 100;
}

export interface MovementPageTotalsResult {
  interestTotal: number;
  netTotal: number;
}

// Totais da página. `apiTotals` (`meta.page_totals`) tem precedência; sem ele,
// deriva dos itens (juros: soma crua sem sinal; líquido: E +, S −).
export function computeMovementPageTotals(
  items: ReadonlyArray<SignedValueInput & Partial<Pick<MovementListItem, 'interest'>>>,
  apiTotals?: MovementsPageTotals | null
): MovementPageTotalsResult {
  if (apiTotals && hasValue(apiTotals.interest) && hasValue(apiTotals.net_value)) {
    return {
      interestTotal: toCents(apiTotals.interest) / 100,
      netTotal: toCents(apiTotals.net_value) / 100,
    };
  }
  let interestCents = 0;
  let netCents = 0;
  for (const item of items) {
    interestCents += toCents(item.interest);
    netCents += Math.round(signedMovementValue(item) * 100);
  }
  return { interestTotal: interestCents / 100, netTotal: netCents / 100 };
}

// Linha de Saldo Inicial: somente leitura. Prefere `is_opening_balance`.
export function isOpeningBalanceRow(
  item: Partial<Pick<MovementListItem, 'is_opening_balance' | 'type_category'>>
): boolean {
  return item.is_opening_balance ?? item.type_category === 'I';
}

// Quantidade de títulos gerados (0 quando a API ainda não devolve o campo).
export function generatedObligationsCount(
  item: Partial<Pick<MovementListItem, 'generated_obligations_count'>>
): number {
  const n = Number(item.generated_obligations_count ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
