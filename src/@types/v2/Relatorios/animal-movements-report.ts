// src/@types/v2/Relatorios/animal-movements-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Movimentação/Rebanho" (F-224, lote 076,
// `AnimalMovementReport-contrato.md` §4.3/§4.4/§4.6) — namespace FLAT já
// estabelecido pelos demais relatórios de Pecuária (`birth-report.ts`,
// `feedlot-weighing-performance-report.ts`, etc.).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`, branch
// `feature/076-relatorios-custeio-ans-fiscal-movrebanho-confinamento`):
//   - `app/Http/Requests/Api/V1/AnimalMovementReportRequest.php` — `rules()`:
//     `harvest_uuid` (nullable|uuid), `month` (nullable|string, NUNCA
//     validado/filtrado — REPLICAR-IGNORAR, ver docblock da classe), `format`
//     (nullable|in:pdf,xlsx).
//   - `app/Http/Controllers/Api/V1/AnimalMovementReportController.php` —
//     `options()` devolve `{harvests: HarvestOptionResource[]}`
//     (`{uuid,label}`); `__invoke()` responde BINÁRIO (PDF inline a4/paisagem
//     ou xlsx), SEM envelope, `format` default `'pdf'` quando ausente.
//
// RULING DO MAESTRO (AF-02, docblock de `AnimalMovementReportRequest`): o
// campo `month` existe na TELA por fidelidade visual ao legado (CL-09/CL-13),
// mas o SERVIDOR o ignora por completo — nunca gera 422 específico, nunca
// filtra nada. `harvest_uuid` é o ÚNICO caminho funcional (CL-16); o gate de
// "Selecione uma safra ou um mês." (CL-14) é satisfeito exclusivamente por
// `harvest_uuid` no cliente e no servidor (`month` NÃO conta).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

/** `HarvestOptionResource` — `GET /api/v1/animal-movements-report/options`. */
export interface AnimalMovementsReportHarvestOption {
  uuid: string;
  label: string;
}

export interface AnimalMovementsReportOptionsData {
  /** Safras do tenant, TODAS (inclusive `is_enabled=false`) — mirror LK-01,
   * sem filtro de `is_enabled`, ordenadas por `end_date desc` no servidor. */
  harvests: AnimalMovementsReportHarvestOption[];
}

export interface AnimalMovementsReportFilterForm {
  harvest_uuid: Option<string> | null;
  /** Campo PRESENTE por fidelidade visual ao legado (CL-09/CL-13) —
   * `MonthInput` ('YYYY-MM'), NUNCA valida nem bloqueia o submit (AF-02,
   * REPLICAR-IGNORAR). O servidor não lê este valor. */
  month: string | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 * `AnimalMovementReportRequest::rules()`. `format` é decidido pelo BOTÃO
 * clicado (PDF/Excel), nunca um campo do form (mirror
 * `FeedlotWeighingPerformanceReport`/`FiscalDifferenceReport`, lote 076). */
export interface AnimalMovementsReportParams {
  harvest_uuid: string;
  month?: string;
  format: 'pdf' | 'xlsx';
}
