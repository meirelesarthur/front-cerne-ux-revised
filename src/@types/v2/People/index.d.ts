// src/@types/v2/People/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo PESSOAS UNIFICADO (Person, entidade-raiz de identidade) —
// API v1 do backend Laravel GB.Cerne. Mirror estrutural de `@types/v2/PaymentTerms`,
// com tipos aninhados por papel (People-contrato.md v1.2).
//
// Fonte: leitura DIRETA do código real do fork nesta rodada (execução 023,
// pós commit f55fe6506 — TASK-BE-330/331/332/333):
//   app/Http/Controllers/Api/V1/PersonController.php
//   app/Http/Requests/Api/V1/PersonRequest.php
//   app/Data/Person/PersonFilterData.php
//   app/Http/Resources/V1/{PersonResource,PersonDetailResource,ProprietaryResource,
//     EmployeeResource,ProviderResource,ClientResource,UserRoleResource,
//     BranchResource,SellerResource}.php
//
//   GET    /api/v1/people            → data: PersonListItem[], meta REAL de
//                                       paginação (`PersonRepository::
//                                       listWithAnyRoleInTenant()` pagina com
//                                       `$filters->perPage ?? 10` — TASK-BE-330
//                                       CONCLUÍDO, default 10 real, não mais 15
//                                       hardcoded). Filtros: `search` (nome/
//                                       apelido/nif normalizado), `entity`
//                                       (papel).
//   GET    /api/v1/people/{uuid}     → data: PersonDetail (+ papéis ativos)
//   GET    /api/v1/people/by-nif/{nif} → data: PersonListItem | 404 (não
//                                       encontrado — tratar como null, não
//                                       como erro genérico)
//   POST   /api/v1/people            → payload PersonPayload — upsert por NIF
//                                       (RN-02): 201 se criou, 200 se
//                                       atualizou um registro pré-existente
//                                       com o mesmo nif.
//   PUT    /api/v1/people/{uuid}     → payload PersonPayload (`sometimes` nos
//                                       campos raiz; blocos de papel ausentes
//                                       preservam o papel já ativo — RN-04,
//                                       NUNCA os desativa implicitamente)
//   DELETE /api/v1/people/{uuid}     → 204, SEMPRE soft-delete incondicional
//                                       (contrato §12 Decisão de Negócio 1 —
//                                       sem guarda de bloqueio/vínculo)
//
// Rotas sob `farm.context` ESTRITO (routes/api.php) — `X-Farm-Id` obrigatório
// para QUALQUER usuário (sem bypass de role), diferente de módulos com
// `farm.context.optional` (cost-centers/financial-categories). O interceptor
// global de `services/api.ts` já anexa o header quando há fazenda ativa —
// nenhuma ação extra aqui, mas o guard de "selecione uma fazenda" do app
// cobre a ausência de X-Farm-Id.
//
// Achados de fidelidade desta rodada (nem tudo do contrato está 100%
// reconciliado no lado de LEITURA — ver `TODO(GAP backend)` inline):
//   - Employee/Provider/Client (raiz de cada papel) FORAM reconciliados
//     (TASK-BE-331) — Resources agora expõem os campos reais do contrato
//     (nada de `admission_date`/`resignation_date`/`salary`/`note` fantasmas).
//   - `BranchResource`/`SellerResource` (sub-satélites de Provider) **NÃO**
//     foram reconciliados nesta rodada — continuam expondo só `{ uuid, name }`,
//     sem `nif`/`state_registration`/`zip_code`/`address`/`city_id` (Branch)
//     nem `email`/`phone` (Seller), apesar de o contrato §2.3/§7.1 documentar
//     esses campos como parte do payload de escrita. CRIAÇÃO não é afetada
//     (o payload de escrita aceita todos os campos, `SyncProviderBranchesAction`/
//     `SyncProviderSellersAction` persistem tudo). EDIÇÃO de uma Pessoa com
//     Fornecedor já ativo reidrata as filiais/vendedores só com `name`
//     (demais campos ficam vazios no formulário) — mesma classe de limitação
//     do achado #2 original de TASK-FE-300, agora restrita a este sub-nível.
//   - TASK-FE-332/TASK-BE-355/356/357 (execução 023, commit `8574f3268`) —
//     `EmployeeResource.function_uuid`/`center_id` e `ProviderResource.bank_id`
//     foram substituídos por objetos denormalizados (`function{uuid,name}`,
//     `center{uuid,code,description}`, `bank{uuid,code,name}`), fechando o
//     prefill com rótulo REAL (não mais uuid cru) em Função/Centro de Custo/
//     Banco do Fornecedor, mesmo padrão de `city` (TASK-BE-334). EXCEÇÃO:
//     `EmployeeResource` NUNCA expôs bank/account_type/agency/account
//     (Employee não tem coluna `bank_id` física, diferente de Provider) —
//     achado latente fora do escopo desta Tarefa, ver nota em
//     `EmployeeRoleDetail.bank_uuid`.
// -----------------------------------------------------------------------------

