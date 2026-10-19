// src/@types/v2/Common/development-report.ts
// Interface para traduções da página de Relatório de Desenvolvimento

export interface DevelopmentReportLanguage {
  pageTitle: string;
  pageDescription: string;
  lastUpdate: string;

  // Tab names
  tabs: {
    executive: string;
    uxVsFrontend: string;
    frontendDetail: string;
  };

  // Executive Report Tab
  executive: {
    title: string;
    subtitle: string;

    // Hero section — decision numbers
    hero: {
      title: string;
      proposalTitle: string;
      proposalValue: string;
      proposalDesc: string;
      proposalFeatures: string;
      frontendTitle: string;
      frontendValue: string;
      frontendDesc: string;
      frontendModulesList: string;
      growthTitle: string;
      growthValue: string;
      growthDesc: string;
      growthDetails: string;
      ratioLabel: string;
      ratioNew: string;
      ratioEvolved: string;
      ratioMaintained: string;
    };

    // Charts & sections
    proposalVsDelivery: string;
    proposed: string;
    delivered: string;
    featureEvolution: string;
    moduleEvolution: string;
    newFeatures: string;
    evolvedFeatures: string;
    maintainedFeatures: string;
    entirelyNew: string;

    // Module names
    modules: {
      infrastructure: string;
      teams: string;
      pentestManager: string;
      aleexAssistant: string;
      adminPanel: string;
    };

    // Module descriptions
    moduleDescriptions: {
      infrastructure: string;
      teams: string;
      pentestManager: string;
      aleexAssistant: string;
      adminPanel: string;
    };

    // Tooltips
    tooltips: {
      proposalCard: string;
      frontendCard: string;
      growthCard: string;
      ratioBar: string;
      proposalVsDelivery: string;
      proposedBar: string;
      deliveredBar: string;
      growthBadge: string;
      legendNew: string;
      legendEvolved: string;
      legendMaintained: string;
    };
  };

  // UX vs Frontend Tab
  comparison: {
    title: string;
    subtitle: string;

    // UX section
    uxWorkTitle: string;
    uxOriginalFigma: string;
    uxStaticScreens: string;
    uxNewScreens: string;
    uxNewComponents: string;
    uxPageBarOnly: string;
    uxEffectiveWork: string;
    uxScreensLabel: string;
    uxComponentLabel: string;

    // Frontend section
    frontendWorkTitle: string;
    
    // Proportions
    proportionTitle: string;
    withUxReference: string;
    withoutUxReference: string;
    totalBuilt: string;

    // Dimensions
    dimensions: {
      screensDelivered: string;
      featuresCovered: string;
      routesCovered: string;
      modulesZeroCoverage: string;
      componentsDelivered: string;
      endpointsIntegrated: string;
      apiFunctions: string;
      languagesTranslated: string;
    };

    // Coverage gap
    coverageGapTitle: string;
    pagesWithUx: string;
    pagesWithoutUx: string;
    modulesWithoutUx: string;

    // Proportion labels
    proportionFeatures: string;
    proportionRoutes: string;
    proportionModules: string;
    routesInModulesWithoutUx: string;
    ofTotal: string;
  };

  // Frontend Detail Tab
  detail: {
    title: string;
    subtitle: string;

    // KPI Cards
    kpiModules: string;
    kpiModulesDesc: string;
    kpiFeatures: string;
    kpiFeaturesDesc: string;
    kpiIntegrations: string;
    kpiIntegrationsDesc: string;

    // Chart
    chartTitle: string;
    chartSubtitle: string;

    // Module cards
    modulesTitle: string;
    modulesSubtitle: string;
    featuresDelivered: string;
    moduleDescriptions: {
      infrastructure: string;
      teams: string;
      pentestManager: string;
      aleexAssistant: string;
      adminPanel: string;
    };

    // Complexity levels
    complexity: {
      veryHigh: string;
      high: string;
      medium: string;
      low: string;
    };

    // Special technologies
    specialTech: string;
    specialTechItems: {
      sseStreaming: string;
      vulnResolution: string;
      pentestTerminal: string;
      tokenManager: string;
      rbacFrontend: string;
    };

    // Tooltips
    tooltips: {
      kpiModules: string;
      kpiFeatures: string;
      kpiIntegrations: string;
      chart: string;
      modulesSection: string;
      featuresCount: string;
      complexityDot: string;
      specialTech: string;
      specialTechSse: string;
      specialTechVuln: string;
      specialTechTerminal: string;
      specialTechToken: string;
      specialTechRbac: string;
    };
  };

  // Shared
  uxDesign: string;
  frontend: string;
  proportion: string;
  impact: string;
  high: string;
  module: string;
  lines: string;
  of: string;
}
