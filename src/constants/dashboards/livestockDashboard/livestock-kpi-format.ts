// src/constants/dashboards/livestockDashboard/livestock-kpi-format.ts
// Formatador dos 32 KPIs financeiros ativos (`LST-001..032`). **CORREÇÃO
// PÓS-E2E (048):** o payload real de `general.kpis[]`
// (`LivestockDashboardRepository::kpis()`) NUNCA publicou um campo
// `format` — só `{key,label,value,color}`. A versão anterior deste
// arquivo lia `kpi.format` (sempre `undefined` em runtime, caía no
// `default: count`) — todo card financeiro saía sem `R$`/2 casas.
//
// A tabela abaixo é uma EXCEÇÃO pequena e estável por `key` técnico (não
// por posição/rótulo, não é o hardcode dos 32 nomes vedado pelo ROTEIRO
// §5.5): dos 32 `key`s reais do Repository, só 4 não são valor monetário
// (`total_animais` é contagem; `peso_total_kg`/`peso_total_arroba`/
// `area_total_ha` são grandeza física, não preço). Os outros 28 —
// incluindo `preco_medio_kg_*`/`preco_medio_arroba_*`/`mb_kg`/`ml_kg`/
// `mb_arroba`/`ml_arroba`/`mb_ha`/`ml_ha`, que têm "kg"/"arroba"/"ha" no
// NOME mas são PREÇO/MARGEM em R$ por unidade, não a grandeza em si — são
// `currency` por default. Um `key` novo que a API vier a publicar cai no
// default `currency` (o caso majoritário), nunca quebra.

import type { LanguageDate } from '@/@types/language';
import type { LivestockKpiFormat } from '@/@types/v2/Dashboards/livestockDashboard';

const NON_CURRENCY_FORMAT_BY_KEY: Record<string, LivestockKpiFormat> = {
  total_animais: 'count',
  peso_total_kg: 'weight_kg',
  peso_total_arroba: 'weight_arroba',
  area_total_ha: 'area_ha',
};

/**
 * Infere o formato de exibição de 1 KPI pelo `key` técnico publicado pela
 * API — nunca por posição/rótulo/índice do array.
 * @param {string} key - `kpi.key` vindo da API (ex.: `'receita_bruta'`).
 * @return {LivestockKpiFormat} Formato de exibição (default `'currency'`).
 */
export function inferLivestockKpiFormat(key: string): LivestockKpiFormat {
  return NON_CURRENCY_FORMAT_BY_KEY[key] ?? 'currency';
}

/**
 * Formata um KPI financeiro de Pecuária pelo formato inferido do `key`.
 * @param {number} value - Valor cru vindo da API.
 * @param {string} key - `kpi.key` vindo da API — determina o formato via `inferLivestockKpiFormat`.
 * @param {LanguageDate} languageGB - Dicionário ativo (sufixo de unidade).
 * @return {string} Valor formatado pt-BR + sufixo de unidade.
 */
export function formatLivestockKpi(value: number, key: string, languageGB: LanguageDate): string {
  const suffixes = languageGB.dashboards.livestockDashboard.formats;
  const format = inferLivestockKpiFormat(key);

  switch (format) {
    case 'currency':
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'weight_kg':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${suffixes.weightKgSuffix}`;
    case 'weight_arroba':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${suffixes.weightArrobaSuffix}`;
    case 'area_ha':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${suffixes.areaHaSuffix}`;
    case 'percent':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}${suffixes.percentSuffix}`;
    case 'ratio':
      return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${suffixes.ratioSuffix}`;
    case 'count':
    default:
      return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }
}