// ============================================
// Papéis — chave e metadados
// ============================================

/** União dos 5 papéis funcionais do formulário (sem `partner`/`tenant` — fora do escopo funcional do contrato §2.3/§7). */
export type RoleKey = 'proprietary' | 'employee' | 'provider' | 'client' | 'user';

// ============================================
// PERSON (resposta da API)
// ============================================

export interface PersonCityRef {
  /** TASK-FE-327 — `PersonDetailResource.city` já expõe `uuid` desde `TASK-BE-334`; usado para prefill do `SelectAsyncPaginate` em edição. */
  uuid: string;
  name: string;
  state: { name: string; uf: string } | null;
}

export interface PersonListItem {
  uuid: string;
  name: string;
  nickname: string;
  nif: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  number: string | null;
  district: string | null;
  zip_code: string | null;
  city: PersonCityRef | null;
}

// --- Sub-satélites de Provider (Branch/Seller) ---
// TODO(GAP backend): BranchResource/SellerResource só expõem uuid+name(+city_uuid
// desde TASK-BE-334) hoje — os demais campos do contrato (nif/state_registration/
// zip_code/address para Branch; email/phone para Seller) não são reidratados em
// edição. Ver nota de cabeçalho do arquivo.
export interface PersonBranchRef {
  uuid?: string;
  name: string | null;
  /** TASK-FE-327 — `BranchResource` só expõe o uuid cru (sem nome/UF denormalizados); prefill usa fallback rótulo=uuid. */
  city_uuid?: string | null;
}

export interface PersonSellerRef {
  uuid?: string;
  name: string | null;
}

// --- Papéis (leitura — PersonDetailResource) ---

export interface ProprietaryRoleDetail {
  uuid?: string;
  is_enabled: boolean;
  farms?: { uuid: string; percentage: number | null }[];
  state_registration_numbers?: string[];
}

/** TASK-FE-332/TASK-BE-357 — `EmployeeResource.function` substitui `function_uuid` cru; usado para prefill do `SelectAsyncPaginate` de Função (CBO) em edição, com rótulo real (não mais uuid cru). */
export interface EmployeeFunctionRef {
  uuid: string;
  name: string;
}

/** TASK-FE-332/TASK-BE-357 — `EmployeeResource.center` substitui `center_id`(int); mesmo shape de `CostCenterRef` (`@types/v2/CostCenters`), não importado aqui para manter este arquivo autocontido (mesma convenção de `PersonCityRef`). */
export interface EmployeeCenterRef {
  uuid: string;
  code: string;
  description: string;
}

/** TASK-FE-332/TASK-BE-357 — `ProviderResource.bank` substitui `bank_id`(int); mesmo shape de `BankOptionItem` (`@types/v2/Banks`). */
export interface ProviderBankRef {
  uuid: string;
  code: string;
  name: string;
}

