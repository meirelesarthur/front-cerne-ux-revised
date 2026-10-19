// src/pages/Fiscal/Mdfe/mdfe-ciot-errors.ts
// -----------------------------------------------------------------------------
// UT-000776 / T-776-FE-03 — leitura do 422 de CIOT do `MdfeRequest` (errors flat por campo:
// `ciots`, `ciots.N.codigo`, `ciots.N.cpf_cnpj`) para o formulário de MDF-e.
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

/** Índice da aba "Transporte" no formulário de MDF-e (Geral=0, Transporte=1, Descarga=2). */
export const MDFE_TRANSPORT_TAB_INDEX = 1;

function firstMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value) return value;
  if (Array.isArray(value)) {
    const found = value.find((item) => typeof item === 'string' && item);
    return typeof found === 'string' ? found : undefined;
  }
  return undefined;
}

/**
 * Extrai a primeira mensagem de erro de CIOT (`ciots` ou `ciots.*`) de um 422 da API.
 * Aceita tanto o `AxiosError` quanto o corpo `errors` já desempacotado.
 *
 * @param {unknown} error - erro capturado da mutação.
 * @return {string | undefined} mensagem da API, ou `undefined` se não houver erro de CIOT.
 */
export function extractCiotFieldError(error: unknown): string | undefined {
  let errors: unknown;
  if (isAxiosError(error)) {
    if (error.response?.status !== 422) return undefined;
    errors = error.response?.data?.errors;
  } else {
    errors = error;
  }
  if (!errors || typeof errors !== 'object') return undefined;

  const entries = Object.entries(errors as Record<string, unknown>);
  const key =
    entries.find(([name]) => name === 'ciots') ??
    entries.find(([name]) => name.startsWith('ciots.'));
  return key ? firstMessage(key[1]) : undefined;
}
