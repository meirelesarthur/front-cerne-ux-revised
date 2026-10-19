// src/@types/v2/BaseRegistrations/tenant/index.d.ts
// Tipos do módulo de Contratantes (Tenant) — API v1 do backend Laravel
// GB.Cerne. Fiel ao formulário legado `agro365/resources/views/tenants/
// _forms.blade.php` (33 campos, contrato de tela `Tenant-contrato-tela.md
// §3`). SEM `X-Farm-Id` — Tenant não é escopado por farm (DA-T01).
//
// RECONCILIAÇÃO (`GAP-TN-FE-03`, Achados A/B/C/D — TODOS RESOLVIDOS no
// backend real, `TenantRequest`/`TenantData`/`TenantDetailResource`
// confirmados por leitura direta do `api_root`, TASK-TN-05/TASK-TN-06 ✅):
//   A — `country_id`/`person.city_id` (FK inteira) → `country_uuid`/
//       `person.city_uuid` (uuid-first).
//   B — payload passa a ser ANINHADO (`person: {...}`), não mais flat.
//   C — `qtd_issuers` (30º campo) adicionado, `required`, mirror
//       `qtd_farms`/`qtd_users`.
//   D — `role_id` (FK inteira) → `role_uuid` (uuid-first) no PAYLOAD; o
//       CAMPO de formulário continua chamado `role_id` (nome de UI/schema,
//       mirror do próprio nome usado por `city`→`person.city_uuid`) — só a
//       CHAVE do payload mudou.
//
// `country`/`role`/`plan` no `TenantData` (leitura) podem faltar via
// `when()` no backend — NUNCA quebrar o fillForm por isso.

import type { Option } from '@/@types/option';

// ============================================
// ENUMS backed (DA-T04 do contrato de API — Tenant-contrato.md)
// ============================================

/** 1=ACTIVE, 2=DEFAULTING, 3=SUSPENDED, 4=CANCELLED. */
export type TenantStatus = 1 | 2 | 3 | 4;

/** 1=TRIAL, 2=MONTHLY, 3=QUARTERLY, 4=SEMIANNUAL, 5=ANNUAL, 6=BIANNUAL, 99=UNDETERMINED. */
export type TenantSignature = 1 | 2 | 3 | 4 | 5 | 6 | 99;

/** Dia de vencimento — só 5, 10 ou 15 (mirror `Tenant::opDueDays()` legado). */
export type TenantDueDay = 5 | 10 | 15;

// ============================================
// TENANT (resposta da API — leitura, GET /tenants/{uuid})
// ============================================