export interface EmployeeRoleDetail {
  uuid?: string;
  is_enabled: boolean;
  office: string | null;
  /** TASK-FE-332/TASK-BE-357 — substitui `function_uuid` cru; `EmployeeResource` só expõe quando a relação `function` está carregada (`whenLoaded`). */
  function: EmployeeFunctionRef | null;
  commission: number | null;
  vl_time_productive: number | null;
  vl_time_unproductive: number | null;
  base_salary: number | null;
  goal_salary: number | null;
  /** TASK-FE-332/TASK-BE-357 — substitui `center_id`(int); `EmployeeResource` só expõe quando a relação `center` está carregada. */
  center: EmployeeCenterRef | null;
  /** `Y-m-d` ou null. */
  birthday: string | null;
  /**
   * TASK-FE-332 — achado de leitura cruzada: `EmployeeResource` NUNCA
   * expôs `bank`/`account_type`/`agency`/`account` (confirmado desde a
   * primeira versão do Resource, sem coluna `bank_id` na tabela
   * `employees` — diferente de `Provider`, que TEM `bank_id` físico).
   * `PersonRequest::rules()` aceita `employee.bank_uuid` na ESCRITA
   * (`Rule::exists('banks','uuid')`), então o campo é tipado aqui para o
   * payload de escrita fazer sentido — mas a leitura em edição estará
   * SEMPRE `undefined` (latente, fora do escopo desta Tarefa; registrado
   * para o Arquiteto avaliar se `EmployeeResource` deveria denormalizar
   * `bank` como `ProviderResource` já faz).
   */
  bank_uuid?: string | null;
  account_type?: string | null;
  agency?: string | null;
  account?: string | null;
  pix_type: number | null;
  pix: string | null;
}

export interface ProviderRoleDetail {
  uuid?: string;
  is_enabled: boolean;
  type: number | null;
  commission: number | null;
  hour_value: number | null;
  state_registration: string | null;
  city_registration: string | null;
  contact: string | null;
  contact_phone: string | null;
  id_abroad: string | null;
  /** TASK-FE-332/TASK-BE-357 — substitui `bank_id`(int); `ProviderResource` só expõe quando a relação `bank` está carregada. */
  bank: ProviderBankRef | null;
  account_type: string | null;
  agency: string | null;
  account: string | null;
  pix_type: number | null;
  pix: string | null;
  branches: PersonBranchRef[];
  sellers: PersonSellerRef[];
}

export interface ClientRoleDetail {
  uuid?: string;
  is_enabled: boolean;
  cellphone: string | null;
  contact: string | null;
  contact_phone: string | null;
  city_registration: string | null;
  final_costumer: boolean;
  taxpayer: boolean;
  code_country: string | null;
  id_abroad: string | null;
  farm_name: string | null;
  /** TASK-FE-334/TASK-BE-359 — virou ARRAY no backend (`ClientRoleData::$stateRegistrations`); reidratação usa repeater, mesmo padrão de `ProprietaryRoleDetail.state_registration_numbers`. */
  state_registrations?: string[];
}

export interface UserRoleRef {
  uuid?: string;
  name?: string;
  description?: string;
}

export interface UserRoleDetail {
  uuid?: string;
  is_active: boolean;
  is_purchasing_assistant: boolean;
  roles?: UserRoleRef[];
  farms?: UserRoleRef[];
  bosses?: UserRoleRef[];
}

export interface PersonDetail extends PersonListItem {
  proprietary: ProprietaryRoleDetail | null;
  employee: EmployeeRoleDetail | null;
  provider: ProviderRoleDetail | null;
  client: ClientRoleDetail | null;
  user: UserRoleDetail | null;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — REAL, default 10)
// ============================================

export interface PeopleApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface PeopleListEnvelope {
  success: boolean;
  message: string;
  data: PersonListItem[];
  errors: Record<string, string[]> | null;
  meta: PeopleApiPaginationMeta | null;
}

// ============================================
// REQUEST TYPES (payload de escrita — PersonRequest::rules())
// ============================================

/**
 * TASK-FE-338 (execução 023, generalização do achado F/TASK-FE-337 para os
 * papéis NÃO-usuário) — já aceitava o bloco MÍNIMO `{ is_enabled: false }`
 * sem qualquer mudança estrutural (todos os demais campos já eram
 * opcionais). Usado quando a Pessoa em EDIÇÃO já tinha este papel ativo e o
 * toggle é desligado no submit — sinal explícito de desativação, backend
 * desativa e PRESERVA `farms`/`state_registration_numbers` já vinculados
 * (contrato combinado com TASK-BE-362, em paralelo).
 */
