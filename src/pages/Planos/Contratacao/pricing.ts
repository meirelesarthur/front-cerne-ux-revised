// src/pages/Planos/Contratacao/pricing.ts
// Regra de preço da contratação — funções PURAS (sem React), cobertas por `pricing.test.ts`.
// Porte fiel da lógica do simulador do documento "Precificação do GB Cerne".

import { CATALOG, type Catalog, type CatalogModule, type PlanTier, type SizeUnit } from './catalog';

export const RANK: Record<PlanTier | 'Nenhum', number> = { Pro: 0, Deluxe: 1, Enterprise: 2, Nenhum: 9 };

export interface Selection {
  plan: PlanTier;
  users: number;
  /** Chaves dos módulos marcados pelo usuário. */
  modules: ReadonlySet<string>;
  unit: SizeUnit;
  /** Tamanho da fazenda na medida escolhida. */
  size: number;
  /** Chave do serviço GB Consult (`none` = sem serviço). */
  consult: string;
}

export type QuoteInput = Pick<Selection, 'users' | 'modules' | 'unit' | 'size'>;

export interface Quote {
  tier: PlanTier;
  /** Faixa de tamanho, de 0 a 4 (faixa 1 a 5). */
  band: number;
  /** Faixa 5: o preço é ponto de partida para proposta. */
  openRange: boolean;
  base: number;
  /** Acessos acima do incluído no plano. */
  extraSeats: number;
  seatsTotal: number;
  /** Módulos pagos à parte neste plano. */
  addedModules: CatalogModule[];
  /** Módulos marcados que já vêm incluídos neste plano. */
  includedModules: CatalogModule[];
  modulesTotal: number;
  /** R$/mês do software. */
  month: number;
  /** `false` quando algum módulo marcado não existe neste plano (nem avulso). */
  valid: boolean;
}

/** Faixa de tamanho (0 a 4): primeira cujo limite comporta o tamanho; acima do último = faixa 5. */
export function bandIndex(unit: SizeUnit, size: number, catalog: Catalog = CATALOG): number {
  const limits = catalog.sizeUnits[unit].limits;
  let i = 0;
  while (i < 4 && size > limits[i]) i++;
  return i;
}

/** Pontos da régua: 0, os 4 limites e o máximo — 5 trechos iguais, um por faixa. */
const stops = (unit: SizeUnit, catalog: Catalog) => [0, ...catalog.sizeUnits[unit].limits, catalog.sizeUnits[unit].max];

/** Tamanho → posição na régua (0 a 500, 100 por faixa). */
export function sizeToPosition(unit: SizeUnit, size: number, catalog: Catalog = CATALOG): number {
  const s = stops(unit, catalog);
  for (let i = 0; i < 5; i++) {
    if (size <= s[i + 1]) return i * 100 + ((size - s[i]) / (s[i + 1] - s[i])) * 100;
  }
  return 500;
}

/** Posição na régua → tamanho (arredondado em passos de 10/50/100). */
export function positionToSize(unit: SizeUnit, position: number, catalog: Catalog = CATALOG): number {
  const s = stops(unit, catalog);
  const i = Math.min(4, Math.floor(position / 100));
  const v = s[i] + ((position - i * 100) / 100) * (s[i + 1] - s[i]);
  const step = v < 1000 ? 10 : v < 5000 ? 50 : 100;
  return Math.max(1, Math.round(v / step) * step);
}

/** Plano mínimo em que um módulo pode ser usado (avulso → qualquer um; senão, o que o inclui). */
export const minTierFor = (m: CatalogModule): PlanTier =>
  m.price === null ? (m.includedIn as PlanTier) : 'Pro';

export const isIncluded = (tier: PlanTier, m: CatalogModule) => RANK[tier] >= RANK[m.includedIn];

export function quote(tier: PlanTier, sel: QuoteInput, catalog: Catalog = CATALOG): Quote {
  const band = bandIndex(sel.unit, sel.size, catalog);
  const extraSeats = Math.max(0, sel.users - catalog.seatsIncluded[tier]);
  const seatsTotal = extraSeats * catalog.extraSeatPrice[tier];
  const addedModules: CatalogModule[] = [];
  const includedModules: CatalogModule[] = [];
  let valid = true;

  for (const m of catalog.modules) {
    if (!sel.modules.has(m.key)) continue;
    if (isIncluded(tier, m)) includedModules.push(m);
    else if (m.price === null) valid = false;
    else addedModules.push(m);
  }

  const modulesTotal = addedModules.reduce((sum, m) => sum + (m.price ?? 0), 0);
  const base = catalog.bandPrice[tier][band];
  return {
    tier,
    band,
    openRange: band === 4,
    base,
    extraSeats,
    seatsTotal,
    addedModules,
    includedModules,
    modulesTotal,
    month: base + seatsTotal + modulesTotal,
    valid,
  };
}

/** Mensalidade equivalente no anual (10 de 12 meses). */
export const annualMonthly = (month: number, catalog: Catalog = CATALOG) =>
  Math.round(((month * catalog.annualBilledMonths) / 12) * 100) / 100;

export const annualTotal = (month: number, catalog: Catalog = CATALOG) => month * catalog.annualBilledMonths;

/** Valor mensal do serviço GB Consult escolhido (0 = sem serviço). */
export const consultPrice = (key: string, catalog: Catalog = CATALOG) =>
  catalog.consult.find((c) => c.key === key)?.price ?? 0;

/**
 * Aplica a escolha de um módulo: se ele só existe em plano acima do atual, devolve o plano
 * ajustado (e `adjustedTo`) para a UI avisar. Desmarcar nunca muda o plano.
 */
export function toggleModule(
  sel: Selection,
  moduleKey: string,
  checked: boolean,
  catalog: Catalog = CATALOG
): { selection: Selection; adjustedTo?: PlanTier; module: CatalogModule } {
  const module = catalog.modules.find((m) => m.key === moduleKey)!;
  const modules = new Set(sel.modules);
  if (!checked) {
    modules.delete(moduleKey);
    return { selection: { ...sel, modules }, module };
  }
  modules.add(moduleKey);
  const need = minTierFor(module);
  if (RANK[need] > RANK[sel.plan]) {
    return { selection: { ...sel, plan: need, modules }, adjustedTo: need, module };
  }
  return { selection: { ...sel, modules }, module };
}

/**
 * Ao rebaixar o plano, remove módulos "só no plano X" que deixaram de existir; devolve quais saíram.
 */
export function pruneUnavailable(
  sel: Selection,
  catalog: Catalog = CATALOG
): { selection: Selection; removed: CatalogModule[] } {
  const removed = catalog.modules.filter(
    (m) => sel.modules.has(m.key) && m.price === null && RANK[sel.plan] < RANK[m.includedIn]
  );
  if (removed.length === 0) return { selection: sel, removed };
  const modules = new Set(sel.modules);
  removed.forEach((m) => modules.delete(m.key));
  return { selection: { ...sel, modules }, removed };
}

/** Cotações dos 3 planos e o mais barato entre os que atendem. */
export function compareTiers(sel: QuoteInput, catalog: Catalog = CATALOG) {
  const quotes = catalog.tiers.map((t) => quote(t, sel, catalog));
  const valid = quotes.filter((q) => q.valid);
  const cheapest = valid.reduce((a, b) => (b.month < a.month ? b : a), valid[0]);
  return { quotes, cheapest };
}

export const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,00$/, '')}`;
