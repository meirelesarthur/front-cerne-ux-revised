// ============================================
// TIPOS DE TIERS — API V2
// Referência: GET /api/v2/tiers
// ============================================

export interface TierCharacteristic {
  label: string;
  value: string;
}

export interface TierData {
  id: number;
  name: string;
  description: string;
  is_default: boolean;
  max_pentests_per_month: number | null;
  max_team_members: number | null;
  max_teams: number | null;
  max_api_tokens: number | null;
  max_agents: number | null;
  max_scheduled_pentests: number | null;
  price_monthly: number;
  price_yearly: number;
  price_monthly_display: number | string;
  price_yearly_display: number | string;
  monthly_usage_budget_usd: number;
  monthly_usage_budget_display: number | string;
  team_member_usage_budget_usd: number | null;
  team_member_usage_budget_display: number | string | null;
  is_custom_pricing: boolean;
  characteristics: Record<string, TierCharacteristic>;
}

export interface TiersResponse {
  individual: TierData[];
  team: TierData[];
}
