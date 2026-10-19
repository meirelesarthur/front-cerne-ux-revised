// src/components/Suprimentos/useDeniedRequestsModal.ts
// -----------------------------------------------------------------------------
// Dados e abertura do modal de solicitações NEGADAS (execução 081, T-081-FE-01;
// contrato LEGADO 10, `denied_request_modal.blade.php`, DEP-API-10).
//
// Legado: ao abrir Solicitações, Meus Processos e Cotações, se há notificações
// de negação não lidas, o modal abre UMA vez e as marca como lidas. Aqui:
//   - `GET request-purchases/denied-notifications` (query `deniedRequests`);
//   - abre quando chega ao menos 1 item e ainda não foi exibido nesta montagem
//     (guarda por `useRef`, então o refetch não reabre o modal);
//   - marca como lidas ao abrir (`POST .../denied-notifications/read`), sem
//     bloquear a exibição; falha ao marcar não esconde o modal (estado honesto).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKey } from '@/constants/query-key';

import {
  listDeniedNotifications,
  markDeniedNotificationsAsRead,
} from '@/services/v2/Notifications/notification-service';

import type { DeniedNotificationItem } from '@/@types/v2/Notifications';

export interface UseDeniedRequestsModalResult {
  isOpen: boolean;
  items: DeniedNotificationItem[];
  close: () => void;
}

export function useDeniedRequestsModal(options?: {
  enabled?: boolean;
}): UseDeniedRequestsModalResult {
  const enabled = options?.enabled ?? true;
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<DeniedNotificationItem[]>([]);
  const alreadyShown = useRef(false);

  const deniedQuery = useQuery({
    queryKey: [queryKey.requestPurchases.deniedRequests],
    queryFn: listDeniedNotifications,
    enabled,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const markAsRead = useMutation({
    mutationFn: markDeniedNotificationsAsRead,
    onSuccess: () => {
      // O sino global também precisa refletir as notificações lidas.
      queryClient.invalidateQueries({ queryKey: [queryKey.supplyNotifications.list] });
    },
  });

  useEffect(() => {
    const data = deniedQuery.data;
    if (!enabled || alreadyShown.current || !data || data.length === 0) return;
    alreadyShown.current = true;
    setItems(data);
    setIsOpen(true);
    markAsRead.mutate();
  }, [enabled, deniedQuery.data]);

  function close() {
    setIsOpen(false);
  }

  return { isOpen, items, close };
}
