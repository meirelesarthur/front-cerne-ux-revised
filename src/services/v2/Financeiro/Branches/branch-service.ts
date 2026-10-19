// src/services/v2/Financeiro/Branches/branch-service.ts
// -----------------------------------------------------------------------------
// Branch Service — API v1 do backend Laravel GB.Cerne. Cascata mínima
// `provider_uuid → filiais` (GAP-036-108/TASK-BE-036-107, TASK-FE-036-103) —
// CRUD completo de `branches` está fora de escopo desta fatia.
//
// Contrato (envelope ApiResponse, `BranchController::index`):
//   GET /branches?provider_uuid=  → data: BranchOptionResource[] (uuid/name/
//                                    nif/state_registration/zip_code/
//                                    address), SEM paginação (lista completa
//                                    por provider) — `provider_uuid` é
//                                    `required` no `BranchIndexRequest`, NUNCA
//                                    chamar sem ele (evita 422).
//
// Sem `permission:` dedicada (lookup enxuto, GAP-BE-040 Opção B) — mesma
// nota de `listCostCenterOptions`/`listPlanAccountOptions`.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';

export interface BranchOption {
  uuid: string;
  name: string;
  nif: string | null;
  state_registration: string | null;
  zip_code: string | null;
  address: string | null;
}

// Guarda no CALLER (o service só monta a request) — `providerUuid` é sempre
// obrigatório aqui; quem consome via `SelectAsyncPaginate` só deve habilitar
// o campo `branch_uuid` quando `provider_uuid` já estiver preenchido.
async function listBranchesByProvider(providerUuid: string): Promise<Response<BranchOption[]>> {
  const { data } = await api.V2.get<Response<BranchOption[]>>('/branches', {
    provider_uuid: providerUuid,
  });
  return data;
}

export { listBranchesByProvider };
