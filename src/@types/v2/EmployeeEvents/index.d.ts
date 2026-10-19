// src/@types/v2/EmployeeEvents/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Funcionário X Eventos" (EmployeeEvent — Administrativo /
// Gestão Pessoal). Shape tirado DIRETAMENTE da fonte (TASK-FE-FXE-01 Roteiro
// passo 1/2, api_root):
//   app/Http/Resources/V1/EmployeeEventResource.php (listagem/detalhe)
//   app/Http/Resources/V1/EmployeeEventImportResultResource.php (import)
//   app/Actions/EmployeeEvent/SyncEmployeeEventsAction.php (retorno do sync)
//   app/Http/Requests/Api/V1/EmployeeEventSyncRequest.php (payload do sync)
// (FuncionarioXEventos-contrato.md §4.3/§3.4, contrato de tela §2/§3).
//
// DA-EE-FE-01 (INVIOLÁVEL): 2 telas — Tela 1 picker de Funcionários (reaproveita
// `EmployeeListItem`/`EmployeeFilterForm` de `@/@types/v2/CadastrosBase/employee`,
// ZERO tipo novo para a listagem), Tela 2 Matriz de Vínculos por Funcionário
// (`sync`, único endpoint de escrita da SPA — SEM CRUD unitário isolado).
//
// `EmployeeEventFilterRequest`/`SyncEmployeeEventItem`/`SyncEmployeeEventsRequest`
// são usados só pela TASK-FE-FXE-02 (Matriz), mas declarados aqui junto do
// resto do módulo (mesmo arquivo/diretório, instrução explícita da Tarefa 06).
// -----------------------------------------------------------------------------

// ============================================
// Referência achatada de Funcionário/Evento dentro do vínculo (mirror
// `EmployeeEventResource::toArray()` — `employee{uuid,name}`/`event{uuid,name}`)
// ============================================

export interface EmployeeEventEmployeeRef {
  uuid: string;
  name: string | null;
}

export interface EmployeeEventEventRef {
  uuid: string;
  name: string | null;
}

// ============================================
// EMPLOYEE EVENT — LISTAGEM/DETALHE (mirror `EmployeeEventResource`) — nunca
// `id`/`employee_id`/`event_id`/`farm_id` internos.
// ============================================

export interface EmployeeEventListItem {
  uuid: string;
  employee: EmployeeEventEmployeeRef;
  event: EmployeeEventEventRef;
  value: number;
  /** Valor bruto do enum `App\Enums\EventMethod` (GAP-BE-04 Opção A — reaproveitado, mesmo enum de `Event.method`). */
  method: number;
  /** Rótulo pronto do backend (`EventMethod::description()`) — usado pela grid/exibição, nunca pela fábrica de opções do formulário (que usa `eventMethodOptions`, reuso de Eventos). */
  method_label: string;
  is_enabled: boolean;
  created_at: string;
}

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated) — mirror `EventsListEnvelope`
// ============================================

export interface EmployeeEventsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface EmployeeEventsListEnvelope {
  success: boolean;
  message: string;
  data: EmployeeEventListItem[];
  errors: Record<string, string[]> | null;
  meta: EmployeeEventsApiPaginationMeta | null;
}

// ============================================
// FILTRO (`GET /employee-events`, contrato de API §3.1 `EmployeeEventFilterData`)
// — consumido só pela Tela 2 (Matriz), que filtra por `employee_uuid`. Sem
// filtro de UI dedicado na Tela 1 (picker de Funcionários, não de vínculos).
// ============================================

export interface EmployeeEventFilterRequest {
  employee_uuid?: string;
  event_uuid?: string;
  is_enabled?: boolean;
}

// ============================================
// SYNC (`PUT /employee-events/sync`, contrato de API §3.2 `EmployeeEventSyncRequest`
// — único endpoint de escrita da SPA, DA-EE-FE-01). Payload SEMPRE completo —
// o array `items` reflete o `useFieldArray` inteiro no momento do submit.
//
// [CORREÇÃO PÓS-ENTREGA, 2026-08-12 — TASK-FE-FXE-02 v2.0] `uuid` (campo
// aditivo, opcional) — mirror `EmployeeEventSyncItemData::$uuid` do backend.
// Presente = a linha já existe (identificada pelo `uuid` FÍSICO da linha,
// `EmployeeEventListItem.uuid`) e o backend mantém/atualiza; ausente = linha
// nova adicionada nesta sessão via "Adicionar novo" e o backend cria. GAP-BE-06
// revertido — a identidade de uma linha nunca foi (e agora explicitamente não
// é) a tupla `employee_uuid+event_uuid+farm`; ocorrências múltiplas do mesmo
// Evento para o mesmo Funcionário/Fazenda são legítimas e distinguidas só
// pelo `uuid` da linha.
// ============================================

export interface SyncEmployeeEventItem {
  uuid?: string;
  event_uuid: string;
  value: number;
  /** Valor numérico do enum `EventMethod` — `Select` do form trabalha com `Option<string>`, convertido para `number` só no submit (contrato de tela §3). */
  method: number;
  is_enabled: boolean;
}

export interface SyncEmployeeEventsRequest {
  employee_uuid: string;
  items: SyncEmployeeEventItem[];
}

// Retorno de `sync` — mirror `SyncEmployeeEventsAction::handle()` (`array{created,updated,deleted}`),
// devolvido cru dentro do envelope `ApiResponse::success()` (contrato de API §4.3).
export interface SyncEmployeeEventsResult {
  created: number;
  updated: number;
  deleted: number;
}

// ============================================
// IMPORT EXCEL (`POST /employee-events/import`) — shape CONFIRMADO por leitura
// direta (TASK-FE-FXE-01 Roteiro passo 1): `EmployeeEventImportResultResource`
// (api_root), mirror `EmployeeEventImportResultData` — DIVERGE de
// `StockCorrectionImportResult` (que só tem `code`/`rows_processed`): aqui a
// importação pode tocar vínculos de VÁRIOS funcionários numa planilha só,
// agrupados internamente por `employee_id` antes do `syncForEmployee()` — por
// isso `employees_processed` (nº de funcionários distintos na planilha) +
// `rows_processed` (nº total de linhas resolvidas) + os 3 contadores agregados
// de `created`/`updated`/`deleted` (soma de todos os `syncForEmployee()` da
// transação). SEM `code` (este import não gera um "código" de operação,
// diferente de Correção de Estoque).
// ============================================

export interface EmployeeEventImportResult {
  employees_processed: number;
  rows_processed: number;
  created: number;
  updated: number;
  deleted: number;
}
