// src/utils/masks/document.ts
// -----------------------------------------------------------------------------
// Módulo consolidado de máscara de documento/telefone/CEP — Wave 0 da esteira
// 001 (97-Esteiras/001/CONTRATOS/01-MaskedInput-Contrato.md §1.1). Util PURO
// (sem I/O, sem React), consumido por `masks/maskSource.ts` e, através dele,
// por `src/components/Form/MaskedInput.tsx`.
//
// Canonização (ver 02-Mapa-Consolidacao.md §2 — 3 implementações → 1):
//   - Checksum mod-11 de CPF/CNPJ: PORTADO byte-a-byte de
//     `src/utils/validateCpfCnpj.ts` (canônico) — rejeita sequência de dígito
//     único repetido via regex genérica, ANTES do checksum.
//   - Formatação progressiva de CPF/CNPJ: PORTADA byte-a-byte de
//     `src/utils/format-document.ts` (canônico) — reaplica separadores a
//     cada tecla, sem exigir o documento já completo.
//   - Formatação progressiva de telefone: PORTADA byte-a-byte de
//     `src/utils/format-phone.ts` (canônico) — fixo `(DD)XXXX-XXXX` (≤10
//     dígitos) / celular `(DD)XXXXX-XXXX` (11 dígitos), SEM espaço após o
//     parêntese (mesmo formato hoje em produção no campo `fone` do Contador
//     — preservado sem mudança de comportamento nesta Wave 0).
//   - `formatCepProgressive`: NOVO (hoje só via `react-input-mask` +
//     `strings.mask.cep`), mesmo paradigma progressivo dos dois anteriores.
//
// `cpfCnpj.ts` (checksum redundante + heurística de máscara dinâmica que só
// servia ao `react-input-mask`) NÃO é canonizado aqui — descartado por
// redundância matemática, conforme decisão do Mapa de Consolidação.
// -----------------------------------------------------------------------------

export type DocType = 'cpf' | 'cnpj' | 'unknown';

// CNPJ alfanumérico (NT Conjunta 2025.001): repetição de QUALQUER caractere
// válido (ex.: 14 zeros) é recusada antes do checksum.
const ALL_CHARS_EQUAL_REGEX = /^([0-9A-Z])\1+$/;

function hasAllDigitsEqual(digits: string): boolean {
  return ALL_CHARS_EQUAL_REGEX.test(digits);
}

/**
 * Normaliza um documento: caixa alta e somente `[0-9A-Z]` (remove máscara,
 * espaço e pontuação). Base do CNPJ alfanumérico.
 * @param {string} raw - Valor cru, mascarado ou não, em qualquer caixa.
 * @return {string} Documento só com `[0-9A-Z]` em maiúsculas.
 */
