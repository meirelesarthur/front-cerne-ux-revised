// src/pages/BaseRegistrations/NfseRecebidas/index.tsx
// -----------------------------------------------------------------------------
// Tela de LISTAGEM (grid) de NFSe Recebidas (Nfse — domínio Fiscal, execução
// 033, TASK-FE-2732 + wiring de TASK-FE-2733). Depende de `TASK-FE-2730`
// (fundação) e `TASK-FE-2731` (filtro). Consome `GET /api/v1/nfses` (backend
// APROVADO, TASK-BE-973/974/975).
//
// Domínio NÃO É CRUD (contrato §1/§7.4 — sem `update`/`destroy` de `Nfse`) —
// divergência DECLARADA da regra global 1 do protocolo `padrao-frontend-gb-
// cerne-v2` ("ações de linha: só Editar/Excluir"): é documento fiscal de
// terceiro, só leitura + ações de download/lançamento. As 3 ações reais do
// legado ("Lançar NFe Despesa"/"Gerar DANFE"/"Baixar XML") SUBSTITUEM
// Editar/Excluir, cada uma gateada pela sua própria permissão
// (`nfse_launch`/`nfse_danfe`/`nfse_xml`).
//
// Referência PRINCIPAL de estrutura: `BaseRegistrations/IssueDfeSyncTimes/
// index.tsx` (sibling mais recente do MESMO domínio Fiscal, mesma FK
// Issuer) — mais simples aqui porque o backend já devolve
// `issuer_razao_social` DIRETO no Resource (sem relação aninhada a resolver
// no front).
//
// RN-1 (contrato §1/§4): sem `issuer_uuid` no filtro aplicado, a query NÃO
// dispara (`enabled: Boolean(filter?.issuer_uuid)`) — evita 1 fetch inútil
// a cada digitação de outro filtro; empty-state DEDICADO cobre esse estado
// (distinto de "sem resultados"/"nenhum documento sincronizado ainda").
//
// "Lançar NFe Despesa" (UT-000754, FE-02): `POST /nfses/{uuid}/expense-draft`
// via `useRequest` (`typesRequest: 'apply'`) e, no sucesso, NAVEGA direto para
// `/financeiro/pagar/novo` com `state.nfseDraft` (como o legado) — o modal de
// leitura `ExpenseDraftModal` foi removido (P-FE-01). Visível com
// `nfse_launch`; habilitada só se `!is_launched` E `expenses_create` (P-FE-02,
// com tooltip quando falta a permissão). 422 "já vinculada" vira toast pelo
// `useRequest`, sem navegar. Colunas: CPF/CNPJ mascarado, emissão
// `dd/MM/yyyy HH:mm`, competência `MM/yyyy`, nulos `--` (P-FE-05).
//
// Downloads ("Baixar XML"/"Gerar DANFE") são handlers locais (SEM
// `useRequest`/mutation — é leitura, não escrita), com estado de loading
// POR LINHA (`downloadingUuid`/`generatingDanfeUuid`, não um booleano único
// — múltiplas linhas podem baixar em paralelo), mirror
// `EstoqueInicial/HeaderTable.tsx::handleDownloadTemplate` adaptado para
// granularidade por linha.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckCircle, FiFileText, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useGridSettings } from '@/hooks/useGridSettings';
import { useGridStorageScope } from '@/hooks/useGridStorageScope';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { formatDocument } from '@/utils/format-document';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { queryKey } from '@/constants/query-key';

import {
  buildNfseExpenseDraft,
  downloadNfseXml,
  generateNfseDanfe,
  listNfses,
} from '@/services/v2/BaseRegistrations/nfse-service';

import type {
  NfseExpenseDraft,
  NfseFilterForm,
  NfseListItem,
} from '@/@types/v2/BaseRegistrations/nfse';

import { FilterSideNfseRecebidas } from './FilterSideNfseRecebidas';
import { HeaderTable } from './HeaderTable';
import { NFSE_RECEBIDAS_STORAGE_KEY } from './storage';

// Chaves DISPLAY-ONLY do filtro que não contam para a distinção
// "sem resultados" vs "resultado filtrado" no empty-state — `issuer_uuid` é
// OBRIGATÓRIO por UX (RN-1), não uma refinação opcional da grid.
const REQUIRED_FILTER_KEY = 'issuer_uuid';

