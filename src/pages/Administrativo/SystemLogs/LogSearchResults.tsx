// src/pages/Administrativo/SystemLogs/LogSearchResults.tsx
// Resultado da busca no arquivo inteiro: linhas que contêm `q`, da mais recente
// para a mais antiga, com o termo destacado (`<mark>`). "Abrir contexto" leva o
// visualizador ao bloco que termina na linha da ocorrência (`before = end`).

import { Fragment } from 'react';

import { Alert, Box, Flex, HStack, Skeleton, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';

import type { SystemLogSearchMatch } from '@/@types/v2/SystemLogs';

import { highlightSegments } from './utils';

interface LogSearchResultsProps {
  q: string;
  matches: SystemLogSearchMatch[];
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
  onOpenContext: (match: SystemLogSearchMatch) => void;
  labels: {
    title: string;
    count: string;
    noResults: string;
    loadMore: string;
    moreAvailable: string;
    openContext: string;
    lineTruncated: string;
    error: string;
    retry: string;
  };
}

export function LogSearchResults({
  q,
  matches,
  isLoading,
  isError,
  isFetchingNextPage,
  hasNextPage,
  onLoadMore,
  onRetry,
  onOpenContext,
  labels,
}: LogSearchResultsProps) {
  return (
    <Box
      borderWidth="1px"
      borderColor="borderGrid"
      borderRadius="md"
      bg="bg.subtle"
      data-testid="system-logs-search-results"
    >
      <Flex
        px={3}
        py={2}
        gap={2}
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
      >
        <Text fontSize="sm" fontWeight="medium">
          {labels.title}
        </Text>
        {!isLoading && !isError && matches.length > 0 && (
          <Text
            fontSize="xs"
            color="fg.muted"
            aria-live="polite"
            data-testid="system-logs-search-count"
          >
            {labels.count.replace('{count}', String(matches.length))}
          </Text>
        )}
      </Flex>

      <Box maxH="260px" overflowY="auto" borderTopWidth="1px" borderColor="borderGrid">
        {isLoading ? (
          <Box p={3}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} height="14px" mb={2} />
            ))}
          </Box>
        ) : isError && matches.length === 0 ? (
          <Flex p={3} gap={3} alignItems="center" flexWrap="wrap" role="alert">
            <Text fontSize="sm" color="fg.error">
              {labels.error}
            </Text>
            <Button title={labels.retry} size="xs" variant="outline" onClick={onRetry} />
          </Flex>
        ) : matches.length === 0 ? (
          <Text p={3} fontSize="sm" color="fg.muted" data-testid="system-logs-search-empty">
            {labels.noResults}
          </Text>
        ) : (
          <Box as="ul" listStyleType="none" margin="0" padding="0">
            {matches.map((match) => (
              <Flex
                as="li"
                key={`${match.start}-${match.end}`}
                px={3}
                py={1.5}
                gap={3}
                alignItems="flex-start"
                borderBottomWidth="1px"
                borderColor="borderGrid"
                data-testid="system-logs-match"
              >
                <Box
                  flex="1"
                  minW={0}
                  fontFamily="mono"
                  fontSize="xs"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {highlightSegments(match.line, q).map((segment, index) => (
                    <Fragment key={index}>
                      {segment.match ? (
                        <mark data-testid="system-logs-mark">{segment.text}</mark>
                      ) : (
                        segment.text
                      )}
                    </Fragment>
                  ))}
                  {match.line_truncated && (
                    <Text as="span" color="fg.muted">{` ${labels.lineTruncated}`}</Text>
                  )}
                </Box>
                <Button
                  title={labels.openContext}
                  size="xs"
                  variant="ghost"
                  flexShrink={0}
                  onClick={() => onOpenContext(match)}
                  data-testid="system-logs-open-context"
                />
              </Flex>
            ))}
          </Box>
        )}
      </Box>

      {!isLoading && hasNextPage && (
        <HStack px={3} py={2} gap={3} flexWrap="wrap" borderTopWidth="1px" borderColor="borderGrid">
          <Text fontSize="xs" color="fg.muted">
            {labels.moreAvailable}
          </Text>
          <Button
            title={labels.loadMore}
            size="xs"
            variant="outline"
            loading={isFetchingNextPage}
            onClick={onLoadMore}
            data-testid="system-logs-search-more"
          />
        </HStack>
      )}

      {isError && matches.length > 0 && (
        <Alert.Root status="warning" size="sm" borderRadius="0">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{labels.error}</Alert.Description>
          </Alert.Content>
          <Button title={labels.retry} size="xs" variant="outline" onClick={onLoadMore} />
        </Alert.Root>
      )}
    </Box>
  );
}
