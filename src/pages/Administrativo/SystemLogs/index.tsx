// src/pages/Administrativo/SystemLogs/index.tsx
// -----------------------------------------------------------------------------
// Explorador de logs do sistema (execução 079) — Administrativo › Sistema ›
// Logs do Sistema. Rota: /administrativo/logs?path=<dir relativo a storage/logs>
// (vazio = raiz). Só `Gestor_Plataf` (guard na rota; 403 real é da API).
//
// Composição de componentes existentes do `cerne` (UX-GAP-079-01: o design
// system não tem página de logs): ContainerGrid + HeaderGrid + breadcrumb
// local + tabela Chakra no padrão de `Administrativo/Sla` (listagem de UM
// diretório, SEM paginação — não usa TableProvider/useCustomGridQuery).
//
// Ordenação: server-side (`sort`/`direction` da API; pastas sempre antes, `name`
// em ordem natural). Filtro por nome: local, sem acento/caixa, debounce 200 ms.
// Sem mock: dado ausente = estado de UI honesto (loading/vazio/erro/403/404).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState, type ElementType } from 'react';

import {
  Alert,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Spinner,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiFolder,
} from 'react-icons/fi';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import { AccessDenied } from '@/components/AccessDenied';
import { ContainerGrid } from '@/components/ContainerGrid';
import { EmptyState } from '@/components/EmptyState';
import { HeaderGrid } from '@/components/HeaderGrid';
import { IconButtonTable } from '@/components/IconButtonTable';
import { QueryErrorState } from '@/components/QueryErrorState';
import { TableSkeleton } from '@/components/TableSkeleton';

import { useLanguage } from '@/hooks/useLanguage';

import { formatBytes } from '@/utils/formatBytes';
import formatDate from '@/utils/formatDate';

import type { SystemLogDirection, SystemLogEntry, SystemLogSort } from '@/@types/v2/SystemLogs';

import { HeaderTable } from './HeaderTable';
import { getHttpStatus } from './hooks/httpStatus';
import { useSystemLogDirectory } from './hooks/useSystemLogDirectory';
import { useSystemLogDownload } from './hooks/useSystemLogDownload';
import { LogsBreadcrumb } from './LogsBreadcrumb';
import { buildBreadcrumb, explorerHref, filterEntries, toIntlLocale, viewerHref } from './utils';

const FILTER_DEBOUNCE_MS = 200;

// Direção inicial ao ativar uma coluna: data mais recente primeiro, nome A→Z,
// maiores primeiro. Clicar de novo na coluna ativa alterna asc/desc.
const DEFAULT_DIRECTION: Record<SystemLogSort, SystemLogDirection> = {
  modified_at: 'desc',
  name: 'asc',
  size: 'desc',
};

