// src/@types/v2/Relatorios/production-costing-area-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Produção/Custeio/Área" (F-298, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-298-FE-01) — CANÁRIO da tela de
// relatório em código para o fan-out (F-279/F-238/F-315/F-326). Mirror
// ESTRUTURAL de `income-statement.ts` (flat, não Module/Entity aninhado).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`), não adivinhados:
//   - `app/Http/Resources/V1/ProductionCycleOptionResource.php` (LK-01)
//   - `app/Http/Resources/V1/AreaOptionResource.php` (LK-02)
//   - `app/Http/Requests/Api/V1/ProductionCostingAreaReportRequest.php`
//   - `app/Data/Reports/ProductionCostingAreaReport/ProductionCostingAreaReportFilterData.php`
//
// RISCO CRÍTICO DE NOMENCLATURA: a Request/DTO reais da API usam
// `production_cycle_uuid`/`area_uuids[]` (mapeados via `SnakeCaseMapper` para
// `productionCycleUuid`/`areaUuids`) — NÃO `production_cycle`/`areas` como o
// texto informal do roteiro descrevia o campo pelo nome de EXIBIÇÃO. Este
// arquivo segue o contrato REAL (`ProductionCostingAreaReportRequest::rules()`),
// não o texto do roteiro — enviar `areas[]` faria o backend ignorar o filtro
// e devolver TODAS as áreas no PDF (bug silencioso, `area_uuids` ficaria
// `null`/ausente).
//
// `production_cycle_uuid` é aceito e IGNORADO em silêncio pela Action
// server-side (fidelidade ao legado, IG-01 — o ciclo só alimenta a cascata
// CLIENT-SIDE de datas/áreas antes do submit, nunca filtra no servidor); a
// SPA ainda o envia para reconciliação de contrato/telemetria futura.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface ProductionCostingAreaRef {
  uuid: string;
  description: string;
}

export interface ProductionCycleOptionRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend — cascata IG-01 100% client-side, sem endpoint dedicado. */
  areas: ProductionCostingAreaRef[];
}

export interface ProductionCostingAreaReportOptionsData {
  productionCycles: ProductionCycleOptionRef[];
  /** Universo COMPLETO (LK-02) — carregado inteiro, sem paginação/busca no servidor. */
  areas: ProductionCostingAreaRef[];
}

export interface ProductionCostingAreaReportFilterForm {
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `ProductionCostingAreaReportRequest::rules()`. */
export interface ProductionCostingAreaReportParams {
  production_cycle_uuid?: string;
  area_uuids?: string[];
  start_date: string;
  end_date: string;
}
