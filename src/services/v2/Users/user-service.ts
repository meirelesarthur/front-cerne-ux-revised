// src/services/v2/Users/user-service.ts
// -----------------------------------------------------------------------------
// User Service — API v1 do backend Laravel GB.Cerne.
//
// `listUserOptions` (TASK-FE-305) — service ORIGINAL do picker de
// "Encarregados" (`user.boss_uuids`), fonte `GET /users` (listagem
// administrativa geral, `permission:users_view`). REMOVIDO em TASK-FE-918
// (fechamento do laço, defeito nº1 do 2º E2E do dev): a regra de
// elegibilidade de encarregado (`whereHas('authorizer.farms', tenant)`) só
// era aplicada na VALIDAÇÃO de escrita, nunca na leitura — a tela oferecia
// 17 candidatos e a API rejeitava 14 com 422. Os 2 únicos consumidores
// (`CreateOrUpdateUsuario.tsx`, `StepUsuario.tsx`) migraram para
// `listUserBossOptions` (`GET /users/boss-options`, TASK-BE-910 — já filtra
// por elegibilidade no backend). Sem consumidor restante no repositório
// nesta data — confirmado por grep antes da remoção.
//
// A partir daqui (TASK-FE-802, Execução 027): CRUD administrativo completo de
// User — `listUsers`/`getUser`/`createUser`/`updateUser`/`toggleUserActive`/
// `deleteUser`/`resetUserPassword`. Contrato real (User-contrato.md §6d/§18):
//   GET    /users                → UserResource paginado (filtros reais)
//   GET    /users/{uuid}         → UserDetailResource
//   POST   /users                → multipart, bloco Pessoa achatado (nif/
//                                    name/email/phone/city_uuid/address) —
//                                    upsert por NIF, `person_uuid` NUNCA
//                                    enviado por esta tela (TASK-FE-900,
//                                    reversão E2E §18.2). `number`/`district`
//                                    NUNCA enviados por esta tela (TASK-FE-912,
//                                    2º E2E — sem equivalente no legado;
//                                    enviar vazio apagaria quem já os tem via
//                                    People, full-resource-replace)
//   POST   /users/{uuid}
//     + _method=PUT               → multipart, method-spoofing (NUNCA
//                                    `api.V2.put()` com FormData — mesmo
//                                    achado real de Marker/FamilyEquipment)
//   PATCH  /users/{uuid}/status  → JSON `{ is_active: boolean }`
//   DELETE /users/{uuid}         → sem corpo — HARD-DELETE FÍSICO REAL
//                                    (F-206, PLANO-FIDELIDADE-VISUALIZAR-EXCLUIR,
//                                    gate_humano APROVADO). Pode responder 422
//                                    `UserInUseException` (mensagem pública já
//                                    pronta no envelope) quando o usuário tem
//                                    QUALQUER vínculo em tabela RESTRICT do
//                                    domínio operacional — nesse caso nada é
//                                    alterado no backend (rollback de transação).
//   POST   /users/{uuid}/reset-password → sem corpo, sem retorno de senha
//
// `is_active`/`is_purchasing_assistant`/`remove_photo` vão em FormData como
// `'1'`/`'0'` (NUNCA `'true'`/`'false'` string — a regra `boolean` do Laravel
// rejeita esse literal em payload multipart, mesma armadilha de
// `marker-service.ts`). `role_uuids[]`/`farm_uuids[]`/`boss_uuids[]` via
// múltiplos `fd.append` por item (array em multipart não aceita
// `JSON.stringify`).
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { Response, ResponsePagination } from '@/@types/response-api';
import type {
  CreateUserRequest,
  UserBossOptionsEnvelope,
  UserDetail,
  UserListItem,
  UpdateUserRequest,
  UsersFullListEnvelope,
} from '@/@types/v2/Users';

// F-141 (Autorizadores, esteira 089, Slice 2) — Resource ENXUTO de
// `GET /users/authorizer-options` (`UserAuthorizerOptionResource`, backend):
// só `uuid`+`name`. Tipo inline (mirror `RequestAuthorizerOptionItem` em
// `request-authorizer-service.ts` — não existe pasta de tipos própria para
// este lookup específico, mesmo racional).
export interface UserAuthorizerOptionItem {
  uuid: string;
  name: string;
}