export default function SystemLogsExplorer() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.systemLogs.systemLog;
  const locale = toIntlLocale(languageInUse);

  const [searchParams, setSearchParams] = useSearchParams();
  const path = searchParams.get('path') ?? '';

  const [sort, setSort] = useState<SystemLogSort>('modified_at');
  const [direction, setDirection] = useState<SystemLogDirection>('desc');

  // Filtro por nome: estado local POR PASTA (zera ao trocar de path), sem persistência.
  const [filterInput, setFilterInput] = useState('');
  const [filterTerm, setFilterTerm] = useState('');

  useEffect(() => {
    setFilterInput('');
    setFilterTerm('');
  }, [path]);

  useEffect(() => {
    const timer = setTimeout(() => setFilterTerm(filterInput), FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [filterInput]);

  const directory = useSystemLogDirectory({ path, sort, direction });
  const downloader = useSystemLogDownload();

  const items = directory.data?.data.items;
  const visibleItems = useMemo(
    () => (items ? filterEntries(items, filterTerm) : []),
    [items, filterTerm]
  );

  function handleSort(column: SystemLogSort) {
    if (column === sort) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSort(column);
    setDirection(DEFAULT_DIRECTION[column]);
  }

  function clearFilter() {
    setFilterInput('');
    setFilterTerm('');
  }

  const status = getHttpStatus(directory.error);
  const breadcrumbItems =
    directory.data?.data.breadcrumbs ?? buildBreadcrumb(path, text.explorer.breadcrumbRoot);

  if (directory.isError && status === 403) return <AccessDenied />;

  const isPathNotFound = directory.isError && (status === 404 || status === 422);

  return (
    <ContainerGrid>
      <HeaderGrid
        header={
          <HeaderTable
            filterValue={filterInput}
            onFilterChange={setFilterInput}
            onRefresh={() => directory.refetch()}
            isRefreshing={directory.isFetching && !directory.isLoading}
            labels={{
              filterPlaceholder: text.explorer.filter.placeholder,
              filterAriaLabel: text.explorer.filter.ariaLabel,
              clearFilter: text.explorer.filter.clear,
              refresh: text.explorer.actions.refresh,
            }}
          />
        }
      >
        <VStack align="flex-start" gap={1}>
          <Text as="h1" fontSize="2xl" fontWeight="bold" color="brandColorText">
            {text.explorer.pageTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {text.explorer.pageSubtitle}
          </Text>
        </VStack>
      </HeaderGrid>

      <Box mt={4}>
        <LogsBreadcrumb
          items={breadcrumbItems}
          ariaLabel={text.explorer.breadcrumbAriaLabel}
          hrefFor={explorerHref}
        />
      </Box>

      <Box mt={4}>
        {directory.isLoading ? (
          <TableSkeleton rows={6} columns={4} hasPagination={false} />
        ) : isPathNotFound ? (
          <Box py={12} borderTop="1px solid" borderColor="borderGrid">
            <QueryErrorState
              message={text.explorer.notFoundState.title}
              description={text.explorer.notFoundState.description}
              icon={FiFolder as ElementType}
              onBack={() => setSearchParams({})}
              backLabel={text.explorer.notFoundState.back}
            />
          </Box>
        ) : directory.isError ? (
          <Box py={12} borderTop="1px solid" borderColor="borderGrid">
            <QueryErrorState
              message={text.explorer.error.message}
              retryLabel={text.explorer.error.retry}
              onRetry={() => directory.refetch()}
              isRetrying={directory.isFetching}
              error={directory.error}
            />
          </Box>
        ) : (
          <>
            {directory.data?.meta.truncated && (
              <Alert.Root status="warning" mb={4} data-testid="system-logs-truncated">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{text.explorer.truncatedNotice}</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            {(items?.length ?? 0) === 0 ? (
              <EmptyState
                variant="empty"
                message={text.explorer.emptyState.title}
                description={text.explorer.emptyState.description}
              />
            ) : visibleItems.length === 0 ? (
              <EmptyState
                variant="search"
                message={text.explorer.noResultsState.title}
                description={text.explorer.noResultsState.description}
                action={{ label: text.explorer.noResultsState.clear, onClick: clearFilter }}
              />
            ) : (
              <Table.ScrollArea borderTop="1px" borderTopRadius="md" borderColor="borderGrid">
                <Table.Root
                  variant="line"
                  size="md"
                  data-testid="system-logs-table"
                  css={{
                    border: 'none',
                    '& th': {
                      bg: 'gridHeadSecondary',
                      color: 'textGridColor',
                      height: '10',
                      fontWeight: '500',
                      fontSize: '14px',
                      paddingY: '2',
                      paddingLeft: '4',
                      paddingRight: '4',
                    },
                  }}
                >
                  <Table.Header>
                    <Table.Row borderBottom="1px solid" borderColor="borderGrid">
                      <SortHeader
                        column="name"
                        label={text.explorer.table.name}
                        active={sort === 'name'}
                        direction={direction}
                        onSort={handleSort}
                      />
                      <SortHeader
                        column="size"
                        label={text.explorer.table.size}
                        active={sort === 'size'}
                        direction={direction}
                        onSort={handleSort}
                        align="end"
                      />
                      <SortHeader
                        column="modified_at"
                        label={text.explorer.table.modifiedAt}
                        active={sort === 'modified_at'}
                        direction={direction}
                        onSort={handleSort}
                      />
                      <Table.ColumnHeader textAlign="end" width="140px">
                        {text.explorer.table.actions}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {visibleItems.map((entry) => (
                      <LogRow
                        key={entry.path}
                        entry={entry}
                        locale={locale}
                        dateTimePattern={languageGB.defaltStrings.dateTime}
                        openLabel={text.explorer.actions.open}
                        downloadLabel={text.explorer.actions.download}
                        folderLabel={text.explorer.table.folder}
                        fileLabel={text.explorer.table.file}
                        downloadingLabel={text.download.inProgress}
                        downloadAriaLabel={text.download.ariaLabel}
                        progressLabel={text.download.progress}
                        isDownloadingThis={downloader.activePath === entry.path}
                        isDownloadBusy={downloader.isPending}
                        percent={downloader.percent}
                        onDownload={() => downloader.download(entry.path)}
                      />
                    ))}
                  </Table.Body>
                </Table.Root>
              </Table.ScrollArea>
            )}
          </>
        )}
      </Box>
    </ContainerGrid>
  );
}

// ---------------------------------------------------------------------------

interface SortHeaderProps {
  column: SystemLogSort;
  label: string;
  active: boolean;
  direction: SystemLogDirection;
  onSort: (column: SystemLogSort) => void;
  align?: 'start' | 'end';
}

function SortHeader({
  column,
  label,
  active,
  direction,
  onSort,
  align = 'start',
}: SortHeaderProps) {
  return (
    <Table.ColumnHeader
      textAlign={align}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <Button
        variant="plain"
        size="sm"
        height="auto"
        padding="0"
        marginLeft={align === 'end' ? 'auto' : undefined}
        fontWeight="inherit"
        onClick={() => onSort(column)}
        data-testid={`system-logs-sort-${column}`}
      >
        {label}
        {active && <Icon as={direction === 'asc' ? FiChevronUp : FiChevronDown} aria-hidden />}
      </Button>
    </Table.ColumnHeader>
  );
}

interface LogRowProps {
  entry: SystemLogEntry;
  locale: string;
  dateTimePattern: string;
  openLabel: string;
  downloadLabel: string;
  folderLabel: string;
  fileLabel: string;
  downloadingLabel: string;
  downloadAriaLabel: string;
  progressLabel: string;
  isDownloadingThis: boolean;
  isDownloadBusy: boolean;
  percent: number | null;
  onDownload: () => void;
}

function LogRow({
  entry,
  locale,
  dateTimePattern,
  openLabel,
  downloadLabel,
  folderLabel,
  fileLabel,
  downloadingLabel,
  downloadAriaLabel,
  progressLabel,
  isDownloadingThis,
  isDownloadBusy,
  percent,
  onDownload,
}: LogRowProps) {
  const isDir = entry.type === 'dir';
  const href = isDir ? explorerHref(entry.path) : viewerHref(entry.path);

  return (
    <Table.Row borderBottom="1px solid" borderColor="borderGrid" data-testid="system-logs-row">
      <Table.Cell>
        <HStack gap="2">
          <Icon
            as={isDir ? FiFolder : FiFileText}
            color="fg.muted"
            aria-label={isDir ? folderLabel : fileLabel}
          />
          <Text
            asChild
            fontFamily="mono"
            fontSize="sm"
            color="brandColorText"
            wordBreak="break-all"
          >
            <RouterLink to={href} data-testid="system-logs-entry-link">
              {entry.name}
            </RouterLink>
          </Text>
        </HStack>
      </Table.Cell>
      <Table.Cell textAlign="end" whiteSpace="nowrap">
        {isDir ? '—' : formatBytes(entry.size, locale)}
      </Table.Cell>
      <Table.Cell whiteSpace="nowrap">{formatDate(entry.modified_at, dateTimePattern)}</Table.Cell>
      <Table.Cell>
        <Flex justify="flex-end" alignItems="center" gap="2">
          {isDownloadingThis && (
            <Text
              fontSize="xs"
              color="fg.muted"
              aria-live="polite"
              data-testid="system-logs-progress"
            >
              {percent === null
                ? downloadingLabel
                : progressLabel.replace('{percent}', String(percent))}
            </Text>
          )}
          <IconButtonTable
            asChild
            variant="ghost"
            size="sm"
            aria-label={`${openLabel} ${entry.name}`}
            mensegerTooltip={openLabel}
          >
            <RouterLink to={href}>
              <Icon as={FiExternalLink} />
            </RouterLink>
          </IconButtonTable>
          {!isDir && (
            <IconButtonTable
              variant="ghost"
              size="sm"
              aria-label={downloadAriaLabel.replace('{name}', entry.name)}
              mensegerTooltip={downloadLabel}
              disabled={isDownloadBusy}
              onClick={onDownload}
              data-testid="system-logs-download"
            >
              {isDownloadingThis ? <Spinner size="xs" /> : <Icon as={FiDownload} />}
            </IconButtonTable>
          )}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}
