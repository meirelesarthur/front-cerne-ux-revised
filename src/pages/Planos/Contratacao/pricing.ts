// src/pages/Planos/Contratacao/pricing.ts
// Regra de preço da contratação — funções PURAS (sem React), cobertas por `pricing.test.ts`.
// Porte fiel da lógica do simulador do artifact "Cerne Planos e Precificação".

import { CATALOG, type Catalog, type CatalogModule, type PlanTier } from './catalog';

export const RANK: Record<PlanTier | 'Nenhum', number> = { Pro: 0, Deluxe: 1, Enterprise: 2, Nenhum: 9 };

export interface Selection {
  plan: PlanTier;
  users: number;
  /** Chaves dos módulos marcados pelo usuário. */
  modules: ReadonlySet<string>;
}

export interface Quote {
  tier: PlanTier;
  base: number;
  /** Acessos acima do incluído no plano. */
  extraSeats: number;
  seatsTotal: number;
  /** Módulos pagos à parte neste plano. */
  addedModules: CatalogModule[];
  /** Módulos marcados que já vêm incluídos neste plano. */
  includedModules: CatalogModule[];
  modulesTotal: number;
  /** R$/mês. */
  month: number;
  /** `false` quando algum módulo marcado não existe neste plano (nem avulso). */
  valid: boolean;
}

/** Plano mínimo em que um módulo pode ser usado (avulso → qualquer um; senão, o que o inclui). */
export const minTierFor = (m: CatalogModule): PlanTier =>
  m.price === null ? (m.includedIn as PlanTier) : 'Pro';

export const isIncluded = (tier: PlanTier, m: CatalogModule) => RANK[tier] >= RANK[m.includedIn];

export function quote(tier: PlanTier, sel: Pick<Selection, 'users' | 'modules'>, catalog: Catalog = CATALOG): Quote {
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
  const base = catalog.basePrice[tier];
  return {
    tier,
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
export function compareTiers(sel: Pick<Selection, 'users' | 'modules'>, catalog: Catalog = CATALOG) {
  const quotes = catalog.tiers.map((t) => quote(t, sel, catalog));
  const valid = quotes.filter((q) => q.valid);
  const cheapest = valid.reduce((a, b) => (b.month < a.month ? b : a), valid[0]);
  return { quotes, cheapest };
}

export const formatBRL = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/,00$/, '')}`;
