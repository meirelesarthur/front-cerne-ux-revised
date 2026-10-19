// src/@types/v2/Users/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de USUÁRIOS (User).
//
// `UserOption`/`UsersApiPaginationMeta`/`UsersListEnvelope` (TASK-FE-305, fonte
// `GET /api/v1/users`) REMOVIDOS em TASK-FE-918 junto com `listUserOptions` —
// ver nota de cabeçalho de `services/v2/Users/user-service.ts`. Substituídos
// por `UserBossOption`/`UserBossOptionsEnvelope` logo abaixo.
// -----------------------------------------------------------------------------
// Picker de "Encarregados" (`boss_uuids`) — fonte NOVA (TASK-FE-918, fechamento
// do laço do defeito nº1 do 2º E2E: `GET /users` administrativo oferecia 17
// candidatos, mas a escrita (`whereHas('authorizer.farms', tenant)`) só
// aceitava 3; leitura e escrita em desacordo). Substitui `listUserOptions`
// como fonte deste picker específico — `GET /api/v1/users/boss-options`
// (TASK-BE-910), lido direto de `UserBossOptionResource.php` (api_root,
// 2026-08-03): payload ENXUTO, só `uuid`+`name` (`name` vem de `people.name`,
// NUNCA `users.name` — ver nota do Resource), SEM paginação
// (`ApiResponse::success`, `meta: null`) — mesmo formato de
// `FarmsCurrentTenantEnvelope`/`listFarmsForUser` (farm-service.ts), não o
// `ResponsePagination` do CRUD administrativo de User.
// -----------------------------------------------------------------------------

export interface UserBossOption {
  uuid: string;
  name: string;
}

export interface UserBossOptionsEnvelope {
  success: boolean;
  message: string;
  data: UserBossOption[];
  errors: Record<string, string[]> | null;
  meta: null;
}

// -----------------------------------------------------------------------------
// CRUD administrativo completo de User (TASK-FE-800, Execução 027). Espelha
// `UserResource`/`UserDetailResource`/`UserData`/`UserFilterData` (api_root),
// lidos diretamente do contrato de tela (`User-Frontend-Contrato.md` §1).
// -----------------------------------------------------------------------------

// TASK-FE-900/901 (reversão E2E, User-contrato.md §18.5.1) —
// `UserDetailResource.person` ganhou `address`/`number`/`district` (mirror do
// que Person/PartnerResource já expõem).
//
// TASK-FE-909 (remoção da mitigação) — `nickname`/`email` (contato civil,
// `people.email`, DISTINTO de `users.email`/login) agora TAMBÉM vêm no
// `GET` (`UserDetailResource.person`, TASK-BE-909, confirmado lendo
// `app/Http/Resources/V1/UserDetailResource.php` em 2026-08-03: string
// nullable, mirror exato de `PersonResource`). Antes o Resource não os
// devolvia e a tela só reenviava os 2 campos no UPDATE quando o operador de
// fato os tocava (`dirtyFields`), para não apagar em silêncio um valor
// gravado por outro módulo — mitigação removida, ver `CreateOrUpdateUsuario.
// tsx::fillUserForm`/`tryPersistUser`.
export interface UserDetailPerson {
  uuid: string;
  name: string;
  nickname: string | null;
  nif: string;
  email: string | null; // contato civil (`people.email`) — DISTINTO do login (`UserDetail.email`)
  phone: string | null;
  address: string | null;
  number: string | null;
  district: string | null;
  city: { uuid: string; name: string; state: { name: string; uf: string } | null } | null;
}

export interface UserListItem {
  uuid: string;
  name: string;
  email: string;
  photo: string | null;
  /** URL absoluta (APP_URL/storage/<path>) — usar para <img src>; `photo` é o path relativo cru. */
  photo_url?: string | null;
  is_active: boolean;
  is_purchasing_assistant: boolean; // TASK-BE-802 — exposto em listagem e detalhe
  last_activity: string | null;
  roles: string[]; // listagem: `UserResource` só devolve nomes aqui
}

// `UserDetailResource` (TASK-BE-803) sobrescreve `roles` com `{uuid, name}[]`
// — só no detalhe; a listagem (`UserResource` puro, `UserListItem.roles`)
// continua `string[]`. Confirmado lendo `UserDetailResource::toArray()`
// diretamente (api_root) em 2026-08-03 — GAP-FE-202 fechado (ver Gap).
export interface UserDetail extends Omit<UserListItem, 'roles'> {
  roles: { uuid: string; name: string }[];
  farms: { uuid: string; description: string }[];
  bosses: { uuid: string; name: string }[];
  person?: UserDetailPerson;
}

export interface UserFilterForm {
  search?: string;
  role_uuid?: string;
  role_uuid_label?: string; // display-only, companheiro do SelectAsyncPaginate
  is_active?: 'true' | 'false';
  online?: 'true' | 'false';
  inactive_days?: number;
  tenant_uuid?: string;
  tenant_uuid_label?: string; // display-only, só Gestor_Plataf
  plan?: string;
  tenant_status?: number; // enum TenantStatus, só Gestor_Plataf
}

