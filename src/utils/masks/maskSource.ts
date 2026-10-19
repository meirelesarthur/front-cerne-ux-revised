// src/utils/masks/maskSource.ts
// -----------------------------------------------------------------------------
// Tabela de despacho única `kind → MaskEntry` — Wave 0 da esteira 001
// (97-Esteiras/001/CONTRATOS/01-MaskedInput-Contrato.md §1.3). Mesma
// filosofia de `GB.Cerne.UX/src/components/ui/masks.ts`, adaptada (sem
// import cross-repo). `MaskedInput.tsx` NÃO implementa algoritmo — só
// resolve `kind` → `MaskEntry` aqui e liga aos handlers do Chakra
// `Input`/`Field` já existentes.
// -----------------------------------------------------------------------------

import {
  formatCepProgressive,
  formatCnpj,
  formatCpf,
  formatCpfCnpjProgressive,
  formatPhoneProgressive,
} from './document';
import {
  currencyDigitsToNumber,
  directTypingToNumber,
  formatCurrencyDisplay,
  formatIntegerDisplay,
  integerDigitsToNumber,
  numberToCurrencyDigits,
  numberToDirectTypingDisplay,
  sanitizeDirectTyping,
} from './numeric';
import { formatPlateProgressive } from './plate';

export type StringMaskKind =
  'cpf' | 'cnpj' | 'cpfCnpj' | 'phone' | 'cep' | 'digits' | 'digitsOrIsento' | 'plate';
export type NumericMaskKind = 'currency' | 'percent' | 'weight' | 'quantity' | 'integer';

export interface MaskEntry<TValue extends string | number | null> {
  inputMode: 'numeric' | 'tel' | 'decimal' | 'text';
  /** Valor cru do DOM (texto completo do campo, não só a tecla) → texto exibido. */
  format(raw: string): string;
  /** Texto exibido → valor do contrato de saída. */
  parse(display: string): TValue;
  /** Valor do contrato → texto exibido (round-trip de carga externa/reset). */
  toDisplay(value: TValue): string;
  /** `'%'` para `'percent'`; `''`/ausente nos demais. */
  defaultSuffix?: string;
}

function onlyDigits(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

const ISENTO = 'ISENTO';

// IE do cliente (D5): dígitos OU a palavra ISENTO. Se o 1º caractere
// alfanumérico é letra, entra em modo texto e só mantém o maior prefixo de
// ISENTO (caixa alta); caso contrário, só dígitos. Nunca mistura os dois.
function digitsOrIsento(raw: string): string {
  const alnum = (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]/.test(alnum)) return onlyDigits(alnum);
  let out = '';
  for (const ch of alnum) {
    if (!/[A-Z]/.test(ch) || !ISENTO.startsWith(out + ch)) break;
    out += ch;
  }
  return out;
}

const identityParse = (display: string): string => display;