interface UserAuthorizerOptionsEnvelope {
  success: boolean;
  message: string;
  data: UserAuthorizerOptionItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// `listUserBossOptions` (TASK-FE-918, fechamento do laço) — fonte CORRETA do
// picker de "Encarregados" (`boss_uuids`), `GET /api/v1/users/boss-options`
// (TASK-BE-910). Mirror LITERAL de `farm-service.ts::listFarmsForUser`: sem
// paginação real (`ApiResponse::success`), payload já filtrado por
// elegibilidade no backend (farm do tenant E autorizador de requisição,
// ordenado por `people.name`) — NENHUM filtro de `search` é aceito pelo
// endpoint (`UserController::bossOptions` só valida `exclude_uuid`), então o
// caller filtra client-side (lista pequena, mesmo padrão de
// farmItems/roleItems nos 2 consumidores). `excludeUuid` remove o próprio
// usuário sendo editado (só se aplica na EDIÇÃO de Usuário).
async function listUserBossOptions(excludeUuid?: string) {
  const { data } = await api.V2.get<UserBossOptionsEnvelope>('/users/boss-options', {
    exclude_uuid: excludeUuid || undefined,
  });
  return data.data ?? [];
}

export interface ListUserAuthorizerOptionsParams extends PaginationQueryParams {
  search?: string;
}

// `listUserAuthorizerOptions` (F-141 Autorizadores, Opção A, decisão do
// dono — esteira 089, Slice 2) — fonte CORRETA do select de "Usuário" do
// CRUD de Autorizadores, `GET /api/v1/users/authorizer-options`. Lookup
// TENANT-WIDE (NUNCA farm-scoped) — substitui as fontes proibidas/erradas
// documentadas no contrato §7.2/§10 (`/users` administrativo removido,
// `/users/options` farm-scoped, `/users/boss-options` outro universo).
// Adaptação envelope ApiResponse::paginated → ResponsePagination, mesmo
// adaptador de `listCostCenterOptions`/`listRequestAuthorizerOptions` (meta
// REAL, nunca fallback fake).
async function listUserAuthorizerOptions(
  params: ListUserAuthorizerOptionsParams
): Promise<ResponsePagination<UserAuthorizerOptionItem[]>> {
  const { data } = await api.V2.get<UserAuthorizerOptionsEnvelope>('/users/authorizer-options', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
  });

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

// ---- CRUD administrativo completo (TASK-FE-802) ----------------------------

export interface ListUsersParams extends PaginationQueryParams {
  search?: string;
  role_uuid?: string;
  is_active?: 'true' | 'false';
  online?: 'true' | 'false';
  inactive_days?: number;
  tenant_uuid?: string;
  plan?: string;
  tenant_status?: number;
}

// CORREÇÃO (lote 2, Execução 027 — TASK-FE-807): `{ ...params }` espalhava
// TODAS as chaves do objeto de filtro cru para a querystring — incluindo os
// companheiros display-only (`role_uuid_label`/`tenant_uuid_label`) do
// `SelectAsyncPaginate`/Input, que nunca deveriam alcançar o backend (DoD da
// Tarefa: "nunca vão ao payload de filtro real"). Whitelist explícita, mesmo
// padrão de `listFunctions`/`listMarkers` — só os campos realmente aceitos
// por `UserFilterData` (contrato) viram query param.
async function listUsers(params: ListUsersParams): Promise<ResponsePagination<UserListItem[]>> {
  const { data } = await api.V2.get<UsersFullListEnvelope>('/users', {
    page: params.page,
    per_page: params.per_page,
    search: params.search || undefined,
    role_uuid: params.role_uuid || undefined,
    // `??` — NUNCA `||` (armadilha documentada em FilterSideFuncoes.tsx):
    // `is_active`/`online` são strings 'true'/'false', mas o valor lógico
    // "Inativo"/"Offline" não pode ser tratado como ausência de filtro.
    is_active: params.is_active ?? undefined,
    online: params.online ?? undefined,
    inactive_days: params.inactive_days ?? undefined,
    tenant_uuid: params.tenant_uuid || undefined,
    plan: params.plan || undefined,
    tenant_status: params.tenant_status ?? undefined,
  });

  return {
    success: data.success,
    message: data.message,
    data: {
      items: data.data,
      pagination: {
        total: data.meta?.total ?? data.data.length,
        count: data.data.length,
        per_page: data.meta?.per_page ?? params.per_page ?? data.data.length,
        current_page: data.meta?.current_page ?? params.page ?? 1,
        total_pages: data.meta?.last_page ?? 1,
      },
    },
  };
}

async function getUser(uuid: string) {
  const { data } = await api.V2.get<Response<UserDetail>>(`/users/${uuid}`);
  return data;
}

// Full-resource sempre. `is_active`/`is_purchasing_assistant`/`remove_photo`
// como '1'/'0' (NUNCA 'true'/'false' — armadilha de multipart do Laravel, já
// documentada em marker-service.ts). Arrays via múltiplos append (não
// JSON.stringify). Bloco Pessoa achatado (TASK-FE-900, reversão E2E) —
// `nif`/`name`/`email`/`city_uuid`/`address` sempre presentes
// (full-resource-replace); `contact_email`/`phone`/`nickname` só entram no
// FormData quando o payload realmente os traz (`undefined` omitido) —
// `contact_email` hoje SEMPRE vem preenchido (o caller,
// `CreateOrUpdateUsuario.tsx::tryPersistUser`, espelha o mesmo valor de
// `email`, TASK-FE-912).
//
// `number`/`district` — NÃO fazem parte do payload desta tela (TASK-FE-912,
// 2º E2E do dev): `CreateUserRequest`/`UpdateUserRequest` não têm mais essas
// chaves, então `buildUserFormData` NUNCA as anexa, em NENHUM verbo — sem
// equivalente no legado (endereço é 1 campo livre) e enviá-las vazias
// apagaria em silêncio `people.number`/`people.district` de quem já os tem
// via módulo Pessoas (mesma família de defeito de
// `is_purchasing_assistant`/`contact_email`/`nickname`).
function buildUserFormData(
  payload: CreateUserRequest | UpdateUserRequest,
  isEditing: boolean
): FormData {
  const fd = new FormData();
  fd.append('nif', payload.nif);
  fd.append('name', payload.name);
  if (payload.contact_email) fd.append('contact_email', payload.contact_email);
  if (payload.phone) fd.append('phone', payload.phone);
  fd.append('city_uuid', payload.city_uuid);
  fd.append('address', payload.address);
  if (payload.nickname) fd.append('nickname', payload.nickname);
  fd.append('email', payload.email);
  if (payload.password) fd.append('password', payload.password);
  fd.append('is_active', payload.is_active ? '1' : '0');
  fd.append('is_purchasing_assistant', payload.is_purchasing_assistant ? '1' : '0');
  if (payload.photo) fd.append('photo', payload.photo);
  if (isEditing && 'remove_photo' in payload && payload.remove_photo) {
    fd.append('remove_photo', '1');
  }
  (payload.role_uuids ?? []).forEach((uuid) => fd.append('role_uuids[]', uuid));
  (payload.farm_uuids ?? []).forEach((uuid) => fd.append('farm_uuids[]', uuid));
  (payload.boss_uuids ?? []).forEach((uuid) => fd.append('boss_uuids[]', uuid));
  return fd;
}

async function createUser(payload: CreateUserRequest) {
  const { data } = await api.V2.post<Response<UserDetail>>(
    '/users',
    buildUserFormData(payload, false)
  );
  return data;
}

// Method spoofing — NUNCA `api.V2.put()` com `FormData` (ver nota de
// cabeçalho do arquivo).
async function updateUser(uuid: string, payload: UpdateUserRequest) {
  const fd = buildUserFormData(payload, true);
  fd.append('_method', 'PUT');
  const { data } = await api.V2.post<Response<UserDetail>>(`/users/${uuid}`, fd);
  return data;
}

async function toggleUserActive(uuid: string, isActive: boolean) {
  const { data } = await api.V2.patch<Response<UserListItem>>(`/users/${uuid}/status`, {
    is_active: isActive,
  });
  return data;
}

// HARD-DELETE físico real (F-206, PLANO-FIDELIDADE-VISUALIZAR-EXCLUIR —
// decisão do dono, gate_humano APROVADO, risco de FK/auditoria aceito).
// `DeleteUserAction` limpa farms/roles/tokens/housekeeping e apaga a linha de
// `users` de verdade, dentro de uma transação; pode responder 422
// `UserInUseException` (usuário com vínculo em tabela RESTRICT de negócio —
// vendas, movimentações, lançamentos etc.), caso em que NADA é alterado
// (rollback). O caller (`Usuarios/index.tsx::deleteUserMutation`) exibe a
// mensagem pública do erro via `resolveMutationErrorMessage` — já vem
// apresentável do envelope da API, sem mapeamento de campo necessário. Só o
// verbo HTTP, sem corpo.
async function deleteUser(uuid: string) {
  const { data } = await api.V2.delete(`/users/${uuid}`);
  return data;
}

// Sem corpo de requisição; a senha NUNCA volta na resposta (contrato §1.4).
async function resetUserPassword(uuid: string) {
  const { data } = await api.V2.post<Response<null>>(`/users/${uuid}/reset-password`);
  return data;
}

export {
  listUserBossOptions,
  listUserAuthorizerOptions,
  listUsers,
  getUser,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
  resetUserPassword,
  buildUserFormData,
};
