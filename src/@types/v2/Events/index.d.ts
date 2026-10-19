// src/@types/v2/Events/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do catálogo de EVENTOS (Event — rubrica de folha, Administrativo /
// Gestão Pessoal). Fonte: `Eventos-contrato.md` (v1.0, APROVADO) §3/§4 +
// leitura direta de `app/Http/Resources/V1/EventResource.php` (api_root,
// branch `feature/refactor-events-for-api`) — o Resource JÁ expõe
// `type_label`/`method_label`/`condition_label` prontos (confirmado por
// leitura direta), por isso `EventListItem` os inclui e a grid (TASK-FE-EVT-01)
// consome-os DIRETO, sem depender das fábricas de opções abaixo para exibição
// (mirror `CostCenterListItem.class_label`). As fábricas de opções
// (`@/constants/GestaoPessoal/Event/options/*`) continuam existindo — são
// consumidas pelos `Select` do formulário (TASK-FE-EVT-02), que precisam da
// LISTA de opções, não só do rótulo do valor atual.
//
// TASK-FE-EVT-01 cobre `EventListItem`/`EventsListEnvelope`/`EventFilterForm`/
// `EventInUseError`. TASK-FE-EVT-02 ACRESCENTA `EventDetail`/`EventForm`/
// `CreateEventRequest`/`UpdateEventRequest`/`EventPayload` (mirror do
// comentário de cabeçalho de `parameterWeights/index.d.ts` sobre TASK-PW-FE-02).
// -----------------------------------------------------------------------------

// ============================================
// LISTAGEM (grid)
// ============================================

export interface EventListItem {
  uuid: string;
  name: string;
  /** Enum `EventPeriodicity` (1=Semanal, 2=Mensal, 3=Anual, 4=Quinzenal, 5=Trimestral, 6=Semestral). */
  type: number;
  /** Rótulo humano já resolvido pelo backend (`EventResource::toArray`). */
  type_label: string;
  /** Enum `EventMethod` (0=Fixo, 1=Informado). */
  method: number;
  method_label: string;
  /** Enum `EventCondition` (0=Diminui, 1=Soma) — GAP-BE-01 Opção B, sempre presente, nunca `null`. */
  condition: number;
  condition_label: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// `EventResource` devolve o mesmo shape em `show`/`store`/`update` que em
// `index` — `EventDetail` é um alias estrutural de `EventListItem`, mantido
// como tipo próprio por clareza semântica no formulário (TASK-FE-EVT-02,
// mirror `FunctionDetail`).
export type EventDetail = EventListItem;

// ============================================
// FILTRO (drawer da listagem, TASK-FE-EVT-01)
// ============================================

export interface EventFilterForm {
  /** Busca por `name` (ILIKE). */
  search?: string;
  is_enabled?: 'true' | 'false';
  /** Filtro por `created_at` ("Data de cadastro"), NÃO período/vigência do próprio Evento — contrato de tela §2. */
  start_date?: string;
  end_date?: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated)
// ============================================

export interface EventsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface EventsListEnvelope {
  success: boolean;
  message: string;
  data: EventListItem[];
  errors: Record<string, string[]> | null;
  meta: EventsApiPaginationMeta | null;
}

// ============================================
// LOOKUP ENXUTO (`GET /events/options`, Eventos-contrato.md §4.3) —
// CORRECAO-R2 (Execução 037, REG-1). `EventOptionResource` devolve só
// `uuid`+`name`+`is_enabled` (leitura direta de
// `app/Http/Resources/V1/EventOptionResource.php`, api_root) — SEM
// paginação real (a `ListEventOptionsAction` devolve a Collection completa
// filtrada por `search`/`only_enabled`, sem `page`/`per_page`). `meta`
// sempre `null` nesta rota; o adaptador do service (`listEventOptions`)
// finge uma única página para o contrato `ResponsePagination` exigido pelo
// `SelectAsyncPaginate`. NUNCA usar `listEvents`/`EventListItem` (CRUD
// completo, farm-scoped, `GET /events`) neste select — mirror
// `listCostCenterOptions`/`CostCenterRef`.
// ============================================

export interface EventOption {
  uuid: string;
  name: string;
  is_enabled: boolean;
}

export interface EventOptionsListEnvelope {
  success: boolean;
  message: string;
  data: EventOption[];
  errors: Record<string, string[]> | null;
  meta: EventsApiPaginationMeta | null;
}

// ============================================
// EXCLUSÃO BLOQUEADA (422 `errors.in_use`) — fan-in de 5 tabelas, a maior do
// projeto até aqui (mirror `FunctionInUseError`, mapa `Record<string, number>`).
// ============================================

export interface EventInUseError {
  errors: { in_use: Record<string, number> };
}

// ============================================
// FORMULÁRIO create/edit (TASK-FE-EVT-02)
// ============================================

// Forma INTERNA do form RHF — os 3 enums como STRING (formato consumido pelo
// `Select`/`Controller`, mirror `CostCenterForm.condition`); convertidos para
// `number` só no `tryPersistEvento` (TASK-FE-EVT-02, `CreateOrUpdateEvento.tsx`).
export interface EventForm {
  name: string;
  type: string;
  method: string;
  condition: string;
  is_enabled: boolean;
}

// Payload real enviado à API — FULL-RESOURCE-REPLACE (`EventRequest`
// unificado exige todos os campos `required` em ambos os verbos, contrato de
// API §3.2 — sem `sometimes`, nunca um delta de `dirtyFields`, mirror
// `CreateFunctionRequest`).
export interface CreateEventRequest {
  name: string;
  type: number;
  method: number;
  condition: number;
  is_enabled: boolean;
}

// Mesmo shape do create — full-resource-replace (`EventRequest` unificado
// store+update).
export type UpdateEventRequest = CreateEventRequest;

// Alias genérico usado pelo service/tela quando o verbo (create/update) ainda
// não foi decidido — mesmo shape dos dois acima.
export type EventPayload = CreateEventRequest;

// ============================================
// OPTIONS (lookup enxuto — `GET /events/options`, TASK-12-registro-faltas)
// Mirror EXATO de `FunctionOption`/`FunctionOptionsListEnvelope`
// (`@/@types/v2/Functions`) — o endpoint devolve uma `Collection` PHP SEM
// paginação real (`EventOptionResource::collection`), consumido pelo
// adaptador `listEventOptions` (`event-service.ts`) que simula página única
// para casar com `ResponsePagination` exigido pelo `SelectAsyncPaginate`.
// Compartilhável por qualquer módulo que precise do mesmo lookup (Bonus/
// Advance/Earning/EmployeeEvent/Absence) — NÃO duplicar.
// ============================================

export interface EventOption {
  uuid: string;
  name: string;
  is_enabled: boolean;
}

export interface EventOptionsListEnvelope {
  success: boolean;
  message: string;
  data: EventOption[];
}
