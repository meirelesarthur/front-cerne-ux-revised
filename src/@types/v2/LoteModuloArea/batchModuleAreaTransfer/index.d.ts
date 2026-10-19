// src/@types/v2/LoteModuloArea/batchModuleAreaTransfer/index.d.ts
// -----------------------------------------------------------------------------
// Tipos de "Lote/Módulo/Área" (BatchModuleAreaTransfer — Operacional >
// Pecuária > Transferências, 97-Esteiras/070, TASK-LMA-FE-01). Módulo 100%
// NOVO na SPA (UX-GAP confirmado, `F-023-lote-modulo-area-frontend-contract.md`
// `## Leitura do dev`). Mirror ESTRUTURAL de
// `@/@types/v2/LoteFazenda/transferBatchFarm` (mesmo módulo pai `Operacional`,
// mesma convenção de nomes) — NÃO copiado de `ChangeBatchModuleAreaModal.tsx`/
// `transferBatchFarm-service.ts` (feature diferente, `TASK-FE-041-LF-03`), só
// usado como referência de FORMA.
//
// Fonte de verdade: `BatchModuleAreaTransferListResource`/
// `BatchModuleAreaTransferRequest`/`GetBatchModuleAreaTransferOptionsAction`
// (fork `GB.Cerne.Api`, `F-023-lote-modulo-area-api-contract.md ## 4`) — nomes
// de campo EXATOS, sem tradução livre.
// -----------------------------------------------------------------------------

// ---- Listagem (`BatchModuleAreaTransferListResource`, contrato de API §4.5) -
export interface BatchModuleAreaTransferListItem {
  uuid: string;
  code: string;
  description: string;
  animals_count: number;
  // Prioridade area>grazing>corral>null (contrato de API §S-LIST) — `null`
  // é o contrato correto; a tradução `null → '—'` é responsabilidade da
  // camada de apresentação (TASK-LMA-FE-02), não deste tipo.
  current_link: string | null;
}

export interface BatchModuleAreaTransferListEnvelope {
  success: boolean;
  message: string;
  data: BatchModuleAreaTransferListItem[];
  errors: Record<string, string[]> | null;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
}

// ---- GET create-options?batch_uuid= — CONTEXTO para uma nova transferência -
// (contrato de API §4.2) — NÃO é a entidade a editar, é o contexto de um
// sempre-INSERT (mirror `F-023-lote-modulo-area-frontend-contract.md ## 5.2`).
export interface BatchModuleAreaTransferDestinationOption {
  uuid: string;
  // `description` — areas/grazings; `name` — feedlot_corrals usa `name`.
  description?: string;
  name?: string;
}

export interface BatchModuleAreaTransferOptions {
  /** Sugestão server-side (`nextSequentialCode`) — SEMPRE readonly na UI, nunca no payload. */
  code: string;
  /** `Y-m-d`, default hoje. */
  date: string;
  /** `"code - description"` (CLM-023). */
  batch: string;
  qtd: number;
  /** Vínculo atual (display), prioridade area>grazing>corral>null. Nunca no payload. */
  area: string | null;
  /** Nome do usuário autenticado (display, nunca enviado). */
  user: string;
  areas: BatchModuleAreaTransferDestinationOption[];
  grazings: BatchModuleAreaTransferDestinationOption[];
  feedlot_corrals: BatchModuleAreaTransferDestinationOption[];
}

// ---- POST batch-module-area-transfers — payload REAL (contrato de API §4.3)
// SEM `code`/`batch`/`qtd`/`area`/`employee_uuid`/`tenant_id`/`farm_id`/`user_id`.
export interface CreateBatchModuleAreaTransferRequest {
  batch_uuid: string;
  date: string;
  area_uuid?: string | null;
  grazing_uuid?: string | null;
  feedlot_corral_uuid?: string | null;
}

// Resposta de `store`: mirror do retorno já usado por LF-03 (`AnimalBatchResource`,
// contrato de API §4.4). Reaproveita `BatchDetail` de
// `@/@types/v2/LoteFazenda/transferBatchFarm` — o shape bate 1:1 (uuid,
// description, date, employee_uuid, specie_uuid, parameter_weight_uuid,
// status, code, animals, total_animals, areas, grazings). Se um smoke real
// contra a API divergir (ex.: `corrals` presente aqui e ausente lá), declarar
// tipo local `BatchModuleAreaTransferBatchDetail` estendendo `BatchDetail`
// nesse ponto — não antecipado aqui sem confirmação de smoke real (SEM MOCK).

// ---- GET check-date (contrato de API §4.6) ----------------------------------
// Um dos 3 (`area_uuid`|`grazing_uuid`|`feedlot_corral_uuid`) + `batch_uuid`
// opcionais, `date` obrigatório.
export interface CheckBatchModuleAreaTransferDateParams {
  date: string;
  batch_uuid?: string;
  area_uuid?: string;
  grazing_uuid?: string;
  feedlot_corral_uuid?: string;
}

export interface CheckBatchModuleAreaTransferDateResult {
  valid: boolean;
}
