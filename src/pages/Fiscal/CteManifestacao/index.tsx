// src/pages/Fiscal/CteManifestacao/index.tsx
// -----------------------------------------------------------------------------
// Tela de listagem (grid) de Manifestação de CT-e (CteManifestacao — domínio
// Fiscal, execução 045, Onda 2, TASK-CTE-FE-12/13). Consome `GET /api/v1/
// cte-manifestacoes` (`CONTRATO-API-CTE-ONDA2.md §2`, E16). Modelo A (`get_
// pwa_complex_screen_compositions_pattern`), mirror estrutural `Fiscal/Cte/
// index.tsx`/`Fiscal/Dfe/index.tsx` (mesmo domínio).
//
// Ações por linha (TASK-CTE-FE-13): "Manifestar desacordo" (`cte_manifest`,
// visível `tipo=0` Pendente), "Gerar DANFE"/"Baixar XML" (`cte_manifest`,
// visíveis `tipo=1` Desacordo) — mirror `Fiscal/Dfe/index.tsx` (blob +
// `downloadBlob`, NUNCA `window.open(url cru)` — X-Farm-Id não propagaria).
//
// GAP-CTE-FE-01 (BLOQUEADO-INFRA): a consulta real à SEFAZ (E17, dialog
// "Consultar novos documentos") depende de certificado digital A1 de
// homologação, fora do controle deste código — o smoke cobre até a chamada
// de rede ser disparada e o tratamento de erro/loading.
// GAP-CTE-FE-04: `issue_id` (filtro + dialog de consulta) é enviado como
// uuid (única fonte real do SPA) — backend real exige `integer`, ver nota em
// `@/@types/v2/Fiscal/cteManifestacao`.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { FiCheckSquare, FiDownload, FiFileText } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { ClassificationBadge } from '@/components/ClassificationBadge';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { Table } from '@/components/Table';
import { toaster } from '@/components/ui/toaster';

import { TableProvider } from '@/contexts/TableContext';

import { useCustomGridQuery } from '@/hooks/useCustomGridQuery';
import { useLanguage } from '@/hooks/useLanguage';
import { userPaginatedQuery } from '@/hooks/usePaginatedQueryStorage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { styleColumTable } from '@/utils/style-colum-table';

import { getCteManifestacaoTipoSlot } from '@/constants/Fiscal/cteManifestacao/cte-manifestacao-tipo-classification';
import { cteManifestacaoTipoOptions } from '@/constants/Fiscal/cteManifestacao/options/cte-manifestacao-tipo-options';
import { CTE_MANIFESTACOES_LIST_STORAGE_KEY } from '@/constants/Fiscal/cteManifestacao/storage';
import { queryKey } from '@/constants/query-key';

import {
  getAllManifestacoes,
  getManifestacaoDanfe,
  getManifestacaoXml,
} from '@/services/v2/Fiscal/cte-manifestacao-service';

import type {
  CteManifestacaoFilterForm,
  CteManifestacaoListItem,
} from '@/@types/v2/Fiscal/cteManifestacao';

import { ConsultarDocumentosDialog } from './ConsultarDocumentosDialog';
import { FilterSideCteManifestacao } from './FilterSideCteManifestacao';
import { HeaderTable } from './HeaderTable';
import { ManifestarDesacordoDialog } from './ManifestarDesacordoDialog';

// `App\Enums\CteManifestaTipo`: 0 = Pendente (ação "Manifestar desacordo"
// visível), 1 = Desacordo/já manifestado (ações DANFE/XML visíveis).
const TIPO_PENDENTE = 0;
const TIPO_DESACORDO = 1;

