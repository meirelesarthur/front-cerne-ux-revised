// src/components/NotificationPanel/useNotifications.ts
// -----------------------------------------------------------------------------
// Dados do sino de notificações GLOBAL (execução 081, T-081-FE-11; decisão D-04).
//
//   - `GET notifications` a cada 30 s (equivale ao TTL de 30 s do legado), sem
//     depender de fazenda (a rota é só de sessão);
//   - ler uma / ler todas: `useMutation` direto (micro-efeito, sem toast de
//     entidade) com invalidação da lista no sucesso.
// -----------------------------------------------------------------------------

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/v2/Notifications/notification-service';

export const NOTIFICATIONS_REFETCH_INTERVAL_MS = 30_000;

export function useNotifications() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: [queryKey.supplyNotifications.list],
    queryFn: listNotifications,
    refetchInterval: NOTIFICATIONS_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: [queryKey.supplyNotifications.list] });
  }

  const markAsRead = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: invalidate,
  });

  const markAllAsRead = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: invalidate,
  });

  return {
    notificationsQuery,
    items: notificationsQuery.data?.items ?? [],
    unreadCount: notificationsQuery.data?.unreadCount ?? 0,
    markAsRead,
    markAllAsRead,
  };
}
