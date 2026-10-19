// src/@types/v2/Notifications/index.d.ts
// -----------------------------------------------------------------------------
// Tipos das notificações de Suprimentos (execução 081, T-081-FE-01, DEP-API-10).
// Contrato da T-081-API-09 (plano da API), programado antes da rota existir:
//
//   GET  notifications                          → data[{id, message, url, created_at}]
//                                                 + meta.unread_count
//   POST notifications/{id}/read
//   POST notifications/read-all
//   GET  request-purchases/denied-notifications → data[{id, message, request_uuid}]
//   POST request-purchases/denied-notifications/read
//
// `id` aqui é o identificador da NOTIFICAÇÃO (string do Laravel, não o id
// sequencial de uma entidade de negócio). `url` é ABSOLUTA, baseada em
// `FRONTEND_URL` (ver `utils/notificationRoute.ts`, FE-11). Ajustável num único
// lugar caso o contrato da API mude.
// -----------------------------------------------------------------------------

export interface NotificationItem {
  id: string;
  message: string;
  /** URL absoluta (origem = `FRONTEND_URL`). Pode vir nula em notificações sem destino. */
  url: string | null;
  created_at: string;
}

export interface NotificationsMeta {
  unread_count: number;
}

export interface NotificationsListEnvelope {
  success: boolean;
  message: string;
  data: NotificationItem[];
  errors: Record<string, string[]> | null;
  meta: NotificationsMeta | null;
}

/** Resultado já desempacotado de `listNotifications`. */
export interface NotificationsListResult {
  items: NotificationItem[];
  unreadCount: number;
}

/** Notificação de solicitação NEGADA (modal "Sua(s) solicitação(ões) foram negada(s):"). */
export interface DeniedNotificationItem {
  id: string;
  message: string;
  /** Solicitação negada — destino do link "Clique aqui para ver". */
  request_uuid: string;
}
