// src/services/v2/Farms/farm-service.ts
// -----------------------------------------------------------------------------
// Farm Service — API v1 do backend Laravel GB.Cerne. Service NOVO e MÍNIMO
// (TASK-FE-320) — só o necessário para popular o `CheckboxListField`
// "Fazendas Vinculadas" de Emissores NFe (TASK-FE-322). Não existe service de
// Farm no projeto até esta Tarefa.
//
// ⚠️ RECONFERÊNCIA REAL — ver nota de cabeçalho de `@/@types/v2/Farms`: usa
// `GET /api/v1/farms/current-tenant` (Grupo A, SEM `permission:`, só
// `farm.context`/X-Farm-Id — mesmo padrão do picker de Autorizadores), NÃO o
// `GET /api/v1/farms` administrativo (`permission:farms_view`) presumido pelo
// planejamento original — o endpoint administrativo exigiria uma permissão
// que nem todo usuário de Emissor tem. `FarmResource::collection` devolve um
// array SEM paginação (`ApiResponse::success`) — não há `meta` real para
// adaptar ao shape `ResponsePagination`; a busca do `CheckboxListField` é
// filtrada no CLIENTE (lista pequena, fazendas do tenant corrente).
//
// TASK-FE-920 (AJUSTE 3 — seletor de fazenda ativa do header) acrescenta
// `getMyFarms()`/`selectFarm()` sobre o Grupo A "usuário autenticado"
// (`/me/farms`), confirmado por leitura direta de `routes/api.php` +
// `FarmController::mine()/select()` no `api_root`:
//   GET  /api/v1/me/farms            → FarmResource::collection (sem paginação)
//   POST /api/v1/me/farms/{uuid}/select → FarmResource (efeito colateral real
//        no banco — last_activity/last_farm_id/UserActivity, RN-07 do plano)
// Ambos usam o envelope genérico `Response<T>` (mesmo padrão de
// `cost-center-service.ts`), não os envelopes MÍNIMOS acima (que só cobrem o
// caso `current-tenant`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type { FarmCurrent, FarmRef, FarmsCurrentTenantEnvelope } from '@/@types/v2/Farms';

async function listFarms(): Promise<FarmRef[]> {
  const { data } = await api.V2.get<FarmsCurrentTenantEnvelope>('/farms/current-tenant');
  return data.data ?? [];
}

// ROTEIRO-FILT-05 (esteira 060, F-264, achado C-P1-06) — `only_enabled` é
// ADITIVO/opt-in no ENDPOINT (`/farms/current-tenant?only_enabled=true`,
// mirror `only_analytic`/`is_enabled` de `cost-center-service.ts`). Função
// SEPARADA (não um parâmetro opcional em `listFarms`) pelo MESMO racional já
// documentado em `listFarmsForUser` acima: ~15 telas existentes
// (`CreateFarmTransfer.tsx`, `useIssuers.tsx`, `useAccounts.tsx`,
// `StepUsuario.tsx`, `StepProprietario.tsx`, `CreateOrUpdateProprietario.tsx`,
// `ApuracaoCusto`/`CustoProducao`/`JurosPagos`/`JurosRecebidos`/`Maquinas`/
// `Faturamento`/`HorasLogadas`/`CreateOrUpdateContaBancaria.tsx`/
// `CreateOrUpdateEmissor.tsx`/`CreateOrUpdateModuleWeighing.tsx` etc.) passam
// `listFarms` DIRETO como `queryFn` cru do TanStack Query — dar um parâmetro
// opcional a `listFarms` quebra a checagem estrutural de `QueryFunction`
// (TS2769/weak-type: o `QueryFunctionContext` injetado pelo TanStack não tem
// NENHUMA propriedade em comum com um tipo só-opcional, e o TypeScript rejeita
// a atribuição). `listEnabledFarms` é consumida SÓ pelo relatório Movimento
// Bancário (F-264), que precisa esconder fazenda desabilitada (paridade
// legado, `where('is_enabled', true)`) — as demais ~15 telas continuam
// chamando `listFarms()` sem qualquer mudança de comportamento.
async function listEnabledFarms(): Promise<FarmRef[]> {
  const { data } = await api.V2.get<FarmsCurrentTenantEnvelope>('/farms/current-tenant', {
    only_enabled: true,
  });
  return data.data ?? [];
}

// `listFarmsForUser` (TASK-BE-808/TASK-FE-900) — variante de `listFarms()`
// com `include_user_uuid`, mesmo racional de
// `role-service.ts::ListRolesParams.include_user_uuid`: alarga o picker para
// mostrar vínculos de fazenda de OUTRO tenant já atribuídos ao usuário sendo
// editado, senão o operador não consegue desmarcá-los (achado E2E, usuária
// Alexsandra). Função SEPARADA (não um parâmetro opcional em `listFarms`)
// porque vários callers existentes (`StepUsuario.tsx`, `StepProprietario.tsx`,
// `CreateOrUpdateProprietario.tsx`, `useIssuers.tsx`, `useAccounts.tsx`)
// passam `listFarms` DIRETO como `queryFn` do TanStack Query — adicionar um
// parâmetro a `listFarms` quebraria a assinatura `QueryFunction` esperada por
// esses callers (o TanStack injeta um `QueryFunctionContext`, não uma
// string). Usar `listFarmsForUser` SÓ na edição de Usuário.
async function listFarmsForUser(includeUserUuid?: string): Promise<FarmRef[]> {
  const { data } = await api.V2.get<FarmsCurrentTenantEnvelope>('/farms/current-tenant', {
    include_user_uuid: includeUserUuid || undefined,
  });
  return data.data ?? [];
}

// TASK-FE-920 — fonte do seletor de fazenda do header (`useMyFarms`).
async function getMyFarms(): Promise<FarmRef[]> {
  const { data } = await api.V2.get<Response<FarmRef[]>>('/me/farms');
  return data.data ?? [];
}

// TASK-FE-920 — troca de fazenda ativa (`useSelectFarm`). `{uuid}` é o
// route-model binding por `uuid` (padrão do projeto, não id numérico).
async function selectFarm(farmUuid: string): Promise<FarmRef> {
  const { data } = await api.V2.post<Response<FarmRef>>(`/me/farms/${farmUuid}/select`);
  return data.data;
}

// GAP-EMP-01/TASK-EMP-FE-07 — GET /api/v1/me/farms/current (Grupo A, só
// `farm.context`, X-Farm-Id via interceptor). Único consumidor: bloqueio
// preventivo do "Criar Usuário" em Funcionários (users_quota.limit_reached).
async function getCurrentFarm(): Promise<FarmCurrent> {
  const { data } = await api.V2.get<Response<FarmCurrent>>('/me/farms/current');
  return data.data;
}

export { getCurrentFarm, getMyFarms, listEnabledFarms, listFarms, listFarmsForUser, selectFarm };
