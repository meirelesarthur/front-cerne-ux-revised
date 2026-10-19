// src/pages/Financeiro/MovCaixaBancario/movement-server-errors.ts
// -----------------------------------------------------------------------------
// Mapeia o 422 flat por campo (contrato §10 do módulo) para `setError` do
// react-hook-form, ALÉM do toast genérico exibido pelo `onError` do
// `useRequest`. Erro de negócio SEM campo específico cai no fallback genérico
// (toast) — nunca em campo.
//
// UT-000796 — chaves emitidas pelas novas validações da API
// (`MovementRequest` R1-R6 + guarda de imutabilidade de Transferência):
// `type`, `type_category`, `client_uuid`, `provider_uuid`,
// `destination_account_uuid`, `generates_obligation`. Todas já estão em
// `knownRootFields`.
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

export const MOVEMENT_ROOT_ERROR_FIELDS: ReadonlySet<string> = new Set([
  'date',
  'type',
  'type_category',
  'account_uuid',
  'destination_account_uuid',
  'farm_uuid',
  'proprietary_uuid',
  'client_uuid',
  'provider_uuid',
  'value',
  'interest',
  'document',
  'note',
  'fiscal_document',
  'generates_obligation',
]);

const itemFieldPattern =
  /^allocations\.(\d+)\.(category_uuid|center_uuid|plan_account_uuid|harvest_uuid|value)$/;

export function applyServerFieldErrors(
  error: unknown,
  setError: (name: any, error: { type: string; message: string }) => void
) {
  if (!isAxiosError(error) || error.response?.status !== 422) return;
  const backendErrors = (error.response.data as any)?.errors as
    Record<string, string[]> | undefined;
  if (!backendErrors) return;

  Object.entries(backendErrors).forEach(([field, messages]) => {
    const message = messages?.[0];
    if (!message) return;

    const itemMatch = field.match(itemFieldPattern);
    if (itemMatch) {
      setError(`allocations.${itemMatch[1]}.${itemMatch[2]}`, { type: 'server', message });
      return;
    }

    if (MOVEMENT_ROOT_ERROR_FIELDS.has(field)) {
      setError(field, { type: 'server', message });
    }
    // Erro de nível de ARRAY (`allocations` — ex.: `min:1`) e qualquer erro
    // de negócio sem campo específico caem no fallback genérico do toast.
  });
}
