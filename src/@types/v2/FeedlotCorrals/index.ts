// src/@types/v2/FeedlotCorrals/index.ts
// Tipagem de FeedlotCorral ("Curral") — TASK-FE-042-206. Mirror 1:1
// `FeedlotCorralResource`/`FeedlotCorralRequest`/`GetFeedlotCorralOptionsAction`
// (GB.Cerne.Api).

import type { Option } from '@/@types/option';

export interface FeedlotCorralEnumRef {
  value: string;
  label: string;
}

export interface FeedlotCorralResourceRef {
  uuid: string;
  description: string;
}

export interface FeedlotCorralDetail {
  uuid: string;
  identification: string;
  name: string;
  feedlot_sector: { uuid: string; name: string };
  installation_type: FeedlotCorralEnumRef;
  status: FeedlotCorralEnumRef;
  width: number | null;
  length: number | null;
  capacity: number | null;
  coverage: FeedlotCorralEnumRef;
  floor: FeedlotCorralEnumRef;
  shading: FeedlotCorralEnumRef;
  trough: FeedlotCorralResourceRef | null;
  drinking_fountain: FeedlotCorralResourceRef | null;
  // `available_at`/`last_status_note` — CUR-04b (PARADA-DEF-A), já expostos
  // por `FeedlotCorralResource::toArray()` (GB.Cerne.Api). TASK-063-CUR-02
  // hidrata o wizard standalone com esses valores reais (antes hardcoded
  // vazio) em vez de reproduzir a lacuna já fechada na API.
  available_at: string | null;
  last_status_note: string | null;
  created_at: string | null;
  updated_at: string | null;
  // UT-000698 (DEFEITO #1, Mapa de Confinamento) — `GET /feedlot-corrals/{uuid}`
  // passa a devolver os lotes já anexados ao curral (array vazio quando sem
  // lotes). Hidrata a Etapa 3 (Lotes) do wizard em editar — antes descartado
  // fixo como `[]` em `fillForm`, mascarando lotes já vinculados (visíveis no
  // Mapa) e arriscando desanexá-los no primeiro submit (sync do attach).
  batches: { uuid: string; description: string }[];
}

// `GET /feedlot-corrals/options?corral_uuid=` — os 5 enums do formulário +
// cochos/bebedouros disponíveis (inclui o vínculo atual em modo editar).
// `next_identification` (GAP-API-03/`TASK-BE-043-CUR-01`, CV-001) — preview
// do próximo `identification` sequencial: `string` só quando `corral_uuid`
// NÃO é enviado (modo CRIAR); `null` em editar (o front já tem o valor real
// hidratado por `FeedlotCorralDetail.identification`, mirror
// `GetFeedlotCorralOptionsAction::handle()`).
export interface FeedlotCorralOptions {
  installation_types: FeedlotCorralEnumRef[];
  statuses: FeedlotCorralEnumRef[];
  coverages: FeedlotCorralEnumRef[];
  floors: FeedlotCorralEnumRef[];
  shadings: FeedlotCorralEnumRef[];
  next_identification: string | null;
  troughs: FeedlotCorralResourceRef[];
  drinking_fountains: FeedlotCorralResourceRef[];
}

// `feedlot_sector_uuid`/`status` só no CREATE (`prohibited` no PUT/PATCH,
// mirror `FeedlotCorralRequest::rules()`). `identification` NUNCA entra —
// gerado pelo servidor.
//
// `available_at`/`note` — ADITIVO (GAP-API-05, `TASK-BE-043-CUR-03`,
// PARADA-API-05 decidida pelo dono = estender o `store`). Confirmado em
// `FeedlotCorralRequest::rules()` (GB.Cerne.Api): só entram no ramo POST,
// `required_if` `status` ∈ {VS,LI,MA,FE} — mirror EXATO de
// `UpdateFeedlotCorralStatusRequest`. Omitir quando o status não exige
// detalhe (o backend ignora/`nullable` de qualquer forma). Isto torna o
// CREATE do wizard (T06) ATÔMICO — curral+situação em 1 request, sem a 2ª
// chamada de `updateStatus` que o contrato de tela §7 previa antes deste
// GAP ser resolvido pela API.
export interface CreateFeedlotCorralRequest {
  name: string;
  feedlot_sector_uuid: string;
  status: string;
  installation_type: string;
  coverage: string;
  floor: string;
  shading: string;
  width: number;
  length: number;
  capacity: number;
  trough_uuid: string;
  drinking_fountain_uuid: string;
  available_at?: string | null;
  note?: string | null;
}