export interface ProprietaryRolePayload {
  is_enabled: boolean;
  farms?: { farm_uuid: string; percentage: number }[];
  state_registration_numbers?: string[];
}

/**
 * TASK-FE-338 — mesma exceção de `ProprietaryRolePayload` acima: já aceitava
 * `{ is_enabled: false }` sozinho (demais campos já opcionais); backend
 * desativa e PRESERVA os dados do papel.
 */
export interface EmployeeRolePayload {
  is_enabled: boolean;
  office?: string | null;
  /** v1.2/DEC-009 — substitui `function_id` (uuid, `GET /functions/options`). */
  function_uuid?: string;
  commission?: number | null;
  vl_time_productive?: number | null;
  vl_time_unproductive?: number | null;
  base_salary?: number | null;
  goal_salary?: number | null;
  /** TASK-FE-332/TASK-BE-335 — substitui `center_id`(int); `PersonRequest::rules()` exige `Rule::exists('cost_centers','uuid')`. */
  center_uuid?: string | null;
  /** `Y-m-d`. */
  birthday?: string;
  /** TASK-FE-332/TASK-BE-335 — substitui `bank_id`(int); `PersonRequest::rules()` exige `Rule::exists('banks','uuid')` (aceito na escrita mesmo `EmployeeResource` não devolvendo o dado na leitura — ver nota em `EmployeeRoleDetail.bank_uuid`). */
  bank_uuid?: string | null;
  account_type?: string | null;
  agency?: string | null;
  account?: string | null;
  pix_type?: number | null;
  pix?: string | null;
}

export interface ProviderBranchPayload {
  nif: string;
  /** TASK-FE-327/TASK-BE-334 — substitui `city_id`(int). */
  city_uuid: string;
  address: string;
  name?: string | null;
  state_registration?: string | null;
  zip_code?: string | null;
}

export interface ProviderSellerPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface ProviderRolePayload {
  is_enabled: boolean;
  /**
   * Enum não fechado no backend (contrato §5, PERGUNTA-02) — `2` é
   * RESERVADO ao mirror automático de Employee (RN-07), nunca selecionável
   * manualmente.
   *
   * TASK-FE-338 — tornado OPCIONAL (era `type: number` obrigatório) para o
   * bloco MÍNIMO de desativação `{ is_enabled: false }` tipar corretamente.
   * `buildPayload()` SEMPRE preenche `type` quando `is_enabled: true`
   * (criação/toggle ON) — a opcionalidade só é exercida no ramo de
   * desativação (papel já ativo + toggle OFF em edição), onde nenhum outro
   * campo é enviado.
   */
  type?: number;
  commission?: number | null;
  hour_value?: number | null;
  state_registration?: string | null;
  city_registration?: string | null;
  contact?: string | null;
  contact_phone?: string | null;
  id_abroad?: string | null;
  /** TASK-FE-332/TASK-BE-335 — substitui `bank_id`(int); `PersonRequest::rules()` exige `Rule::exists('banks','uuid')`. */
  bank_uuid?: string | null;
  account_type?: string | null;
  agency?: string | null;
  account?: string | null;
  pix_type?: number | null;
  pix?: string | null;
  branches?: ProviderBranchPayload[];
  sellers?: ProviderSellerPayload[];
}

export interface ClientRolePayload {
  is_enabled: boolean;
  cellphone?: string | null;
  contact?: string | null;
  contact_phone?: string | null;
  city_registration?: string | null;
  /**
   * TASK-FE-338 — `final_costumer`/`taxpayer`/`code_country` tornados
   * OPCIONAIS (eram obrigatórios) para o bloco MÍNIMO de desativação
   * `{ is_enabled: false }` tipar corretamente. `buildPayload()` SEMPRE
   * preenche os 3 quando `is_enabled: true` (criação/toggle ON) — a
   * opcionalidade só é exercida no ramo de desativação (papel já ativo +
   * toggle OFF em edição).
   */
  final_costumer?: boolean;
  taxpayer?: boolean;
  code_country?: string;
  id_abroad?: string | null;
  farm_name?: string | null;
  /** TASK-FE-334/TASK-BE-359 — virou ARRAY (ver `ClientRoleDetail`); sem limite/dedup artificiais, mesmo padrão de `ProprietaryRolePayload.state_registration_numbers`. */
  state_registrations?: string[];
}

