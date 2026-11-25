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
//
// Visual (25/11): mesma tabela da aba Cotações (`SimpleTable`) e a situação
// em `StatusTag`, com a cor de cada status do suprimento.
// -----------------------------------------------------------------------------

import { Box, Text } from '@chakra-ui/react';

import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import {
  requestPurchaseStatusDotToken,
  RequestPurchaseStatus,
} from '@/constants/RequestPurchases/request-purchase-status';

import type { RequestMovementRow } from '@/@types/v2/RequestPurchases';

import { RequestTabEmpty, RequestTabHeader } from './RequestTabParts';

export interface RequestMovementHistoryProps {
  movements: RequestMovementRow[];
}

function statusToken(status: number): string {
  return requestPurchaseStatusDotToken[status as RequestPurchaseStatus] ?? 'semanticNeutral.500';
}

export function RequestMovementHistory({ movements }: RequestMovementHistoryProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form;
  const historyText = text.historySection;

  const columns: SimpleTableColumn[] = [
    { key: 'date', header: historyText.columns.date },
    { key: 'user', header: historyText.columns.user },
    { key: 'status', header: historyText.columns.status },
    { key: 'elapsed', header: historyText.columns.elapsed, align: 'right' },
    { key: 'justify', header: historyText.columns.justify },
  ];

  const rows: SimpleTableRow[] = movements.map((movement) => ({
    key: movement.uuid,
    cells: {
      date: (
        <Text whiteSpace="nowrap">{formatDate(movement.created_at, 'dd/MM/yyyy HH:mm')}</Text>
      ),
      // `movement.user` segue opcional no tipo: fallback "—".
      user: <Text fontWeight="medium">{movement.user?.name ?? '—'}</Text>,
      status: (
        <StatusTag size="sm" label={movement.status_label} color={statusToken(movement.status)} />
      ),
      elapsed: <Text whiteSpace="nowrap">{movement.elapsed_label ?? '—'}</Text>,
      justify: (
        <Text color={movement.justify ? undefined : 'fg.muted'} minW="200px">
          {movement.justify ?? '—'}
        </Text>
      ),
    },
  }));

  return (
    <Box pt={4}>
      <RequestTabHeader title={text.tabs.history} count={movements.length} />
      {movements.length === 0 ? (
        <RequestTabEmpty>{historyText.emptyLabel}</RequestTabEmpty>
      ) : (
        <SimpleTable columns={columns} rows={rows} ariaLabel={text.tabs.history} />
      )}
    </Box>
  );
}
