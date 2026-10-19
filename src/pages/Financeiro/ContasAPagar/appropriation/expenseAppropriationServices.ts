// src/pages/Financeiro/ContasAPagar/appropriation/expenseAppropriationServices.ts
// -----------------------------------------------------------------------------
// UT-000795 — wrappers ENXUTOS dos lookups do bloco Pecuária/Manutenção que
// dependem de um "pai". Garantem que a API NUNCA seja chamada sem o filtro do
// pai (Lote sem Área/Módulo devolveria todos os lotes; Animal sem Lote, todos
// os animais) — devolvem uma página vazia sem requisição. Demais endpoints são
// consumidos direto dos serviços de domínio.
// -----------------------------------------------------------------------------

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';

import type { ResponsePagination } from '@/@types/response-api';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';

/** Animais do legado: ativos (A) e prenhes (P). `per_page` máx. da API = 100. */
export const LIVESTOCK_ANIMAL_STATUSES = ['A', 'P'];
export const LIVESTOCK_ANIMAL_PAGE_SIZE = 100;

export function emptyOptionsPage<T>(): ResponsePagination<T[]> {
  return {
    success: true,
    message: '',
    data: {
      items: [],
      pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
    },
  };
}

export async function listLivestockBatchOptions(params: {
  search?: string;
  areaUuid?: string | null;
  grazingUuid?: string | null;
}): Promise<ResponsePagination<BatchOption[]>> {
  if (!params.areaUuid && !params.grazingUuid) return emptyOptionsPage<BatchOption>();
  return listBatchOptionsForForm({
    search: params.search,
    areaUuid: params.areaUuid || undefined,
    grazingUuid: params.areaUuid ? undefined : params.grazingUuid || undefined,
  });
}

export async function listLivestockAnimalOptions(params: {
  search?: string;
  page?: number;
  per_page?: number;
  batchUuid?: string | null;
}): Promise<ResponsePagination<AnimalOptionListItem[]>> {
  if (!params.batchUuid) return emptyOptionsPage<AnimalOptionListItem>();
  return listAnimalOptions({
    page: params.page,
    per_page: params.per_page ?? LIVESTOCK_ANIMAL_PAGE_SIZE,
    search: params.search,
    batch_uuid: params.batchUuid,
    statuses: LIVESTOCK_ANIMAL_STATUSES,
  });
}
