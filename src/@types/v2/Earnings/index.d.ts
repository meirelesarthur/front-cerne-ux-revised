// src/@types/v2/Earnings/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo "Apuração Mensal" (Earning — Administrativo, 97-Esteiras/002,
// Tarefas 07/08/09). Mirror estrutural de `@/@types/v2/Requisitions`, cruzado
// com leitura DIRETA de `EarningController.php`/`EarningRequest.php`/
// `EarningResource.php`/`EarningFilterData.php`/`UpsertEarningData.php`/
// `EarningEventData.php`/`EarningImportResultResource.php`/
// `EarningExpenseRequest.php` (`GB.Cerne.Api-apuracao-mensal`, código real já
// ✅ CONCLUÍDO e testado pelo Tester de API).
//
// Contrato (envelope ApiResponse): { success, message, data, errors, meta }.
//   GET    /api/v1/earnings                    → data: EarningListItem[], meta
//                                                  paginação REAL (filtros
//                                                  employee_uuid/function_uuid/
//                                                  month/year, uuid exato — SEM
//                                                  busca textual) — só apurações
//                                                  JÁ LANÇADAS (`GAP-EARNING-FE-02`)
//   GET    /api/v1/earnings/{employee_uuid}     → data: EarningDetail — 404 se
//                                                  não existir apuração para o
//                                                  período (esperado, não é erro
//                                                  de tela — ver Armadilha 1 da
//                                                  Tarefa 07/08)
//   PUT    /api/v1/earnings/{employee_uuid}     → payload EarningUpsertPayload
//                                                  (upsert único, sem POST
//                                                  separado) → data: EarningDetail
//   DELETE /api/v1/earnings/{employee_uuid}     → 204, sem body
//   GET    /api/v1/earnings/download            → binário (.xlsx modelo)
//   POST   /api/v1/earnings/import              → multipart → data: EarningImportResult
//   POST   /api/v1/earnings/expenses            → payload {earning_uuids} →
//                                                  data: EarningExpenseResult[]
//
// `total`/`vl_account`/`vl_cheque` vêm como STRING no JSON (`decimal:2` cast
// no Model) — conversão explícita (`Number(...)`) antes de qualquer
// cálculo/formatação (Armadilha 4 da Tarefa 07).
//
// `type` vem como objeto `{ value, description }` no Resource — CONFIRMADO por
// leitura direta de `EarningResource::toArray()` (NÃO `{value,label}` como o
// task-packet sugeria; `description` é o campo real retornado pelo backend).
//
// `events[]`/`advances_period` podem estar AUSENTES da resposta (não são
// `[]`) — checar presença da chave antes de renderizar (Armadilha 7 da
// Tarefa 08). `events[]` É retornado tanto no índice quanto no detalhe
// (`EarningRepository::WITH` eager-carrega `events` em ambos os métodos).
//
// Nenhum `id` sequencial em nenhum tipo — sempre `uuid` (Lei 10).
//
// F-105 (UT-000731, branch irmã já aprovada da API) — `GET /api/v1/earnings`
// deixou de listar SÓ apurações já lançadas e passou a listar o ROSTER de
// funcionários elegíveis por vínculo em Funcionário x Eventos (reverte
// `GAP-EARNING-FE-02`). Cada linha agora vem em 2 formas, discriminadas por
// `is_pay === null` (e `uuid === null`):
//   - APURADO:   `uuid` setado, `is_pay` bool, `total`/`vl_account`/
//     `vl_cheque` preenchidos (string decimal), `events:[...]`.
//   - A APURAR:  `uuid:null`, `is_pay:null`, `total:null`/`vl_account:null`/
//     `vl_cheque:null`, `events:[]`, `employee`/`function`/`month`/`year`/
//     `type` do PERÍODO DO FILTRO (sempre presentes nas duas formas).
// `created_at` idem (só existe quando a apuração foi de fato lançada).
// `EarningDetail = EarningListItem` continua o alias — a tela de Detalhe
// (`GET /earnings/{employee_uuid}`) só é alcançável a partir de uma linha
// JÁ APURADA (ver `index.tsx`), então na prática `item.uuid`/`is_pay` nunca
// chegam `null` ali, mas o tipo compartilhado precisa tolerar os dois casos.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// REFS ANINHADAS (shape 1:1 com EarningResource.php, lido no código real)
// ============================================

