// ============================================
// INTERFACE DE TRADUÇÃO — MÓDULO MARKETPLACE
// Usado como: languageGB.common.marketplace.*
// ============================================

export interface MarketplaceLanguage {
  pageTitle: string;
  pageSubtitle: string;
  gcpBadge: string;
  fields: {
    email: string;
    password: string;
    username: string;
    country: string;
    region: string;
    language: string;
  };
  placeholders: {
    email: string;
    password: string;
    username: string;
  };
  buttons: {
    signup: string;
    login: string;
  };
  toggleLinks: {
    hasAccount: string;
    noAccount: string;
  };
  validation: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordMinLength: string;
  };
  errors: {
    noToken: string;
    noTokenButton: string;
    tokenExpired: string;
    tokenExpiredButton: string;
    invalidCredentials: string;
    alreadyLinked: string;
    alreadyLinkedButton: string;
    genericError: string;
    retryButton: string;
  };
  success: {
    title: string;
    planActivated: string;
  };
  polling: {
    syncingBanner: string;
  };
}