export function normalizeDocument(raw: string): string {
  return (raw ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function hasLetter(normalized: string): boolean {
  return /[A-Z]/.test(normalized);
}

/**
 * Remove tudo que não é dígito (letras, pontuação, espaço).
 * @param {string} raw - Valor cru, mascarado ou não.
 * @return {string} Só os dígitos.
 */
export function onlyDigits(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

/**
 * Classificação EXATA do tipo de documento pela quantidade de dígitos —
 * usada para rótulo/validação (11 → CPF, 14 → CNPJ, qualquer outro tamanho →
 * `'unknown'`). Não confundir com `maskDocTypeOfDigits` (heurística de
 * SELEÇÃO de máscara em digitação, tolerante a documento incompleto).
 * @param {string} value - Documento mascarado ou cru.
 * @return {DocType} Classificação exata do documento.
 */
export function docTypeOfDigits(value: string): DocType {
  const normalized = normalizeDocument(value);
  if (normalized.length === 14) return 'cnpj';
  if (normalized.length === 11 && !hasLetter(normalized)) return 'cpf';
  return 'unknown';
}

/**
 * Heurística de SELEÇÃO de máscara durante a digitação (documento ainda
 * incompleto): mais de 11 dígitos crus já digitados → aplica máscara de
 * CNPJ; caso contrário → máscara de CPF. Mesmo critério de
 * `format-document.ts` atual.
 * @param {string} value - Documento mascarado ou cru, possivelmente incompleto.
 * @return {('cpf'|'cnpj')} Tipo de máscara a aplicar.
 */
export function maskDocTypeOfDigits(value: string): 'cpf' | 'cnpj' {
  const normalized = normalizeDocument(value);
  return hasLetter(normalized) || normalized.length > 11 ? 'cnpj' : 'cpf';
}

/**
 * Formata progressivamente um CPF a partir dos dígitos crus (parcial ou completo).
 * @param {string} digits - Dígitos crus (parcial ou completo).
 * @return {string} CPF formatado, ex.: `"123.456.789-00"`.
 */
export function formatCpf(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

/**
 * Formata progressivamente um CNPJ (numérico ou alfanumérico) a partir do valor cru.
 * @param {string} digits - Valor cru (parcial ou completo).
 * @return {string} CNPJ formatado, ex.: `"12.345.678/0001-90"`.
 */
export function formatCnpj(digits: string): string {
  const normalized = normalizeDocument(digits);
  // 12 primeiras posições [0-9A-Z]; 2 últimas (DV) somente dígitos.
  const d = (normalized.slice(0, 12) + normalized.slice(12).replace(/\D/g, '')).slice(0, 14);
  return d
    .replace(/([0-9A-Z]{2})([0-9A-Z])/, '$1.$2')
    .replace(/([0-9A-Z]{2})\.([0-9A-Z]{3})([0-9A-Z])/, '$1.$2.$3')
    .replace(/([0-9A-Z]{2})\.([0-9A-Z]{3})\.([0-9A-Z]{3})([0-9A-Z])/, '$1.$2.$3/$4')
    .replace(/([0-9A-Z]{4})([0-9A-Z])/, '$1-$2');
}

/**
 * Formata progressivamente CPF OU CNPJ a partir do valor cru digitado,
 * despachando por `maskDocTypeOfDigits` (heurística por quantidade de
 * dígitos, tolerante a documento incompleto) — mesmo algoritmo de
 * `format-document.ts::formatDocument` atual.
 * @param {string} raw - Valor cru vindo do evento de `onChange` do input.
 * @return {string} Documento formatado (CPF ou CNPJ).
 */
export function formatCpfCnpjProgressive(raw: string): string {
  const normalized = normalizeDocument(raw);
  return maskDocTypeOfDigits(normalized) === 'cnpj'
    ? formatCnpj(normalized)
    : formatCpf(normalized.slice(0, 11));
}

/**
 * Formata progressivamente um telefone (fixo ou celular) a partir do valor
 * cru digitado — mesmo algoritmo de `format-phone.ts::formatPhone` atual
 * (fixo `(DD)XXXX-XXXX`, celular `(DD)XXXXX-XXXX`, SEM espaço após o
 * parêntese), preservado sem mudança de comportamento nesta Wave 0.
 * @param {string} raw - Valor cru vindo do evento de `onChange` do input.
 * @return {string} Telefone formatado.
 */
export function formatPhoneProgressive(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);

  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)})${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)})${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)})${d.slice(2, 7)}-${d.slice(7)}`;
}

/**
 * Formata progressivamente um CEP a partir do valor cru digitado —
 * `"99999-999"` (formato canônico brasileiro de CEP: 5 dígitos, hífen, 3
 * dígitos), mesmo paradigma de `format-document.ts`/`format-phone.ts`, sem
 * depender de `react-input-mask`. Corrige defeito sistêmico que produzia
 * `"NN.NNN-NNN"` (formato de CPF, 10 chars) em vez do CEP real (9 chars).
 * @param {string} raw - Valor cru vindo do evento de `onChange` do input.
 * @return {string} CEP formatado, ex.: `"29118-785"`.
 */
export function formatCepProgressive(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Validação de dígito verificador (checksum mod-11) de CPF — PORTADA
 * byte-a-byte de `src/utils/validateCpfCnpj.ts` (canônico).
 * @param {string} value - Documento mascarado ou cru.
 * @return {boolean} `true` se o dígito verificador do CPF for válido.
 */
export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || hasAllDigitsEqual(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  return remainder === Number(digits[10]);
}

/**
 * Validação de dígito verificador (checksum mod-11) de CNPJ — PORTADA
 * byte-a-byte de `src/utils/validateCpfCnpj.ts` (canônico).
 * @param {string} value - Documento mascarado ou cru.
 * @return {boolean} `true` se o dígito verificador do CNPJ for válido.
 */
export function isValidCnpj(value: string): boolean {
  const chars = normalizeDocument(value);
  if (chars.length !== 14 || hasAllDigitsEqual(chars)) return false;
  // 12 primeiras [0-9A-Z]; 2 últimas (DV) obrigatoriamente dígitos.
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars)) return false;

  // Valor do caractere = código ASCII − 48 (0..9 → 0..9; A=17 … Z=42).
  const values = Array.from(chars, (c) => c.charCodeAt(0) - 48);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += values[i] * weights1[i];
  let remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (remainder !== values[12]) return false;

  sum = 0;
  for (let i = 0; i < 13; i += 1) sum += values[i] * weights2[i];
  remainder = sum % 11 < 2 ? 0 : 11 - (sum % 11);

  return remainder === values[13];
}

/**
 * Despacha a validação de checksum por quantidade de dígitos: 11 → CPF,
 * 14 → CNPJ, qualquer outro tamanho → inválido. PORTADA byte-a-byte de
 * `src/utils/validateCpfCnpj.ts` (canônico).
 * @param {string} value - Documento mascarado ou cru.
 * @return {boolean} `true` se o dígito verificador do documento for válido.
 */
export function isValidCpfCnpj(value: string): boolean {
  const type = docTypeOfDigits(value);
  if (type === 'cpf') return isValidCpf(value);
  if (type === 'cnpj') return isValidCnpj(value);
  return false;
}