export interface EarningEmployeeRef {
  uuid: string;
  name: string | null;
}

export interface EarningFunctionRef {
  uuid: string;
  name: string;
}

export interface EarningCostCenterRef {
  uuid: string;
  description: string;
}

export interface EarningTeamRef {
  uuid: string;
  name: string;
}

export interface EarningProprietaryRef {
  uuid: string;
  name: string | null;
}

/** Mirror `App\Enums\EarningType` (backend, backed `string`: N/A/D). */
export type EarningTypeValue = 'N' | 'A' | 'D';

/** `type` do `EarningResource` — `description` é o campo REAL (não `label`). */
export interface EarningTypeRef {
  value: EarningTypeValue;
  description: string;
}

/** Mirror `App\Enums\EventMethod` — `0` = Fixo/readonly, `1` = Informado/editável. */
export type EventMethodValue = 0 | 1;

export interface EventMethodRef {
  value: EventMethodValue;
  description: string | null;
}

/** 1 linha de `events[]` — mirror `EarningResource::eventRow()`. */
export interface EarningEventRow {
  uuid: string;
  name: string;
  /** STRING (`decimal`) — `Number(...)` antes de qualquer cálculo. */
  value: string;
  method: EventMethodRef;
}

/** 1 item de `advances_period[]` — bloco informativo READ-ONLY, nunca editável. */
export interface EarningAdvancePeriodItem {
  uuid: string;
  date: string;
  /** STRING (`decimal`) — `Number(...)` antes de exibir. */
  amount: string;
}

// ============================================
// EARNING LIST ITEM (resposta de `GET /api/v1/earnings`) — mesmo shape do
// detalhe (`EarningResource` único, sem Resource dedicado de índice).
// ============================================

export interface EarningListItem {
  /** `null` = linha "A apurar" (roster, sem earning lançado — F-105). */
  uuid: string | null;
  month: number;
  year: number;
  type: EarningTypeRef;
  /**
   * STRING (`decimal:2`) — `Number(...)` antes de somar/formatar. `null` na
   * linha "A apurar" (F-105) — NÃO tratar como `0`/"R$ 0,00" na exibição.
   */
  total: string | null;
  vl_account: string | null;
  vl_cheque: string | null;
  /** Discriminador do roster (F-105): `null` = "A apurar" (ainda sem earning). */
  is_pay: boolean | null;
  employee: EarningEmployeeRef | null;
  function: EarningFunctionRef | null;
  cost_center: EarningCostCenterRef | null;
  team: EarningTeamRef | null;
  proprietary: EarningProprietaryRef | null;
  /** Sempre presente (`[]` na linha "A apurar" — nunca ausente, F-105). */
  events?: EarningEventRow[];
  advances_period?: EarningAdvancePeriodItem[];
  /** `null`/ausente na linha "A apurar" (earning nunca foi criado). */
  created_at?: string | null;
  updated_at?: string;
}

// ============================================
// EARNING DETAIL (resposta de `GET /api/v1/earnings/{employee_uuid}`) —
// mesmo shape de `EarningListItem` (Resource único) — mantido como alias
// nomeado para expressar intenção nas telas de detalhe/formulário.
// ============================================

export type EarningDetail = EarningListItem;

// ============================================
// ENVELOPE PAGINADO (ApiResponse::paginated — GET /api/v1/earnings)
// ============================================

export interface EarningsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
}

export interface EarningsListEnvelope {
  success: boolean;
  message: string;
  data: EarningListItem[];
  errors: Record<string, string[]> | null;
  meta: EarningsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem, Tarefa 07 — Contrato B). Mirror
// `EarningFilterData` (employee_uuid EXATO via combobox — SEM busca textual
// direta contra `/earnings`, `GAP-EARNING-FE-02`).
// ============================================

export interface EarningFilterForm {
  employee_uuid?: Option | null;
  function_uuid?: Option | null;
  year?: string;
  month?: Option<number> | null;
  type?: Option<EarningTypeValue> | null;
}

/** Querystring real de `GET /api/v1/earnings`. */
export interface EarningFilterRequest {
  employee_uuid?: string;
  function_uuid?: string;
  month?: number;
  year?: number;
  /**
   * UT-000716 item 9 (complemento) — decisão do dono: filtro de Tipo passa
   * a ser REAL; a API ganha `?type=` em paralelo (`EarningFilterData.php`).
   */
  type?: EarningTypeValue;
}

