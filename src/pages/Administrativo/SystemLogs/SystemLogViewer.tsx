// src/pages/Administrativo/SystemLogs/SystemLogViewer.tsx
// -----------------------------------------------------------------------------
// Visualizador de arquivo de log (execução 079). Rota:
// /administrativo/logs/arquivo?path=<arquivo>[&q=<busca>][&before=<byte>].
//
// Leitura: abre no FIM do arquivo (tail) e carrega trechos mais antigos por
// cursor em bytes (`before`), SEM biblioteca de virtualização (DD-FE-079-01 A):
// cada bloco é um `<pre>` memoizado, com teto de 20.000 linhas / 8 MiB
// carregados (acima disso, "baixe o arquivo") e linhas > 10.000 caracteres
// cortadas na tela. A posição de scroll é preservada ao carregar mais antigos.
//
// Busca: no ARQUIVO INTEIRO, feita pela API (`q`, DD-FE-079-02): lista de
// ocorrências (mais recentes primeiro), "Abrir contexto" lê o bloco que termina
// na ocorrência. Dispara só no Enter/botão (a API audita e limita cada busca).
//
// Download: blob com progresso e nome do Content-Disposition (DD-FE-079-03).
// -----------------------------------------------------------------------------

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ElementType } from 'react';

import { Alert, Box, Flex, HStack, Skeleton, Spinner, Text, VStack } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiDownload, FiFileText, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AccessDenied } from '@/components/AccessDenied';
import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { HeaderGrid } from '@/components/HeaderGrid';
import { QueryErrorState } from '@/components/QueryErrorState';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';

import { formatBytes } from '@/utils/formatBytes';
import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';

import { SYSTEM_LOG_SEARCH_MIN_CHARS } from '@/services/v2/SystemLogs/system-logs-service';

import type { SystemLogSearchMatch } from '@/@types/v2/SystemLogs';

import {
  systemLogContentKey,
  useSystemLogContent,
  useSystemLogSearch,
} from './hooks/useSystemLogContent';
import { useSystemLogDownload } from './hooks/useSystemLogDownload';
import { LogContent } from './LogContent';
import { LogsBreadcrumb } from './LogsBreadcrumb';
import { LogSearchBar, type LogSearchBarHandle } from './LogSearchBar';
import { LogSearchResults } from './LogSearchResults';
import {
  buildBreadcrumb,
  classifyContentError,
  countLines,
  explorerHref,
  isLoadLimitReached,
  parentPathOf,
  readWrapPreference,
  toIntlLocale,
  writeWrapPreference,
} from './utils';

function parseBefore(raw: string | null): number | undefined {
  return raw !== null && /^\d+$/.test(raw) ? Number(raw) : undefined;
}

