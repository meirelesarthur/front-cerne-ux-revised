/**
 * Interface de tradução para restrições de tier/plano.
 * Usado por TierGate, UpgradePrompt, TierLimitButton, FeatureLockOverlay e TierBadge.
 */
export interface TierRestrictionsLanguage {
  // Geral
  locked: string;
  availableFrom: string;
  upgradeRequired: string;
  currentPlan: string;

  // Limites
  limitReached: string;
  limitNear: string;
  usageCount: string;
  unlimited: string;
  notAvailable: string;

  // CTAs
  viewPlans: string;
  upgradeTo: string;
  learnMore: string;
  contactSales: string;

  // Mensagens por Feature
  features: {
    agents: {
      title: string;
      description: string;
      limitMessage: string;
    };
    scheduledPentests: {
      title: string;
      description: string;
      limitMessage: string;
    };
    apiTokens: {
      title: string;
      description: string;
      limitMessage: string;
    };
    teams: {
      title: string;
      description: string;
      limitMessage: string;
    };
    pentests: {
      title: string;
      description: string;
      limitMessage: string;
    };
    vulnResolution: {
      title: string;
      description: string;
    };
    qualityGate: {
      title: string;
      description: string;
    };
    exportVulnerabilities: {
      title: string;
      description: string;
    };
    webhooks: {
      title: string;
      description: string;
    };
    onDemand: {
      title: string;
      description: string;
    };
    chatSharing: {
      title: string;
      description: string;
    };
  };

  // Nomes dos tiers
  tierNames: {
    casual: string;
    pro: string;
    ultra: string;
    business: string;
    enterprise: string;
  };

  // Tooltips
  tooltips: {
    limitReachedUpgrade: string;
    featureNotAvailable: string;
    nearLimit: string;
  };
}
