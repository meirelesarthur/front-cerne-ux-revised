// src/components/WriteOff/WriteOffActiveList.tsx
// -----------------------------------------------------------------------------
// Componente COMPARTILHADO de listagem das baixas ATIVAS de 1 título (`GET
// /{segment}/{uuid}/writeoffs`) + cancelamento por linha (`PUT
// /writeoffs/{uuid}/cancel`) — TASK-FE-036-332, ONDA 3 sub-onda 3a. Consumido
// tanto por Contas a Receber (`segment='incomes'`, TASK-FE-036-333) quanto
// pela fatia irmã de Contas a Pagar (`segment='expenses'`, ainda não
// fatiada). NÃO DUPLICAR — nenhum import do service de Income/Expense nem da
// constante de query-key específica desses módulos aqui dentro.
//
// Adaptação de UX deliberada vs. o legado (registrada, NÃO é fidelidade
// quebrada): o legado abre um modal com seleção por RÁDIO entre as baixas
// ativas + 1 botão de confirmar único (`DOC-BRUTA-B10 §C`). A API migrada
// cancela 1 write-off por chamada (`PUT /writeoffs/{uuid}/cancel`) — por isso
// esta lista usa 1 botão "Cancelar" POR LINHA (mirror do padrão já usado em
// toda a grid de Incomes/Expenses para ações por linha), em vez do
// rádio+confirmar único. A regra de NEGÓCIO (1 baixa cancelada por vez, com
// confirmação) é preservada.
//
// Cancelamento agrupado (existe no backend, implícito para o usuário) — se a
// baixa cancelada compartilhar `movement_id` com outra(s) (não deveria
// acontecer nesta fatia — toda baixa manual cria seu próprio `Movement`,
// Tarefa 330 — mas o backend SUPORTA por robustez futura), o `PUT` cancela o
// grupo inteiro. Por isso este componente SEMPRE reconsulta a lista inteira
// após qualquer cancelamento bem-sucedido — nunca remove só a linha
// localmente por otimismo.
//
// Resposta do cancelamento é 204 SEM CORPO — após sucesso, invalida a MESMA
// query key usada pelo `useQuery` de listagem deste componente e repassa
// `onCancelled` para o CONSUMIDOR invalidar as queries do próprio título
// (ex.: `balance` restaurado), mesma regra de fronteira de `WriteOffCreateModal`
// (Tarefa 331) — o componente compartilhado não conhece `queryKey` de
// Income/Expense.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { EmptyState, Flex, Icon, Skeleton, Table, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiInbox } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { cancelWriteOff, listActiveWriteOffs } from '@/services/v2/WriteOff/writeoff-service';

import type { WriteOffListItem, WriteOffSegment } from '@/@types/v2/WriteOff';

export interface WriteOffActiveListProps {
  segment: WriteOffSegment;
  titleUuid: string;
  /** Disparado após cancelar com sucesso — o CONSUMIDOR decide o que invalidar (ex.: `balance` do título). */
  onCancelled?: () => void;
}

export function WriteOffActiveList({ segment, titleUuid, onCancelled }: WriteOffActiveListProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.writeOff.list;
  const queryClient = useQueryClient();

  // Query key PRÓPRIA deste componente (namespace `write-offs-active`, NUNCA
  // a constante de query-key de Income/Expense) — mesma chave usada pelo
  // `useQuery` de listagem E pela invalidação após cancelar (DoD da Tarefa
  // 332). Array literal INLINE em cada call site (não extraído para
  // variável/função auxiliar) — mantém o lint `exhaustive-deps` do TanStack
  // Query capaz de rastrear `segment`/`titleUuid` corretamente.
  const writeOffsQuery = useQuery({
    queryKey: ['write-offs-active', segment, titleUuid],
    queryFn: async () => {
      const response = await listActiveWriteOffs(segment, titleUuid);
      return response.data;
    },
    enabled: isValidGuid(titleUuid),
    retry: false,
  });

  const isLoading = writeOffsQuery.isLoading || writeOffsQuery.isPending;
  const items = writeOffsQuery.data ?? [];

  const [writeOffToCancel, setWriteOffToCancel] = useState<WriteOffListItem | null>(null);

  const cancelMutation = useMutation({
    mutationFn: async (writeOffUuid: string) => cancelWriteOff(writeOffUuid),
    onSuccess: () => {
      toaster.success({
        title: text.title,
        description: text.cancelledToast,
        duration: 7000,
      });
      setWriteOffToCancel(null);
      // Reconsulta a lista INTEIRA (não remove só a linha por otimismo) —
      // cancelamento agrupado pode ter derrubado mais de 1 linha (ver
      // cabeçalho do arquivo).
      queryClient.invalidateQueries({ queryKey: ['write-offs-active', segment, titleUuid] });
      onCancelled?.();
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({ title: text.title, description: message, duration: 7000 });
      setWriteOffToCancel(null);
    },
  });

  const isCancelling = cancelMutation.isPending;

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  if (isLoading) {
    return (
      <VStack align="stretch" gap={2}>
        <Skeleton height="40px" borderRadius="md" />
        <Skeleton height="40px" borderRadius="md" />
      </VStack>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState.Root size="sm">
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Icon as={FiInbox} boxSize={6} color="fg.muted" />
          </EmptyState.Indicator>
          <VStack textAlign="center" gap={1}>
            <EmptyState.Title>{text.emptyState.title}</EmptyState.Title>
            <EmptyState.Description>{text.emptyState.description}</EmptyState.Description>
          </VStack>
        </EmptyState.Content>
      </EmptyState.Root>
    );
  }

  return (
    <>
      <Table.Root size="sm" variant="outline" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{text.columns.account}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.columns.reason}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.columns.movementDate}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.columns.amount}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.columns.netValue}</Table.ColumnHeader>
            <Table.ColumnHeader>{text.columns.note}</Table.ColumnHeader>
            <Table.ColumnHeader />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item) => (
            <Table.Row key={item.uuid}>
              <Table.Cell>{item.account?.description ?? '—'}</Table.Cell>
              <Table.Cell>{item.reason?.description ?? '—'}</Table.Cell>
              <Table.Cell>{item.date_movement}</Table.Cell>
              <Table.Cell>{formatCurrency(Number(item.amount))}</Table.Cell>
              <Table.Cell>{formatCurrency(Number(item.net_value))}</Table.Cell>
              <Table.Cell>{item.note || '—'}</Table.Cell>
              <Table.Cell>
                <Flex justify="flex-end">
                  <Button
                    title={text.cancelAction}
                    variant="ghost"
                    size="sm"
                    colorPalette="red"
                    disabled={isCancelling}
                    onClick={() => setWriteOffToCancel(item)}
                  />
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <DeleteConfirmDialog
        isOpen={writeOffToCancel !== null}
        onClose={() => setWriteOffToCancel(null)}
        onConfirm={() => {
          if (writeOffToCancel) cancelMutation.mutate(writeOffToCancel.uuid);
        }}
        isLoading={isCancelling}
        title={text.cancelConfirmTitle}
        description={text.cancelConfirmDescription}
        confirmButtonText={text.cancelAction}
        tone="warning"
        colorPalette="orange"
      />
    </>
  );
}
