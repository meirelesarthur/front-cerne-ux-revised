// src/@types/v2/Relatorios/profitability-by-crop-report.ts
// -----------------------------------------------------------------------------
// Tipos de domínio do relatório "Rentabilidade/Cultura" (F-302, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-302-plano-front.md). Mirror ESTRUTURAL de
// `production-costing-area-report.ts` (F-298) no que toca a cascata
// harvest→datas, e de `sale-client-report.ts` (F-313) no que toca o casco de
// filtro+download PDF-only, SEM seletor de formato (F-302-plano-api.md §4 —
// endpoint é PDF puro, sem parâmetro `report_type`).
//
// `cultivation_uuid` é REQUIRED (diferente de todo campo opcional dos
// templates F-230/F-298/F-313) — validado com `v.option<string>()`
// (`fieldValidationSchema`), NÃO `optionSchema.nullable().default(null)`.
//
// `harvest` é 100% CLIENT-SIDE (F-302-plano-api.md §4: "aceito, NÃO usado
// para filtrar... nullable") — só autopreenche `start_date`/`end_date` via
// cascata (mirror IG-01/IG-02 de `ProducaoCusteioArea`); NUNCA enviado ao
// service (risco 3 do plano de front — omitido do payload real).
// -----------------------------------------------------------------------------

import type { Option } from '@/@types/option';

export interface ProfitabilityByCropReportFilterForm {
  /** REQUIRED pelo schema (`v.option<string>()`), tipado nullable no form. */
  cultivation_uuid: Option<string> | null;
  /** 100% client-side — só autopreenche `start_date`/`end_date` via cascata
   *  (IG-01/IG-02, mirror `ProducaoCusteioArea`). NUNCA enviado ao service. */
  harvest: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

/** Payload REAL enviado ao servidor — mirror EXATO `F-302-plano-api.md §4`
 *  (FormRequest). `harvest`/`harvest_uuid` NUNCA aparece aqui (decisão
 *  registrada — risco 3 da "Leitura do dev" do plano de front). */
export interface ProfitabilityByCropReportParams {
  cultivation_uuid: string;
  start_date: string;
  end_date: string;
}