export interface UserRolePayload {
  is_active: boolean;
  is_purchasing_assistant?: boolean;
  /** `required_if:user.is_active,true` no CREATE; `sometimes` no UPDATE — omitir mantém a senha atual. */
  password?: string;
  farm_uuids?: string[];
  role_uuids?: string[];
  boss_uuids?: string[];
}

/**
 * Payload raiz completo — espelha `PersonRequest::rules()`. Cada bloco de
 * papel é incluído SE E SOMENTE SE `enabled === true` no estado do wizard
 * (regra 4/RN-04 do contrato: ausência do bloco no update preserva o papel
 * já ativo, nunca o desativa implicitamente).
 *
 * TASK-FE-337 (execução 023, decisão do dev) — EXCEÇÃO consciente a RN-04
 * só para `user`: quando a Pessoa em EDIÇÃO já tinha usuário ATIVO e o
 * toggle "Usuário" é desligado no submit, `buildPayload()` envia o BLOCO
 * MÍNIMO `user: { is_active: false }` (sem `password`/`farm_uuids`/
 * `role_uuids`/`boss_uuids`) — sinal EXPLÍCITO de desativação, não
 * confundir com o "papel nunca teve usuário + toggle OFF" (esse caso
 * continua omitindo o bloco inteiro, no-op real). O backend, ao receber
 * `is_active: false` SEM arrays de vínculo, desativa o usuário e revoga o
 * token, mas PRESERVA roles/farms/bosses já vinculados (contrato alinhado
 * com o Architect/Executor backend em paralelo, mesma execução).
 *
 * TASK-FE-338 (execução 023, generalização do achado F para os 4 papéis
 * NÃO-usuário — Proprietário/Funcionário/Fornecedor/Cliente) — MESMA
 * exceção consciente a RN-04, agora estendida: quando a Pessoa em EDIÇÃO já
 * tinha um destes papéis ATIVO e o toggle correspondente é desligado no
 * submit, `buildPayload()` envia o BLOCO MÍNIMO
 * `{ role }: { is_enabled: false }` (sem `farms`/`branches`/`sellers`/
 * demais campos do papel) — sinal EXPLÍCITO de desativação. O backend, ao
 * receber `is_enabled: false` sozinho, desativa o papel e PRESERVA
 * filiais/vendedores/fazendas/inscrições já vinculados (contrato combinado
 * com TASK-BE-362, em paralelo). Continua valendo para os 4: CRIAÇÃO nunca
 * cai neste ramo (`isEditing` falso); papel que NUNCA esteve ativo com
 * toggle OFF também não (estado original é `false`) — nesses casos o bloco
 * do papel continua OMITIDO (no-op real, RN-04 padrão inalterada).
 */
export interface PersonPayload {
  nif: string;
  name: string;
  nickname: string;
  email?: string | null;
  phone?: string | null;
  /** TASK-FE-327/TASK-BE-334 — substitui `city_id`(int); `PersonRequest::rules()` exige `Rule::exists('cities','uuid')`. */
  city_uuid: string;
  zip_code?: string | null;
  address: string;
  number: string;
  district: string;
  proprietary?: ProprietaryRolePayload | null;
  employee?: EmployeeRolePayload | null;
  provider?: ProviderRolePayload | null;
  client?: ClientRolePayload | null;
  user?: UserRolePayload | null;
}

// ============================================
// FILTRO (drawer/params da listagem)
// ============================================

export interface PersonFilterForm {
  /** Busca por nome/apelido/CPF-CNPJ normalizado (param `search`) — NÃO filtra e-mail. */
  search?: string;
  entity?: RoleKey;
}
