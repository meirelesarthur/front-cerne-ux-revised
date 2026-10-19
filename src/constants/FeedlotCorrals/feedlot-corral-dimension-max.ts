// src/constants/FeedlotCorrals/feedlot-corral-dimension-max.ts
// Teto de `width`/`length` do Curral (FeedlotCorral) — QA2 Currais F-035
// (execução 063, TASK-063-CUR-QA2-05). Mirror EXATO da coluna Postgres
// `decimal(12,2)` (`database/migrations/..._create_feedlot_corrals_table.php`,
// GB.Cerne.Api): 12 dígitos totais, 2 decimais → no máximo 10 dígitos
// inteiros = `9999999999.99`. Sem este teto, o `NumberInput` aceita
// qualquer magnitude e a API (`FeedlotCorralRequest::rules()`, fix irmão
// TASK-063-CUR-QA2-06) responde 500 por overflow do Postgres em vez de 422.
//
// Consumida por 2 telas (`StepDimensoesEstrutura.tsx`, `FeedlotCorralDialog.tsx`,
// prop `max` do `NumberInput`) e pelo schema Yup compartilhado
// (`feedlotCorral-schema.ts`, `.max()` de `width`/`length`) — NUNCA duplicar
// o literal.
export const FEEDLOT_CORRAL_DIMENSION_MAX = 9999999999.99;