export interface TenantData {
  uuid: string;
  person: {
    name: string;
    nickname: string;
    nif: string;
    email: string;
    phone: string | null;
    address: string;
    /**
     * uuid-first (Achado A, `GAP-TN-06`/`TASK-TN-05`, ✅). Sempre presente
     * na resposta (chave nunca omitida), mas `null` quando a relação
     * `person.city` não resolve — `fillForm` trata os dois casos sem
     * quebrar.
     */
    city: { uuid: string; title: string } | null;
    zip_code: string | null;
  };
  cellphone: string | null;
  contact: string | null;
  contact_phone: string | null;
  /**
   * Pode faltar via `when()` no backend (relação não carregada ou Tenant
   * sem país resolvido) — NUNCA quebrar o fillForm por isso.
   * uuid-first (Achado A, `GAP-TN-06`/`TASK-TN-05`, ✅) — `codigo` é o
   * código numérico legado (30=Brasil), campo DISTINTO do `id` sequencial
   * (nunca exposto).
   */
  country?: { uuid: string; nome: string; codigo: number };
  /**
   * Pode faltar via `when()` no backend — NUNCA quebrar o fillForm por isso.
   * `description` (`TASK-TN-09` backend, ✅ validado) — rótulo legado do
   * papel (ex. "Rastreabilidade"), distinto do slug interno `name` (ex.
   * "Gestor_Rastro"). Opcional: raro perfil sem `description` preenchida
   * cai no fallback `name` (`TASK-TN-FE-08`, mirror `fillForm`).
   */
  role?: { uuid: string; name: string; description?: string };
  /**
   * Plano ATIVO corrente do Tenant (`TenantDetailResource`, `TASK-TN-04`
   * backend, `GAP-TN-FE-01` RESOLVIDO). Chave AUSENTE (não `null`) quando não
   * há plano ativo — mesmo padrão de `role` acima. `fillForm`
   * (`TASK-TN-FE-04`) mapeia para `plan_uuid: {value: data.plan.uuid, label:
   * data.plan.nome}` quando presente.
   */
  plan?: { uuid: string; nome: string };
  list_all_farms: boolean;
  qtd_farms: number;
  qtd_users: number;
  /** NOVO (Achado C, `GAP-TN-FE-03`, ✅) — 30º campo, mirror `qtd_farms`/`qtd_users`. */
  qtd_issuers: number;
  /**
   * NOVOS (ajuste de homologação, `TASK-TN-12` backend ✅ validado) — 3
   * campos de quantidade fiscal, mirror exato de `qtd_issuers`
   * (`required`, default `10` na criação). `TenantDetailResource` já expõe
   * os 3.
   */
  qtd_nfe: number;
  qtd_cte: number;
  qtd_mdfe: number;
  export_xls: boolean;
  status: { value: TenantStatus; label: string };
  uses_cash_book: boolean;
  use_fiscal: boolean;
  signature: { value: TenantSignature; label: string };
  dt_accession: string; // ISO yyyy-MM-dd
  due_date: string | null; // ISO yyyy-MM-dd — null quando signature=UNDETERMINED
  /** `TenantDetailResource` devolve objeto `{value,label}` — mirror `status`/`signature`, NÃO bare number. */
  due_day: { value: TenantDueDay; label: string };
  value: number;
  generate_financial: boolean;
  generate_ticket: boolean;
  cancellation_reason: string | null;
  /**
   * RESOLVIDO (`GAP-TN-10`/`TASK-TN-08` backend, ✅ CONCLUÍDO/validado) —
   * `TenantDetailResource` agora devolve os centros de custo já vinculados
   * ao Tenant. SEMPRE presente como array (nunca `null`/omitida — `[]`
   * quando não há vínculo). `fillForm` usa `data.centers.map(c => c.uuid)`
   * para pré-marcar os checkboxes vinculados em edição (ver
   * `CreateOrUpdateContratante.tsx::fillForm`).
   */
  centers: { uuid: string; code: string; description: string }[];
}

// ============================================
// LISTAGEM (grid — GET /tenants, `TASK-TN-FE-02`)
// ============================================

export interface TenantListItem {
  uuid: string;
  person: { name: string; nickname: string; nif: string };
  status: { value: TenantStatus; label: string };
  due_date: string | null;
}

// ============================================
// ENVELOPE (ApiResponse::paginated — paginação REAL, mirror
// `DiagnosisPregnanciesListEnvelope`/`RolesListEnvelope`)
// ============================================

export interface TenantsListEnvelope {
  success: boolean;
  message: string;
  data: TenantListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page?: number;
  } | null;
}

// ============================================
// FORM (React Hook Form) — Selects sempre `Option<T>` (`TASK-TN-FE-03/04/05`)
// ============================================

