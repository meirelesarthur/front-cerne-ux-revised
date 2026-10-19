// src/@types/v2/Marcacao/marking/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de MARCAÇÃO (Marking — Operacional > Agricultura > Manejo,
// TASK-MC-FE-01, esteira 97-Esteiras/044).
//
// Fonte: leitura DIRETA do fork `GB.Cerne.Api` (TASK-MC-01/02/03, já
// materializadas nesta sessão) — `app/Http/Resources/V1/MarkingResource.php`,
// `app/Http/Requests/Api/V1/{MarkingRequest,MarkingForecastRequest,
// MarkingDoneRequest}.php`, `app/Data/{MarkingData,MarkingFilterData,
// MarkingForecastLineData,MarkingDoneLineData}.php`,
// `app/Enums/{MarkingStatusEnum,MarkingColorEnum,MarkingDoneStatusEnum}.php`
// — NÃO é inferência do `ARCHITECTURE-MARCACAO-FE.md` (o roteiro assumiu
// alguns nomes de campo que o código real corrige, ver notas abaixo).
//
// `uuid` sempre, `id` NUNCA aparece no envelope.
//
// Correções confirmadas contra o código real da API (divergem do roteiro
// front, que foi escrito antes da API materializar — TASK-MC-FE-02 já previa
// essa reconciliação como "confirmação de contrato, não decisão nova"):
//   - `MarkingResource` usa `area.name`/`harvest.name`/`variety.name`/
//     `employee.name`/`user.name` (NÃO `.description`) e `cost_center`
//     (NÃO `center`) — mirror exato de `PastureResource`/`WeaningResource`.
//   - `farm` é exposto no Resource (não estava no roteiro).
//   - `week_vintage` traz o objeto completo (`number_week`/`start_date`/
//     `end_date`/`color`), não só `uuid`+`number_week`.
//   - NENHUM `forecast_date` no `MarkingResource` — o roteiro assumia uma
//     coluna "data prevista" na listagem (LST-11), mas forecasts/dones são
//     DELIBERADAMENTE não expostos neste Resource (docblock real: "subca-
//     dastros completos são TASK-MC-02, fora desta Tarefa"). SEM MOCK: o
//     campo não existe aqui — a coluna foi omitida da listagem
//     (TASK-MC-FE-03) em vez de fabricar o dado.
//   - `MarkingFilterData` real usa `harvest_uuid` (NÃO `farm_uuid` — o
//     filtro por fazenda foi DELIBERADAMENTE não reintroduzido,
//     `GAP-MC-02`/`DEC-070`, isolamento de tenant por construção via
//     `X-Farm-Id` único por requisição). 9 filtros reais: `area_uuid`,
//     `harvest_uuid`, `variety_uuid`, `user_uuid`, `status`, `color`,
//     `start_date`, `end_date`, `week`.
//   - `MarkingRequest::rules()` real exige TODOS os campos (exceto
//     `employee_uuid`/`center_uuid`) também no update — SEM PATCH parcial
//     por `dirtyFields` (mirror `UpdateMarkingAction::handle()`:
//     `fill($inputs)->save()` com o payload INTEIRO). `CreateMarkingRequest`
//     e `UpdateMarkingRequest` são o MESMO shape.
//   - `week_vintage_uuid` é populado pela cascata real
//     `GET /harvests/{uuid}/weeks/current?date=` (`getHarvestCurrentWeek`,
//     já existente em `@/services/v2/Harvests/harvest-service.ts`) — NÃO um
//     endpoint `GET /harvest-week` dedicado a Marcação (esse não existe no
//     fork; confirmado por leitura direta de `routes/api.php`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `MarkingStatusEnum` (backend, backed int) — 1=Marcado 2=Previsto 3=Realizado. */
export type MarkingStatusValue = 1 | 2 | 3;

/** `MarkingDoneStatusEnum` (backend, backed string `char(1)`) — mirror
 *  EXATO do legado, não é defeito. */
export type MarkingDoneStatusValue = '1' | '2' | '3';

export interface MarkingRefUuidName {
  uuid: string;
  name: string;
}