// ============================================
// UPSERT (Tarefa 08) — `PUT /api/v1/earnings/{employee_uuid}`, mirror
// `UpsertEarningData`/`EarningEventData`. `farm_id` NUNCA aparece (R4).
// ============================================

/** 1 linha de evento no PAYLOAD de escrita — mirror `EarningEventData`. */
export interface EarningEventPayload {
  event_uuid: string;
  value: number;
  method: EventMethodValue;
}

export interface EarningUpsertPayload {
  employee_uuid: string;
  function_uuid: string;
  month: number;
  year: number;
  type: EarningTypeValue;
  total: number;
  vl_account: number;
  events: EarningEventPayload[];
  center_uuid?: string | null;
  team_uuid?: string | null;
  proprietary_uuid?: string | null;
}

/**
 * 1 linha do editor de eventos (`EventoApuracaoEditor.tsx`, Tarefa 08) —
 * shape de FORMULÁRIO (RHF `useFieldArray`), distinto do payload de wire.
 * `condition`/`conditionLabel`/`method` são derivados do evento selecionado
 * no catálogo (`GAP-EARNING-FE-04`: `listEvents`/`GET /events`, NÃO
 * `/events/options` — o lookup enxuto não expõe `condition`, necessário
 * para o cálculo client-side de `total`, CV-01/CV-02) — `method` readonly
 * após a seleção, `value` só é editável quando `method === 1` (Informado).
 * `condition` (0=Diminui/1=Soma, `App\Enums\EventCondition`) governa o
 * SINAL da linha na soma de `total` — NUNCA persistido no payload (só
 * `event_uuid`/`value`/`method` vão no wire).
 */
export interface EarningEventFormRow {
  event: Option | null;
  event_uuid: string;
  value: number | null;
  method: EventMethodValue | null;
  /** `EventCondition` (0=Diminui/1=Soma) — client-only, governa o sinal na soma de `total`. */
  condition: 0 | 1 | null;
  conditionLabel: string;
  /**
   * UT-000716 item 10 — client-only, NUNCA vai no payload. `true` para
   * linhas HIDRATADAS a partir da apuração já persistida (`fillForm`,
   * `CreateOrUpdateEarning.tsx`) — mirror legado: linha pré-existente é
   * 100% readonly (evento + valor), só linhas adicionadas manualmente
   * nesta sessão (`EventoApuracaoEditor.tsx::handleAdd`, nascem `false`)
   * permanecem totalmente editáveis.
   */
  isPersisted?: boolean;
}

/** Formulário de upsert (Tarefa 08) — RHF `useForm<EarningUpsertForm>`. */
export interface EarningUpsertForm {
  employee_uuid: string;
  function_uuid: Option | null;
  month: number;
  year: number;
  type: EarningTypeValue;
  total: number;
  /**
   * UT-000742 — `null` só no ramo "apuração nova" (`fillForm(null)`,
   * `CreateOrUpdateEarning.tsx`): o campo nasce EM BRANCO, mirror legado
   * (`earnings/edit.blade.php` nunca pré-preenche "Vl. Conta" quando ainda
   * não há apuração). `MoneyInput` já aceita `number | null` (exibe vazio);
   * cálculos (`computedVlCheque`/payload) já usam `Number(...) || 0`.
   */
  vl_account: number | null;
  vl_cheque: number;
  events: EarningEventFormRow[];
  center_uuid: Option | null;
  team_uuid: Option | null;
  proprietary_uuid: Option | null;
}

// ============================================
// IMPORTAÇÃO DE PLANILHA (Tarefa 09) — mirror `EarningImportResultResource`.
// ============================================

export interface EarningImportResult {
  employees_processed: number;
  rows_processed: number;
}

/** Payload de campos GLOBAIS do lote (`ImportEarningRequest`) — aplicados a
 *  TODAS as linhas da planilha, não por linha. */
export interface EarningImportBatchFields {
  month: number;
  year: number;
  type?: EarningTypeValue;
  center_uuid?: string;
  team_uuid?: string;
  proprietary_uuid?: string;
}

// ============================================
// "GERAR FINANCEIRO" (Tarefa 09) — `POST /api/v1/earnings/expenses`, mirror
// `EarningExpenseRequest`/`EarningExpenseResource`.
// ============================================

export interface EarningExpenseResult {
  uuid: string;
  [key: string]: unknown;
}
