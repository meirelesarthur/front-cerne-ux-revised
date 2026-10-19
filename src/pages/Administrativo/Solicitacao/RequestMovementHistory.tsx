// src/pages/Administrativo/Solicitacao/RequestMovementHistory.tsx
// -----------------------------------------------------------------------------
// Bloco de UI "Histórico" do formulário único de Solicitação de Compras
// (RequestPurchase — Administrativo/Suprimentos, esteira 97-Esteiras/022,
// TASK-RP-FE-07). Lista 100% READ-ONLY (`movements[]`, `RequestMovementRow`
// de `@/@types/v2/RequestPurchases`, TASK-RP-FE-01) do trâmite da
// Solicitação — nenhum input, nenhum `Controller`/`useFieldArray` (diferente
// de `RequestItemRow`/`RequestAttachmentRow`, que são seções editáveis).
// `TASK-RP-FE-09` (formulário único, ainda não construído) CONSOME este
// componente na aba "Histórico", passando `requestPurchaseData?.movements`.
//
// Sem endpoint próprio — `movements[]` já vem embutido no
// `GET /request-purchases/{uuid}` (`RequestPurchaseResource`, contrato §4),
// não precisa de query separada nem paginação aqui (lista tipicamente curta
// — um movimento por transição de status/trâmite da Solicitação).
//
// Execução 081 / T-081-FE-05 (legado show.blade: Movimentações) — colunas na
// ordem Data, Responsável, Status, Tempo Gasto e Descrição/Justificativa.
// "Responsável" vem de `movement.user` (agora carregado pela API) e "Tempo
// Gasto" de `elapsed_label` ("< 1h", "5h", "1d 6h"): o front NÃO calcula.
//
// `status` de cada linha é o status de ORIGEM do movimento (DA-RP-09,
// somente leitura) — `requestPurchaseStatusColor[status]`
// (`constants/RequestPurchases/request-purchase-status.ts`, TASK-RP-FE-02)
// resolve a cor do `Badge`, mesmo padrão de uso de `colorPalette` já visto em
// `EquipamentoRateioCentroCustoTab.tsx`. `status` chega como `number` cru
// (não o union fechado `RequestPurchaseStatus`) — indexação defensiva com
// fallback `gray` abaixo (dado histórico fora do domínio do enum não deve
// quebrar a tela, mesmo racional de tolerância já usado no bloco fiscal de
// `Product` para enums com dado legado).
// -----------------------------------------------------------------------------

import { Badge, Box, Flex, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import {
  requestPurchaseStatusColor,
  RequestPurchaseStatus,
} from '@/constants/RequestPurchases/request-purchase-status';

import type { RequestMovementRow } from '@/@types/v2/RequestPurchases';

export interface RequestMovementHistoryProps {
  movements: RequestMovementRow[];
}

function statusColorPalette(status: number): string {
  return requestPurchaseStatusColor[status as RequestPurchaseStatus] ?? 'gray';
}

export function RequestMovementHistory({ movements }: RequestMovementHistoryProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form;
  const historyText = text.historySection;

  return (
    <Box pt={4}>
      <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
        {movements.length === 0 ? (
          <Box py={2}>
            <Text fontSize="sm" color="fg.muted">
              {historyText.emptyLabel}
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={0}>
            <Flex
              gap={3}
              px={2}
              py={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
              display={{ base: 'none', md: 'flex' }}
            >
              <Box flex="1" minW="140px">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  {historyText.columns.date}
                </Text>
              </Box>
              <Box flex="1" minW="160px">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  {historyText.columns.user}
                </Text>
              </Box>
              <Box flex="1" minW="140px">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  {historyText.columns.status}
                </Text>
              </Box>
              <Box w="110px">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  {historyText.columns.elapsed}
                </Text>
              </Box>
              <Box flex="2" minW="220px">
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                  {historyText.columns.justify}
                </Text>
              </Box>
            </Flex>

            {movements.map((movement) => (
              <Flex
                key={movement.uuid}
                gap={3}
                px={2}
                py={3}
                borderBottom="1px solid"
                borderColor="border.subtle"
                wrap="wrap"
                align="center"
              >
                <Box flex="1" minW="140px">
                  <Text fontSize="sm">{formatDate(movement.created_at, 'dd/MM/yyyy HH:mm')}</Text>
                </Box>
                <Box flex="1" minW="160px">
                  {/* `movement.user` segue opcional no tipo: fallback "—". */}
                  <Text fontSize="sm">{movement.user?.name ?? '—'}</Text>
                </Box>
                <Box flex="1" minW="140px">
                  <Badge colorPalette={statusColorPalette(movement.status)} variant="subtle">
                    {movement.status_label}
                  </Badge>
                </Box>
                <Box w="110px">
                  <Text fontSize="sm">{movement.elapsed_label ?? '—'}</Text>
                </Box>
                <Box flex="2" minW="220px">
                  <Text fontSize="sm">{movement.justify ?? '--'}</Text>
                </Box>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
