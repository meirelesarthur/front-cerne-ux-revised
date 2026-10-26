// src/@types/language/module-subscription/index.ts
// Interface de tradução da página "Contratar ou alterar plano" (simulador de assinatura).
// Placeholders `{x}` são trocados em tempo de execução. Conteúdo em
// src/constants/languages/{idioma}/languageSubscription.ts.

export interface ModuleSubscription {
  pageTitle: string;
  pageSubtitle: string;
  simulationNotice: string;
  steps: {
    label: string;
    plan: string;
    modules: string;
  };
  plan: {
    title: string;
    hint: string;
    perMonth: string;
    accessesIncluded: string;
    current: string;
    taglinePro: string;
    taglineDeluxe: string;
    taglineEnterprise: string;
  };
  billing: {
    title: string;
    hint: string;
    monthly: string;
    annual: string;
  };
  accesses: {
    title: string;
    hint: string;
    decrease: string;
    increase: string;
    quantity: string;
    info: string;
  };
  modules: {
    title: string;
    hint: string;
    groupDeluxe: string;
    groupEnterprise: string;
    groupAny: string;
    included: string;
    onlyFrom: string;
  };
  nav: {
    next: string;
    back: string;
  };
  summary: {
    title: string;
    plan: string;
    baseValue: string;
    accesses: string;
    contracted: string;
    includedInPlan: string;
    extras: string;
    none: string;
    seatsNote: string;
    modules: string;
    noModules: string;
    alreadyIncluded: string;
    totalMonth: string;
    totalAnnual: string;
    perYear: string;
    annualInstead: string;
    compare: string;
    cheapest: string;
    unavailable: string;
    vsCurrent: string;
    sameAsCurrent: string;
    copy: string;
    copied: string;
    copyError: string;
    requestNew: string;
    requestUpgrade: string;
    requestChange: string;
  };
  messages: {
    moduleRequires: string;
    moduleRemoved: string;
    upgradeCheaper: string;
    otherCheaper: string;
  };
  request: {
    title: string;
    body: string;
    confirm: string;
    done: string;
    devNotice: string;
  };
}
