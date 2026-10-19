// src/@types/v2/Relatorios/Agricultura/appropriationOccurrenceReport.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Ocorrências Talhões" (F-232, Tarefa 50,
// esteira CORE_WORKSPACE/97-Esteiras/015). Mirror ESTRUTURAL do padrão
// `AccumulatedWeighingBatchReport*` (endpoint `options` PRÓPRIO + endpoint de
// download `responseType:'blob'`), MAS com 3 divergências deliberadas
// (frontend-contract-ocorrencias-talhoes.md §"Leitura do dev"):
//   1. SEM campo `format` — a API só devolve `application/pdf` (nenhum branch
//      Excel).
//   2. `production_cycles[].areas[]` vem ANINHADO no próprio `options`
//      (api-contract-ocorrencias-talhoes.md §5, `ProductionCycleOptionResource`)
//      — a cascata NÃO precisa de query extra (`getProductionCycleByUuid`).
//   3. `production_cycle_uuid` É ENVIADO normalmente no payload de download
//      (aceito e ignorado server-side, mirror `proprietary_uuid`/DEC-043) —
//      NÃO é um campo 100% client-only como em `MarkingForecastAreaReport`.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface AppropriationOccurrenceAreaRef {
  uuid: string;
  description: string;
  productive_area: boolean;
}

export interface AppropriationOccurrenceProductionCycleAreaRef {
  uuid: string;
  description: string;
}

export interface AppropriationOccurrenceProductionCycleRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Áreas do ciclo, já aninhadas — fonte da cascata SEM query extra (risco 2). */
  areas: AppropriationOccurrenceProductionCycleAreaRef[];
}

export interface AppropriationOccurrenceReportOptionsData {
  areas: AppropriationOccurrenceAreaRef[];
  productionCycles: AppropriationOccurrenceProductionCycleRef[];
}

export interface AppropriationOccurrenceReportFilterForm {
  production_cycle_uuid: Option<string> | null;
  area_uuids: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL — nomes 1:1 com o Form Request da API
 *  (api-contract-ocorrencias-talhoes.md §6). `production_cycle_uuid` é
 *  ENVIADO normalmente (risco 3) — aceito e ignorado server-side. */
export interface AppropriationOccurrenceReportParams {
  production_cycle_uuid?: string;
  area_uuids?: string[];
  start_date: string;
  end_date: string;
}
