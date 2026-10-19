// src/@types/v2/Relatorios/agriculture-application-management-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Aplicação/Manejo Talhões" (F-220, execução
// 059, `CONTRATO-F220-aplicacao-manejo-talhoes.md`, download-only PDF/Excel,
// domínio Agricultura/Appropriation×Area). Mirror ESTRUTURAL DUPLO:
//   - `@/@types/v2/Relatorios/production-costing-area-report.ts` (F-298,
//     canário do fan-out) — cascata `production_cycle`→`areas`/datas 100%
//     CLIENT-SIDE (IG-01/IG-02), `production_cycle` NUNCA vai ao servidor
//     (DEC-265: campo morto no `AgricultureApplicationManagementReportFilterData`
//     real da API — diferente de F-298, que ainda envia
//     `production_cycle_uuid` ignorado; aqui o campo nem existe no contrato).
//   - `@/@types/v2/StockAbcReport/index.ts` (F-322) — campo `format` PDF/Excel
//     com enum PRÓPRIO deste módulo. Domínio real da API
//     (`AgricultureApplicationManagementReportOutputType`) é EXATAMENTE
//     'pdf'|'xlsx' (não 'excel' como StockAbcReport) — NUNCA confundir os 2
//     enums de formato entre módulos distintos.
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`):
//   - `app/Http/Resources/V1/ProductionCycleOptionResource.php` (uuid/code/
//     start_date/end_date/areas[uuid,description])
//   - `app/Http/Resources/V1/AreaOptionResource.php` (uuid/description/
//     productive_area)
//   - `app/Http/Resources/V1/GroupProductOptionResource.php` (uuid/label)
//   - `app/Http/Requests/Api/V1/AgricultureApplicationManagementReportRequest.php`
//     (`start_date`/`end_date` obrigatórios; `area_uuids[]`/`report_type`/
//     `group_uuid`/`category_uuid`/`kind_uuid` opcionais; `format`
//     `required|in:pdf,xlsx`)
//   - `app/Data/Reports/AgricultureApplicationManagementReport/
//     AgricultureApplicationManagementReportFilterData.php` (SEM
//     `production_cycle` — DEC-265/DEC-260)
//
// `category_uuid`/`kind_uuid` são alimentados pela cascata GENÉRICA já
// existente (`GET /category-products/options?group_uuid=`, `GET /kinds/
// options?category_uuid=`, ver `listCategoryProductOptions`/`listKindOptions`)
// — ZERO tipo/endpoint novo para eles, só consumo (mirror
// `FilterSideCatalogo.tsx`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// Enum PRÓPRIO deste módulo — NUNCA reusar `StockAbcReportFormat` ('excel')
// nem `ReportFormat` de AccountsReports (mesmo domínio 'pdf'|'xlsx', mas
// isolamento de módulo é a convenção do codebase, ver nota de topo).
export type AgricultureApplicationManagementReportFormat = 'pdf' | 'xlsx';

// `report_type` é filtro de RENDER no servidor (Action monta os 3 blocos
// sempre; ausência = os 3 aparecem) — contrato `nullable|string|in:inputs,
// services,occurrences` (AgricultureApplicationManagementReportRequest).
export type AgricultureApplicationManagementReportType = 'inputs' | 'services' | 'occurrences';

/** Área embutida no Ciclo de Produção (cascata IG-01, SEM `productive_area`
 * — mirror `ProductionCycleOptionResource::toArray()`, bloco `areas`). */
export interface AgricultureApplicationManagementReportCycleAreaRef {
  uuid: string;
  description: string;
}

/** Ciclo de Produção (LK-01) — mirror `ProductionCycleOptionResource`. */
export interface AgricultureApplicationManagementReportProductionCycleRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend — cascata IG-01 100% client-side, sem endpoint dedicado. */
  areas: AgricultureApplicationManagementReportCycleAreaRef[];
}

/** Universo de Talhões (LK-02) — mirror `AreaOptionResource`. */
export interface AgricultureApplicationManagementReportAreaRef {
  uuid: string;
  description: string;
  productive_area: number;
}

/** Grupo de Produto (LK-03, NOVO nesta feature) — mirror `GroupProductOptionResource`. */
export interface AgricultureApplicationManagementReportGroupRef {
  uuid: string;
  label: string;
}

export interface AgricultureApplicationManagementReportOptionsData {
  productionCycles: AgricultureApplicationManagementReportProductionCycleRef[];
  /** Universo COMPLETO — carregado inteiro, sem paginação/busca no servidor. */
  areas: AgricultureApplicationManagementReportAreaRef[];
  groups: AgricultureApplicationManagementReportGroupRef[];
}

export interface AgricultureApplicationManagementReportFilterForm {
  /** CLIENT-SIDE PURO (IG-01/IG-02) — NUNCA compõe `AgricultureApplicationManagementReportParams`. */
  production_cycle: Option<string> | null;
  area_uuids: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
  report_type: Option<AgricultureApplicationManagementReportType> | null;
  group_uuid: Option<string> | null;
  category_uuid: Option<string> | null;
  kind_uuid: Option<string> | null;
  format: Option<AgricultureApplicationManagementReportFormat> | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com
 * `AgricultureApplicationManagementReportRequest::rules()`. SEM
 * `production_cycle`/`production_cycle_uuid` (DEC-265 — campo morto,
 * diferente de F-298). */
export interface AgricultureApplicationManagementReportParams {
  start_date: string;
  end_date: string;
  area_uuids?: string[];
  report_type?: AgricultureApplicationManagementReportType;
  group_uuid?: string;
  category_uuid?: string;
  kind_uuid?: string;
  format: AgricultureApplicationManagementReportFormat;
}
