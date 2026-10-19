// src/@types/v2/Relatorios/costing-area-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Custeio/Área" (F-252, esteira
// CORE_WORKSPACE/97-Esteiras/079, TASK-252-FE-01) — tela NOVA, distinta de
// `ProducaoCusteioArea` (F-298, rota/controller/permissão diferentes, ver
// `F-252-plano-frontend.md §0`). Mirror ESTRUTURAL de
// `production-costing-area-report.ts` (F-298), MESMO shape de filtro (4
// campos, SEM `grazings` de F-251).
//
// Shapes confirmados por leitura DIRETA do código real da API já
// materializada (`GB.Cerne.Api`), não adivinhados:
//   - `app/Http/Resources/V1/ProductionCycleOptionResource.php` (LKP-02)
//   - `app/Http/Resources/V1/AreaOptionResource.php` (LKP-01)
//   - `app/Http/Requests/Api/V1/CostingAreaReportRequest.php` (payload real
//     confirmado: `production_cycle_uuid`, `area_uuids[]`, `start_date`,
//     `end_date`)
//
// RISCO CRÍTICO DE NOMENCLATURA (mirror F-298): a Request real usa
// `production_cycle_uuid`/`area_uuids[]` — NÃO `production_cycle`/`areas`
// como o texto do roteiro descreve o campo pelo nome de EXIBIÇÃO. Este
// arquivo segue o contrato REAL (`CostingAreaReportRequest::rules()`).
//
// `production_cycle_uuid` é aceito pelo servidor mas só alimenta a cascata
// CLIENT-SIDE de datas/áreas (IG-01) antes do submit — mesma fidelidade ao
// legado (CLM-004) já registrada em F-298.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface CostingAreaRef {
  uuid: string;
  description: string;
}

export interface ProductionCycleOptionRef {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend — cascata IG-01 100% client-side, sem endpoint dedicado. */
  areas: CostingAreaRef[];
}

export interface CostingAreaReportOptionsData {
  productionCycles: ProductionCycleOptionRef[];
  /** Universo COMPLETO (LKP-01) — carregado inteiro, sem paginação/busca no servidor. */
  areas: CostingAreaRef[];
}

export interface CostingAreaReportFilterForm {
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — nomes 1:1 com `CostingAreaReportRequest::rules()`. */
export interface CostingAreaReportParams {
  production_cycle_uuid?: string;
  area_uuids?: string[];
  start_date: string;
  end_date: string;
}
