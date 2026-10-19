// src/@types/language/module-common/index.ts
// Interface para traduções comuns (Login, ComingSoon, AleexAssistant, Register, Profile, SystemProjectStatus)

import { AleexAssistantLanguage } from "@/@types/v2/Common/aleex-assistant";
import { AssistantReadonlyLanguage } from "@/@types/v2/Common/assistant-readonly";
import { ComingSoonLanguage } from "@/@types/v2/Common/coming-soon";
import { DevelopmentReportLanguage } from "@/@types/v2/Common/development-report";
import { ErrorLogLanguage } from "@/@types/v2/Common/error-log";
import { LoginLanguage } from "@/@types/v2/Common/login";
import { ProfileLanguage } from "@/@types/v2/Common/profile";
import { RegisterLanguage } from "@/@types/v2/Common/register";
import { SystemProjectStatusLanguage } from "@/@types/v2/Common/system-project-status";
import { ForgotPasswordLanguage } from "@/@types/v2/Common/forgot-password";
import { ResetPasswordLanguage } from "@/@types/v2/Common/reset-password";
import { InvitationsLanguage } from "@/@types/v2/Common/invitations";
import { PricingLanguage } from "@/@types/v2/Common/pricing";
import { BillingLanguage } from "@/@types/v2/Common/billing";
import { PlanLimitsLanguage } from "@/@types/v2/Common/plan-limits";
import { TeamBillingLanguage } from "@/@types/v2/Common/team-billing";
import { TierRestrictionsLanguage } from "@/@types/v2/Common/tier-restrictions";
import { TrialLanguage } from "@/@types/v2/Common/trial";
import { EmailVerificationLanguage } from "@/@types/v2/Common/email-verification";
import { ErrorFallbackLanguage } from "@/@types/v2/Common/error-fallback";
import { UserAgentsLanguage } from "@/@types/v2/Common/user-agents";
import { MarketplaceLanguage } from "@/@types/v2/Common/marketplace";
import { NavRailLanguage } from "@/@types/v2/Common/nav-rail";
import { BrandingLanguage } from "@/@types/v2/Common/branding-language";
import { MyProfileLanguage } from "@/@types/v2/Common/my-profile";
import { AccountMenuLanguage } from "@/@types/v2/Common/account-menu";

export interface ModuleCommon {
  login: LoginLanguage;
  forgotPassword: ForgotPasswordLanguage;
  resetPassword: ResetPasswordLanguage;
  register: RegisterLanguage;
  comingSoon: ComingSoonLanguage;
  aleexAssistant: AleexAssistantLanguage;
  profile: ProfileLanguage;
  systemProjectStatus: SystemProjectStatusLanguage;
  developmentReport: DevelopmentReportLanguage;
  invitations: InvitationsLanguage;
  errorLog: ErrorLogLanguage;
  errorFallback: ErrorFallbackLanguage;
  pricing: PricingLanguage;
  billing: BillingLanguage;
  planLimits: PlanLimitsLanguage;
  teamBilling: TeamBillingLanguage;
  tierRestrictions: TierRestrictionsLanguage;
  trial: TrialLanguage;
  emailVerification: EmailVerificationLanguage;
  agents: UserAgentsLanguage;
  marketplace: MarketplaceLanguage;
  assistantReadonly: AssistantReadonlyLanguage;
  navRail: NavRailLanguage;
  branding: BrandingLanguage;
  /** Execução 071 (TASK-071-FE-01) — tela "Meu perfil" (`/profile`). Bloco
   *  NOVO, não reutiliza `profile` (template do 2FA acima). */
  myProfile: MyProfileLanguage;
  /** Execução 071 (TASK-071-FE-01/05) — menu da conta (avatar do Header). */
  accountMenu: AccountMenuLanguage;
}
