// src/@types/v2/BaseRegistrations/depreciationForecasts/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do módulo de PREVISÃO DE DEPRECIAÇÃO (DepreciationForecast — Cadastros
// Base / Bens-Ativos). TASK-FE-230 (fundação de dados, sem UI).
//
// Contrato (envelope ApiResponse { success, message, data, errors, meta }):
//   GET /depreciation-forecasts/equipment-options → data: EquipmentOption[],
//                                                    SEM paginação (meta null).
//   GET /depreciation-forecasts?equipment_id=&forecast_time= → data:
//                                                    DepreciationForecastData,
//                                                    SEM paginação (meta null).
//
// Módulo 100% leitura/simulação — não há payload de escrita, não há uuid (D4
// do contrato de API): nem `equipments` nem `depreciations` têm coluna `uuid`
// no fork, criar uma exigiria migration fora do escopo desta entrega. O
// endpoint expõe `id` bigint sequencial de Equipment — exceção documentada ao
// padrão "uuid sempre" da SPA (mesmo tipo de exceção já aceito em `Operation`).
//
// Fonte: `DepreciationForecast-contrato.md §6/§8`, `DepreciationForecast-FE-
// contrato.md §2`, TASK-FE-230.
// -----------------------------------------------------------------------------

// ============================================
// EQUIPMENT OPTION (select "Bem imobilizado")
// ============================================

/**
 * Opção do select de equipamento elegível — `id` bigint sequencial, NUNCA
 * `uuid` (exceção D4 do contrato de API: nem `equipments` nem `depreciations`
 * têm coluna uuid no fork, sem migration nesta entrega). O TypeScript deve
 * pegar em tempo de compilação qualquer tentativa de reintroduzir `uuid`
 * aqui — é a única exceção deste módulo ao padrão uuid da SPA.
 */
export interface EquipmentOption {
  id: number;
  description: string;
}

// ============================================
// PROJEÇÃO DE DEPRECIAÇÃO (resultado calculado, efêmero — nunca persistido)
// ============================================

export interface DepreciationForecastRow {
  year: number;
  month: number;
  vl_depreciate: number;
  vl_depreciation: number;
  sd_depreciate: number;
}

export interface DepreciationForecastData {
  equipment: EquipmentOption;
  forecast_time: number;
  months: number;
  rows: DepreciationForecastRow[];
}

// ============================================
// HORIZONTE DE PREVISÃO (select "Tempo de Previsão" — 16 opções ESTÁTICAS,
// sem chamada de API, ver TASK-FE-231)
// ============================================

export interface ForecastTimeOption {
  value: number;
  label: string;
}
