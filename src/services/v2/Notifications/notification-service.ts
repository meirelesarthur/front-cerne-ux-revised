// src/services/v2/Notifications/notification-service.ts
// -----------------------------------------------------------------------------
// Notificações de Suprimentos (execução 081, T-081-FE-01, DEP-API-10 /
// T-081-API-09). Programado contra o contrato do plano da API; nenhuma tela
// desta tarefa quebra se a rota ainda não existir (quem consome trata o erro
// de query com estado honesto, sem mock).
//
//   GET  /notifications                           → lista + `meta.unread_count`
//   POST /notifications/{id}/read                 → marca uma como lida
//   POST /notifications/read-all                  → marca todas como lidas
//   GET  /request-purchases/denied-notifications  → solicitações negadas não lidas
//   POST /request-purchases/denied-notifications/read
// -----------------------------------------------------------------------------

import api from '@/services/api';

import type { Response } from '@/@types/response-api';
import type {
  DeniedNotificationItem,
  NotificationsListEnvelope,
  NotificationsListResult,
} from '@/@types/v2/Notifications';

async function listNotifications(): Promise<NotificationsListResult> {
  const { data } = await api.V2.get<NotificationsListEnvelope>('/notifications');
  return {
    items: data.data ?? [],
    unreadCount: data.meta?.unread_count ?? 0,
  };
}

async function markNotificationAsRead(id: string) {
  const { data } = await api.V2.post<Response<null>>(`/notifications/${id}/read`);
  return data;
}

async function markAllNotificationsAsRead() {
  const { data } = await api.V2.post<Response<null>>('/notifications/read-all');
  return data;
}

async function listDeniedNotifications(): Promise<DeniedNotificationItem[]> {
  const { data } = await api.V2.get<Response<DeniedNotificationItem[]>>(
    '/request-purchases/denied-notifications'
  );
  return data.data ?? [];
}

async function markDeniedNotificationsAsRead() {
  const { data } = await api.V2.post<Response<null>>(
    '/request-purchases/denied-notifications/read'
  );
  return data;
}

export {
  listDeniedNotifications,
  listNotifications,
  markAllNotificationsAsRead,
  markDeniedNotificationsAsRead,
  markNotificationAsRead,
};