// PUT/PATCH — payload SEMPRE completo (mirror `TroughPayload`/
// `DrinkingFountainPayload`), SEM `feedlot_sector_uuid`/`status`
// (`prohibited` no backend).
export interface UpdateFeedlotCorralRequest {
  name: string;
  installation_type: string;
  coverage: string;
  floor: string;
  shading: string;
  width: number;
  length: number;
  capacity: number;
  trough_uuid: string;
  drinking_fountain_uuid: string;
}

// `PUT /feedlot-corrals/{uuid}/status` — `available_at`/`note` `required_if`
// status destino ∈ {VS,LI,MA,FE} (mirror `UpdateFeedlotCorralStatusRequest`).
export interface UpdateFeedlotCorralStatusRequest {
  status: string;
  available_at: string | null;
  note: string | null;
}

export interface FeedlotCorralForm {
  name: string;
  installation_type: Option<string> | null;
  status: Option<string> | null;
  // `available_at`/`note` — ADITIVO (TASK-063-CUR-01). Condicionais via
  // `FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED` (`feedlotCorralStatus-schema.ts`)
  // quando `status` ∈ {VS,LI,MA,FE} — reuso do MESMO conjunto já usado por
  // `FeedlotCorralWizardForm`/`feedlotCorralStatusSchema`, nunca uma cópia
  // divergente. Presentes aqui (base compartilhada pelo diálogo do Mapa) para
  // o diálogo "Criar Curral" também coletar os 2 campos no CREATE.
  available_at: string | null;
  note: string;
  width: number | '';
  length: number | '';
  capacity: number | '';
  coverage: Option<string> | null;
  floor: Option<string> | null;
  shading: Option<string> | null;
  trough_uuid: Option<string> | null;
  drinking_fountain_uuid: Option<string> | null;
}

