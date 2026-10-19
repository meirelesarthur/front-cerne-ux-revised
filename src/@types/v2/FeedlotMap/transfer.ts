// src/@types/v2/FeedlotMap/transfer.ts
// Tipagem de "Transferir Lote" do Curral — TASK-FE-042-210. Mirror 1:1
// `GetFeedlotCorralTransferOptionsAction`/`TransferFeedlotCorralBatchRequest`
// (GB.Cerne.Api).

export type FeedlotCorralTransferDestinationType = 'corral' | 'area' | 'grazing';

export interface FeedlotCorralTransferOption {
  value: string;
  label: string;
}

// `identification`/`status`/`status_label`/`capacity`/`animals_count`
// (execução 063, F-036 rejeição QA rodada 2, TASK-063-MAPA2-06/07) — campos
// ADITIVOS SÓ no grupo `corrals`, devolvidos por
// `GetFeedlotCorralTransferOptionsAction` (GB.Cerne.Api), mirror EXATO do
// legado `ModalTransferirLote.js:195-208`. `areas`/`grazings`/`batches`
// permanecem `{value,label}` puro (`FeedlotCorralTransferOption`).
export interface FeedlotCorralTransferDestinationCorralOption extends FeedlotCorralTransferOption {
  identification: string;
  status: string;
  status_label: string;
  capacity: number;
  animals_count: number;
}

// `animals_count` (execução 063, aviso não-bloqueante de capacidade,
// mirror `ModalTransferirLote.js:80-93` `checkCapacity`) — campo ADITIVO só
// no grupo `batches`, devolvido por `GetFeedlotCorralTransferOptionsAction`
// (GB.Cerne.Api). `areas`/`grazings` permanecem `{value,label}` puro.
export interface FeedlotCorralTransferBatchOption extends FeedlotCorralTransferOption {
  animals_count: number;
}

export interface FeedlotCorralTransferOptions {
  batches: FeedlotCorralTransferBatchOption[];
  corrals: FeedlotCorralTransferDestinationCorralOption[];
  areas: FeedlotCorralTransferOption[];
  grazings: FeedlotCorralTransferOption[];
}

export interface TransferCorralBatchRequest {
  batch_uuid: string;
  destination_type: FeedlotCorralTransferDestinationType;
  destination_uuid: string;
  transfer_date: string;
}
