// src/@types/v2/SupplyDashboard/index.d.ts
// -----------------------------------------------------------------------------
// Tipos do Dashboard de Suprimentos v2 (SupplyDashboard — Dashboards,
// esteira 97-Esteiras/019, Tarefa 55). Endpoint único, só leitura:
//   GET /api/v1/supply-dashboard → contrato `api-contract-suprimentos-v2.md` §7.
//
// Reformulação COMPLETA do payload v1 (`SupplyByTypeItem`/`SupplyDashboardTotals`
// removidos por completo, D-05 do PRD — não ficam como campos legados ao lado
// do novo shape). Entram: `SupplyDashboardFunnelStage`/`SupplyDashboardFunnel`
// (funil de 4 estágios), `SupplyDashboardKpi` (4 KPIs com sparkline/variação)
// e `SupplyDashboardProvider` (Top 5 fornecedores).
//
// `SupplyDashboardFilterForm`/`SupplyDashboardFilterRequest` INALTERADOS — o
// request não muda nesta reformulação (mesmos `farm_ids`/`harvest_id`/
// `start_date`/`end_date`, herdados do contrato v1).
//
// `harvest_id` é aceito pelo backend só por SIMETRIA (AD-05/GAP-SUP-02) — NÃO
// filtra o dataset (comportamento herdado, sem mudança nesta Tarefa).
// -----------------------------------------------------------------------------

export interface SupplyDashboardFilterForm {
  farm_ids?: string[];
  harvest_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface SupplyDashboardFilterRequest {
  farm_ids?: string[];
  harvest_id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

/** Estágio do funil (`funnel.stages[]`, 4 itens, ordem fixa do backend, AD-V2-04). */
export interface SupplyDashboardFunnelStage {
  stage: string;
  stage_label: string;
  volume: number;
  conversion_rate: number;
  average_value: number;
  /**
   * Meta/SLA (`supply_status_slas`) — `null` quando nenhuma farm filtrada tem
   * parâmetro configurado para a janela do estágio (AD-V2-05/CV2-5).
   */
  lead_time_hours: number | null;
  /**
   * Dwell-time real observado (`request_movements`, CV2-4) — `null` só
   * quando não há segmento mensurável no cohort do estágio.
   */
  actual_duration_hours: number | null;
  /** `true` quando o estágio agrega status fora do D-04 literal (GAP-DASH-01/02). */
  is_proxy: boolean;
  proxy_notes: string[] | null;
}

/** Funil completo (`funnel`, contrato de API §7). */
export interface SupplyDashboardFunnel {
  stages: SupplyDashboardFunnelStage[];
  final_conversion_rate: number;
}

/** KPI com sparkline/variação (`kpis[]`, 4 itens, ordem fixa do backend, AD-V2-07). */
export interface SupplyDashboardKpi {
  stage: string;
  label: string;
  value: number;
  /**
   * `null` = cresceu de uma base zero (sem `%` calculável) — a UI mostra
   * texto alternativo, nunca `"null%"`/`"NaN%"` (contrato de tela §6.2).
   */
  variation_percentage: number | null;
  variation_direction: 'up' | 'down' | 'flat';
  /** Tamanho VARIÁVEL (`GAP-DASH-05`, ≤7) — nunca assumir 7 pontos fixos. */
  sparkline: number[];
}

/**
 * Fornecedor do Top 5 (`top_providers[]`, 0 a 5 itens, já ordenado por
 * `total_value` desc pelo backend — nenhum sort no client, AD-V2-06).
 */
export interface SupplyDashboardProvider {
  provider_uuid: string;
  name: string;
  total_value: number;
  saving_percentage: number;
}

export interface SupplyDashboardData {
  period: {
    start_date: string;
    end_date: string;
  };
  /**
   * Janela imediatamente anterior, mesmo tamanho em dias (AD-V2-07) —
   * consumida só implicitamente via `variation_percentage`/
   * `variation_direction` dos KPIs (nenhum cálculo de janela no client,
   * RNF-06). Não renderizado diretamente nesta versão (contrato de tela §4).
   */
  previous_period: {
    start_date: string;
    end_date: string;
  };
  funnel: SupplyDashboardFunnel;
  kpis: SupplyDashboardKpi[];
  top_providers: SupplyDashboardProvider[];
}
