// src/@types/v2/Common/system-project-status.ts
// Interface para traduções do SystemProjectStatus

import { FeatureTranslations } from "./system-project-status-features";

export interface SystemProjectStatusLanguage {
  pageTitle: string;
  pageDescription: string;
  overallProgress: string;
  features: string;
  lastUpdate: string;
  totalFeatures: string;
  featuresTracked: string;
  featuresComplete: string;
  criticalNotes: string;
  pending: string;

  // Development weight labels
  total: string;
  api: string;
  frontend: string;
  weight: string;
  weightLabel: string;
  developmentWeight: string;
  integrationWarning: string;
  integrationWarningDetails: string;
  integrationCost: string;
  integrationCostDetails: string;

  // Status labels
  status: {
    complete: string;
    partial: string;
    pending: string;
    critical: string;
  };

  // Module names
  modules: {
    admin: string;
    aleexAssistant: string;
    pentestManager: string;
    teams: string;
    infrastructure: string;
  };

  // Tab names
  tabs: {
    admin: string;
    aleex: string;
    pentest: string;
    teams: string;
    infra: string;
  };

  // Additional labels
  modulesComplete: string;
  of: string;
  complete: string;

  // Action labels
  actionsLabel: string;

  // Disclaimer / refinement notice
  disclaimerTitle: string;
  disclaimerMessage: string;

  // Feature translations
  featureTranslations: FeatureTranslations;
}
