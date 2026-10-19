export interface PricingLanguage {
  pageTitle: string;
  pageSubtitle: string;
  currentPlanHeader: {
    yourPlan: string;
    yourTier: string;
    freePlan: string;
    adminTier: string;
    adminDescription: string;
    renewsOn: string;
    cancelsOn: string;
    billingInterval: {
      month: string;
      year: string;
    };
    manageSubscription: string;
    viewInvoices: string;
    noSubscription: string;
    upgradeCta: string;
  };
  billing: {
    monthly: string;
    yearly: string;
    discount: string;
  };
  tabs: {
    individual: string;
    business: string;
  };
  individual: {
    title: string;
  };
  team: {
    title: string;
    perMember: string;
  };
  card: {
    currentPlan: string;
    popular: string;
    recommended: string;
    upgrade: string;
    downgrade: string;
    contactSales: string;
    getStarted: string;
    free: string;
    perMonth: string;
    perYear: string;
    customPricing: string;
  };
  comparison: {
    title: string;
    feature: string;
    unlimited: string;
    notAvailable: string;
    included: string;
  };
  features: {
    pentestsPerMonth: string;
    aiBudget: string;
    onDemand: string;
    teams: string;
    teamMembers: string;
    apiTokens: string;
    customAgents: string;
    scheduledPentests: string;
    budgetPerMember: string;
  };
  checkout: {
    redirecting: string;
    error: string;
    activeSubscription: string;
    pendingPayment: string;
    manageInPortal: string;
  };
  callback: {
    success: {
      title: string;
      description: string;
      backToProfile: string;
    };
    cancel: {
      title: string;
      description: string;
      backToPlans: string;
    };
  };
  toast: {
    upgradeRequested: string;
    downgradeRequested: string;
    checkoutError: string;
  };
}
