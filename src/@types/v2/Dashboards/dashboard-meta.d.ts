// src/@types/v2/Dashboards/dashboard-meta.d.ts
// Metadado transversal dos dashboards analíticos (execução 046,
// TASK-DASH-FE-06 — criada na reconciliação, ver
// `05-RECONCILIACAO-front-x-api-046.md` MUD-046-04).
//
// A API publica `meta.proxies[]` (métrica DERIVADA, com a regra de cálculo)
// e `meta.lacunas[]` (bloco sem fonte real). O front NUNCA hardcoda o badge
// "Estimado via ..."/a nota de lacuna — eles são renderizados a partir deste
// dado (ver `ProxyBadge`/`LacunaNote`, `src/components/Dashboard/`).
// `meta` ausente (endpoint que não tem nada a declarar) não quebra a tela.

export interface DashboardMetaProxy {
  /** Identifica o bloco/card do dashboard ao qual a regra se aplica (ex.: `kpi-taxa-adesao`). */
  block_id: string;
  /** Regra de derivação exibida no tooltip do `ProxyBadge`. */
  rule: string;
}

export interface DashboardMetaLacuna {
  /** Identifica o bloco/card do dashboard sem fonte de dado. */
  block_id: string;
  /** Motivo da ausência, exibido pela `LacunaNote` no lugar do valor. */
  reason: string;
}

export interface DashboardMeta {
  proxies?: DashboardMetaProxy[];
  lacunas?: DashboardMetaLacuna[];
}
