// src/utils/allocationCostCenter.ts
// -----------------------------------------------------------------------------
// 088 — cascata Categoria Financeira → Centro de Custo dos rateios (Compra de
// Animais, Venda de Animais, Transferência entre Fazendas).
//
// Decisão do dono: as OPÇÕES do select Centro de Custo vêm SEMPRE do catálogo
// de centros ANALÍTICOS do CONTRATANTE (`GET /cost-centers/options?scope=allocation`,
// não só da fazenda). `GET /cost-centers/by-category/{uuid}` serve SÓ para
// PRÉ-SELECIONAR o primeiro centro vinculado à categoria — nunca reduz nem
// substitui as opções; a escolha manual nunca é sobrescrita.
// -----------------------------------------------------------------------------

import { listCostCentersByCategory } from '@/services/v2/CostCenters/cost-center-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

export function mapCostCenterRefToOption(item: CostCenterRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

export function buildAllocationCostCenterParams() {
  return (search: string | { search: string }) => ({
    search: typeof search === 'string' ? search : search.search,
    scope: 'allocation' as const,
  });
}

/*
 * Devolve o 1º centro de `by-category` (`scope=allocation`, mesmo universo do
 * catálogo do contratante e ordenado pela API) ou `null`. Falha de rede
 * nunca propaga — pré-seleção é best-effort e não pode bloquear o formulário.
 */
export async function resolveCascadeCostCenter(
  categoryUuid: string
): Promise<Option<string> | null> {
  try {
    const byCategory = await listCostCentersByCategory(categoryUuid, {
      scope: 'allocation',
    });
    const first = (byCategory.data ?? [])[0];
    return first ? mapCostCenterRefToOption(first) : null;
  } catch {
    return null;
  }
}
