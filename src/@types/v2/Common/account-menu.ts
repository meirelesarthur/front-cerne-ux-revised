// src/@types/v2/Common/account-menu.ts
// Tipos de i18n do menu da conta (avatar do Header) — Execução 071,
// TASK-071-FE-01/05. `triggerAriaLabelTemplate` carrega o placeholder
// literal `{name}` (substituído em `AccountMenu.tsx`, sem lib de i18n com
// interpolação — mesmo padrão de template simples já usado no projeto).

export interface AccountMenuLanguage {
  triggerAriaLabelTemplate: string;
  upgrade: string;
  currentPlanLabel: string;
  currentPlanBadge: string;
  language: string;
  myProfile: string;
  settings: string;
  lightModeAction: string;
  gbModeAction: string;
  plans: string;
  helpCenter: string;
  logout: string;
  comingSoonBadge: string;
  comingSoonToastDescription: string;
  languagePersistWarning: string;
}
