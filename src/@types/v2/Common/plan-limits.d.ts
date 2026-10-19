export interface PlanLimitsLanguage {
  title: string;
  thisMonth: string;
  created: string;
  active: string;
  unlimited: string;
  notAvailable: string;
  viewPlans: string;
  limits: {
    pentests: string;
    aiBudget: string;
    teams: string;
    agents: string;
    apiTokens: string;
    scheduledPentests: string;
  };
  progress: {
    used: string;
    remaining: string;
    exceeded: string;
  };
}