export interface MarkingWeekVintageRef {
  uuid: string;
  number_week: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  /** Cor sugerida da safra p/ esta semana (livre, ≤20 chars no servidor —
   *  SEM enum server-side). Usada só como SUGESTÃO visual na cascata do
   *  form (TASK-MC-FE-04); nunca substitui a escolha do usuário em
   *  `markings.color` (catálogo fechado de 16 hex, `MarkingColorEnum`). */
  color: string;
}

export interface MarkingData {
  uuid: string;
  code: number | null;
  date: string; // YYYY-MM-DD
  quantity: number;
  /** Hex EXATO de `MarkingColorEnum` (16 valores fechados, case preservado). */
  color: string;
  status: MarkingStatusValue;
  /** Já traduzido no servidor (`MarkingStatusEnum::label()`), pt-BR fixo —
   *  usar `markingStatusOptions(languageGB).getLabel(status)` no front para
   *  exibir no idioma ativo; `status_label` fica disponível como fallback. */
  status_label: string;
  area: MarkingRefUuidName;
  harvest: MarkingRefUuidName;
  farm: MarkingRefUuidName;
  cost_center: MarkingRefUuidName | null;
  week_vintage: MarkingWeekVintageRef;
  variety: MarkingRefUuidName;
  employee: MarkingRefUuidName | null;
  user: MarkingRefUuidName;
  created_at?: string;
  updated_at?: string;
}

// `employee_uuid`/`center_uuid` NÃO fazem parte deste form — FIX de
// fidelidade (achado do dono, confirmado por leitura direta de
// `agro365/resources/views/markings/_forms.blade.php`): o form legado não
// tem esses inputs (só `area_id`/`date`/`variety_id`/`user_id` hidden/
// `quantity`/`harvest_id`/`week_vintage_id` hidden/`color`). As colunas
// `employee_id`/`center_id` existem no banco (nullable) mas nunca são
// escolhidas pelo usuário neste form — ficam `null` no create/update,
// mirror fiel do legado. Ver `CreateMarkingRequest`/`UpdateMarkingRequest`
// abaixo, que continuam aceitando os dois como opcionais (contrato real do
// backend), só este form não os coleta.
//
// `user_uuid` (Responsável) TAMBÉM não faz parte deste form — FIX #2
// (decisão do dono): é READONLY = usuário logado (criação) ou responsável
// já gravado (edição), mirror `CreateOrUpdatePastagem.tsx`
// (`TASK-PAST-FIX-FE-01`) e do hidden `user_id` do legado. Resolvido direto
// em `tryPersistMarking` a partir de `useAuth().user`/`markingQuery.data`,
// nunca por escolha do usuário — por isso não é campo de
// react-hook-form aqui.
export interface MarkingForm {
  area_uuid: Option<string> | null;
  date: string | null;
  variety_uuid: Option<string> | null;
  quantity: number | null;
  harvest_uuid: Option<string> | null;
  color: Option<string> | null; // value = hex (MarkingColorEnum)
  /** Preenchido pela cascata `useCascadesMarking` (harvest_uuid + date →
   *  `GET /harvests/{uuid}/weeks/current`) — nunca editável direto pelo
   *  usuário. */
  week_vintage_uuid: string | null;
}

export interface MarkingFilterForm {
  area_uuid?: string;
  /** Companion DISPLAY-ONLY de re-hidratação do `SelectAsyncPaginate`
   *  (mesma convenção de `responsible_label` em `WeaningFilterForm`) —
   *  nunca enviado ao servidor. */
  area_label?: string;
  harvest_uuid?: string;
  harvest_label?: string;
  variety_uuid?: string;
  variety_label?: string;
  user_uuid?: string;
  user_label?: string;
  start_date?: string | null;
  end_date?: string | null;
  color?: string | null;
  status?: MarkingStatusValue | null;
  /** Número da semana da safra (`week_vintages.number_week`). */
  week?: number | null;
}

export interface MarkingFilterRequest {
  area_uuid?: string | null;
  harvest_uuid?: string | null;
  variety_uuid?: string | null;
  user_uuid?: string | null;
  // `| null` (em vez de só `?`) porque `MarkingFilterForm` (fonte real do
  // valor em runtime, via `paginatedQuery.filter`) usa `null` explícito
  // nestes 3 campos — evita incompatibilidade estrutural entre os dois
  // tipos no call site de `useMarkingsList`/`listMarkings`.
  status?: MarkingStatusValue | null;
  color?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  week?: number | null;
}

