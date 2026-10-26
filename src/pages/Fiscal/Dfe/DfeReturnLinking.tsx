// src/pages/Fiscal/Dfe/DfeReturnLinking.tsx
// -----------------------------------------------------------------------------
// Tela de Vínculo de Retorno (`dfe.return`/SURF-SCREEN-RETURN) — FLX-010.
// Disparada por "Lançar Retorno" (`tipo==='0'`) na Listagem
// (`Fiscal/Dfe/index.tsx::handleLaunchReturn`). Seleciona 1..N vendas e navega
// para as telas de finalização JÁ EXISTENTES (`/operacional/venda-animais/
// :uuid/finalizar` ou `/finalizar-lote?ids=`) — esta tela NÃO recria a
// finalização, só a etapa de SELEÇÃO/vínculo.
//
// UT-000752 (T-752-FE-03): consome `GET /dfes/{uuid}/return-candidates` (só
// Abate pendente da fazenda atual com o MESMO CNPJ/CPF da nota; paginação 10;
// filtros `date`/`search` NO SERVIDOR; `suggestions` ≤ 2). Resolve:
//   GAP-1 (filtro por CNPJ)   → feito pela API.
//   GAP-2 (filtro V/R)        → NAO_APLICAVEL (a API de vendas não tem V/R).
//   GAP-3 ("Aceitar sugestão")→ bloco "Sugestões" devolvido pela API.
// O cabeçalho (razão social/CNPJ/chave/valor) vem da API — sobrevive a F5, sem
// `location.state`. NÃO há chamada a `/movement-sales` nesta tela.
//
// DIV-09 (CLM-DFe-048) — `rowSelection` CONTROLADO por `uuid` (`getRowId`),
// preservado entre páginas: só inclui uuids explicitamente marcados.
//
// BLOQUEADO (fora do front, INV-FIS-21): a API ainda NÃO grava
// `movement_sales.key_nfe_return` ao finalizar; logo "Lançada=Abate" não
// aparece depois do Retorno. Não simulado aqui.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import {
  Box,
  Card,
  EmptyState,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiAlertCircle, FiFileText, FiInfo } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { Checkbox } from '@/components/ui/checkbox';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQueryById } from '@/hooks/useCustomGridQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { formatDocument } from '@/utils/format-document';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  listDfeReturnCandidates,
  type ListDfeReturnCandidatesResult,
} from '@/services/v2/Fiscal/dfe-service';

import type { DfeReturnCandidate } from '@/@types/v2/Fiscal/dfe';

import type { OnChangeFn, RowSelectionState } from '@tanstack/react-table';

import { PageHeader } from '@/components/ui/PageHeader';

const DFE_RETURN_LINKING_STORAGE_KEY = 'dfe-return-linking:v2:';
const SEARCH_DEBOUNCE_MS = 400;

interface ReturnLinkingFilter {
  date?: string;
  search?: string;
}

function formatMoney(value: number | null | undefined): string {
  return typeof value === 'number' ? formatCurrencyBRL(value) : '--';
}