// -----------------------------------------------------------------------------
// Tela standalone de Currais (F-035, lote 043, TASK-043-CUR-T01) — ADITIVO.
// `FeedlotCorralForm`/`CreateFeedlotCorralRequest`/`UpdateFeedlotCorralRequest`
// acima ficam INTOCADOS (consumidos pelo `FeedlotCorralDialog` do Mapa).
// Mirror `FeedlotCorralResource::toArray()` (GB.Cerne.Api) — `animals_count`/
// `capacity_percent`/`capacity_status` já resolvidos no backend
// (`TASK-BE-043-CUR-01`, GAP-API-02 JÁ RESOLVIDO no Resource, só aparecem
// quando `index` eager-carrega `batches.animals`; `null` nos demais métodos).
// `available_at`/`last_status_note` (TASK-063-CUR-QA2-03) — PREMISSA ANTERIOR
// DESATUALIZADA: este arquivo chegou a documentar que `FeedlotCorralListItem`
// "não tem" esses 2 campos; na verdade `available_at` já vem sempre resolvido
// pelo MESMO `FeedlotCorralResource` usado pelo `index` (sem depender de
// relação), e `last_status_note` só falta o `index` eager-carregar
// `latestStatusHistory` (`TASK-063-CUR-QA2-04`, API, em paralelo) — até lá
// chega `null` na listagem, nunca quebra o tipo.
export interface FeedlotCorralListItem {
  uuid: string;
  identification: string;
  name: string;
  feedlot_sector: { uuid: string; name: string };
  installation_type: FeedlotCorralEnumRef;
  status: FeedlotCorralEnumRef;
  width: number | null;
  length: number | null;
  capacity: number | null;
  coverage: FeedlotCorralEnumRef;
  floor: FeedlotCorralEnumRef;
  shading: FeedlotCorralEnumRef;
  trough: FeedlotCorralResourceRef | null;
  drinking_fountain: FeedlotCorralResourceRef | null;
  animals_count: number | null;
  capacity_percent: number | null;
  capacity_status: string | null;
  available_at: string | null;
  last_status_note: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// ENVELOPE PAGINADO (`ApiResponse::paginated`) — mirror `FeedlotSectorsListEnvelope`.
// ============================================

export interface FeedlotCorralsApiPaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FeedlotCorralsListEnvelope {
  success: boolean;
  message: string;
  data: FeedlotCorralListItem[];
  errors: Record<string, string[]> | null;
  meta: FeedlotCorralsApiPaginationMeta | null;
}

// ============================================
// FILTRO (drawer da listagem — mirror `FeedlotCorralFilterData`, GB.Cerne.Api:
// só `feedlot_sector_id`/`status`/`name`, `installation_type` NÃO é filtro).
// ============================================

export interface FeedlotCorralFilterForm {
  name?: string;
  feedlot_sector_id?: Option<string>;
  status?: Option<string>;
}

export interface FeedlotCorralFilterRequest {
  name?: string;
  feedlot_sector_id?: string;
  status?: string;
}

// ============================================
// WIZARD (formulário standalone, DEC-043-CURRAIS-FORM) — base de
// `FeedlotCorralForm` (INTOCADO) + `available_at`/`note` (Etapa 1, mirror
// `UpdateFeedlotCorralStatusRequest`) + `batches[]` (Etapa 3, mirror
// `SyncBatchesFormValues.batches` — reuso do row shape do Mapa, sem
// duplicar/divergir). `identification` NUNCA entra aqui — readonly/derivado
// do servidor, exibido como texto estático (mirror `FeedlotCorralDialog.tsx`
// em editar), nunca um campo RHF.
//
// `feedlot_sector_uuid` (FM-003, TASK-043-CUR-T03) — ADITIVO exclusivo do
// wizard: criado editável (`SelectAsyncPaginate`/`listFeedlotSectors`),
// readonly quando a rota chega via `?sector_uuid=` (PARADA-E) e fixo/readonly
// em editar (PARADA-D, imutável pós-create). Ausente de `FeedlotCorralForm`
// porque o diálogo do Mapa recebe o setor por prop (`sectorUuid`), não por
// campo do form — aditivo isolado aqui, shared intocado.
// ============================================

export interface FeedlotCorralWizardForm extends FeedlotCorralForm {
  feedlot_sector_uuid: Option<string> | null;
  available_at: string | null;
  note: string;
  batches: { batch_uuid: Option<string> | null }[];
}

// -----------------------------------------------------------------------------
// Orquestração de submit do wizard (T06, GAP-API-06/`TASK-BE-043-CUR-02`) —
// `PUT /api/v1/feedlot-corrals/{uuid}/batches` (`syncBatchesFromForm`),
// endpoint NOVO e corral-scoped, DISTINTO do `syncCorralBatches` do Mapa
// (`PUT /feedlot-map/corrals/{uuid}/batches`, que exige `entry_date`/
// `exit_date`/`expected_adg` — assinatura intocada, `@types/v2/FeedlotMap/
// batches.ts`). Fiel ao form legado: só `batch_ids` (0..N, sem datas — CLM-007).
// ============================================
export interface AttachFeedlotCorralBatchesRequest {
  batch_ids: string[];
}

// -----------------------------------------------------------------------------
// Histórico de situação do Curral (T09, GAP-API-01, `TASK-BE-043-CUR-01`) —
// `GET /feedlot-corrals/{uuid}/histories`, paginado, 6 colunas (LM-012..017,
// contrato-currais-norm.md). Mirror `FeedlotCorralStatusHistoryResource::
// toArray()` (GB.Cerne.Api): `before_status`/`after_status` chegam SEMPRE
// como objeto `{value,label}` (podem vir `null` internamente quando a
// transição não tem um dos dois lados — nunca o objeto inteiro `null`).
// `note`/`user`/`corral` são `string | null` (relação opcional/observação
// vazia) — a UI trata `null` como "-"/"—" (Regra 9, sem inventar dado).
// -----------------------------------------------------------------------------

export interface FeedlotCorralHistoryStatusRef {
  value: string | null;
  label: string | null;
}

export interface FeedlotCorralHistoryItem {
  corral: string | null;
  before_status: FeedlotCorralHistoryStatusRef;
  after_status: FeedlotCorralHistoryStatusRef;
  note: string | null;
  created_at: string | null;
  user: string | null;
}

export interface FeedlotCorralHistoriesListEnvelope {
  success: boolean;
  message: string;
  data: FeedlotCorralHistoryItem[];
  errors: Record<string, string[]> | null;
  meta: FeedlotCorralsApiPaginationMeta | null;
}

// `GET /feedlot-corrals/available-for-batch` (TASK-063-PROC-QA3-05/06,
// execução 063, roteiro `processamento-novolote-roteiro-qa3.md` §4) —
// picklist do campo opcional "Curral Confinamento" do modal "Novo Lote".
// Mirror `ListFeedlotCorralAvailableForBatchAction` (GB.Cerne.Api): já
// filtrado (só currais com vaga) e já rotulado
// `"{nome} | Capacidade: x/y | Situação: ..."` — nenhum enriquecimento
// adicional no front.
export interface FeedlotCorralAvailableForBatchOption {
  value: string;
  label: string;
}
