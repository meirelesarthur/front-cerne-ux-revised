// src/pages/Home/SystemUpdatePendingModal.tsx
// -----------------------------------------------------------------------------
// Popup do dashboard — Atualizações do Sistema pendentes (GAP-BE-511-
// systemupdate, decisão do dono, execução 031: "Incluir popup + pivô agora",
// Opção A). Componente AUTOCONTIDO: monta-se sozinho na Home
// (`src/pages/Home/index.tsx`, 1 import + 1 linha de JSX, sem refatorar o
// resto do dashboard) e resolve tudo internamente — dados, modal, marcação
// de "visto".
//
// Fluxo (fiel ao legado, que marca "visto" ao EXIBIR o comunicado — ver
// gatilho desta Tarefa; `SystemUpdateController::markSeen` do backend é
// idempotente, `upsert` na pivô `system_update_user`, seguro para chamar
// mais de uma vez):
//   1. Ao montar, busca `GET /system-updates/pending` (só se o usuário tiver
//      `system_updates_view` — mesma permissão exigida pelo backend nos 2
//      endpoints, `SystemUpdateController::middleware()`).
//   2. Se houver ao menos 1 pendente, abre o modal com a 1ª da fila e chama
//      `POST /system-updates/{uuid}/seen` imediatamente (marca "visto" ao
//      exibir, idempotente — não há problema em chamar de novo se o
//      componente remontar).
//   3. "Fechar" avança para a próxima pendente da fila (se houver) ou fecha
//      o modal — a marcação já aconteceu no passo 2, fechar é só UI.
//
// `description` é HTML cru vindo da API (GAP-BE-512, Opção B no backend) —
// SEMPRE renderizado via `RichTextContent` (que já sanitiza com DOMPurify
// internamente, `sanitizeHtml`), nunca `dangerouslySetInnerHTML` direto aqui.
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Dialog, Portal } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { RichTextContent } from '@/components/RichTextEditor/RichTextContent';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';

import {
  getPendingSystemUpdates,
  markSystemUpdateSeen,
} from '@/services/v2/BaseRegistrations/systemUpdate-service';

import type { SystemUpdateListItem } from '@/@types/v2/BaseRegistrations/systemUpdate';

export function SystemUpdatePendingModal() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.systemUpdate;

  const hasPermission = can('system_updates_view');

  const pendingQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.systemUpdatesPending],
    queryFn: async () => {
      const response = await getPendingSystemUpdates();
      return response.data;
    },
    enabled: hasPermission,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [queue, setQueue] = useState<SystemUpdateListItem[]>([]);
  const initializedRef = useRef(false);
  // Evita chamar `seen` mais de uma vez para o mesmo uuid nesta sessão de
  // componente (idempotente no backend, mas não há motivo para repetir a
  // chamada de rede a cada re-render).
  const markedSeenRef = useRef<Set<string>>(new Set());

  // Inicializa a fila UMA VEZ, quando a query resolve com sucesso — não
  // reinicializa em refetches subsequentes (evita reabrir um popup que o
  // usuário já fechou nesta sessão).
  useEffect(() => {
    if (!initializedRef.current && pendingQuery.isSuccess) {
      initializedRef.current = true;
      setQueue(pendingQuery.data ?? []);
    }
  }, [pendingQuery.isSuccess, pendingQuery.data]);

  const current = queue[0];

  // Marca "visto" assim que o item é EXIBIDO (fiel ao legado, ver cabeçalho)
  // — idempotente, `markSystemUpdateSeen` tolera chamada repetida.
  useEffect(() => {
    if (!current) return;
    if (markedSeenRef.current.has(current.uuid)) return;
    markedSeenRef.current.add(current.uuid);
    markSystemUpdateSeen(current.uuid).catch((error) => {
      // Falha ao marcar "visto" não deve travar a experiência do usuário —
      // o comunicado já foi exibido; só registra o erro no console (mesmo
      // racional de não bloquear a Home por uma falha de UX secundária).
      console.error('SystemUpdatePendingModal - markSystemUpdateSeen error:', error);
    });
  }, [current]);

  const handleDismiss = () => {
    setQueue((prev) => prev.slice(1));
  };

  if (!hasPermission || !current) {
    return null;
  }

  return (
    <Dialog.Root
      open={!!current}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleDismiss();
      }}
      lazyMount
      unmountOnExit
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>
                {text.pendingModal.title}
                {current.release_date ? ` — ${formatDate(current.release_date)}` : ''}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <RichTextContent html={current.description} />
            </Dialog.Body>
            <Dialog.Footer>
              <Button title={text.pendingModal.dismiss} onClick={handleDismiss} />
            </Dialog.Footer>
            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default SystemUpdatePendingModal;
