// src/pages/Onboarding/types.ts
// Estado do fluxo "Criar conta". Nada sensível é persistido: senha e cartão ficam só em memória.

import type { OnboardingOrder } from '@/pages/Planos/Contratacao/order';

export type OnboardingStep = 'plan' | 'account' | 'payment' | 'contractor' | 'done';
export const ONBOARDING_STEPS: OnboardingStep[] = ['plan', 'account', 'payment', 'contractor', 'done'];

export interface AccountData {
  name: string;
  email: string;
  password: string;
  accepted: boolean;
}

export type PayMethod = 'card' | 'pix' | 'boleto';

export interface PaymentResult {
  method: PayMethod;
  paidAt: string;
}

export interface ContractorData {
  personType: 'pj' | 'pf';
  document: string;
  legalName: string;
  tradeName: string;
  phone: string;
  cellphone: string;
  contactName: string;
  contactEmail: string;
  zip: string;
  address: string;
  number: string;
  complement: string;
  city: string;
  state: string;
}

export const EMPTY_CONTRACTOR: ContractorData = {
  personType: 'pj',
  document: '',
  legalName: '',
  tradeName: '',
  phone: '',
  cellphone: '',
  contactName: '',
  contactEmail: '',
  zip: '',
  address: '',
  number: '',
  complement: '',
  city: '',
  state: '',
};

export interface OnboardingDraft {
  step: OnboardingStep;
  order: OnboardingOrder | null;
  /** Sem senha. */
  account: Omit<AccountData, 'password'> | null;
  payment: PaymentResult | null;
  contractor: ContractorData;
}

/**
 * FRONT DE DESIGN: por enquanto NENHUM passo valida nada (dá para andar pelas etapas só clicando).
 * Quando a integração real entrar, troque para `true` e os erros/bloqueios voltam a funcionar.
 */
export const ONBOARDING_VALIDATE = false;

export const DRAFT_KEY = 'cerne-onboarding-draft-v2';
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const digits = (v: string) => v.replace(/\D/g, '');
