// src/pages/Planos/Contratacao/order.ts
// Pedido montado no configurador de planos e entregue ao onboarding ("Criar conta"): o que o
// cliente escolheu e quanto isso custa. Só dados — a tela de pagamento e o resumo formatam.

import type { PlanTier, SizeUnit } from './catalog';

export interface OnboardingOrderModule {
  key: string;
  name: string;
  price: number;
}

export interface OnboardingOrder {
  plan: PlanTier;
  unit: SizeUnit;
  size: number;
  /** Faixa de tamanho (1 a 5). */
  band: number;
  /** Faixa 5: o valor é ponto de partida para proposta. */
  openRange: boolean;
  users: number;
  modules: OnboardingOrderModule[];
  consult: { key: string; name: string; price: number } | null;
  billing: 'monthly' | 'annual';
  /** Software por mês (plano + acessos extras + módulos), sem GB Consult. */
  softwareMonth: number;
  /** Total por mês com o GB Consult. */
  totalMonth: number;
  /** Valor cobrado agora: o mês, ou o equivalente a 10 meses no anual. */
  chargeNow: number;
}
