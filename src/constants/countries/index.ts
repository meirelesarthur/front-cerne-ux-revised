// src/constants/countries/index.ts
// -----------------------------------------------------------------------------
// TASK-072-FE-01 — fonte ÚNICA do identificador do Brasil no Cerne.
//
// A API identifica país por `countries.codigo` (código IBGE, ESTÁVEL entre
// ambientes — ao contrário de `id`/`uuid`, que variam por seed). No Cerne o
// Brasil é `id 30` / `codigo 1058`; o legado usava o `id` (30) no JS, e a
// comparação do `codigo` com o id 30 herdada dessa confusão nunca casava (causa raiz
// do contrato 072: sem máscara/DV de CPF/CNPJ no form de Contratante).
//
// NUNCA espalhe o literal: consuma `BRAZIL_COUNTRY_CODE` (params de API) ou
// `isBrazilCountry` (decisão de UI/validação).
// -----------------------------------------------------------------------------

/** Código IBGE do Brasil em `countries.codigo`. */
export const BRAZIL_COUNTRY_CODE = 1058 as const;

/**
 * Indica se o país informado é o Brasil, pelo `codigo` IBGE.
 * Tolerante a `codigo` string (ex.: o valor textual vindo de query params/API).
 * @param {Object} [country] - País (Option ou recurso da API) com `codigo`.
 * @return {boolean} `true` somente quando `codigo` equivale a `BRAZIL_COUNTRY_CODE`.
 */
export function isBrazilCountry(country?: { codigo?: number | string | null } | null): boolean {
  if (country?.codigo === null || country?.codigo === undefined || country.codigo === '') {
    return false;
  }
  return Number(country.codigo) === BRAZIL_COUNTRY_CODE;
}