export default function CteManifestacaoList() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.cteManifestacoes.cteManifestacao;

  const canManifest = can('cte_manifest');

  const defaultQueryOptions = useMemo(
    () => ({ pageSize: 10, storageKey: CTE_MANIFESTACOES_LIST_STORAGE_KEY }),
    []
  );

  const { paginatedQuery, handlePaginatedQuery, handleFilterChange, handleResetFilter } =
    userPaginatedQuery<CteManifestacaoFilterForm>(defaultQueryOptions);

  const { open: isFilterOpen, onOpen: onOpenFilter, onClose: onCloseFilter } = useDisclosure();
  const {
    open: isConsultarOpen,
    onOpen: onOpenConsultar,
    onClose: onCloseConsultar,
  } = useDisclosure();
  const {
    open: isManifestarOpen,
    onOpen: onOpenManifestar,
    onClose: onCloseManifestar,
  } = useDisclosure();

  const filtersApplied = useMemo(
    () =>
      Object.values(paginatedQuery.filter ?? {}).filter(
        (v) => v !== undefined && v !== null && v !== ''
      ).length,
    [paginatedQuery.filter]
  );

  const manifestacoesList = useCustomGridQuery<CteManifestacaoListItem, CteManifestacaoFilterForm>({
    asyncFunction: getAllManifestacoes,
    queryKey: queryKey.cteManifestacoes.cteManifestacoesList,
    paginatedQuery,
    setPaginatedQuery: handlePaginatedQuery,
    filterQuery: [],
    filter: paginatedQuery.filter ?? ({} as CteManifestacaoFilterForm),
  });

  const items = manifestacoesList.data?.data?.items;

  // ---- Manifestar desacordo (TASK-CTE-FE-13, tipo=0) -----------------------
  const [selectedManifestacaoUuid, setSelectedManifestacaoUuid] = useState<string | null>(null);

  function handleOpenManifestar(row: CteManifestacaoListItem) {
    setSelectedManifestacaoUuid(row.uuid);
    onOpenManifestar();
  }

  function handleCloseManifestar() {
    onCloseManifestar();
    setSelectedManifestacaoUuid(null);
  }

  // ---- DANFE/XML (TASK-CTE-FE-13, tipo=1) — blob + downloadBlob, loading
  // POR LINHA (mirror `Fiscal/Dfe/index.tsx::handleDownloadXml/
  // handleGenerateDanfe`). NUNCA `window.open(url cru)` — a rota exige
  // `X-Farm-Id`, que uma navegação direta do browser não envia. ------------
  const [generatingDanfeUuid, setGeneratingDanfeUuid] = useState<string | null>(null);
  const [downloadingXmlUuid, setDownloadingXmlUuid] = useState<string | null>(null);

  async function handleGenerateDanfe(row: CteManifestacaoListItem) {
    setGeneratingDanfeUuid(row.uuid);
    try {
      const blob = await getManifestacaoDanfe(row.uuid);
      downloadBlob(blob, `cte-manifesta-danfe-${row.chave || row.uuid}.pdf`);
    } catch (error) {
      toaster.error({
        title: text.pluralLabel,
        description: extractApiErrorMessage(error) || text.list.danfeError,
      });
    } finally {
      setGeneratingDanfeUuid(null);
    }
  }

  async function handleDownloadXml(row: CteManifestacaoListItem) {
    setDownloadingXmlUuid(row.uuid);
    try {
      const blob = await getManifestacaoXml(row.uuid);
      downloadBlob(blob, `cte-manifesta-${row.chave || row.uuid}.xml`);
    } catch (error) {
      toaster.error({
        title: text.pluralLabel,
        description: extractApiErrorMessage(error) || text.list.xmlError,
      });
    } finally {
      setDownloadingXmlUuid(null);
    }
  }

  // ---- Colunas (LS10-LS15) --------------------------------------------------
  const columnHelper = createColumnHelper<CteManifestacaoListItem>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('nome', {
        header: text.list.table.nome,
        cell: ({ row }) => <Text lineClamp="1">{row.original.nome ?? '—'}</Text>,
        meta: { gridLabel: text.list.table.nome },
      }),
      columnHelper.accessor('documento', {
        header: text.list.table.documento,
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.documento },
      }),
      columnHelper.accessor('valor', {
        header: text.list.table.valor,
        cell: ({ row }) => (
          <Text fontSize="sm" textAlign="right" fontVariantNumeric="tabular-nums">
            {formatCurrencyBRL(row.original.valor)}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.valor },
      }),
      columnHelper.accessor('data_emissao', {
        header: text.list.table.dataEmissao,
        cell: ({ row }) => (
          <Text fontSize="sm" color="fg.muted">
            {formatDate(row.original.data_emissao, 'dd/MM/yyyy HH:mm')}
          </Text>
        ),
        meta: { ...styleColumTable.sm, gridLabel: text.list.table.dataEmissao },
      }),
      // LS14 — Manifesto (badge amarelo/azul — `classification.*` tokens).
      columnHelper.accessor('tipo', {
        header: text.list.table.tipo,
        cell: ({ row }) => (
          <ClassificationBadge slot={getCteManifestacaoTipoSlot(row.original.tipo)}>
            {cteManifestacaoTipoOptions.getLabel(row.original.tipo, languageGB)}
          </ClassificationBadge>
        ),
        meta: { ...styleColumTable.md, gridLabel: text.list.table.tipo },
      }),
      // LS15 — Prazo Manifesto (calculado no BACKEND, `CteManifestaListResource
      // ::prazo`) — não listada em LS10-LS14 do roteiro da Tarefa, mas
      // presente no contrato legado (S40) e já retornada pelo backend
      // pronta para uso; incluída aqui por fidelidade (nenhum campo real
      // omitido).
      columnHelper.display({
        id: 'prazo',
        header: text.list.table.prazo,
        cell: ({ row }) => {
          const { tipo, prazo } = row.original;
          if (tipo === TIPO_DESACORDO) {
            return (
              <ClassificationBadge slot="neutral">
                {text.list.prazo.manifestado}
              </ClassificationBadge>
            );
          }
          if (prazo <= 0) {
            return (
              <ClassificationBadge slot="slot4">{text.list.prazo.encerrado}</ClassificationBadge>
            );
          }
          return (
            <ClassificationBadge slot="slot6">
              {text.list.prazo.diasRestantes.replace('{{days}}', String(prazo))}
            </ClassificationBadge>
          );
        },
        meta: { ...styleColumTable.md, gridLabel: text.list.table.prazo },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const isPendente = item.tipo === TIPO_PENDENTE;
          const isDesacordo = item.tipo === TIPO_DESACORDO;

          if (!canManifest) return null;

          return (
            <Flex justify="flex-end">
              <Actions languageGB={languageGB} tooltipLabel={languageGB.defaltStrings.actions}>
                {isPendente && (
                  <Actions.Item
                    icon={<Icon as={FiCheckSquare} />}
                    onClick={() => handleOpenManifestar(item)}
                  >
                    {text.list.actionsMenu.manifestarDesacordo}
                  </Actions.Item>
                )}
                {isDesacordo && (
                  <Actions.Item
                    icon={<Icon as={FiFileText} />}
                    disabled={generatingDanfeUuid === item.uuid}
                    onClick={() => handleGenerateDanfe(item)}
                  >
                    {text.list.actionsMenu.gerarDanfe}
                  </Actions.Item>
                )}
                {isDesacordo && (
                  <Actions.Item
                    icon={<Icon as={FiDownload} />}
                    disabled={downloadingXmlUuid === item.uuid}
                    onClick={() => handleDownloadXml(item)}
                  >
                    {text.list.actionsMenu.baixarXml}
                  </Actions.Item>
                )}
              </Actions>
            </Flex>
          );
        },
        meta: {
          gridLabel: languageGB.defaltStrings.actions,
          gridOrder: 'fixed-end',
          gridDataColumn: false,
        },
      }),
    ],
    [text, languageGB, canManifest, generatingDanfeUuid, downloadingXmlUuid]
  );

  const isLoading = checkLoadingStatus([manifestacoesList]);
  const isEmpty = !isLoading && (items?.length ?? 0) === 0;

  return (
    <ContainerGrid>
      <TableProvider
        data={items}
        columns={columns}
        pagination={paginatedQuery}
        setPagination={handlePaginatedQuery}
      >
        <HeaderGrid
          header={
            <HeaderTable
              onOpenFilter={onOpenFilter}
              filtersApplied={filtersApplied}
              onOpenConsultar={onOpenConsultar}
            />
          }
        >
          <VStack align="flex-start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
              {text.list.pageTitle}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {text.list.pageSubtitle}
            </Text>
          </VStack>
        </HeaderGrid>

        <Box mt={6}>
          {isEmpty && !manifestacoesList.isError ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiFileText} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{text.list.emptyState.title}</EmptyState.Title>
                  <EmptyState.Description>
                    {text.list.emptyState.description}
                  </EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Table
              isLoading={isLoading}
              isError={manifestacoesList.isError}
              error={manifestacoesList.error}
              onRetry={() => manifestacoesList.refetch()}
              isRetrying={manifestacoesList.isFetching}
            />
          )}
        </Box>
      </TableProvider>

      <FilterSideCteManifestacao
        isOpen={isFilterOpen}
        onClose={onCloseFilter}
        handleFilterChange={handleFilterChange}
        handleReset={handleResetFilter}
        filter={paginatedQuery.filter}
        languageGB={languageGB}
      />

      <ConsultarDocumentosDialog
        isOpen={isConsultarOpen}
        onClose={onCloseConsultar}
        languageGB={languageGB}
      />

      <ManifestarDesacordoDialog
        isOpen={isManifestarOpen}
        onClose={handleCloseManifestar}
        manifestacaoUuid={selectedManifestacaoUuid}
        languageGB={languageGB}
      />
    </ContainerGrid>
  );
}
