// src/@types/v2/Relatorios/Agricultura/markingForecastHarvestAreaReport/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Previsão Colheita/Área" (F-282, esteira 059,
// `CONTRATO-F282-previsao-colheita-area.md` §5). Shapes confirmados por
// leitura DIRETA do código real já materializado na API
// (`GB.Cerne.Api`), não adivinhados:
//   - `app/Http/Controllers/Api/V1/MarkingForecastHarvestAreaReportController.php`
//   - `app/Http/Requests/Api/V1/MarkingForecastHarvestAreaReportRequest.php`
//   - `app/Data/Reports/MarkingForecastHarvestArea/MarkingForecastHarvestAreaReportFilterData.php`
//   - `app/Http/Resources/V1/{ProductionCycleOptionResource,AreaOptionResource,CultivationOptionResource}.php`
//
// Mirror ESTRUTURAL de `markingForecastAreaReport/index.d.ts` (F-280) na
// forma dos tipos, combinando:
//   - a cascata client-side de `production_cycle` (mirror
//     `ProducaoCusteioArea`/F-298, IG-01/IG-02 — JS-only, NUNCA entra no
//     payload real do endpoint);
//   - o filtro `cultivation` como uuid FLAT resolvido pelo `/options`
//     combinado (`CultivationOptionResource`, label já composto
//     `"{cultura} - {variedade}"`) — NÃO usa `SelectCultivation`
//     (F-281/`PrevisaoFazendaReceita`) porque aqui o universo já chega
//     pronto no MESMO payload de `/options`, sem 2ª chamada de rede.
//
// `harvest` (DTO/Request real da API) é capacidade DORMENTE por decisão do
// Arquiteto (FUP-282-02, docblock do Controller: "aceita pela API sem campo
// correspondente no form de referência") — por isso NÃO existe em
// `MarkingForecastHarvestAreaReportFilterForm` nem em
// `MarkingForecastHarvestAreaReportParams` desta fatia frontend.
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// PAYLOAD (query string real de `GET /markings/forecast-harvest-area-report`,
// 1:1 com `MarkingForecastHarvestAreaReportRequest::rules()`)
// ============================================

export type MarkingForecastHarvestAreaReportOrder = 1 | 2 | 3 | 4;

export interface MarkingForecastHarvestAreaReportParams {
  areas?: string[];
  cultivation?: string;
  start_date?: string;
  end_date?: string;
  forecast?: MarkingForecastHarvestAreaReportOrder;
  week?: number;
  year?: number;
}

// ============================================
// REACT HOOK FORM (forma interna, Option-based)
// ============================================

export interface MarkingForecastHarvestAreaReportFilterForm {
  /** JS-only (mirror `ProducaoCusteioArea` IG-01/IG-02) — cascata
   *  client-side sobre o MESMO payload de `/options`, NUNCA entra em
   *  `MarkingForecastHarvestAreaReportParams`. */
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
  cultivation: Option<string> | null;
  forecast: Option<MarkingForecastHarvestAreaReportOrder> | null;
  week: number | null;
  year: number | null;
}

// ============================================
// OPTIONS — `GET /markings/forecast-harvest-area-report/options` (combinado,
// mirror `ProductionCycleOptionResource`/`AreaOptionResource`/`CultivationOptionResource`)
// ============================================

export interface MarkingForecastHarvestAreaOptionArea {
  uuid: string;
  description: string;
}

export interface MarkingForecastHarvestAreaProductionCycleOption {
  uuid: string;
  code: string;
  start_date: string;
  end_date: string;
  /** Eager-loaded pelo backend — cascata client-side, sem endpoint dedicado. */
  areas: MarkingForecastHarvestAreaOptionArea[];
}

export interface MarkingForecastHarvestAreaOptionItem {
  uuid: string;
  description: string;
  productive_area: number;
}

export interface MarkingForecastHarvestAreaCultivationOption {
  uuid: string;
  label: string;
}

export interface MarkingForecastHarvestAreaReportOptionsData {
  productionCycles: MarkingForecastHarvestAreaProductionCycleOption[];
  /** Universo COMPLETO — carregado inteiro, sem paginação/busca no servidor. */
  areas: MarkingForecastHarvestAreaOptionItem[];
  cultivations: MarkingForecastHarvestAreaCultivationOption[];
}
