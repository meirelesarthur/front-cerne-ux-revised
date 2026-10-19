// src/@types/v2/FeedlotMap/diet.ts
// Tipagem de "Alterar Dieta" do Curral — TASK-FE-042-212. Mirror 1:1
// `POST /feedlot-corral-diet-histories` (`[[07-front-lotes-sync-transfer]]`
// §5): `feedlot_corral_uuid` (uuid), `date`, `diet_id` (uuid, required — `D09`,
// servidor exige mesmo sendo "opcional" no legado), `feed_intake` (required).

export interface CreateCorralDietHistoryRequest {
  feedlot_corral_uuid: string;
  date: string;
  diet_id: string;
  feed_intake: number;
}
