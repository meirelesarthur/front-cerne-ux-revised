export interface TrialLanguage {
  badge: string;
  startTrial: string;
  currentTrial: string;
  trialActive: string;
  trialExpired: string;
  trialUsed: string;
  daysRemaining: string;
  daysLabel: string;
  daysUsed: string;
  expiresIn: string;
  lastDay: string;
  expiringSoon: string;
  upgradeToKeep: string;
  subscribePlan: string;
  trialActiveSubscribeHint: string;
  trialOf: string;
  freeFor30Days: string;
  noCardRequired: string;
  trialActivated: string;
  trialRevoked: string;
  dialog: {
    title: string;
    subtitle: string;
    noCreditCard: string;
    cancelAnytime: string;
    fullAccess: string;
    confirm: string;
  };
  expiringDialog: {
    title: string;
    titleLastDay: string;
    description: string;
    descriptionLastDay: string;
    loseAccess: string;
    features: string;
    revertToCasual: string;
    upgradeNow: string;
    remindLater: string;
    lastDay: string;
  };
  teamTrialBanner: {
    title: string;
    description: string;
    subscribe: string;
  };
  homeCard: {
    eligibleTitle: string;
    eligibleDescription: string;
  };
  admin: {
    activateTrial: string;
    revokeTrial: string;
    trialDuration: string;
    selectTier: string;
    trialActivatedFor: string;
    trialRevokedFor: string;
    trialSection: string;
    trialStatus: string;
    neverUsed: string;
    activeUntil: string;
    expiredOn: string;
    tier: string;
    startsAt: string;
    endsAt: string;
    durationPlaceholder: string;
    confirmRevokeTitle: string;
    confirmRevokeDescription: string;
    businessTierFixed: string;
  };
  a11y: {
    progressLabel: string;
    daysProgress: string;
  };
}
