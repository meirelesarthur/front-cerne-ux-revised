// Admin Teams Types - API V2
// Baseado no Postman Collection: GB Cerne API v2 > Admin panel > Teams Admin

import { Label } from "@/@types/label";
import { Option } from "@/@types/option";
import type { TeamBillingStatus } from "@/@types/v2/permissions";

// ============================================
// STATUS E ENUMS
// ============================================

export const teamStatus = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export type TeamStatus = (typeof teamStatus)[keyof typeof teamStatus];

// ============================================
// TEAM DATA TYPES
// ============================================

export interface TeamData {
  id: number;
  name: string;
  description: string;
  max_members: number;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  status: TeamStatus;
  member_count?: number;
  created_at: string;
  updated_at?: string;
  billing_status: TeamBillingStatus;
  billing_grace_deadline: string | null;
  stripe_customer_id: string | null;
  tier_id?: number;
  tier_name?: string;
  trial?: {
    active: boolean;
    trial_tier: { id: number; name: string; price_monthly: number } | null;
    starts_at: string | null;
    ends_at: string | null;
    days_remaining: number;
    trial_used: boolean;
  } | null;
}

export interface TeamMemberData {
  id: number;
  user_id: number;
  team_id: number;
  username: string;
  email: string;
  role_id?: number;
  role_name?: string;
  joined_at: string;
}

// ============================================
// TEAM LANGUAGE (i18n)
// ============================================

export interface TeamLanguage extends Label {
  name: string;
  description: string;
  maxMembers: string;
  owner: Label;
  status: string;
  statusLabel: Record<TeamStatus, string>;
  members: Label;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TEAM FORM TYPES
// ============================================

export interface TeamForm {
  id?: number;
  name: string;
  description: string;
  max_members: number;
  owner?: Option<number>;
  status: TeamStatus;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  max_members: number;
  owner_id: number;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  max_members?: number;
  owner_id?: number;
  status?: TeamStatus;
}

export interface AddTeamMemberRequest {
  user_id: number;
  role_id?: number;
}

export interface TransferOwnershipRequest {
  new_owner_id: number;
}

// ============================================
// TEAM FILTER TYPES
// ============================================

export interface TeamFilterForm {
  name?: string;
  status?: Option<TeamStatus>;
  owner_id?: number;
}

export interface TeamFilterRequest {
  name?: string;
  status?: TeamStatus;
  owner_id?: number;
}
