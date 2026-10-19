// src/@types/v2/Dashboards/rainfallDashboard/index.d.ts
// Tipos da dashboard Pluviometria (execução 048, TASK-01-FE).
//
// **CORREÇÃO PÓS-E2E CRÍTICA (048):** shape abaixo RECONCILIADO byte-a-byte
// contra o payload REAL capturado do ambiente rodando
// (`GB.Cerne.FrontEnd/e2e/_048-dash/pluviometria.json`, `body.data`) — a
// versão anterior era ESPECULATIVA (endpoint ainda não existia quando a
// tela foi construída) e **crashava a tela**: lia
// `historical.days_by_month`/`historical.volume_by_month` (campos que NUNCA
// existiram no backend real) — `undefined.length` explodia em
// `index.tsx`. O backend real só publica `historical.accumulated_by_period`/
// `historical.by_area`; não existe contagem de dias com/sem chuva.
//
// Outras divergências corrigidas: `forecast.next_rain` é `{label,amount}`
// (rótulo JÁ FORMATADO pelo backend, ex. `"Quinta, 3 Setembro"` — sem
// `date`/`threshold_mm`); `forecast.week_forecast[]` é
// `{day_name,temp_max,temp_min,precipitation,icon}` (`day_name` já
// localizado, `icon` é uma classe Font Awesome do legado — sem `date`/
// `weather_code` WMO); `forecast.application_window` é
// `{status,color,message,source}` — `status` é TEXTO LIVRE do backend
// (`"Atenção"`, não um enum `warning`/`excellent`) e `color` é o HEX que a
// própria API publica (sem `source_label`, campo renomeado `source`).

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

/** `CONTRATO-API-048-01 §2` — janela do histórico agregado, default `12m`. */
export type RainfallPeriod = '30d' | '90d' | '12m';

/** Forma INTERNA do filtro (Option-based) — mesmo racional de `AssetsDashboardFilterForm`. */
export interface RainfallDashboardFilterForm {
  area: Option<string> | null;
  period: Option<RainfallPeriod> | null;
}

export interface RainfallDashboardFilterRequest {
  area_uuid?: string;
  period?: RainfallPeriod;
}

/** Acumulado (mm) por período mensal (`"YYYY-MM"`) — série única, sem quebra dias com/sem chuva. */
export interface RainfallAccumulatedPeriodRow {
  period: string;
  amount: number;
}

/** Acumulado por área (mm) — `area_rainfall`, recorte do filtro. */
export interface RainfallByAreaRow {
  area_uuid: string;
  label: string;
  amount: number;
}

export interface RainfallHistorical {
  accumulated_by_period: RainfallAccumulatedPeriodRow[];
  by_area: RainfallByAreaRow[];
}

/**
 * 1 dia da previsão semanal — `day_name` já localizado pelo backend, `icon`
 * é classe Font Awesome do legado, agora decidida pela precipitação real
 * (`fa-sun`, `fa-cloud-sun`, `fa-cloud-rain`, `fa-cloud-showers-heavy`,
 * `fa-bolt`, `fa-snowflake`, `fa-smog`, `fa-cloud`). `weather_code` (WMO)
 * é opcional — o backend passou a expor em paralelo, mas o ícone do front
 * continua derivado de `icon` (Regra: não mudar lógica de temp/precipitação).
 */
export interface RainfallWeekForecastDay {
  day_name: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  icon: string;
  weather_code?: number;
}

/** Janela de aplicação — `status`/`color`/`message`/`source` são TEXTO/HEX livres publicados pela API, nunca um enum do front. */
export interface RainfallApplicationWindow {
  status: string;
  color: string;
  message: string;
  source: string;
}

/** Próxima chuva — `label` já vem formatado pelo backend (data por extenso). */
export interface RainfallNextRain {
  label: string;
  amount: number;
}

/**
 * CORREÇÃO PÓS-E2E (048, 3ª rodada) — `alerts[]` é ARRAY DE OBJETOS
 * `{type,icon,color}`, não `string[]` (tipo antigo, especulativo). `type` é
 * o texto exibível (ex. `"Déficit Hídrico"`); `icon`/`color` são metadados
 * livres do backend (classe Font Awesome do legado / cor semântica) — o
 * front NUNCA renderiza o objeto inteiro como filho React (`{alert}` cru),
 * sempre `alert.type`.
 */
export interface RainfallAlert {
  type: string;
  icon: string;
  color: string;
}

export interface RainfallForecast {
  /** Chuva acumulada últimos 7 dias (mm). */
  accumulated: number;
  /** Umidade do solo atual (%). */
  soil_moisture: number;
  next_rain: RainfallNextRain | null;
  /** "Chuva Intensa"/"Déficit Hídrico"; vazio = nenhum alerta ativo. */
  alerts: RainfallAlert[];
  week_forecast: RainfallWeekForecastDay[];
  application_window: RainfallApplicationWindow | null;
}

export interface RainfallDashboardData {
  historical: RainfallHistorical;
  /** `null` quando a fazenda não tem `latitude`/`longitude` — ver `meta.lacunas`. */
  forecast: RainfallForecast | null;
  meta?: DashboardMeta;
}