export interface TenantForm {
  /**
   * Payload: `country_uuid` (Achado A, ✅) — `value` é uuid, não FK
   * inteira. `codigo` (código IBGE, 1058=Brasil — `BRAZIL_COUNTRY_CODE`,
   * DISTINTO do `id` sequencial 30, nunca exposto) carregado pelo `mapOptions` do
   * `SelectAsyncPaginate` (`CountryOptionResource` expõe `{uuid,nome,
   * codigo}`) — usado por `nif`/`zip_code` para decidir a máscara BR×
   * genérica (Gate 3).
   */
  country: (Option<string> & { codigo?: number }) | null;
  nif: string;
  nickname: string;
  name: string;
  email: string;
  phone: string;
  cellphone: string;
  /**
   * Nome de CAMPO mantido `role_id` (UI/schema/i18n) — só a CHAVE do
   * payload mudou para `role_uuid` (Achado D, ✅). `value` é uuid
   * (`role-service.ts` nunca expõe FK inteira).
   */
  role_id: Option<string> | null;
  /**
   * Obrigatório no CREATE; no EDIT vem pré-preenchido pelo `fillForm` a
   * partir de `data.plan` (`GAP-TN-FE-01` RESOLVIDO) — ver `tenantSchema`
   * (`isEditing`).
   */
  plan_uuid: Option<string> | null;
  list_all_farms: Option<boolean> | null;
  qtd_farms: number | null;
  qtd_users: number | null;
  /** NOVO (Achado C, ✅) — 30º campo, mirror `qtd_farms`/`qtd_users`. */
  qtd_issuers: number | null;
  /**
   * NOVOS (ajuste de homologação, `TASK-TN-12` backend ✅ validado) — mirror
   * exato de `qtd_issuers`, default `10` na criação (ver `defaultValues`).
   */
  qtd_nfe: number | null;
  qtd_cte: number | null;
  qtd_mdfe: number | null;
  export_xls: Option<boolean> | null;
  zip_code: string;
  address: string;
  /** Payload: `person.city_uuid` (Achado A/B, ✅). */
  city: Option<string> | null;
  contact: string;
  contact_phone: string;
  status: Option<TenantStatus> | null;
  uses_cash_book: Option<boolean> | null;
  use_fiscal: Option<boolean> | null;
  signature: Option<TenantSignature> | null;
  dt_accession: string | null;
  due_date: string | null;
  due_day: Option<TenantDueDay> | null;
  value: number | null;
  generate_financial: Option<boolean> | null;
  generate_ticket: Option<boolean> | null;
  cancellation_reason: string;
  /**
   * `TenantDetailResource` não expõe os centros já vinculados (ver nota em
   * `TenantData.centers`) — em EDIÇÃO a lista SEMPRE inicia vazia
   * (`[]`, estado honesto, nunca fabricado) e só é reenviada no payload se
   * o usuário efetivamente tocar neste campo nesta sessão (`dirtyFields`,
   * mirror `plan_uuid` — omitir a chave preserva os vínculos atuais no
   * backend, confirmado em `StoreTenantAction`/`UpdateTenantAction`: "se
   * centers presente no payload"). Em CRIAÇÃO, obrigatório (`min(1)`).
   */
  centers: string[];
}

// ============================================
// PAYLOAD (escrita — POST/PUT /tenants, `TenantRequest::rules()`, contrato §4)
// ============================================

/** Bloco aninhado `person.*` (Achado B, ✅) — nomes idênticos ao `TenantRequest` real. */
export interface TenantPersonPayload {
  name: string;
  nickname: string;
  nif: string;
  email: string;
  /** uuid-first (Achado A, ✅) — nunca `city_id`. */
  city_uuid: string;
  phone?: string | null;
  address: string;
  zip_code?: string;
}

export interface TenantPayload {
  person: TenantPersonPayload;
  /** uuid-first (Achado A, ✅) — nunca `country_id`. RAIZ, fora de `person`. */
  country_uuid: string;
  cellphone: string | null;
  contact: string | null;
  contact_phone: string | null;
  /**
   * uuid-first (Achado D, ✅) — nunca `role_id` inteiro. Campo de FORM
   * chama-se `role_id` (ver `TenantForm`); só a CHAVE do payload é
   * `role_uuid`, mirror exato de `city`→`person.city_uuid`.
   */
  role_uuid: string;
  /**
   * OPCIONAL (backend `sometimes`, ambos POST/PUT, Gate 2 RESOLVIDO) —
   * omitir a chave quando o usuário não alterou o plano nesta sessão de
   * edição (preserva o plano atual, mirror `if ($planUuid !== null)` do
   * backend).
   */
  plan_uuid?: string;
  list_all_farms?: boolean;
  qtd_farms: number;
  qtd_users: number;
  /** NOVO (Achado C, ✅) — 30º campo, `required|integer|min:1` no backend. */
  qtd_issuers: number;
  /**
   * NOVOS (ajuste de homologação, `TASK-TN-12` backend ✅ validado) — mirror
   * exato de `qtd_issuers`, sempre enviados (obrigatórios, `TenantRequest`
   * exige `required|integer|min:1`).
   */
  qtd_nfe: number;
  qtd_cte: number;
  qtd_mdfe: number;
  export_xls: boolean;
  status: TenantStatus;
  uses_cash_book?: boolean;
  use_fiscal: boolean;
  signature: TenantSignature;
  dt_accession: string;
  due_date: string | null;
  due_day: TenantDueDay;
  value: number;
  generate_financial: boolean;
  generate_ticket: boolean;
  cancellation_reason?: string | null;
  /**
   * OPCIONAL (backend `nullable`/`sometimes` na prática — "se centers
   * presente no payload" dispara `SyncTenantCentersAction`, confirmado em
   * `StoreTenantAction`/`UpdateTenantAction`) — omitir a chave preserva os
   * vínculos atuais. Ver nota em `TenantForm.centers` sobre por que o
   * front trata esta chave como condicional (`dirtyFields`), mirror
   * `plan_uuid`, e não sempre-presente.
   */
  centers?: string[];
}

