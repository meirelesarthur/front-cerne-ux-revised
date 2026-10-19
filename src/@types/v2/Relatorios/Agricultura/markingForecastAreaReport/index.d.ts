// src/@types/v2/Relatorios/Agricultura/markingForecastAreaReport/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Prev. Área/Receita" (F-280, TASK-MFA-FE-01, esteira
// 075). Mirror ESTRUTURAL de `stock-movement-report-service.ts` (payload) +
// `MovimentacaoEstoqueFilterForm` (forma interna do form) — tela de filtro +
// 1 download (PDF), sem grid/prévia (contrato de tela §1/§3).
//
// `production_cycle` (Ciclo de Produção) é JS-only (`CL-10`, contrato de
// tela §5) — existe SÓ na forma interna do form (`MarkingForecastAreaReportFilterForm`),
// NUNCA em `MarkingForecastAreaReportParams` (payload real do endpoint).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

// ============================================
// PAYLOAD (query string do endpoint, contrato de tela §3)
// ============================================

export interface MarkingForecastAreaReportParams {
  areas?: string[];
  start_date?: string;
  end_date?: string;
  variety_id?: string;
  order?: number;
  week?: number;
  year?: number;
}

// ============================================
// REACT HOOK FORM (forma interna, Option-based — contrato de tela §2)
// ============================================

export interface MarkingForecastAreaReportFilterForm {
  /** JS-only (`CL-10`/`CL-11`) — cascata client-side, NUNCA entra em `MarkingForecastAreaReportParams`. */
  production_cycle: Option<string> | null;
  areas: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
  variety: Option<string> | null;
  order: Option<number> | null;
  week: string;
  year: string;
}

// ============================================
// OPTIONS — lookup local FLAT de Área (`GET /areas/options`, mirror EXATO
// `getAreasOptions()` de `rainfall-service.ts`/`harvestProduct-service.ts`).
// ============================================

export interface MarkingForecastAreaOptionItem {
  uuid: string;
  description: string;
}

export interface MarkingForecastAreaFlatOptionsEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
}
