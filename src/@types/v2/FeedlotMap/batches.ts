// src/@types/v2/FeedlotMap/batches.ts
// Tipagem de "Gerenciar/sincronizar lotes" do Curral — TASK-FE-042-209.
// Mirror 1:1 `GetFeedlotCorralBatchOptionsAction`/`SyncFeedlotCorralBatchesRequest`
// (GB.Cerne.Api). `batch_ids`/`diet_id` são nomeados assim no backend mas o
// VALOR é sempre `uuid` (nunca id sequencial) — mirror exato dos nomes reais
// do payload, para não divergir do contrato na hora do PUT.

// `animals_count`/`average_weight`/`average_start_weight` (execução 063,
// F-036 rejeição QA rodada 2, TASK-063-MAPA2-03/04) — campos ADITIVOS
// devolvidos por `GetFeedlotCorralBatchOptionsAction` (GB.Cerne.Api),
// mirror EXATO do legado `ModalLotes.js:140-159`. `null` quando o lote não
// tem nenhum animal (mirror `Batch::getAverageAttribute()`).
export interface FeedlotCorralBatchOption {
  value: string;
  label: string;
  animals_count: number;
  average_weight: number | null;
  average_start_weight: number | null;
}

// `PUT /feedlot-map/corrals/{uuid}/dates` (`TASK-FE-042-211`) — update
// simples e direto, sem histórico dedicado (mirror `IG22`).
export interface UpdateCorralDatesRequest {
  entry_date: string | null;
  exit_date: string | null;
  expected_adg: number | null;
}

export interface SyncCorralBatchesRequest {
  batch_ids: string[];
  entry_date: string;
  exit_date: string;
  diet_id: string | null;
  feed_intake: number | null;
  expected_adg: number;
}
