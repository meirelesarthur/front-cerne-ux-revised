// src/@types/language/module-dashboards/rainfall-dashboard.d.ts
// Tipo espelhado da tela Pluviometria (execução 048, TASK-01-FE).
//
// **CORREÇÃO PÓS-E2E (048):** `charts.daysTitle/daysRainySeries/
// daysNonRainySeries` removidos (bloco "Pluviometria (dias)" não tem mais
// fonte — o backend real nunca publicou contagem de dias com/sem chuva);
// `applicationWindow.status` (enum `excellent`/`warning`/`unviable`/
// `unavailable`) removido — `status` é TEXTO LIVRE que a própria API
// publica (`RainfallApplicationWindow.status`), não um enum traduzido.

export interface ModuleDashboardsRainfallDashboard {
  /** Usado na composição da query-key (`dashboards.rainfallDashboard`). */
  singularLabel: string;
  title: string;
  subtitle: string;
  filter: {
    title: string;
    period: string;
    periodOptions: {
      d30: string;
      d90: string;
      m12: string;
    };
    area: string;
    areaAllPlaceholder: string;
  };
  kpis: {
    accumulated7d: string;
    soilMoisture: string;
    nextRain: string;
    nextRainNoForecast: string;
    alerts: string;
    noAlerts: string;
  };
  charts: {
    volumeTitle: string;
    volumeSeries: string;
    byAreaTitle: string;
    byAreaSeries: string;
  };
  applicationWindow: {
    title: string;
  };
  weekForecast: {
    title: string;
    source: string;
    /** Rótulo do 1º dia da tira (hoje) — demais dias usam `day_name` real da API. */
    today: string;
  };
}
