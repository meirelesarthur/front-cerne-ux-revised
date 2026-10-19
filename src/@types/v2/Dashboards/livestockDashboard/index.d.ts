// src/@types/v2/Dashboards/livestockDashboard/index.d.ts
// Tipos da dashboard Pecuária de Corte (execução 048, TASK-05-FE). Fonte:
// `CONTRATO-API-048-05-livestock-dashboard.md §2/§4` (contrato
// APPROVED_WITH_NOTES, readback MCP confirmado `9fc1471c`) — endpoint ainda
// PLANEJADO no momento desta Tarefa (Onda 1 API-arch publica em paralelo,
// mesma técnica de `rainfallDashboard`/`depreciationDashboard`/
// `financialDashboard`).
//
// Filtro real segue o padrão JÁ ESTABELECIDO pela dashboard irmã
// `AbcIndicators` (execução 046, MESMA cascata Safra→datas, `getHarvest`
// reusado): `harvest_uuid`/`start_date`/`end_date`, não os nomes abreviados
// `harvest_id`/`period` do §2 do contrato (prosa curta, não nomenclatura
// literal) — mirror do padrão vivo já em produção nesta SPA.
//
// **DEC-101** — `by_breed`/`by_category` são o catálogo REAL (35 raças/42
// categorias); front NUNCA hardcoda os 5 nomes de exemplo do UX
// (Angus/Brangus/Cruzado/Nelore/Senepol), sempre agrupa top-N + "Outros"
// no cliente sobre o array que a API mandar (`ROTEIRO §5.5`).
//
// **Escopo de tabs (`ROTEIRO §5.5`, DoD desta Tarefa):** o backend decidiu
// CONSTRUIR os blocos `productive`/`reproductive` como especificação nova
// (`DECISOES-048.md §A`), mas o FRONT não implementa abas "Produtivo"/
// "Reprodutivo" (mirror do legado morto, `CV-025/026`, que a UX também não
// pede) — os campos usados aqui (`productive.arroba_per_month`,
// `productive.weighings_count_by_month`, `reproductive.births/deaths`)
// entram como CARDS/GRÁFICOS FLAT na tela única, nunca como navegação por
// aba.
//
// Os 32 KPIs financeiros (`LST-001..032` do contrato normalizado) vêm como
// ARRAY (`kpis[]`), mirror da própria forma declarada no contrato de API
// (`kpis: [ ...32 cards financeiros... ]`) — o front NUNCA hardcoda os 32
// nomes/posições, só itera e formata pelo `key` de cada item (ver
// `formatLivestockKpi`).
//
// **CORREÇÃO PÓS-E2E (048, correção de front na Pecuária):** shape abaixo
// RECONCILIADO byte-a-byte com o backend REAL, já publicado
// (`GB.Cerne.Api/app/Repositories/LivestockDashboardRepository.php`,
// `LivestockDashboardResource`/`GetLivestockDashboardAction`), não mais o
// contrato PLANEJADO — 2 divergências corrigidas:
// 1. `general.kpis[]` vem com `{key,label,value,color}` — NUNCA um campo
//    `format` (não existe no payload real); `formatLivestockKpi` agora
//    infere o formato pelo `key` (pequena tabela de EXCEÇÕES: só
//    `total_animais`/`peso_total_kg`/`peso_total_arroba`/`area_total_ha`
//    fogem de `currency`, os outros 28 campos são valores monetários reais
//    — não é o mesmo tipo de hardcode proibido pelo ROTEIRO §5.5, que veda
//    hardcodar EXISTÊNCIA/ORDEM dos 32 cards, não a heurística de formato).
// 2. `composition.by_breed`/`by_category` vêm com `{breed_uuid|category_uuid,
//    label,total}` (`LivestockDashboardRepository::compositionByBreedAndCategory`)
//    — NUNCA `{uuid,count}` (nomes antigos, especulativos, causavam os 2
//    `DonutChart` renderizarem em branco: `row.count` sempre `undefined`
//    fazia `DonutChart.isEmpty` disparar em toda fatia).

import type { Option } from '@/@types/option';
import type { DashboardMeta } from '@/@types/v2/Dashboards/dashboard-meta';

/**
 * Forma INTERNA do filtro (Option-based) — mesmo racional de
 * `AbcIndicatorsFilterForm`. `breed`/`category` usam UUID (não o `int`
 * abreviado do §2 do contrato de API) — mirror dos endpoints JÁ MIGRADOS
 * `/breeds/options`/`/category-animals/options` (`listBreedOptions`/
 * `listCategoryAnimalOptions`), que só expõem `uuid` (regra "uuid, nunca
 * id" da SPA já vale para esses 2 catálogos).
 */