export const stringMaskSource: Record<StringMaskKind, MaskEntry<string>> = {
  cpf: {
    inputMode: 'numeric',
    format: formatCpf,
    parse: identityParse,
    toDisplay: (value) => formatCpf(value ?? ''),
  },
  // CNPJ alfanumérico: teclado de texto (letras nas 12 primeiras posições);
  // `format` já devolve caixa alta.
  cnpj: {
    inputMode: 'text',
    format: formatCnpj,
    parse: identityParse,
    toDisplay: (value) => formatCnpj(value ?? ''),
  },
  cpfCnpj: {
    inputMode: 'text',
    format: formatCpfCnpjProgressive,
    parse: identityParse,
    toDisplay: (value) => formatCpfCnpjProgressive(value ?? ''),
  },
  phone: {
    inputMode: 'tel',
    format: formatPhoneProgressive,
    parse: identityParse,
    toDisplay: (value) => formatPhoneProgressive(value ?? ''),
  },
  cep: {
    inputMode: 'numeric',
    format: formatCepProgressive,
    parse: identityParse,
    toDisplay: (value) => formatCepProgressive(value ?? ''),
  },
  // `digits` — CAMPO GLOBAL PADRÃO para "número simples / inscrições / IDs
  // numéricos" (ex.: Número de endereço, Inscrição Estadual, Inscrição
  // Municipal e qualquer outro campo textual que deva aceitar SÓ DÍGITOS,
  // sem letras e SEM formatação visual — sem ponto/hífen/espaço, ao
  // contrário de `cpf`/`cnpj`/`cep`/`phone`). Não crie filtro `onlyDigits`
  // inline por tela: use `<MaskedInput kind="digits">` para que a regra
  // viva em um único lugar.
  digits: {
    inputMode: 'numeric',
    format: onlyDigits,
    parse: identityParse,
    toDisplay: (value) => onlyDigits(value ?? ''),
  },
  // `digitsOrIsento` — como `digits`, mas aceita também a palavra ISENTO
  // (Inscrição Estadual do cliente, D5). Não altera `digits`.
  digitsOrIsento: {
    inputMode: 'text',
    format: digitsOrIsento,
    parse: identityParse,
    toDisplay: (value) => digitsOrIsento(value ?? ''),
  },
  // `plate` — placa de veículo (UT-000783): antiga ABC-1234 e Mercosul
  // ABC-1D99 sem "modo"; 5ª posição aceita letra OU dígito.
  plate: {
    inputMode: 'text',
    format: formatPlateProgressive,
    parse: identityParse,
    toDisplay: (value) => formatPlateProgressive(value ?? ''),
  },
};

// Moeda — right-fill, `decimalPlaces` sempre 2 (ignora qualquer prop, §2 do
// contrato). Algoritmo idêntico ao `MoneyInput.tsx` atual.
const currencyEntry: MaskEntry<number | null> = {
  inputMode: 'numeric',
  format: (raw) => formatCurrencyDisplay(onlyDigits(raw)),
  parse: (display) => (display ? currencyDigitsToNumber(onlyDigits(display)) : null),
  toDisplay: (value) =>
    value === null || value === undefined
      ? ''
      : formatCurrencyDisplay(numberToCurrencyDigits(value)),
  defaultSuffix: '',
};

// Inteiro — `decimalPlaces` sempre 0 (ignora qualquer prop, §2 do contrato).
// Ramo hoje já correto do `NumberInput.tsx`, promovido.
const integerEntry: MaskEntry<number | null> = {
  inputMode: 'numeric',
  format: (raw) => formatIntegerDisplay(onlyDigits(raw)),
  parse: (display) => integerDigitsToNumber(onlyDigits(display)),
  toDisplay: (value) =>
    value === null || value === undefined ? '' : formatIntegerDisplay(String(Math.round(value))),
  defaultSuffix: '',
};

/**
 * Fábrica da entrada de DIGITAÇÃO DIRETA (percentual/peso/quantidade
 * fracionária — correção KB-06). `decimalPlaces` default é 2 (§2 do
 * contrato); `MaskedInput` invoca esta fábrica de novo com um
 * `decimalPlaces` diferente quando o campo de negócio exigir outra
 * precisão (ex.: alíquotas de 4 casas, Wave 2), em vez de usar a entrada
 * estática da tabela abaixo.
 * @param {number} decimalPlaces - Casas decimais do modelo de digitação direta.
 * @param {string} defaultSuffix - Sufixo default (ex.: `'%'` para percentual).
 * @return {MaskEntry<(number|null)>} Entrada de despacho para o `kind` numérico.
 */
export function createDirectTypingEntry(
  decimalPlaces: number,
  defaultSuffix = ''
): MaskEntry<number | null> {
  return {
    inputMode: 'decimal',
    format: (raw) => sanitizeDirectTyping(raw, decimalPlaces),
    parse: (display) => directTypingToNumber(display),
    toDisplay: (value) => numberToDirectTypingDisplay(value ?? null, decimalPlaces),
    defaultSuffix,
  };
}

export const numericMaskSource: Record<NumericMaskKind, MaskEntry<number | null>> = {
  currency: currencyEntry,
  percent: createDirectTypingEntry(2, '%'),
  weight: createDirectTypingEntry(2),
  quantity: createDirectTypingEntry(2),
  integer: integerEntry,
};