export interface UsersApiPaginationMetaFull {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface UsersFullListEnvelope {
  success: boolean;
  message: string;
  data: UserListItem[];
  errors: Record<string, string[]> | null;
  meta: UsersApiPaginationMetaFull | null;
}

// Forma INTERNA do form RHF — REVERSÃO E2E (TASK-FE-900, User-contrato.md
// §18.1/§18.2): o bloco "Pessoa" volta a ser campos inline (nif/name/email/
// phone/city_uuid/address), CREATE e EDIT com os MESMOS campos — nunca mais
// um `person_uuid`/`SelectAsyncPaginate` de Pessoa (este campo não existe
// mais no form; a tela NUNCA envia `person_uuid`, §18.2). `nickname` é um
// campo "invisível" (sem `Input` próprio, mirror do legado que nunca
// perguntou apelido) — hidratado do `GET` (TASK-BE-909) e/ou pelo prefill de
// `handleNifBlur` (TASK-FE-903), sempre reenviado no payload
// (full-resource-replace íntegro, TASK-FE-909 — mitigação de reenvio
// condicional por `dirtyFields` removida).
// `password`/`password_confirmation` só existem em create (campo omitido no
// edit, não apenas desabilitado).
//
// AJUSTE 2º E2E (TASK-FE-912) — `number`/`district` REMOVIDOS do form: o
// legado tem 1 único campo de endereço livre, sem os 2 campos estruturados
// (que só existem hoje para o módulo Pessoas, entregue em produção). `email`
// deixou de ser exclusivamente o e-mail de LOGIN — agora é o ÚNICO campo de
// e-mail da tela (posicionado no bloco Pessoa, rótulo "Email"), mirror
// literal do legado (`UserController@store` grava o MESMO valor em
// `users.email` e `people.email`). `contact_email` SAIU do `UserForm` (não é
// mais um campo distinto editável) — o payload (`CreateUserRequest`/
// `UpdateUserRequest`) continua enviando os 2 destinos (`email`/
// `contact_email`), sempre com o MESMO valor de `email`, construído em
// `tryPersistUser` (CreateOrUpdateUsuario.tsx), nunca a partir de um 2º
// estado de form. D-02 (dois campos desacoplados no banco) continua válida
// — o que mudou é só a TELA oferecer 1 input em vez de 2.
export interface UserForm {
  nif: string;
  name: string;
  email: string; // ÚNICO e-mail da tela — alimenta login (`users.email`) E contato (`people.email`)
  phone: string;
  city_uuid: import('@/@types/option').Option<string> | null;
  address: string;
  nickname?: string; // não renderizado — ver nota acima
  password?: string; // só create
  password_confirmation?: string; // só create, client-side only, nunca enviado
  is_active: boolean;
  is_purchasing_assistant: boolean;
  role_uuids: string[];
  farm_uuids: string[];
  boss_uuids: string[];
}

// Payload real — full-resource-replace. `person_uuid` NÃO existe mais neste
// payload (a tela sempre resolve a Person por `nif`/upsert, §18.2) — o campo
// `person_uuid` continua vivo na API só para outros clientes (mobile/
// integrações), fora do escopo desta tela.
//
// `number`/`district` REMOVIDOS (TASK-FE-912, 2º E2E) — a tela NUNCA envia
// essas 2 chaves em NENHUM verbo (colunas existem em `people` e o módulo
// Pessoas as usa em produção; enviar vazio apagaria em silêncio quem já as
// tem — mesma família de defeito de `is_purchasing_assistant`/
// `contact_email`/`nickname`). O backend continua aceitando as 2 chaves para
// outros clientes — só esta tela para de enviá-las.
// `contact_email` sempre recebe o MESMO valor de `email` (campo único da
// tela) — nunca um valor independente.
export interface CreateUserRequest {
  nif: string;
  name: string;
  contact_email?: string;
  phone?: string;
  city_uuid: string;
  address: string;
  nickname?: string;
  email: string;
  password: string;
  is_active: boolean;
  is_purchasing_assistant: boolean;
  photo?: File | null;
  role_uuids: string[];
  farm_uuids: string[];
  boss_uuids: string[];
}

// Update = full-resource-replace (password opcional/omitido quando vazio).
// `remove_photo` (GAP-BE-471, TASK-FE-904) — só existe no update; precedência
// sobre `photo` resolvida no backend (`UpdateUserAction`). `number`/`district`
// removidos — ver nota acima de `CreateUserRequest`.
export interface UpdateUserRequest {
  nif: string;
  name: string;
  contact_email?: string;
  phone?: string;
  city_uuid: string;
  address: string;
  nickname?: string;
  email: string;
  password?: string;
  is_active: boolean;
  is_purchasing_assistant: boolean;
  photo?: File | null;
  remove_photo?: boolean;
  role_uuids: string[];
  farm_uuids: string[];
  boss_uuids: string[];
}
