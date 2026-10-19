// src/services/v2/Operacional/Pecuaria/lossAnimal-service.ts
// -----------------------------------------------------------------------------
// LossAnimal Service — API v1 do backend Laravel GB.Cerne (Perdas). Feature
// F-043, execução 040 (TASK-FE-2771). CRUD contra `/api/v1/loss-animals`.
//
//   GET    /loss-animals          → data: LossAnimalData[] + meta (paginação
//                                   real, `ApiResponse::paginated`)
//   GET    /loss-animals/{uuid}   → data: LossAnimalData
//   POST   /loss-animals          → payload CreateOrUpdateLossAnimalRequest
//   PUT    /loss-animals/{uuid}   → payload CreateOrUpdateLossAnimalRequest
//                                   (SEMPRE completo — contrato de tela
//                                   §7.5.2/API §3.6, mirror `DeathLossRequest`)
//   DELETE /loss-animals/{uuid}   → 204
//
// `listLossAnimals` ADAPTA o envelope `ApiResponse::paginated` para o shape
// `ResponsePagination` que `useCustomGridQuery`/`TableProvider` consomem —
// mesmo adaptador de `listDeathLosses`/`listAnimals`.
//
// X-Farm-Id: NÃO setar neste service — anexado automaticamente pelo
// interceptor axios global (lido de `localStorage['app-active-farm']`),
// mirror confirmado de `death-loss-service.ts`. `LossAnimal` é farm-scoped de
// verdade (diferente de `DeathLoss`, que é catálogo global) — nenhum código
// extra é necessário para o farm-scoping funcionar; é transparente ao service.
// -----------------------------------------------------------------------------

import { isAxiosError } from 'axios';

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CheckLossAnimalDateParams,
  CheckLossAnimalDateResult,
  CreateOrUpdateLossAnimalRequest,
  LossAnimalData,
  LossAnimalFilterRequest,
  LossAnimalsListEnvelope,
} from '@/@types/v2/Operacional/Pecuaria/lossAnimal';

const BASE = '/loss-animals';

export interface ListLossAnimalsParams extends PaginationQueryParams, LossAnimalFilterRequest {}

export async function listLossAnimals(
  params: ListLossAnimalsParams
): Promise<ResponsePagination<LossAnimalData[]>> {
  const { data } = await api.V2.get<LossAnimalsListEnvelope>(BASE, {
    page: params.page,
    per_page: params.per_page,
    animal_uuid: params.animal_uuid || undefined,
    cause_uuid: params.cause_uuid || undefined,
    start_date: params.start_date || undefined,
    end_date: params.end_date || undefined,
  });

  // Adaptação envelope ApiResponse::paginated → ResponsePagination (grid) —
  // mesmo adaptador de listDeathLosses/listAnimals.
  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

export async function getLossAnimal(uuid: string): Promise<Response<LossAnimalData>> {
  const { data } = await api.V2.get<Response<LossAnimalData>>(`${BASE}/${uuid}`);
  return data;
}

export async function createLossAnimal(
  body: CreateOrUpdateLossAnimalRequest
): Promise<Response<LossAnimalData>> {
  const { data } = await api.V2.post<Response<LossAnimalData>>(BASE, body);
  return data;
}

// ⚠️ UPDATE recebe o payload COMPLETO (mesmo tipo do create) — contrato
// §7.5.2. NÃO criar uma assinatura `Partial<CreateOrUpdateLossAnimalRequest>`.
export async function updateLossAnimal(
  uuid: string,
  body: CreateOrUpdateLossAnimalRequest
): Promise<Response<LossAnimalData>> {
  const { data } = await api.V2.put<Response<LossAnimalData>>(`${BASE}/${uuid}`, body);
  return data;
}

export async function deleteLossAnimal(uuid: string): Promise<Response<void>> {
  const { data }: { data: Response<void> } = await api.V2.delete(`${BASE}/${uuid}`);
  return data;
}

// GET /loss-animals/check-date — TASK-BE-1078/TASK-FE-2780 (FID-043-03).
// DIFERENTE do mirror `checkBatchDate` (`breeding-batch-service.ts`, que
// sempre responde 200 com `{valid, message}`): este endpoint segue o
// contrato de erro padrão do fork — 200 = válido; **422** com
// `errors.{animal_uuid|batch_uuid}[0]` = inválido (`ValidationException`,
// `CheckLossAnimalDateAction`). Só o 422 é traduzido para `{valid: false}`
// aqui; qualquer outro erro (rede/500) é RELANÇADO — o caller não deve
// limpar o campo nesse caso (spec §2, "erro de rede não pode apagar a
// seleção do usuário").
export async function checkLossAnimalDate(
  params: CheckLossAnimalDateParams
): Promise<CheckLossAnimalDateResult> {
  try {
    await api.V2.get(`${BASE}/check-date`, {
      date: params.date,
      animal_uuid: params.animal_uuid || undefined,
      batch_uuid: params.batch_uuid || undefined,
    });
    return { valid: true };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 422) {
      const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
      const message = fieldErrors?.animal_uuid?.[0] ?? fieldErrors?.batch_uuid?.[0];
      return { valid: false, message };
    }
    throw error;
  }
}