/**
 * TASK-072-FE-03 — recorte de `formState.dirtyFields` que decide chaves
 * OPCIONAIS do payload (`plan_uuid`/`centers` só entram quando tocados nesta
 * sessão). Consumido por `buildTenantPayload` (função pura).
 */
export interface TenantPayloadDirtyFields {
  plan_uuid?: unknown;
  centers?: unknown;
}

/** Título + descrição de um toast do autofill por CEP (i18n do módulo). */
export interface CepAutofillToastMessage {
  title: string;
  description: string;
}

/** TASK-072-FE-04 (I4) — mensagens i18n do autofill por CEP. */
export interface CepAutofillMessages {
  invalidFormat: CepAutofillToastMessage;
  notFound: CepAutofillToastMessage;
  cityNotResolved: CepAutofillToastMessage;
  networkError: CepAutofillToastMessage;
}

/** TASK-072-FE-04 (I4) — callbacks do `autofillByCep` (quem grava no form é a tela). */
export interface CepAutofillHandlers {
  /** Endereço: `street` = logradouro; `district` = bairro (o form de tenant usa só `street`). */
  onAddress: (street: string, district: string) => void;
  /** Cidade resolvida pelo código IBGE (`GET /cities?iso=`). */
  onCity: (option: Option<string>) => void;
  messages: CepAutofillMessages;
}

/**
 * TASK-072-FE-06 (I9) — modo do formulário de Contratante, derivado de rota +
 * permissões por `resolveTenantFormMode`. `denied` = sem permissão para o modo
 * pedido (a rota já barra; defesa em profundidade).
 */
export type TenantFormMode = 'create' | 'edit' | 'view' | 'denied';

// ============================================
// FILTRO (drawer da listagem) — TASK-072-FE-07 (I10, API v1.2 `TenantIndexRequest`)
// ============================================

/** Mês de vencimento (`due_month`, 1–12 — equivalente ao `due_date2` do legado). */
export type TenantDueMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/**
 * Filtro APLICADO (persistido pelo `userPaginatedQuery`) — valores CRUS, na
 * forma aceita pelo `GET /tenants`. Datas sempre `yyyy-MM-dd`.
 *
 * `role_label`/`plan_label` são SÓ de apresentação: guardam o rótulo das
 * opções assíncronas para a re-hidratação do drawer mostrar o nome (e não o
 * uuid). Nunca vão para a API — `toTenantListParams` envia só as chaves do
 * contrato.
 */
export interface TenantsFilterForm {
  /** Nome, razão social ou CPF/CNPJ (com ou sem máscara). */
  search?: string;
  status?: TenantStatus;
  signature?: TenantSignature;
  due_month?: TenantDueMonth;
  dt_accession?: string;
  due_day?: TenantDueDay;
  /** Data de criação — início (inclusivo). */
  start_date?: string;
  /** Data de criação — fim (inclusivo, `>= start_date`). */
  end_date?: string;
  role_uuid?: string;
  plan_uuid?: string;
  role_label?: string;
  plan_label?: string;
}

/** Chaves do filtro que o `GET /tenants` aceita (sem os rótulos de apresentação). */
export type TenantListFilterParams = Omit<TenantsFilterForm, 'role_label' | 'plan_label'>;

/** Forma INTERNA do form do drawer — Selects em `Option<T>`, datas nullable. */
export interface TenantsFilterFormInternal {
  search: string;
  status: Option<TenantStatus> | null;
  signature: Option<TenantSignature> | null;
  due_month: Option<TenantDueMonth> | null;
  due_day: Option<TenantDueDay> | null;
  dt_accession: string | null;
  start_date: string | null;
  end_date: string | null;
  role_uuid: Option<string> | null;
  plan_uuid: Option<string> | null;
}
