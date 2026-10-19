// src/@types/v2/FeedlotMap/weighing.ts
// Tipagem da Pesagem Manual do Curral — TASK-FE-042-213/214. Mirror
// `[[08-front-pesagem-import]]` §1-2: `GET .../animals` (1 linha por animal,
// campos readonly `identification`/`batch_description`/`last_weighing_date`/
// `last_weight` — `last_weight`/`last_weighing_date` já resolvidos
// server-side com o fallback peso/data de ENTRADA quando o animal ainda não
// tem pesagem prévia, mirror do padrão já usado em `CorralCardData`, nenhum
// campo `entry_*` adicional documentado no contrato), `POST
// /weighings-multiple` (arrays paralelos `animal_uuids`/`weights`), e o parse
// da planilha de importação (`POST .../weighing-parse`, `{animal_id,
// weight}[]`, NÃO persiste — só hidrata a tabela).

export interface FeedlotCorralWeighingAnimal {
  animal_uuid: string;
  identification: string;
  batch_description: string;
  last_weighing_date: string | null;
  last_weight: number | null;
}

// `POST /weighings-multiple` — arrays paralelos, SÓ linhas com
// `current_weight > 0` entram (demais ignoradas antes do POST, mirror
// normalization.rules do contrato legado).
export interface SaveMultipleWeighingsRequest {
  animal_uuids: string[];
  weights: number[];
  date: string;
}

// `POST .../weighing-parse` — resposta do parser (NÃO persiste).
export interface WeighingParseResultItem {
  animal_uuid: string;
  weight: number;
}
