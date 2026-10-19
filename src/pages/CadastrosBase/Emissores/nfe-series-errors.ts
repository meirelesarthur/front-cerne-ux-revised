// src/pages/CadastrosBase/Emissores/nfe-series-errors.ts
// -----------------------------------------------------------------------------
// Mapeia o 422 flat da API (`{ "nfe_series.N.campo": [msg], "nfe_series": [msg] }`)
// para erros de campo do RHF (UT-000780). Chaves fora de `nfe_series` são
// ignoradas aqui (o toast genérico do `useRequest` cobre o resto).
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

type SetError = (name: string, error: { type: string; message: string }) => void;

export function applyNfeSeriesServerErrors(error: unknown, setError: SetError): void {
  if (!isAxiosError(error) || error.response?.status !== 422) return;
  const errors = (error.response.data as { errors?: Record<string, string[] | string> } | undefined)
    ?.errors;
  if (!errors || typeof errors !== 'object') return;

  Object.entries(errors).forEach(([key, value]) => {
    if (key !== 'nfe_series' && !key.startsWith('nfe_series.')) return;
    const message = Array.isArray(value) ? value[0] : value;
    if (!message) return;
    const path = key === 'nfe_series' ? 'nfe_series.root' : key;
    setError(path, { type: 'server', message });
  });
}
