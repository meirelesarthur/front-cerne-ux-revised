import type { TrialInfo } from '@/@types/v2/Billing';
import type { TrialVisualState } from '@/utils/trial-visual-config';

/**
 * Verifica se o billing_status da equipe permite acesso normal aos recursos.
 */
export function isTeamBillingActive(billingStatus: string | undefined | null): boolean {
  if (!billingStatus) return false;
  return billingStatus === 'active';
}

/**
 * Verifica se a equipe está em estado de aviso (ainda funcional mas com pendências).
 * payment_pending e grace_period = funcional com aviso.
 */
export function isTeamBillingWarning(billingStatus: string | undefined | null): boolean {
  if (!billingStatus) return false;
  return ['payment_pending', 'grace_period'].includes(billingStatus);
}

/**
 * Verifica se a equipe está com acesso degradado ou bloqueado.
 * past_due e suspended = acesso restrito/bloqueado.
 */
export function isTeamBillingBlocked(billingStatus: string | undefined | null): boolean {
  if (!billingStatus) return false;
  return ['past_due', 'suspended'].includes(billingStatus);
}

/**
 * Verifica se a equipe está completamente suspensa (sem acesso).
 */
export function isTeamSuspended(billingStatus: string | undefined | null): boolean {
  if (!billingStatus) return false;
  return billingStatus === 'suspended';
}

// ============================================
// TRIAL HELPERS
// ============================================

export function isUserOnTrial(trial: TrialInfo | null | undefined): boolean {
  return trial?.active === true;
}

export function canUserActivateTrial(trial: TrialInfo | null | undefined, hasSubscription: boolean): boolean {
  return !trial?.trial_used && !hasSubscription;
}

export function getTrialDaysRemaining(trial: TrialInfo | null | undefined): number {
  return trial?.active ? trial.days_remaining : 0;
}

export function isTrialExpiringSoon(trial: TrialInfo | null | undefined, thresholdDays: number = 5): boolean {
  return !!trial?.active && trial.days_remaining <= thresholdDays;
}

export function isTeamOperational(billingStatus: string | undefined | null, teamTrial: TrialInfo | null | undefined): boolean {
  return isTeamBillingActive(billingStatus) || isUserOnTrial(teamTrial);
}

export function getTotalTrialDays(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined
): number {
  if (!startsAt || !endsAt) return 30;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 30;
}

export function getTrialVisualState(
  trial: TrialInfo | null | undefined,
  hasSubscription: boolean
): TrialVisualState {
  if (hasSubscription) return 'has_subscription';
  if (!trial) return 'none';
  if (trial.active) {
    if (trial.days_remaining > 5) return 'active_safe';
    if (trial.days_remaining >= 3) return 'active_warning';
    if (trial.days_remaining >= 1) return 'active_critical';
    return 'active_last_day';
  }
  if (trial.trial_used) return 'expired';
  return 'eligible';
}
