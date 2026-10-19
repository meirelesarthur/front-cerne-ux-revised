// src/@types/v2/Common/nav-rail.d.ts
// Interface de traduções do NavRail (casca vertical de navegação)

export interface NavRailLanguage {
  menu: string;
  theme: string;
  notifications: string;
  signout: string;
  account: string;
  language: string;
  contextPanel: string;
  talkToAleex: string;
  toggleSidebar: string;
  expandSecondaryMenu: string;
  collapseSecondaryMenu: string;
  /** Sino global (T-081-FE-11): vazio, erro, marcar todas e rótulo do contador. */
  notificationsEmpty: string;
  notificationsLoadError: string;
  notificationsRetry: string;
  notificationsMarkAll: string;
  notificationsUnreadLabel: string;
}
