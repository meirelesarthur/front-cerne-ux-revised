// ============================================
// TIPOS DE BILLING — API V2
// Referência: BILLING_SYSTEM.md
// ============================================

import type { TeamBillingStatus } from '@/@types/v2/permissions';

// ============================================
// TRIAL
// ============================================

export interface TrialTierInfo {
  id: number;
  name: string;
  price_monthly: number;
}

export interface TrialInfo {
  active: boolean;
  trial_tier: TrialTierInfo | null;
  starts_at: string | null;
  ends_at: string | null;
  days_remaining: number;
  trial_used: boolean;
}

export interface ActivateTrialRequest {
  tier_id: number;
}

export interface ActivateTrialResponse {
  trial_tier_id: number;
  trial_tier_name: string;
  starts_at: string;
  ends_at: string;
  duration_days: number;
}

export interface AdminActivateTrialRequest {
  tier_id: number;
  duration_days?: number;
}

// ============================================
// CHECKOUT
// ============================================

export interface CheckoutRequest {
  tier_id: number;
  interval: 'month' | 'year';
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface TeamCheckoutRequest {
  tier_id: number;
  interval: 'month' | 'year';
}

export interface TeamCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

// ============================================
// PORTAL
// ============================================

export interface PortalResponse {
  portal_url: string;
}

export interface TeamPortalResponse {
  portal_url: string;
}

// ============================================
// STATUS
// ============================================

export interface BillingStatusResponse {
  has_subscription: boolean;
  tier: {
    id: number;
    name: string;
    price_monthly: number;
    price_yearly: number;
  };
  trial: TrialInfo | null;
  subscription: {
    status: string;
    billing_interval: 'month' | 'year';
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  usage: {
    current_cost_usd: number;
    budget_limit_usd: number;
    on_demand_enabled: boolean;
  };
}

export interface TeamBillingStatusResponse {
  team_id: number;
  team_name: string;
  billing_status: TeamBillingStatus;
  tier: {
    id: number;
    name: string;
    price_monthly: number;
    price_yearly: number;
  };
  trial: TrialInfo | null;
  subscription: {
    status: string;
    billing_interval: 'month' | 'year';
    current_period_end: string;
    cancel_at_period_end: boolean;
  } | null;
  member_count: number;
}

// ============================================
// INVOICES
// ============================================

export interface InvoiceData {
  id: string;
  number: string;
  status: 'paid' | 'open' | 'void' | 'draft' | 'uncollectible';
  amount_due: number;
  amount_paid: number;
  currency: string;
  period_start: string;
  period_end: string;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

export interface InvoicesResponse {
  invoices: InvoiceData[];
  has_more: boolean;
}

// ============================================
// REACTIVATE (Team only)
// ============================================

export interface ReactivateTeamRequest {
  tier_id?: number;
  interval?: 'month' | 'year';
}

export interface ReactivateTeamResponse {
  team_id: number;
  billing_status: TeamBillingStatus;
  checkout_url?: string;
}