function formatCurrencyBRL(value: number): string {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// IBS = v_ibs_uf + v_ibs_mun; `null` quando ambos ausentes (nota sem grupo
// tributário ou sem IBS). Um só `null` conta como zero na soma.
function sumIbs(row: NfseListItem): number | null {
  if (row.v_ibs_uf == null && row.v_ibs_mun == null) return null;
  return Number(row.v_ibs_uf ?? 0) + Number(row.v_ibs_mun ?? 0);
}

export default function NfseRecebidasList() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.nfse.list;

  const navigate = useNavigate();
  const canLaunch = can('nfse_launch');
  const canCreateExpense = can('expenses_create');
  const canDanfe = can('nfse_danfe');
  const canXml = can('nfse_xml');

  const defaultQueryOptions = useMemo(
    () => ({
      pageSize: 10,
      storageKey: NFSE_RECEBIDAS_STORAGE_KEY,
    }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<NfseFilterForm>(defaultQueryOptions);

  // ---- Estado de filtro (drawer) ------------------------------------------
  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();

  const hasIssuer = Boolean(paginatedQuery.filter?.issuer_uuid);

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // Refinações OPCIONAIS aplicadas (exclui `issuer_uuid`, obrigatório) — usado
  // só para distinguir "nenhum documento sincronizado ainda" (issuer com 0
  // documentos, sem outro filtro) de "nenhum resultado" (issuer + filtro extra
  // sem match).
  const extraFiltersApplied = useMemo(
    () =>
      Object.entries(paginatedQuery.filter ?? {}).filter(
        ([key, v]) => key !== REQUIRED_FILTER_KEY && v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  // ---- Grid (RN-1: só dispara com Emissor selecionado) --------------------
  const nfsesList = useCustomGridQuery<NfseListItem, NfseFilterForm>({
    asyncFunction: listNfses,
    queryKey: queryKey.baseRegistrations.nfses,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as NfseFilterForm),
    enabled: hasIssuer,
  });

  // ---- Downloads (leitura, sem mutation — loading POR LINHA) --------------
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  const [generatingDanfeUuid, setGeneratingDanfeUuid] = useState<string | null>(null);

  async function handleDownloadXml(row: NfseListItem) {
    setDownloadingUuid(row.uuid);
    try {
      const blob = await downloadNfseXml(row.uuid);
      downloadBlob(blob, `nfse-${row.chave || row.number}.xml`);
    } catch {
      toaster.error({ title: text.pageTitle, description: text.downloadXmlError });
    } finally {
      setDownloadingUuid(null);
    }
  }

  async function handleGenerateDanfe(row: NfseListItem) {
    setGeneratingDanfeUuid(row.uuid);
    try {
      const blob = await generateNfseDanfe(row.uuid);
      downloadBlob(blob, `danfe-${row.chave || row.number}.pdf`);
    } catch {
      toaster.error({ title: text.pageTitle, description: text.generateDanfeError });
    } finally {
      setGeneratingDanfeUuid(null);
    }
  }

  // ---- "Lançar NFe Despesa" (UT-000754) -----------------------------------
  const expenseDraftMutation = useRequest<NfseExpenseDraft>({
    asyncFunction: (uuid: string) => buildNfseExpenseDraft(uuid),
    typesRequest: 'apply',
    entityName: languageGB.baseRegistrations.nfse.singularLabel,
    personalizedMessage: languageGB.baseRegistrations.nfse.expenseDraft.successMessage,
    queryKey: queryKey.baseRegistrations.nfses,
    actionSuccess: (data) => {
      navigate('/financeiro/pagar/novo', { state: { nfseDraft: data } });
    },
  });

  function handleLaunchExpense(row: NfseListItem) {
    expenseDraftMutation.mutate(row.uuid);
  }

  const columnHelper = createColumnHelper<NfseListItem>();
  const defaultColumns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: text.table.prestador,
        cell: ({ row }) => (
          <Text fontWeight="medium" lineClamp="1">
            {row.original.name}
          </Text>
        ),
        meta: { gridLabel: text.table.prestador },
      }),
      columnHelper.accessor('cpf_cnpj', {
        header: text.table.cpfCnpj,
        cell: ({ row }) => (
          <Text lineClamp="1">
            {row.original.cpf_cnpj ? formatDocument(row.original.cpf_cnpj) : '--'}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.cpfCnpj },
      }),
      columnHelper.accessor('number', {
        header: text.table.numero,
        cell: ({ row }) => <Text lineClamp="1">{row.original.number}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.table.numero },
      }),
      columnHelper.accessor('value', {
        header: text.table.valor,
        cell: ({ row }) => <Text lineClamp="1">{formatCurrencyBRL(row.original.value)}</Text>,
        meta: { ...styleColumTable.sm, gridLabel: text.table.valor },
      }),
      columnHelper.display({
        id: 'ibs',
        header: text.table.ibs,
        cell: ({ row }) => {
          const ibs = sumIbs(row.original);
          return <Text lineClamp="1">{ibs === null ? '--' : formatCurrencyBRL(ibs)}</Text>;
        },
        meta: { ...styleColumTable.sm, gridLabel: text.table.ibs },
      }),
      columnHelper.accessor('v_cbs', {
        header: text.table.cbs,
        cell: ({ row }) => (
          <Text lineClamp="1">
            {row.original.v_cbs == null ? '--' : formatCurrencyBRL(row.original.v_cbs)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.cbs },
      }),
      columnHelper.accessor('dt_emission', {
        header: text.table.dtEmissao,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.dt_emission, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.dtEmissao },
      }),
      columnHelper.accessor('competence', {
        header: text.table.competencia,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.competence, 'MM/yyyy')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.competencia },
      }),
      // Coluna real de status — SÓ `is_launched` (decisão herdada GAP-BE-518:
      // NÃO existe legenda "Integrado com a Domínio"/`integration_status`).
      columnHelper.accessor('is_launched', {
        header: text.table.lancada,
        cell: ({ row }) => (
          <Badge
            colorPalette={row.original.is_launched ? 'green' : 'gray'}
            variant="subtle"
            py={1}
            px={3}
          >
            {row.original.is_launched ? text.badges.launched : text.badges.notLaunched}
          </Badge>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.table.lancada },
      }),
      columnHelper.display({
        id: 'acoes',
        header: '',
        enableHiding: false,
        cell: ({ row }) => (
          <Flex justify="flex-end">
            <Actions size="sm" tooltipLabel={languageGB.defaltStrings.actions}>
              {canLaunch && (
                <Actions.Item
                  icon={<Icon as={FiCheckCircle} />}
                  onClick={() => handleLaunchExpense(row.original)}
                  disabled={
                    row.original.is_launched || !canCreateExpense || expenseDraftMutation.isPending
                  }
                  disabledReason={
                    !row.original.is_launched && !canCreateExpense
                      ? languageGB.baseRegistrations.nfse.expenseDraft.noPermissionReason
                      : undefined
                  }
                >
                  {text.actions.launchExpense}
                </Actions.Item>
              )}
              {canDanfe && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handleGenerateDanfe(row.original)}
                  disabled={generatingDanfeUuid === row.original.uuid}
                >
                  {text.actions.generateDanfe}
                </Actions.Item>
              )}
              {canXml && (
                <Actions.Item
                  icon={<Icon as={FiFileText} />}
                  onClick={() => handleDownloadXml(row.original)}
                  disabled={downloadingUuid === row.original.uuid}
                >
                  {text.actions.downloadXml}
                </Actions.Item>
              )}
            </Actions>
          </Flex>
        ),
        meta: {
          ...styleColumTable.sm,
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [
      text,
      languageGB.defaltStrings.actions,
      canLaunch,
      canCreateExpense,
      canDanfe,
      canXml,
      expenseDraftMutation.isPending,
      generatingDanfeUuid,
      downloadingUuid,
    ]
  );

  const gridSettings = useGridSettings<NfseListItem>({
    storageKey: NFSE_RECEBIDAS_STORAGE_KEY,
    storageScope: useGridStorageScope(),
    columns: defaultColumns,
  });
  const { columnOrder, setColumnOrder, columnVisibility, setColumnVisibility } = gridSettings;

  const isLoading = hasIssuer && checkLoadingStatus([nfsesList]);
  const items = hasIssuer ? nfsesList.data?.data?.items : undefined;
  const isEmpty = hasIssuer && !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={defaultColumns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
        enableMultiRowSelection={false}
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              languageGB={languageGB}
              gridSettings={gridSettings}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {!hasIssuer ? (
            // Empty-state DEDICADO — sem `issuer_uuid` no filtro (RN-1),
            // distinto de "sem resultados" (issuer selecionado, grid vazia).
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiSearch} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.emptyState.titleNoIssuer}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.emptyState.descriptionNoIssuer}
                  </EmptyState.Description>
                </VStack>
                <Button title={languageGB.defaltStrings.filters} size="sm" onClick={onOpenFilter} />
              </EmptyState.Content>
            </EmptyState.Root>
          ) : isEmpty && !nfsesList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>
                    {extraFiltersApplied > 0
                      ? text.emptyState.titleFiltered
                      : text.emptyState.titleEmpty}
                  </EmptyState.Title>
                  <EmptyState.Description>
                    {extraFiltersApplied > 0
                      ? text.emptyState.descriptionFiltered
                      : text.emptyState.descriptionEmpty}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={nfsesList.isError}
              error={nfsesList.error}
              onRetry={() => nfsesList.refetch()}
              isRetrying={nfsesList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideNfseRecebidas
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />
    </ContainerGrid>
  );
}
