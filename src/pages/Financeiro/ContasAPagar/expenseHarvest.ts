// UT-000765 (FE-765-D, D-101-06) — Safra por modo, igual ao legado.
// CRIAR: Safra no Cabeçalho (vale para todas as linhas; linhas vão `null`).
// EDITAR: Safra por linha do Rateio; cabeçalho vai `null` (a API deriva).
import { isAxiosError } from 'axios';

export interface HarvestOption {
  label: string;
  value: string;
}

export function resolveHeaderHarvestUuid(
  isEditing: boolean,
  headerHarvest: HarvestOption | null | undefined
): string | null {
  return isEditing ? null : (headerHarvest?.value ?? null);
}

export function resolveRowHarvestUuid(
  isEditing: boolean,
  rowHarvest: HarvestOption | null | undefined
): string | null {
  return isEditing ? (rowHarvest?.value ?? null) : null;
}

export type CategoryHarvestErrorKey = `categories.${number}.harvest_uuid`;

const CATEGORY_HARVEST_ERROR = /^categories\.\d+\.harvest_uuid$/;

/**
 * Extrai do 422 flat os erros `categories.N.harvest_uuid` (um por linha).
 * @param {unknown} error Erro capturado na mutação.
 * @return {Array<object>} Erros por linha (`key` e `message`).
 */
export function extractCategoryHarvestErrors(
  error: unknown
): { key: CategoryHarvestErrorKey; message: string }[] {
  if (!isAxiosError(error) || error.response?.status !== 422) return [];
  const errors = error.response.data?.errors as Record<string, unknown> | null | undefined;
  if (!errors || typeof errors !== 'object') return [];
  return Object.entries(errors)
    .filter(([key]) => CATEGORY_HARVEST_ERROR.test(key))
    .map(([key, messages]) => ({
      key: key as CategoryHarvestErrorKey,
      message: Array.isArray(messages) ? String(messages[0]) : String(messages),
    }));
}