/** `MarkingRequest::rules()` real exige TODOS os campos (exceto
 *  `employee_uuid`/`center_uuid`) tanto no create quanto no update — payload
 *  é SEMPRE completo, mirror `WeaningRequest`/`CreateWeaningRequest` (nunca
 *  um delta de `dirtyFields`). */
export interface CreateMarkingRequest {
  area_uuid: string;
  date: string;
  harvest_uuid: string;
  variety_uuid: string;
  week_vintage_uuid: string;
  user_uuid: string;
  quantity: number;
  color: string;
  employee_uuid?: string;
  center_uuid?: string;
}

/** Mesmo shape de `CreateMarkingRequest` — `MarkingData` (DTO do backend) é
 *  o shape unificado de store/update, SEM PATCH parcial (confirmado contra
 *  `UpdateMarkingAction::handle()` real). */
export type UpdateMarkingRequest = CreateMarkingRequest;

// ---- Subcadastros (forecast/done) — sem uuid próprio (decisão real
// confirmada em `MarkingForecastLineData`/`MarkingDoneLineData`: a linha
// nunca é endereçada isoladamente entre requisições, chave exposta é
// `order`). Tipos de FUNDAÇÃO (TASK-MC-FE-01) — UI consumidora é
// TASK-MC-FE-05/06/07 (onda 2, fora desta Tarefa). ----

export interface MarkingForecastLine {
  order: number;
  percentage: number;
  average_weight: number;
  average_price: number;
  days: number;
  // calculados — vêm do servidor pós-save (`CALC-02..05`,
  // `ReplaceMarkingForecastLinesAction`), exibidos como feedback antes do
  // submit também; NUNCA enviados no payload de entrada.
  quantity?: number;
  income_boxes?: number;
  total?: number;
  forecast_date?: string;
}

export interface MarkingDoneLine {
  order: number; // vincula a uma linha de forecast já existente (CLM-DONE-ORDER-LINK)
  date: string;
  quantity: number;
  discard: number;
  average_weight: number;
  average_price: number;
  status: MarkingDoneStatusValue;
  /** Nullable no servidor; NUNCA um campo obrigatório do form. */
  color?: string;
  // calculado — servidor (`CALC-06`, `ReplaceMarkingDoneLinesAction`):
  total?: number;
  status_label?: string;
}

export interface ReplaceMarkingForecastRequest {
  lines: Array<Omit<MarkingForecastLine, 'quantity' | 'income_boxes' | 'total' | 'forecast_date'>>;
}

export interface ReplaceMarkingDoneRequest {
  lines: Array<Omit<MarkingDoneLine, 'total' | 'status_label'>>;
}

export interface BulkForecastRequest extends ReplaceMarkingForecastRequest {
  ids: string[]; // uuids dos markings selecionados
}

export interface BulkDoneRequest extends ReplaceMarkingDoneRequest {
  ids: string[];
}

// ---- Resultado real dos 4 verbos de save (single + bulk create/update) —
// TASK-MC-FE-05/06/07 (onda 2). Confirmado por leitura direta de
// `MarkingForecastController::presentResult()`/`MarkingDoneController::
// presentResult()` (fork `GB.Cerne.Api`): `{ marking: MarkingResource,
// lines: LineResource[] }` — NUNCA o shape `Response<unknown>` genérico
// assumido pelo roteiro antes da API materializar. Bulk devolve um ARRAY
// desse shape (1 item por marking do grupo); single devolve o item direto
// (sem array), mirror `MarkingForecastController::updateSingle()`
// (`$this->presentResult($results[0])`). ----

export interface MarkingForecastSaveResult {
  marking: MarkingData;
  lines: MarkingForecastLine[];
}

export interface MarkingDoneSaveResult {
  marking: MarkingData;
  lines: MarkingDoneLine[];
}

/** `MarkingImportResultResource` real (`POST /markings/import`,
 *  TASK-MC-FE-08) — 1 código sequencial POR LINHA (mirror EXATO do legado),
 *  por isso a faixa `first_code`/`last_code` em vez de uma lista. */
export interface MarkingImportResult {
  rows_processed: number;
  first_code: number;
  last_code: number;
}
