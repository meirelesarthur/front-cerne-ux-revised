// src/utils/masks/numeric.ts
// -----------------------------------------------------------------------------
// Módulo consolidado de máscara numérica — Wave 0 da esteira 001
// (97-Esteiras/001/CONTRATOS/01-MaskedInput-Contrato.md §1.2). Util PURO
// (sem I/O, sem React), consumido por `masks/maskSource.ts` e, através dele,
// por `src/components/Form/MaskedInput.tsx`.
//
// Não existe aqui um `formatMaskedNumber(digits, decimalPlaces)` genérico
// (como o `NumberInput.tsx` atual) — essa função genérica é a RAIZ do defeito
// KB-06 (decide o modelo de digitação pela PRECISÃO, não pelo TIPO de
// campo). Este módulo expõe uma família de funções POR MODELO de digitação:
//   - `currency`: right-fill (centavos) — algoritmo IDÊNTICO ao
//     `MoneyInput.tsx` atual, zero mudança de comportamento (§3.1 do
//     contrato).
//   - `percent`/`weight`/`quantity`: DIGITAÇÃO DIRETA (correção KB-06) — o
//     usuário digita o separador decimal explicitamente, nunca right-fill.
//   - `integer`: ramo hoje já correto do `NumberInput.tsx`
//     (`decimalPlaces<=0`), promovido a função nomeada.
// -----------------------------------------------------------------------------

export type NumericFieldKind = 'currency' | 'percent' | 'weight' | 'quantity' | 'integer';

export interface NumericFormatOptions {
  /** Ignorado quando `kind === 'integer'` (sempre 0). */
  decimalPlaces?: number;
  /** Renderizado via `endElement` do Input base — NUNCA concatenado ao texto. */
  suffix?: string;
}

// ---------------------------------------------------------------------------
// Moeda — right-fill (centavos), algoritmo IDÊNTICO ao `MoneyInput.tsx`
// atual (`formatCurrency`/`digitsToNumber`/`numberToDigits`), decimalPlaces
// fixo em 2.
// ---------------------------------------------------------------------------

/**
 * Formata dígitos crus (centavos) em texto de moeda.
 * @param {string} digits - Dígitos crus (centavos), ex.: `"123456"`.
 * @return {string} Texto formatado, ex.: `"R$ 1.234,56"`.
 */
export function formatCurrencyDisplay(digits: string): string {
  if (!digits) return '';
  const cents = (parseInt(digits, 10) / 100).toFixed(2);
  const [int, dec] = cents.split('.');
  const intGrouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intGrouped},${dec}`;
}

/**
 * Converte dígitos crus (centavos) no número puro.
 * @param {string} digits - Dígitos crus (centavos), ex.: `"123456"`.
 * @return {number} Número puro, ex.: `1234.56`.
 */
export function currencyDigitsToNumber(digits: string): number {
  if (!digits) return 0;
  return Number(digits) / 100;
}

/**
 * Converte o número puro nos dígitos crus (centavos) usados para formatar.
 * @param {number} value - Número puro, ex.: `1234.56`.
 * @return {string} Dígitos crus (centavos), ex.: `"123456"`.
 */
export function numberToCurrencyDigits(value: number): string {
  return String(Math.round(value * 100));
}

// ---------------------------------------------------------------------------
// Percentual/peso/quantidade fracionária — DIGITAÇÃO DIRETA (correção
// KB-06): usuário digita o separador decimal explicitamente; NADA de
// right-fill. Agrupa milhar só na parte INTEIRA; nunca reinterpreta os
// últimos N dígitos como fração.
// ---------------------------------------------------------------------------

/**
 * Sanitiza o texto cru digitado (que pode já conter agrupamento de milhar
 * inserido pelo próprio formatador em teclas anteriores): remove tudo que
 * não é dígito/separador, mantém no máximo 1 separador decimal — a ÚLTIMA
 * ocorrência de `,`/`.` na string, já que qualquer separador ANTERIOR a ela
 * é sempre agrupamento de milhar (nunca um 2º separador decimal digitado
 * pelo usuário sobrevive à normalização) —, trunca as casas decimais em
 * `decimalPlaces` e reagrupa a parte inteira com `.`.
 * @param {string} raw - Texto cru vindo do evento de `onChange` do input.
 * @param {number} decimalPlaces - Casas decimais permitidas.
 * @return {string} Texto sanitizado, pronto para exibição (ex.: `"18,56"`).
 */
export function sanitizeDirectTyping(raw: string, decimalPlaces: number): string {
  const cleaned = (raw ?? '').replace(/[^\d.,]/g, '');
  if (!cleaned) return '';

  const lastSeparatorIndex = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));

  let integerPart: string;
  let decimalPart: string | null = null;

  if (lastSeparatorIndex === -1) {
    integerPart = cleaned;
  } else {
    integerPart = cleaned.slice(0, lastSeparatorIndex).replace(/[.,]/g, '');
    decimalPart = cleaned
      .slice(lastSeparatorIndex + 1)
      .replace(/[.,]/g, '')
      .slice(0, decimalPlaces);
  }

  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  const integerGrouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalPart === null) return integerGrouped;
  return `${integerGrouped || '0'},${decimalPart}`;
}

/**
 * Normaliza o texto exibido (`,` → `.`, agrupamento `.` removido) e converte
 * para número puro. String vazia → `null` (preserva "vazio" vs. "zero
 * digitado").
 * @param {string} display - Texto exibido (ex.: `"18,56"`).
 * @return {(number|null)} Número puro, ou `null` quando vazio.
 */
export function directTypingToNumber(display: string): number | null {
  if (!display) return null;

  const normalized = display.replace(/\./g, '').replace(',', '.');
  if (normalized === '' || normalized === '-') return null;

  const value = Number(normalized);
  return Number.isNaN(value) ? null : value;
}

/**
 * Reformata o valor numérico JÁ NA ESCALA CERTA para exatamente
 * `decimalPlaces` casas (ex.: `18` → `"18,00"`) — ponto crítico da correção
 * KB-06 (NUNCA right-fill, ex. `18` → `"0,18"`).
 * @param {(number|null)} value - Número puro, ou `null` quando vazio.
 * @param {number} decimalPlaces - Casas decimais do formato final.
 * @return {string} Texto formatado, ex.: `"18,00"`.
 */
export function numberToDirectTypingDisplay(value: number | null, decimalPlaces: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';

  const fixed = value.toFixed(decimalPlaces);
  const [intPart, decPart] = fixed.split('.');
  const negative = intPart.startsWith('-');
  const absInt = negative ? intPart.slice(1) : intPart;
  const intGrouped = absInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const signed = negative ? `-${intGrouped}` : intGrouped;

  return decPart ? `${signed},${decPart}` : signed;
}

// ---------------------------------------------------------------------------
// Inteiro — ramo hoje correto do `NumberInput.tsx` (`decimalPlaces<=0`),
// promovido a função nomeada, sem separador decimal em nenhuma hipótese.
// ---------------------------------------------------------------------------

/**
 * Agrupa milhar, sem parte decimal.
 * @param {string} digits - Dígitos crus.
 * @return {string} Texto formatado, ex.: `"1.234"`.
 */
export function formatIntegerDisplay(digits: string): string {
  if (!digits) return '';
  return digits.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Converte dígitos crus no número puro. String vazia → `null` (preserva
 * "vazio" vs. "zero digitado").
 * @param {string} digits - Dígitos crus.
 * @return {(number|null)} Número puro, ou `null` quando vazio.
 */
export function integerDigitsToNumber(digits: string): number | null {
  if (!digits) return null;
  return Number(digits);
}
