// src/@types/v2/MarkingsFarmForecastReport/index.ts
// -----------------------------------------------------------------------------
// Tipos do relatório "Previsão Fazenda/Receita" (F-281, execução 055,
// roteiro-front-F281-prev-fazenda-receita.md §4/§6-TASK-01, TASK-055-F281-
// FRONT-01). Mirror estrutural de `@/@types/v2/WeighingHarvestReport` — tela
// de filtro + download binário, SEM grid/prévia. Diferente da irmã
// Pesagens/Colheita: esta tela é SÓ PDF (sem campo `format`, FID-G3F
// CL-031/RN-19 — divergência declarada do molde SPA), TODOS os 6 filtros
// são opcionais (RN-01: submit vazio gera PDF) e usa `cultivation`
// (Cultura→Variedade via `SelectCultivation`, uuid da variedade) + `forecast`
// (ordem de colheita 1ª/2ª/3ª) + `week`/`year` numéricos (D-FRONT-1: `year`
// incluído, fiel ao form legado de 6 campos).
//
// `MarkingsFarmForecastReportFilterForm` valida a FORMA INTERNA do form
// (Option-based, react-hook-form) — `MarkingsFarmForecastReportParams` é o
// payload 1:1 com o endpoint `GET /markings/forecast-farm-report`, campos
// opcionais SEMPRE `undefined` quando vazios (nunca `''`/`null` na query
// string).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export type MarkingsFarmForecastReportHarvestOrder = 1 | 2 | 3;

export interface MarkingsFarmForecastReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  cultivation: Option<string> | null;
  forecast: Option<MarkingsFarmForecastReportHarvestOrder> | null;
  week: number | null;
  year: number | null;
}

export interface MarkingsFarmForecastReportParams {
  start_date?: string;
  end_date?: string;
  cultivation?: string;
  forecast?: MarkingsFarmForecastReportHarvestOrder;
  week?: number;
  year?: number;
}