export default function DfeReturnLinking() {
  const { dfeUuid = '' } = useParams<{ dfeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const text = languageGB.dfes.dfe.return;

  // ---- Grid: paginação 10 + filtros `date`/`search` NO SERVIDOR ----------
  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: DFE_RETURN_LINKING_STORAGE_KEY + dfeUuid }),
    [dfeUuid]
  );
  const { paginatedQuery, handlePaginatedQuery, handleFilterChange } =
    userPaginatedQuery<ReturnLinkingFilter>(defaultQueryOptions);

  const appliedFilter = paginatedQuery.filter;
  const [searchInput, setSearchInput] = useState(appliedFilter?.search ?? '');

  // Busca textual com debounce → aplica no filtro (reseta p/ página 1).
  useEffect(() => {
    if ((appliedFilter?.search ?? '') === searchInput.trim()) return undefined;
    const timer = setTimeout(() => {
      handleFilterChange({ ...appliedFilter, search: searchInput.trim() || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const candidatesQuery = useCustomGridQueryById<DfeReturnCandidate, ReturnLinkingFilter>({
    registrationId: dfeUuid,
    asyncFunctionById: listDfeReturnCandidates,
    queryKey: queryKey.dfes.returnCandidates,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: appliedFilter ?? {},
  });

  const result = candidatesQuery.data as ListDfeReturnCandidatesResult | undefined;
  const context = result?.context;
  const items = result?.data?.items ?? [];
  const suggestions = context?.suggestions ?? [];

  // ---- Seleção CONTROLADA por uuid (preservada entre páginas) ------------
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelection) : updater;
    setRowSelection(next);
  };

  const selectedUuids = useMemo(
    () => Object.keys(rowSelection).filter((uuid) => rowSelection[uuid]),
    [rowSelection]
  );

  // "Aceitar sugestão" (ACT-22): marca os uuids sugeridos pela API.
  function handleAcceptSuggestions() {
    setRowSelection((prev) => ({
      ...prev,
      ...Object.fromEntries(suggestions.map((suggestion) => [suggestion.uuid, true])),
    }));
  }

  function handleLinkAndFinish() {
    if (selectedUuids.length === 0) return;
    if (selectedUuids.length === 1) {
      navigate(`/operacional/venda-animais/${selectedUuids[0]}/finalizar`);
      return;
    }
    navigate(`/operacional/venda-animais/finalizar-lote?ids=${selectedUuids.join(',')}`);
  }

  // ---- Colunas ------------------------------------------------------------
  const columnHelper = createColumnHelper<DfeReturnCandidate>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={() => row.toggleSelected()}
            aria-label={row.original.code}
          />
        ),
        meta: { gridLabel: '', gridOrder: 'fixed-start', gridDataColumn: false },
      }),
      columnHelper.accessor('code', {
        header: text.table.code,
        cell: ({ row }) => <Text fontWeight="medium">{row.original.code}</Text>,
        meta: { gridLabel: text.table.code },
      }),
      columnHelper.accessor((row) => row.client_name ?? '', {
        id: 'client',
        header: text.table.client,
        cell: ({ row }) => <Text lineClamp="1">{row.original.client_name || '--'}</Text>,
        meta: { gridLabel: text.table.client },
      }),
      columnHelper.accessor('dt_sale', {
        header: text.table.date,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.dt_sale)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.date },
      }),
      columnHelper.accessor('total', {
        header: text.table.amount,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatMoney(row.original.total)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.amount },
      }),
    ],
    [text]
  );

  const isLoading = checkLoadingStatus([candidatesQuery]);
  const isEmpty = !isLoading && items.length === 0;

  // 404 / 422 ("não é de retorno" / "já lançada") → estado de erro com a
  // mensagem real da API + "Voltar" (sem grade, sem retry).
  const errorStatus = (candidatesQuery.error as { response?: { status?: number } } | null)?.response
    ?.status;
  const isBlockingError =
    candidatesQuery.isError && (errorStatus === 404 || errorStatus === 422 || errorStatus === 403);
  const blockingMessage = isBlockingError
    ? (extractApiErrorMessage(candidatesQuery.error) ?? text.loadError)
    : '';

  return (
    <ContainerGrid>
      <HeaderGrid
        header={<Button variant="outline" title={text.backButton} onClick={() => navigate(-1)} />}
      >
        <PageHeader title={text.pageTitle} description={text.pageSubtitle} />
      </HeaderGrid>

      {isBlockingError ? (
        <EmptyState.Root mt={6}>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiAlertCircle} boxSize={8} color="fg.error" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1} role="alert">
              <EmptyState.Title>{blockingMessage}</EmptyState.Title>
            </VStack>
            <Button title={text.backButton} variant="outline" onClick={() => navigate(-1)} />
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          {/* Cabeçalho da NF-e de origem — vem da API (sobrevive a F5). */}
          {isLoading && !context ? (
            <Skeleton height="64px" mt={4} borderRadius="lg" />
          ) : (
            context && (
              <Flex align="flex-start" gap={2} p={3} mt={4} bg="bg.subtle" borderRadius="lg">
                <Icon as={FiInfo} color="fg.muted" mt={0.5} flexShrink={0} />
                <VStack align="flex-start" gap={0} fontSize="sm">
                  <Text fontWeight="medium">{context.dfe.razao_social}</Text>
                  <Text color="fg.muted">{formatDocument(context.dfe.cpf_cnpj ?? '')}</Text>
                  <Text color="fg.muted" fontFamily="mono" fontSize="xs" wordBreak="break-all">
                    {context.dfe.chave}
                  </Text>
                  <Text color="fg.muted">{formatMoney(context.dfe.valor)}</Text>
                </VStack>
              </Flex>
            )
          )}

          {/* Sugestões (≤ 2, devolvidas pela API) + "Aceitar sugestão". */}
          {suggestions.length > 0 && (
            <Card.Root mt={4} variant="outline" aria-label={text.suggestionsTitle}>
              <Card.Body gap={2}>
                <HStack justify="space-between" flexWrap="wrap">
                  <Text fontWeight="semibold" fontSize="sm">
                    {text.suggestionsTitle}
                  </Text>
                  <Button
                    title={text.acceptSuggestionButton}
                    size="sm"
                    variant="outline"
                    onClick={handleAcceptSuggestions}
                  />
                </HStack>
                {suggestions.map((suggestion) => (
                  <HStack key={suggestion.uuid} gap={4} fontSize="sm" flexWrap="wrap">
                    <Text fontWeight="medium">{suggestion.code}</Text>
                    <Text color="fg.muted">{suggestion.client_name || '--'}</Text>
                    <Text color="fg.muted">{formatDate(suggestion.dt_sale)}</Text>
                    <Text fontVariantNumeric="tabular-nums">{formatMoney(suggestion.total)}</Text>
                  </HStack>
                ))}
              </Card.Body>
            </Card.Root>
          )}

          <HStack mt={4} gap={3} flexWrap="wrap" align="flex-end">
            <Box minW="180px">
              <DateInput
                value={appliedFilter?.date ?? null}
                onChange={(value) =>
                  handleFilterChange({ ...appliedFilter, date: value || undefined })
                }
                placeholder={text.filter.date}
              />
            </Box>
            <Box minW="220px">
              <Input
                name="search"
                label={text.filter.search}
                placeholder={text.filter.searchPlaceholder}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </Box>
          </HStack>

          <HStack justify="flex-end" mt={4} mb={-2}>
            {selectedUuids.length > 0 && (
              <Text fontSize="sm" color="fg.muted">
                {selectedUuids.length}
              </Text>
            )}
            {/* `ACT-24` — habilitado só com seleção não vazia. */}
            <Button
              title={text.linkAndFinishButton}
              size="sm"
              disabled={selectedUuids.length === 0}
              onClick={handleLinkAndFinish}
            />
          </HStack>

          <TableProvider
            data={items}
            columns={defaultColumns}
            pagination={paginatedQuery}
            setPagination={handlePaginatedQuery}
            enableMultiRowSelection
            getRowId={(row: DfeReturnCandidate) => row.uuid}
            rowSelection={rowSelection}
            onRowSelectionChange={handleRowSelectionChange}
          >
            <Box mt={6}>
              {isEmpty && !candidatesQuery.isError ? (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon as={FiFileText} boxSize={8} color="fg.muted" />
                    </EmptyState.Indicator>
                    <VStack textAlign="center" gap={1}>
                      <EmptyState.Title>{text.emptyState.title}</EmptyState.Title>
                      <EmptyState.Description>{text.emptyState.description}</EmptyState.Description>
                    </VStack>
                  </EmptyState.Content>
                </EmptyState.Root>
              ) : (
                <Table
                  isLoading={isLoading}
                  isError={candidatesQuery.isError}
                  error={candidatesQuery.error}
                  onRetry={() => candidatesQuery.refetch()}
                  isRetrying={candidatesQuery.isFetching}
                />
              )}
            </Box>
          </TableProvider>
        </>
      )}
    </ContainerGrid>
  );
}