export interface LivestockDashboardFilterForm {
  harvest: Option<string> | null;
  startDate: string | null;
  endDate: string | null;
  breed: Option<string> | null;
  category: Option<string> | null;
}

export interface LivestockDashboardFilterRequest {
  harvest_uuid?: string;
  start_date?: string | null;
  end_date?: string | null;
  breed_uuid?: string;
  category_uuid?: string;
}

export type LivestockKpiFormat =
  'currency' | 'weight_kg' | 'weight_arroba' | 'area_ha' | 'percent' | 'count' | 'ratio';

/**
 * 1 dos 32 cards financeiros ativos (`LST-001..032`) — array, nunca objeto
 * de chaves fixas. `color` é o hex semântico que a própria API publica
 * (`#28a745` positivo/`#dc3545` negativo/`#007bff` info/`#17a2b8` peso) —
 * dado do backend, não escolha de design do front.
 */
export interface LivestockKpiRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Composição por raça — `LivestockDashboardRepository::compositionByBreedAndCategory`. */
export interface LivestockBreedRow {
  breed_uuid: string;
  label: string;
  total: number;
}

/** Composição por categoria — mesmo método, bucket `by_category`. */
export interface LivestockCategoryRow {
  category_uuid: string;
  label: string;
  total: number;
}

export interface LivestockGeneral {
  kpis: LivestockKpiRow[];
  composition: {
    by_breed: LivestockBreedRow[];
    by_category: LivestockCategoryRow[];
  };
}

export interface LivestockGmdRow {
  batch_id: number;
  /** Real: pode vir `null` (lote sem categoria única, `LivestockDashboardRepository::gmdByBatch`). */
  category_id: number | null;
  gmd_kg_day: number;
}

export interface LivestockArrobaMonthRow {
  month: string;
  arrobas: number;
}

export interface LivestockWeighingsMonthRow {
  month: string;
  total: number;
}

/**
 * CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 3ª rodada) — "Manejos por mês" ganha as 2
 * séries que a API já publica ao lado de `weighings_count_by_month`
 * (mesma forma `{month,total}`), consumidas pelo `ManejosPorMes.tsx` em
 * barras agrupadas (Pesagens/Sanitários/Nutrições).
 */
export interface LivestockProductive {
  gmd_by_batch: LivestockGmdRow[];
  arroba_per_month: LivestockArrobaMonthRow[];
  weighings_count_by_month: LivestockWeighingsMonthRow[];
  sanitary_management_by_month?: LivestockWeighingsMonthRow[];
  nutrition_management_by_month?: LivestockWeighingsMonthRow[];
}

export interface LivestockPeriodCount {
  total: number;
  period: string;
}

export interface LivestockReproductive {
  pregnancy_diagnosis: LivestockPeriodCount;
  matings: LivestockPeriodCount;
  weanings: LivestockPeriodCount;
  births: LivestockPeriodCount;
  deaths: LivestockPeriodCount;
}

export interface LivestockHerdEvolutionRow {
  month: string;
  headcount: number;
}

/** 1 fatia de categoria dentro de um mês de `herd_evolution_by_category[]`. */
export interface LivestockHerdEvolutionCategorySlice {
  category_uuid: string;
  label: string;
  total: number;
}

/**
 * CORREÇÃO PÓS-HOMOLOGAÇÃO (048, 2ª rodada) — "Evolução do rebanho" por
 * categoria (multi-série). Campo NOVO, ainda opcional (`?`) até a Onda 1
 * API-arch confirmar 100% do rollout — ausente/vazio, `EvolucaoRebanho.tsx`
 * cai no fallback da série única de total (`herd_evolution`), sem crash.
 * `sum(categories[].total) === herd_evolution[mesmo mês].headcount`.
 */
export interface LivestockHerdEvolutionByCategoryRow {
  month: string;
  categories: LivestockHerdEvolutionCategorySlice[];
}

export interface LivestockDashboardData {
  general: LivestockGeneral;
  productive: LivestockProductive;
  reproductive: LivestockReproductive;
  herd_evolution: LivestockHerdEvolutionRow[];
  herd_evolution_by_category?: LivestockHerdEvolutionByCategoryRow[];
  meta?: DashboardMeta;
}
