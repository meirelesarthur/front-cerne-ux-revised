// ============================================
// TIPOS DE MARKETPLACE — API V2
// Referência: POST /api/v2/marketplace/signup
// ============================================

export interface MarketplaceSignupRequest {
  marketplace_token: string;
  email: string;
  password: string;
  username?: string;
  country?: string;
  region?: string;
  language?: string;
}

export interface MarketplaceUserData {
  user_id: number;
  email: string;
  username: string;
  tier_id: number | null;
}

export interface MarketplaceTokensData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MarketplaceData {
  account_id: string;
  account_name: string;
  product_id: string;
  tier_id: number | null;
  plan_id: string | null;
  entitlement_status: string;
}

export interface MarketplaceSignupResponseData {
  user: MarketplaceUserData;
  tokens: MarketplaceTokensData;
  marketplace: MarketplaceData;
}
