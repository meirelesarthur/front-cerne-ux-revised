// src/@types/v2/Dashboards/depreciationDashboard/index.d.ts
// Tipos da dashboard Depreciações (execução 048, TASK-02-FE). Fonte:
// `CONTRATO-API-048-02-depreciation-dashboard.md §2/§4` (contrato APROVADO,
// handover LIBERADO — shape abaixo é o FINAL, não um esperado). Filtro real
// é `year`/`asset_type` (o preset 3/6/12 meses do rascunho do ROTEIRO §5.2
// não existe no contrato de API final — resolvido a favor do contrato
// aprovado, mesmo racional do §5.1.1 da Pluviometria: dado tem precedência
// sobre desenho especulativo). `forecast_24m` REUSA `DepreciationForecastRow`
// do módulo de simulação já existente (`CalculateDepreciationForecastAction`,
// mesmos campos — `vl_depreciate` sempre ao vivo do Equipment, nunca
// congelado). `meta` aditivo (ver `dashboard-meta.d.ts`).

import type { Option } from '@/@types/option';
import type { DepreciationForecastRow } from '@/@types/v2/BaseRegistrations/depreciationForecasts';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

export type DepreciationAssetType = 'all' | 'equipment' | 'animal';

/** Forma INTERNA do filtro (Option-based) — mesmo racional de `AssetsDashboardFilterForm`. */
export interface DepreciationDashboardFilterForm {
  year: Option<number> | null;
  assetType: Option<DepreciationAssetType> | null;
}

export interface DepreciationDashboardFilterRequest {
  year?: number;
  asset_type?: DepreciationAssetType;
}

export interface DepreciationAccumulated {
  total_equipment: number;
  total_animal: number;
  total: number;
}

export interface DepreciationMonthlyRow {
  year: number;
  month: number;
  equipment_total: number;
  animal_total: number;
}

/** `category` é texto livre (`family_equipments.description`) — front NUNCA hardcoda buckets (DEC-190). */
export interface DepreciationCompositionRow {
  category: string;
  value: number;
  percent: number;
}

export interface DepreciationDashboardData {
  accumulated: DepreciationAccumulated;
  monthly: DepreciationMonthlyRow[];
  composition: DepreciationCompositionRow[];
  /** Linha 0 = âncora (posição atual); linhas 1..months = projeção futura (CV-006, piso zero). */
  forecast_24m: DepreciationForecastRow[];
  /**
   * CORREÇÃO PÓS-HOMOLOGAÇÃO (048): campos NOVOS que a API passa a publicar
   * — valor total do bem (imobilizado) e saldo residual agregados da
   * fazenda. Opcionais (`?`) até a Onda 1 API-arch confirmar 100% do
   * rollout — ausência não quebra a tela (KPI cai no fallback `—`).
   */
  valor_do_bem?: number;
  saldo_residual?: number;
  meta?: DashboardMeta;
}
