// src/@types/v2/Relatorios/production-per-worker-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Prod./Colaborador" (F-300, lote 079,
// F-300-plano-frontend.md TASK-300-FE-01). Mirror ESTRUTURAL de
// `production-costing-area-report.ts` (F-298, flat, não Module/Entity
// aninhado) — reuso literal do mecanismo de cascata IG-01/IG-02.
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`), não adivinhados:
//   - `app/Http/Resources/V1/TeamReportOptionResource.php` (LK-01, NOVO — uuid+name)
//   - `app/Http/Resources/V1/EmployeeOptionResource.php` (LK-02, reuso — uuid+name)
//   - `app/Http/Resources/V1/AreaOptionResource.php` (LK-03, reuso — uuid+description[+productive_area, não consumido nesta tela])
//   - `app/Http/Resources/V1/ProductionCycleOptionResource.php` (LK-04, reuso — MESMO resource do F-298)
//   - `app/Http/Requests/Api/V1/ProductionPerWorkerReportRequest.php`
//   - `app/Http/Controllers/Api/V1/ProductionPerWorkerReportController.php::options()`
//
// RISCO CRÍTICO DE NOMENCLATURA (mesmo padrão do F-298): a Request real da
// API usa `team_uuids[]`/`area_uuids[]`/`employee_uuids[]` — NÃO
// `teams`/`areas`/`employees` (nomes de EXIBIÇÃO usados só na forma interna
// do form). `production_cycle` NÃO É PARÂMETRO DE SERVIDOR — confirmado em
// `ProductionPerWorkerReportRequest::rules()` (ausente) e no plano de API
// §3 item 6: o ciclo só alimenta a cascata CLIENT-SIDE (IG-01/IG-02),
// nunca é enviado ao backend (diferente do F-298, que ainda envia
// `production_cycle_uuid` ignorado em silêncio — aqui nem isso: o campo é
// 100% ausente do payload, mirror `ProductionPerWorkerReportFilterData`).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface TeamOptionRef {
  uuid: string;
  name: string;
}

export interface EmployeeOptionRef {
  uuid: string;
  name: string;
}

export interface ProductionPerWorkerAreaRef {
  uuid: string;
  description: string;
}

export interface ProductionCycleOptionRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend — cascata IG-01 100% client-side, sem endpoint dedicado. */
  areas: ProductionPerWorkerAreaRef[];
}

export interface ProductionPerWorkerReportOptionsData {
  teams: TeamOptionRef[];
  employees: EmployeeOptionRef[];
  /** Universo COMPLETO (LK-03) — carregado inteiro, sem paginação/busca no servidor. */
  areas: ProductionPerWorkerAreaRef[];
  productionCycles: ProductionCycleOptionRef[];
}

export interface ProductionPerWorkerReportFilterForm {
  teams: Option<string>[] | null;
  /** CLIENT-ONLY — alimenta a cascata IG-01/IG-02, nunca vai ao servidor (§B.2 do plano). */
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
  employees: Option<string>[] | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `ProductionPerWorkerReportRequest::rules()`.
 * `production_cycle` NUNCA aparece aqui (client-only, confirmado ausente do server). */
export interface ProductionPerWorkerReportParams {
  team_uuids?: string[];
  area_uuids?: string[];
  employee_uuids?: string[];
  start_date: string;
  end_date: string;
}
