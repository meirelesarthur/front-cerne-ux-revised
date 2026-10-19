// src/@types/v2/Common/system-project-status-features.ts
// Interface para traduções das features do SystemProjectStatus
// Atualizado v4.0 — sincronizado com histórias v7/v6/v8/v4/v4

interface FeatureDetail {
  details: string;
  pendingItems?: string[];
}

export interface FeatureTranslations {
  admin: {
    users: FeatureDetail;
    teams: FeatureDetail;
    roles: FeatureDetail;
    permissions: FeatureDetail;
    models: FeatureDetail;
    agents: FeatureDetail;
    tools: FeatureDetail;
    phases: FeatureDetail;
    chats: FeatureDetail;
    pentestsAdmin: FeatureDetail;
    scheduledPentestsAdmin: FeatureDetail;
    activityLogs: FeatureDetail;
    ticketsAdmin: FeatureDetail;
    operationsAdmin: FeatureDetail;
  };
  aleex: {
    conversations: FeatureDetail;
    messages: FeatureDetail;
    interaction: FeatureDetail;
    userAgents: FeatureDetail;
    ownModels: FeatureDetail;
    shareChats: FeatureDetail;
    archiveSystem: FeatureDetail;
    phases: FeatureDetail;
    pentestTerminal: FeatureDetail;
    vulnerabilities: FeatureDetail;
    agentConfig: FeatureDetail;
  };
  pentest: {
    dashboard: FeatureDetail;
    pentestsCrud: FeatureDetail;
    wizard: FeatureDetail;
    viewPentest: FeatureDetail;
    assets: FeatureDetail;
    comments: FeatureDetail;
    vulnerabilities: FeatureDetail;
    resolution: FeatureDetail;
    evidence: FeatureDetail;
    reports: FeatureDetail;
    agentsPhases: FeatureDetail;
    executionSSE: FeatureDetail;
    scheduledPentestsCrud: FeatureDetail;
    threatIntel: FeatureDetail;
    honeypots: FeatureDetail;
    logs: FeatureDetail;
    support: FeatureDetail;
    operations: FeatureDetail;
  };
  teams: {
    management: FeatureDetail;
    members: FeatureDetail;
    invitesOwner: FeatureDetail;
    invitesUser: FeatureDetail;
    roles: FeatureDetail;
    permissions: FeatureDetail;
    teamAgents: FeatureDetail;
    models: FeatureDetail;
    personalAgents: FeatureDetail;
    teamUsage: FeatureDetail;
  };
  infra: {
    auth: FeatureDetail;
    twoFactor: FeatureDetail;
    sessions: FeatureDetail;
    apiTokens: FeatureDetail;
    rbac: FeatureDetail;
    profile: FeatureDetail;
    accountRecovery: FeatureDetail;
    sessionValidation: FeatureDetail;
    accountManagement: FeatureDetail;
    publicInvitations: FeatureDetail;
    modelsTab: FeatureDetail;
    usageTab: FeatureDetail;
    register: FeatureDetail;
    homeDashboard: FeatureDetail;
    tokenManager: FeatureDetail;
    billing: FeatureDetail;
    tierCards: FeatureDetail;
    transactions: FeatureDetail;
  };
  criticalNotes: {
    admin: string[];
    aleex: string[];
    pentest: string[];
    teams: string[];
    infra: string[];
  };
  featureNames: {
    admin: Record<string, string>;
    aleex: Record<string, string>;
    pentest: Record<string, string>;
    teams: Record<string, string>;
    infra: Record<string, string>;
  };
}
