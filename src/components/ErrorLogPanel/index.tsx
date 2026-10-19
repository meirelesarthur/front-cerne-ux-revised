import { useState } from "react";

import {
  Badge,
  Box,
  Code,
  Flex,
  HStack,
  Icon,
  IconButton,
  Popover,
  Portal,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FiAlertTriangle,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiMaximize2,
  FiMinimize2,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import type { ErrorLogEntry } from "@/contexts/ErrorLogContext";
import useErrorLog from "@/hooks/useErrorLog";
import { useLanguage } from "@/hooks/useLanguage";
import { copyToClipboard } from "@/utils/copyToClipboard";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";

interface ErrorLogPanelProps {
  trigger: React.ReactNode;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "blue",
  POST: "green",
  PUT: "orange",
  PATCH: "yellow",
  DELETE: "red",
};

function getMethodColor(method: string): string {
  return METHOD_COLORS[method.toUpperCase()] || "gray";
}

function hasPayload(method: string): boolean {
  const upper = method.toUpperCase();
  return upper !== "GET" && upper !== "DELETE";
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized = { ...headers };
  const sensitiveKeys = ["authorization", "cookie", "x-api-key", "token"];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = "***";
    }
  }
  return sanitized;
}

function ErrorLogItem({ entry }: { entry: ErrorLogEntry }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { removeErrorLog, markAsViewed } = useErrorLog();
  const { languageGB } = useLanguage();

  const handleToggle = () => {
    if (!isExpanded && !entry.viewed) {
      markAsViewed(entry.id);
    }
    setIsExpanded((prev) => !prev);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeErrorLog(entry.id);
  };

  const handleCopy = () => {
    const details = {
      method: entry.method,
      url: entry.url,
      statusCode: entry.statusCode,
      errorMessage: entry.errorMessage,
      timestamp: entry.timestamp,
      requestHeaders: sanitizeHeaders(entry.requestHeaders),
      requestPayload: hasPayload(entry.method) ? entry.requestPayload : undefined,
      responseBody: entry.responseBody,
    };
    // `copyToClipboard` cobre homologação em HTTP (sem secure context,
    // `navigator.clipboard` é undefined e a chamada direta lançava antes do
    // toast — o botão parecia não fazer nada).
    copyToClipboard(JSON.stringify(details, null, 2))
      .then(() => {
        toaster.success({
          title: languageGB.common.errorLog.copiedToClipboard,
          duration: 2000,
        });
      })
      .catch(() => {
        toaster.error({
          title: languageGB.common.errorLog.copyFailed,
          duration: 3000,
        });
      });
  };

  const statusColor =
    entry.statusCode && entry.statusCode >= 500
      ? "red.400"
      : entry.statusCode && entry.statusCode >= 400
        ? "orange.400"
        : "gray.400";

  return (
    <Box
      borderWidth="1px"
      borderColor={!entry.viewed ? "red.500/30" : "border1"}
      borderRadius="lg"
      bg={!entry.viewed ? "red.500/5" : "transparent"}
      overflow="hidden"
      transition="all 0.2s"
      _hover={{ borderColor: !entry.viewed ? "red.500/50" : "border1" }}
    >
      {/* Header row */}
      <Flex
        align="center"
        gap={2}
        px={3}
        py={2}
        cursor="pointer"
        onClick={handleToggle}
        _hover={{ bg: "cardHoverBG" }}
        transition="background 0.15s"
      >
        {/* Unread dot */}
        {!entry.viewed && (
          <Box w={2} h={2} borderRadius="full" bg="red.500" flexShrink={0} />
        )}

        {/* Method badge */}
        <Badge
          colorPalette={getMethodColor(entry.method)}
          variant="solid"
          size="sm"
          fontFamily="mono"
          fontWeight="bold"
          fontSize="10px"
          minW="50px"
          textAlign="center"
        >
          {entry.method.toUpperCase()}
        </Badge>

        {/* Status code */}
        <Text fontSize="xs" fontWeight="bold" color={statusColor} fontFamily="mono" flexShrink={0}>
          {entry.statusCode || "ERR"}
        </Text>

        {/* URL (truncated) */}
        <Text fontSize="xs" color="text.secondary" flex={1} lineClamp="1" fontFamily="mono">
          {entry.url}
        </Text>

        {/* Timestamp */}
        <Text fontSize="10px" color="text.secondary" flexShrink={0} display={{ base: "none", sm: "block" }}>
          {formatTimestamp(entry.timestamp)}
        </Text>

        {/* Delete button inline */}
        <Tooltip content={languageGB.common.errorLog.deleteItem}>
          <IconButton
            aria-label={languageGB.common.errorLog.deleteItem}
            variant="ghost_danger"
            size="2xs"
            onClick={handleDelete}
            opacity={0.5}
            _hover={{ opacity: 1, bg: "red.500/10" }}
            transition="all 0.15s"
          >
            <Icon as={FiX} boxSize={3} />
          </IconButton>
        </Tooltip>

        {/* Expand icon */}
        <Icon
          as={isExpanded ? FiChevronUp : FiChevronDown}
          boxSize={3}
          color="text.secondary"
          flexShrink={0}
        />
      </Flex>

      {/* Expanded content */}
      {isExpanded && (
        <Box px={3} pb={3}>
          <Separator mb={2} />

          {/* Error message */}
          <Box mb={3}>
            <Text fontSize="xs" fontWeight="semibold" color="red.400" mb={1}>
              {languageGB.common.errorLog.errorMessage}
            </Text>
            <Text fontSize="xs" color="text.primary">
              {entry.errorMessage}
            </Text>
          </Box>

          {/* REQUEST section */}
          <Box
            mb={3}
            borderWidth="1px"
            borderColor="border1"
            borderRadius="md"
            overflow="hidden"
          >
            <Flex
              bg="bg.subtle"
              px={3}
              py={1.5}
              align="center"
              borderBottomWidth="1px"
              borderColor="border1"
            >
              <Text fontSize="xs" fontWeight="bold" color="cyan.400" textTransform="uppercase">
                {languageGB.common.errorLog.requestDetails}
              </Text>
            </Flex>
            <Box px={3} py={2}>
              {/* Method + URL */}
              <HStack mb={1.5} gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="text.secondary" minW="55px">
                  {languageGB.common.errorLog.method}:
                </Text>
                <Badge colorPalette={getMethodColor(entry.method)} size="sm" fontFamily="mono">
                  {entry.method.toUpperCase()}
                </Badge>
              </HStack>
              <HStack mb={1.5} gap={2} align="flex-start">
                <Text fontSize="xs" fontWeight="semibold" color="text.secondary" minW="55px" flexShrink={0}>
                  URL:
                </Text>
                <Text fontSize="xs" color="text.primary" fontFamily="mono" wordBreak="break-all">
                  {entry.url}
                </Text>
              </HStack>

              {/* Headers */}
              {Object.keys(entry.requestHeaders).length > 0 && (
                <Box mb={1.5}>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                    {languageGB.common.errorLog.headers}:
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre-wrap"
                    p={2}
                    borderRadius="md"
                    fontSize="10px"
                    bg="bg.subtle"
                    maxH="120px"
                    overflowY="auto"
                    wordBreak="break-all"
                  >
                    {safeStringify(sanitizeHeaders(entry.requestHeaders))}
                  </Code>
                </Box>
              )}

              {/* Payload (only for POST/PUT/PATCH) */}
              {hasPayload(entry.method) && !!entry.requestPayload && (
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                    {languageGB.common.errorLog.payload}:
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre-wrap"
                    p={2}
                    borderRadius="md"
                    fontSize="10px"
                    bg="bg.subtle"
                    maxH="150px"
                    overflowY="auto"
                    wordBreak="break-all"
                  >
                    {safeStringify(entry.requestPayload)}
                  </Code>
                </Box>
              )}
            </Box>
          </Box>

          {/* RESPONSE section */}
          <Box
            mb={2}
            borderWidth="1px"
            borderColor="border1"
            borderRadius="md"
            overflow="hidden"
          >
            <Flex
              bg="bg.subtle"
              px={3}
              py={1.5}
              align="center"
              borderBottomWidth="1px"
              borderColor="border1"
            >
              <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase">
                {languageGB.common.errorLog.responseDetails}
              </Text>
            </Flex>
            <Box px={3} py={2}>
              <HStack mb={1.5} gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="text.secondary" minW="55px">
                  {languageGB.common.errorLog.status}:
                </Text>
                <Badge
                  colorPalette={
                    entry.statusCode && entry.statusCode >= 500
                      ? "red"
                      : entry.statusCode && entry.statusCode >= 400
                        ? "orange"
                        : "gray"
                  }
                  size="sm"
                  fontFamily="mono"
                >
                  {entry.statusCode || "N/A"}
                </Badge>
              </HStack>

              {!!entry.responseBody && (
                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="text.secondary" mb={1}>
                    {languageGB.common.errorLog.responseBody}:
                  </Text>
                  <Code
                    display="block"
                    whiteSpace="pre-wrap"
                    p={2}
                    borderRadius="md"
                    fontSize="10px"
                    bg="bg.subtle"
                    maxH="200px"
                    overflowY="auto"
                    wordBreak="break-all"
                  >
                    {safeStringify(entry.responseBody)}
                  </Code>
                </Box>
              )}

              {!entry.responseBody && (
                <Text fontSize="xs" color="text.secondary" fontStyle="italic">
                  {languageGB.common.errorLog.networkError}
                </Text>
              )}
            </Box>
          </Box>

          {/* Actions */}
          <Flex justify="flex-end" gap={1} pt={1}>
            <Tooltip content={languageGB.common.errorLog.copyDetails}>
              <IconButton
                aria-label={languageGB.common.errorLog.copyDetails}
                variant="ghost"
                size="xs"
                onClick={handleCopy}
              >
                <Icon as={FiCopy} boxSize={3} />
              </IconButton>
            </Tooltip>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

export function ErrorLogPanel({ trigger }: ErrorLogPanelProps) {
  const { languageGB } = useLanguage();
  const { errorLogs, unreadCount, clearAllErrors, markAllAsViewed } = useErrorLog();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasUnread = unreadCount > 0;

  const panelWidth = isExpanded ? "80vw" : "520px";
  const panelMaxH = isExpanded ? "80vh" : "500px";

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => {
        setIsOpen(e.open);
        if (!e.open) {
          setIsExpanded(false);
        }
      }}
      positioning={{ placement: "bottom-end" }}
      lazyMount
      unmountOnExit
    >
      {/* @ts-ignore */}
      <Popover.Trigger asChild>
        <Box as="span" onClick={() => setIsOpen(!isOpen)} cursor="pointer">
          {trigger}
        </Box>
      </Popover.Trigger>
      <Portal>
        {/* @ts-ignore */}
        <Popover.Positioner>
          {/* @ts-ignore */}
          <Popover.Content
            w={panelWidth}
            maxW="calc(100vw - 32px)"
            bg="cardBG"
            borderRadius="xl"
            boxShadow="0px 20px 40px -5px rgba(0, 0, 0, 0.3), 0px 10px 15px -5px rgba(0, 0, 0, 0.15)"
            border="1px solid"
            borderColor="cardBorder"
            overflow="hidden"
            transition="width 0.25s ease, max-width 0.25s ease"
          >
            {/* Header */}
            <Flex
              justify="space-between"
              align="center"
              px={4}
              py={3}
              borderBottom="1px solid"
              borderColor="border1"
              bg="red.500/8"
            >
              <HStack gap={2}>
                <Icon as={FiAlertTriangle} boxSize={4} color="red.400" />
                <Text fontSize="md" fontWeight="semibold" color="text.primary">
                  {languageGB.common.errorLog.title}
                </Text>
                {errorLogs.length > 0 && (
                  <HStack gap={1.5}>
                    <Badge colorPalette="red" variant="solid" size="sm">
                      {errorLogs.length} {languageGB.common.errorLog.totalErrors}
                    </Badge>
                    {hasUnread && (
                      <Badge colorPalette="orange" variant="subtle" size="sm">
                        {unreadCount} {languageGB.common.errorLog.unreadCount}
                      </Badge>
                    )}
                  </HStack>
                )}
              </HStack>
              <HStack gap={0.5}>
                {/* Marcar todos como vistos */}
                {hasUnread && (
                  <Tooltip content={languageGB.common.errorLog.markAllViewedTooltip}>
                    <IconButton
                      aria-label={languageGB.common.errorLog.markAllViewed}
                      variant="ghost"
                      size="xs"
                      onClick={markAllAsViewed}
                    >
                      <Icon as={FiCheckCircle} boxSize={4} color="text.secondary" />
                    </IconButton>
                  </Tooltip>
                )}
                {/* Limpar todos */}
                {errorLogs.length > 0 && (
                  <Tooltip content={languageGB.common.errorLog.clearAllTooltip}>
                    <IconButton
                      aria-label={languageGB.common.errorLog.clearAll}
                      variant="ghost"
                      size="xs"
                      onClick={clearAllErrors}
                    >
                      <Icon as={FiTrash2} boxSize={4} color="text.secondary" />
                    </IconButton>
                  </Tooltip>
                )}
                {/* Expandir / Recolher */}
                <Tooltip
                  content={
                    isExpanded
                      ? languageGB.common.errorLog.collapsePanel
                      : languageGB.common.errorLog.expandPanel
                  }
                >
                  <IconButton
                    aria-label={
                      isExpanded
                        ? languageGB.common.errorLog.collapsePanel
                        : languageGB.common.errorLog.expandPanel
                    }
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsExpanded((prev) => !prev)}
                  >
                    <Icon
                      as={isExpanded ? FiMinimize2 : FiMaximize2}
                      boxSize={4}
                      color="text.secondary"
                    />
                  </IconButton>
                </Tooltip>
                {/* Fechar */}
                <IconButton
                  aria-label={languageGB.defaltStrings.close}
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon as={FiX} boxSize={4} color="text.secondary" />
                </IconButton>
              </HStack>
            </Flex>

            {/* Content */}
            <Box
              maxH={panelMaxH}
              overflowY="auto"
              p={3}
              transition="max-height 0.25s ease"
              css={{
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: "var(--chakra-colors-gray-400)",
                  borderRadius: "3px",
                },
              }}
            >
              {errorLogs.length === 0 ? (
                <VStack py={10} gap={3}>
                  <Flex
                    w={14}
                    h={14}
                    borderRadius="full"
                    bg="green.500/10"
                    align="center"
                    justify="center"
                  >
                    <Icon as={FiCheck} boxSize={7} color="green.400" />
                  </Flex>
                  <Text fontSize="sm" color="text.secondary">
                    {languageGB.common.errorLog.emptyState}
                  </Text>
                </VStack>
              ) : (
                <VStack align="stretch" gap={2}>
                  {errorLogs.map((entry) => (
                    <ErrorLogItem key={entry.id} entry={entry} />
                  ))}
                </VStack>
              )}
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export default ErrorLogPanel;
