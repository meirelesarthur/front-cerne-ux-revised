// src/services/v2/AccountingGroupers/accounting-grouper-service.ts
// -----------------------------------------------------------------------------
// Accounting Grouper Service — API v1 do backend Laravel GB.Cerne (Agrupadores
// Contábeis — domínio DRE). NÃO confundir com `grouper-service.ts` (agrupador
// de ESTOQUE, rota `/groupers`) — módulos IRMÃOS, contratos distintos
// (TASK-ACG-01, "Armadilha de identidade").
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /accounting-groupers            → SEM paginação — array COMPLETO,
//                                             já ordenado por depth/nested-set
//                                             (`withDepth()`+`defaultOrder()`,
//                                             `ListAccountingGroupersAction`).
//                                             Único filtro real: `search`
//                                             (name OU code, ILIKE).
//   GET    /accounting-groupers/{uuid}     → data: AccountingGrouperDetail
//   POST   /accounting-groupers            → payload AccountingGrouperPayload
//   PUT    /accounting-groupers/{uuid}      → payload AccountingGrouperPayload
//                                             — `parent_uuid` NUNCA enviado
//                                             (o backend ignora, ver
//                                             AccountingGrouperRequest.php:24).
//   DELETE /accounting-groupers/{uuid}      → 204; 422 estruturado
//                                             `errors.in_use[]` (filhos e/ou
//                                             `FinancialCategory` vinculada) —
//                                             tratado por um `useMutation`
//                                             dedicado em index.tsx (mesmo
//                                             padrão de
//                                             `Addressing`/`Cultivation`, NÃO
//                                             pelo `onError` genérico do
//                                             `useRequest`, que esconderia
//                                             `errors.in_use[]`).
//
// Nota sobre `X-Farm-Id`: `AccountingGrouper` é catálogo GLOBAL (sem
// `farm_id`/`tenant_id` na migration) — o header continua anexado
// automaticamente pelo interceptor axios global, mas o backend o ignora
// (mesmo comportamento de `LowReason`/`Grouper`/`Bank`). Nenhuma ação
// especial necessária neste service.
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  AccountingGrouperDetail,
  AccountingGrouperFilterForm,
  AccountingGrouperListItem,
  AccountingGrouperPayload,
  AccountingGroupersListEnvelope,
} from '@/@types/v2/AccountingGroupers';

// SEM paginação — a API devolve o array COMPLETO, já ordenado por
// depth/nested-set. Filtro único real do backend: `search` (name OU code, ILIKE).
async function listAccountingGroupers(
  filter?: AccountingGrouperFilterForm
): Promise<AccountingGrouperListItem[]> {
  const { data } = await api.V2.get<AccountingGroupersListEnvelope>('/accounting-groupers', {
    search: filter?.search || undefined,
  });
  return data.data;
}

async function getAccountingGrouper(uuid: string) {
  const { data } = await api.V2.get<Response<AccountingGrouperDetail>>(
    `/accounting-groupers/${uuid}`
  );
  return data;
}

async function createAccountingGrouper(payload: AccountingGrouperPayload) {
  const { data } = await api.V2.post<Response<AccountingGrouperDetail>>(
    '/accounting-groupers',
    payload
  );
  return data;
}

// `parent_uuid` NUNCA é enviado aqui — o backend ignora
// (AccountingGrouperRequest.php:24, UpdateAccountingGrouperAction.php:23-28).
// Verbo `PUT` confirmado — `routes/api.php` usa `apiResource` (registra
// PUT|PATCH); `AccountingGroupersTest.php` usa `putJson` nos testes de update.
async function updateAccountingGrouper(uuid: string, payload: AccountingGrouperPayload) {
  const { data } = await api.V2.put<Response<AccountingGrouperDetail>>(
    `/accounting-groupers/${uuid}`,
    payload
  );
  return data;
}

async function deleteAccountingGrouper(uuid: string) {
  const { data } = await api.V2.delete(`/accounting-groupers/${uuid}`);
  return data;
}

export {
  createAccountingGrouper,
  deleteAccountingGrouper,
  getAccountingGrouper,
  listAccountingGroupers,
  updateAccountingGrouper,
};