export default function SystemLogViewer() {
  const { languageGB, languageInUse } = useLanguage();
  const text = languageGB.systemLogs.systemLog;
  const locale = toIntlLocale(languageInUse);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const path = searchParams.get('path') ?? '';
  const q = searchParams.get('q') ?? '';
  const before = parseBefore(searchParams.get('before'));
  const folderPath = parentPathOf(path);

  const content = useSystemLogContent(path, before);
  const search = useSystemLogSearch(path, q);
  const downloader = useSystemLogDownload();

  const [wrap, setWrap] = useState<boolean>(() => readWrapPreference());
  const [searchInput, setSearchInput] = useState(q);
  const [searchHint, setSearchHint] = useState<string | undefined>();
  const [sizeWarning, setSizeWarning] = useState(false);

  const searchBarRef = useRef<LogSearchBarHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ height: number; top: number } | null>(null);
  const lastSizeRef = useRef<number | null>(null);

  // Blocos do mais recente (pages[0]) ao mais antigo; a tela exibe o inverso.
  const pages = useMemo(() => content.data?.pages ?? [], [content.data]);
  const chronologicalPages = useMemo(() => [...pages].reverse(), [pages]);
  const newestPage = pages[0];

  const loadedBytes = useMemo(
    () => pages.reduce((total, page) => total + (page.range.end - page.range.start), 0),
    [pages]
  );
  const loadedLines = useMemo(
    () => pages.reduce((total, page) => total + countLines(page.content), 0),
    [pages]
  );
  const limitReached = isLoadLimitReached(loadedBytes, loadedLines);
  const hasPartialLine = pages.some((page) => page.partial_line);

  // Mantém o campo sincronizado quando `q` muda pela URL (Voltar, limpar).
  useEffect(() => {
    setSearchInput(q);
    setSearchHint(undefined);
  }, [q]);

  // Rotação/truncamento: o tamanho do arquivo diminuiu entre leituras.
  const tailSize = newestPage?.size;
  useEffect(() => {
    if (tailSize === undefined) return;
    if (lastSizeRef.current !== null && tailSize < lastSizeRef.current) setSizeWarning(true);
    lastSizeRef.current = tailSize;
  }, [tailSize]);

  // Novo arquivo: zera os controles locais.
  useEffect(() => {
    lastSizeRef.current = null;
    setSizeWarning(false);
  }, [path]);

  // Scroll: primeira página (abertura/atualização) vai para a última linha;
  // páginas mais antigas entram ACIMA e o delta de altura é compensado.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    if (pages.length === 1) {
      element.scrollTop = element.scrollHeight;
      scrollAnchorRef.current = null;
      return;
    }

    const anchor = scrollAnchorRef.current;
    if (anchor) {
      element.scrollTop = element.scrollHeight - anchor.height + anchor.top;
      scrollAnchorRef.current = null;
    }
  }, [pages.length]);

  function updateParams(mutate: (params: URLSearchParams) => void, replace = false) {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next, { replace });
  }

  function loadOlder() {
    const element = scrollRef.current;
    if (element) scrollAnchorRef.current = { height: element.scrollHeight, top: element.scrollTop };
    content.fetchNextPage();
  }

  function handleRefresh() {
    setSizeWarning(false);
    if (before !== undefined) {
      // contexto de uma ocorrência: "atualizar" volta ao fim do arquivo
      updateParams((params) => params.delete('before'));
      return;
    }
    queryClient.resetQueries({ queryKey: systemLogContentKey(path) });
    if (q) {
      queryClient.resetQueries({ queryKey: [queryKey.systemLogs.systemLog, 'search', path] });
    }
  }

  function handleBackToEnd() {
    updateParams((params) => params.delete('before'));
  }

  function handleSubmitSearch() {
    const term = searchInput.trim();
    if (term === '') {
      handleClearSearch();
      return;
    }
    if (term.length < SYSTEM_LOG_SEARCH_MIN_CHARS) {
      setSearchHint(text.search.minChars.replace('{min}', String(SYSTEM_LOG_SEARCH_MIN_CHARS)));
      return;
    }
    setSearchHint(undefined);
    updateParams((params) => {
      params.set('q', term);
      params.delete('before');
    }, true);
  }

  function handleClearSearch() {
    setSearchInput('');
    setSearchHint(undefined);
    updateParams((params) => {
      params.delete('q');
      params.delete('before');
    }, true);
  }

  function handleOpenContext(match: SystemLogSearchMatch) {
    updateParams((params) => params.set('before', String(match.end)));
  }

  function handleWrapChange(checked: boolean) {
    setWrap(checked);
    writeWrapPreference(checked);
  }

  const breadcrumbItems = buildBreadcrumb(path, text.explorer.breadcrumbRoot);
  const backToFolder = () => navigate(explorerHref(folderPath));

  // ---- Estados de página inteira (sem conteúdo para mostrar) ----------------
  if (path === '') {
    return (
      <ContainerGrid>
        <QueryErrorState
          message={text.viewer.missingPathState.title}
          description={text.viewer.missingPathState.description}
          icon={FiFileText as ElementType}
          onBack={() => navigate(explorerHref(''))}
          backLabel={text.viewer.missingPathState.back}
        />
      </ContainerGrid>
    );
  }

  const firstLoadFailed = content.isError && !content.data;
  const errorKind = firstLoadFailed ? classifyContentError(content.error) : null;

  if (errorKind === 'forbidden') return <AccessDenied />;

  const isEmptyFile = !!newestPage && newestPage.size === 0;
  const pageTitle = newestPage?.name ?? path.split('/').filter(Boolean).pop() ?? path;
  const downloadPercent = downloader.activePath === path ? downloader.percent : null;
  const isDownloadingThis = downloader.activePath === path;
  const searchMatches = search.data?.pages.flatMap((page) => page.result.matches) ?? [];
  const searchActive = q.trim().length >= SYSTEM_LOG_SEARCH_MIN_CHARS;

  return (
    <ContainerGrid>
      <HeaderGrid
        header={
          <Flex gap="3" alignItems="center" flexWrap="wrap" justifyContent="flex-end">
            <Switch
              size="sm"
              checked={wrap}
              onCheckedChange={(details: { checked: boolean }) => handleWrapChange(details.checked)}
              data-testid="system-logs-wrap"
            >
              {text.viewer.actions.wrapLines}
            </Switch>
            <Button
              title={text.viewer.actions.refresh}
              icon={FiRefreshCw as ElementType}
              size="sm"
              variant="outline"
              loading={content.isFetching && !content.isFetchingNextPage && !firstLoadFailed}
              onClick={handleRefresh}
              data-testid="system-logs-viewer-refresh"
            />
            <Button
              title={
                isDownloadingThis
                  ? downloadPercent === null
                    ? text.download.inProgress
                    : text.download.progress.replace('{percent}', String(downloadPercent))
                  : text.viewer.actions.download
              }
              icon={FiDownload as ElementType}
              size="sm"
              disabled={isEmptyFile || downloader.isPending}
              aria-label={text.download.ariaLabel.replace('{name}', pageTitle)}
              onClick={() => downloader.download(path)}
              data-testid="system-logs-viewer-download"
            />
          </Flex>
        }
      >
        <VStack align="flex-start" gap={1}>
          <Text
            as="h1"
            fontSize="2xl"
            fontWeight="bold"
            color="brandColorText"
            fontFamily="mono"
            wordBreak="break-all"
          >
            {pageTitle}
          </Text>
          <HStack gap={4} fontSize="sm" color="fg.muted" flexWrap="wrap">
            {newestPage ? (
              <>
                <Text>
                  {text.viewer.fields.size}: {formatBytes(newestPage.size, locale)}
                </Text>
                <Text>
                  {text.viewer.fields.modifiedAt}:{' '}
                  {formatDate(newestPage.modified_at, languageGB.defaltStrings.dateTime)}
                </Text>
              </>
            ) : (
              <Text>{text.viewer.pageSubtitle}</Text>
            )}
          </HStack>
        </VStack>
      </HeaderGrid>

      <Box mt={4}>
        <LogsBreadcrumb
          items={breadcrumbItems}
          ariaLabel={text.explorer.breadcrumbAriaLabel}
          hrefFor={explorerHref}
        />
      </Box>

      <VStack align="stretch" gap={4} mt={4}>
        {!firstLoadFailed && (
          <LogSearchBar
            ref={searchBarRef}
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              if (searchHint) setSearchHint(undefined);
            }}
            onSubmit={handleSubmitSearch}
            onClear={handleClearSearch}
            hasActiveSearch={q !== ''}
            hint={searchHint}
            labels={{
              placeholder: text.search.placeholder,
              ariaLabel: text.search.ariaLabel,
              submit: text.search.submit,
              clear: text.search.clear,
              scopeNote: text.search.scopeNote,
            }}
          />
        )}

        {searchActive && (
          <LogSearchResults
            q={q}
            matches={searchMatches}
            isLoading={search.isLoading}
            isError={search.isError}
            isFetchingNextPage={search.isFetchingNextPage}
            hasNextPage={search.hasNextPage}
            onLoadMore={() => search.fetchNextPage()}
            onRetry={() => search.refetch()}
            onOpenContext={handleOpenContext}
            labels={{
              title: text.search.resultsTitle,
              count: text.search.resultCount,
              noResults: text.search.noResults,
              loadMore: text.search.loadMore,
              moreAvailable: text.search.moreAvailable,
              openContext: text.search.openContext,
              lineTruncated: text.search.lineTruncated,
              error: text.search.error,
              retry: text.viewer.actions.retry,
            }}
          />
        )}

        {sizeWarning && (
          <Alert.Root status="warning" data-testid="system-logs-size-warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{text.viewer.sizeChangedWarning}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {before !== undefined && !firstLoadFailed && (
          <Alert.Root status="info" data-testid="system-logs-context-notice">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{text.viewer.contextNotice}</Alert.Description>
            </Alert.Content>
            <Button
              title={text.viewer.actions.backToEnd}
              size="xs"
              variant="outline"
              onClick={handleBackToEnd}
              data-testid="system-logs-back-to-end"
            />
          </Alert.Root>
        )}

        {content.isLoading ? (
          <Box
            borderWidth="1px"
            borderColor="borderGrid"
            borderRadius="md"
            bg="bg.subtle"
            p={3}
            data-testid="system-logs-viewer-loading"
          >
            {Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} height="14px" mb={2} width={`${60 + ((index * 7) % 40)}%`} />
            ))}
          </Box>
        ) : firstLoadFailed ? (
          <Box py={10} borderTop="1px solid" borderColor="borderGrid">
            {errorKind === 'not-found' ? (
              <QueryErrorState
                message={text.viewer.notFoundState.title}
                description={text.viewer.notFoundState.description}
                icon={FiFileText as ElementType}
                onBack={backToFolder}
                backLabel={text.viewer.notFoundState.back}
                backIcon={FiArrowLeft as ElementType}
              />
            ) : errorKind === 'binary' ? (
              <QueryErrorState
                message={text.viewer.binaryState.title}
                description={text.viewer.binaryState.description}
                icon={FiFileText as ElementType}
                onBack={backToFolder}
                backLabel={text.viewer.notFoundState.back}
                backIcon={FiArrowLeft as ElementType}
              />
            ) : errorKind === 'invalid-cursor' ? (
              <QueryErrorState
                message={text.viewer.invalidCursorState.title}
                description={text.viewer.invalidCursorState.description}
                retryLabel={text.viewer.invalidCursorState.action}
                onRetry={handleBackToEnd}
              />
            ) : (
              <QueryErrorState
                message={text.viewer.error.message}
                retryLabel={text.viewer.actions.retry}
                onRetry={() => content.refetch()}
                isRetrying={content.isFetching}
                error={content.error}
              />
            )}
          </Box>
        ) : isEmptyFile ? (
          <Box
            borderWidth="1px"
            borderColor="borderGrid"
            borderRadius="md"
            bg="bg.subtle"
            p={6}
            textAlign="center"
            color="fg.muted"
            data-testid="system-logs-empty-file"
          >
            {text.viewer.emptyFile}
          </Box>
        ) : (
          <Box>
            <Box
              ref={scrollRef}
              role="log"
              aria-label={text.viewer.contentAriaLabel}
              tabIndex={0}
              borderWidth="1px"
              borderColor="borderGrid"
              borderRadius="md"
              bg="bg.subtle"
              p={3}
              minH="320px"
              maxH="65vh"
              overflow="auto"
              data-testid="system-logs-viewer-scroll"
            >
              <Box mb={3} textAlign="center" fontSize="xs" color="fg.muted">
                {content.hasNextPage ? (
                  limitReached ? (
                    <Text data-testid="system-logs-limit-reached">{text.viewer.limitReached}</Text>
                  ) : (
                    <Button
                      title={text.viewer.actions.loadOlder}
                      size="xs"
                      variant="outline"
                      loading={content.isFetchingNextPage}
                      disabled={content.isFetchingNextPage}
                      onClick={loadOlder}
                      data-testid="system-logs-load-older"
                    />
                  )
                ) : (
                  <Text data-testid="system-logs-start-of-file">{text.viewer.startOfFile}</Text>
                )}
              </Box>

              {chronologicalPages.map((page) => (
                <LogContent
                  key={`${page.range.start}-${page.range.end}`}
                  content={page.content}
                  lineTruncatedLabel={text.viewer.lineTruncated}
                  wrap={wrap}
                />
              ))}
            </Box>

            <Flex mt={2} gap={3} alignItems="center" flexWrap="wrap" fontSize="xs" color="fg.muted">
              <Text data-testid="system-logs-loaded-summary">
                {text.viewer.loadedSummary
                  .replace('{lines}', loadedLines.toLocaleString(locale))
                  .replace('{size}', formatBytes(loadedBytes, locale))}
              </Text>
              {content.isFetchingNextPage && <Spinner size="xs" />}
            </Flex>

            {hasPartialLine && (
              <Text mt={1} fontSize="xs" color="fg.muted" data-testid="system-logs-partial-line">
                {text.viewer.partialLine}
              </Text>
            )}

            {content.isError && !!content.data && (
              <Alert.Root status="error" mt={2} data-testid="system-logs-load-more-error">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{text.viewer.loadMoreError}</Alert.Description>
                </Alert.Content>
                <Button
                  title={text.viewer.actions.retry}
                  size="xs"
                  variant="outline"
                  onClick={loadOlder}
                />
              </Alert.Root>
            )}
          </Box>
        )}
      </VStack>
    </ContainerGrid>
  );
}
