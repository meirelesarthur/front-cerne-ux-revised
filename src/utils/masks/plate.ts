// src/utils/masks/plate.ts
// -----------------------------------------------------------------------------
// Máscara progressiva e validação de placa de veículo (UT-000783).
// Aceita os dois formatos vigentes sem "modo" a escolher:
//   - antigo:   ABC-1234  (3 letras, 4 dígitos)
//   - Mercosul: ABC-1D99  (3 letras, dígito, letra, 2 dígitos)
// A única ambiguidade é a 5ª posição, que aceita letra OU dígito. Mirror do
// jquery.mask do legado (`AAA-0A00`, onde `A` = alfanumérico e `0` = dígito).
// O valor é guardado COM hífen (D1); o XML da NF-e remove o hífen na API.
// -----------------------------------------------------------------------------

const LETTER = /[A-Z]/;
const DIGIT = /[0-9]/;
const ALNUM = /[A-Z0-9]/;

/** Regra por posição (índice 0..6) do valor sem hífen. */
const POSITION_RULES: RegExp[] = [LETTER, LETTER, LETTER, DIGIT, ALNUM, DIGIT, DIGIT];

/**
 * Formata a placa durante a digitação: maiúsculas, descarta caracteres
 * inválidos para a posição, limita a 7 caracteres e insere hífen após o 3º.
 * @param {string} raw - Texto cru do campo (com ou sem hífen).
 * @return {string} Placa formatada (`''` quando vazio).
 */
export function formatPlateProgressive(raw: string): string {
  const cleaned = (raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  let result = '';

  for (const char of cleaned) {
    if (result.length >= POSITION_RULES.length) break;
    if (POSITION_RULES[result.length].test(char)) result += char;
  }

  return result.length > 3 ? `${result.slice(0, 3)}-${result.slice(3)}` : result;
}

/**
 * Valida a placa completa (antiga ou Mercosul), com ou sem hífen/espaço.
 * @param {string} value - Placa a validar.
 * @return {boolean} `true` quando casa `^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$`.
 */
export function isValidPlate(value: string): boolean {
  const cleaned = (value ?? '').toUpperCase().replace(/[-\s]/g, '');
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(cleaned);
}

/**
 * Hidratação de edição (UT-000787): formata `ABC1234` -> `ABC-1234` quando o
 * valor salvo é uma placa válida; valores legados fora do padrão (ex.: "SEM
 * PLACA") são devolvidos intactos, para a hidratação não mutilá-los.
 * @param {string | null | undefined} value - Placa vinda da API.
 * @return {string} Placa formatada, ou o valor original quando inválido.
 */
export function formatPlateIfValid(value: string | null | undefined): string {
  const raw = value ?? '';
  return isValidPlate(raw) ? formatPlateProgressive(raw) : raw;
}
