// src/constants/integracoes/integrationDominio/enums.ts
// Enum "Ativo" do Software Domínio (IntegrationDominio — Integrações, F-121).
// Fidelidade ao legado `select {1:Sim, 0:Não}` (`_forms.blade.php:15-17`).
// A fábrica de options (Map + getLabel/getOption/options) fica em
// `./options/enabled-options.ts`, importando este enum.

export const integrationDominioEnabled = {
  sim: true,
  nao: false,
} as const;

export type IntegrationDominioEnabled =
  (typeof integrationDominioEnabled)[keyof typeof integrationDominioEnabled];
