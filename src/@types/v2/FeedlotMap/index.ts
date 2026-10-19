// src/@types/v2/FeedlotMap/index.ts
// Tipagem da árvore composta do Mapa de Confinamento — `GET /api/v1/feedlot-map`
// (TASK-FE-042-200, `[[06-front-estrutura-espacial]]` §1). Mirror 1:1 do shape
// REAL devolvido por `GetFeedlotMapTreeAction::execute()`/`FeedlotMapTreeResource`
// (GB.Cerne.Api) — nenhum campo inventado, nenhum campo calculado no front
// além do que o card já expõe pronto (`CorralCardData` traz TODAS as métricas
// server-side, `LM01-17`/`CV04-17`).

export interface FeedlotCorralStatusOption {
  value: string;
  label: string;
}

export interface FeedlotComponentRefUuidDescription {
  uuid: string;
  description: string;
}

// `CorralCardData` — mirror `GetFeedlotMapTreeAction::formatCorralCard()`.
// `duration`/`confinement_days`/`remaining_days`/`expected_final_weight`/
// `score_gmd` NÃO vêm do backend (mirror do comentário da Action) — são
// DERIVADOS no front a partir de `entry_date`/`exit_date`/`average_weight`/
// `expected_adg`/`average_gmd` (TASK-FE-042-201, `CardCurral`).
export interface CorralCardData {
  uuid: string;
  identification: string;
  name: string;
  status: string;
  status_label: string;
  status_color: string;
  capacity: number;
  installation_type: string;
  width: number;
  length: number;
  coverage: string;
  floor: string;
  shading: string;
  trough: FeedlotComponentRefUuidDescription | null;
  drinking_fountain: FeedlotComponentRefUuidDescription | null;
  diet_id: number | null;
  // Dieta atual (uuid + label "{code} - {description}", igual a listDietOptions)
  // — usada para pré-selecionar o Select nos diálogos do mapa.
  diet: { uuid: string; label: string } | null;
  feed_intake: number | null;
  animals_count: number;
  capacity_status: string;
  capacity_percent: number;
  males_count: number;
  females_count: number;
  average_weight: number;
  average_gmd: number | null;
  available_at: string | null;
  entry_date: string | null;
  exit_date: string | null;
  expected_adg: number | null;
  batches: FeedlotComponentRefUuidDescription[];
  // 063-est03-9-reprovacoes — Alterar Status do Mapa (`FeedlotCorralStatusDialog.tsx`):
  // prefill da "Observação" com a última nota de status do curral. AINDA NÃO
  // vem da API (pendente de fix de override do dono) — o front já reserva o
  // campo (`?? ''` no dialog degrada para vazio) para quando o backend
  // expuser. NÃO invente valor aqui, NÃO mock.
  last_status_note: string | null;
}

export interface StreetCardData {
  uuid: string;
  description: string;
  orientation: 'H' | 'V';
}

export interface FeedlotComponentNode {
  // uuid do PRÓPRIO `FeedlotComponent` (a célula da grade) — NÃO confundir
  // com `corral.uuid`/`street.uuid` (uuid de OUTRA entidade). É o
  // identificador exigido pelo payload de
  // `PUT /api/v1/feedlot-map/components/reorder`
  // (`ReorderFeedlotComponentsRequest::rules()`, `items.*.uuid`).
  uuid: string;
  line: number;
  column: number;
  type: 'corral' | 'street' | null;
  corral?: CorralCardData;
  street?: StreetCardData;
}

export interface FeedlotSectorNode {
  uuid: string;
  name: string;
  code: string;
  priority: number;
  width: number | null;
  length: number | null;
  observation: string | null;
  components: FeedlotComponentNode[];
}

export interface FeedlotYardNode {
  uuid: string;
  name: string;
  code: string;
  priority: number;
  width: number | null;
  length: number | null;
  observation: string | null;
  sectors: FeedlotSectorNode[];
}

export interface FeedlotMapTree {
  yards: FeedlotYardNode[];
  statuses: FeedlotCorralStatusOption[];
}

// Filtros locais client-side (`FL01-04`, TASK-FE-042-200) — nunca vão para a
// API (a árvore é sempre carregada inteira; o filtro só marca cards `dimmed`,
// mirror `IG05`).
export interface FeedlotMapLocalFilters {
  entryFrom: string | null;
  entryTo: string | null;
  exitFrom: string | null;
  exitTo: string | null;
}
