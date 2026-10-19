// src/components/NotificationPanel/index.tsx
// -----------------------------------------------------------------------------
// Sino de notificações GLOBAL do Header (execução 081, T-081-FE-11; paridade
// legado 10/PC01-PC03, decisão D-04: global como no legado, todas as
// notificações do usuário, não só Suprimentos).
//
// - contador = todas as não lidas (`meta.unread_count`, oculto com 0);
// - lista = até 10 não lidas COM `url`, mais nova primeiro, com a mensagem e
//   "há X tempo";
// - clicar marca como lida e navega para a rota interna da `url`;
// - "Marcar todas como lidas" só com contador > 0;
// - vazio: "Sem notificações"; erro de carga: estado honesto com retry.
//
// O gatilho (ícone) vem do Header por render prop; o badge é desenhado aqui,
// com o contador real, sobre o gatilho.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import {
  Badge,
  Box,
  Flex,
  HStack,
  Icon,
  Popover,
  Portal,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { ptBR } from 'date-fns/locale/pt-BR';
import { FiBellOff, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { QueryErrorState } from '@/components/QueryErrorState';

import { useLanguage } from '@/hooks/useLanguage';

import { listableNotifications, notificationRoute } from '@/utils/notificationRoute';

import { languageContextTypes } from '@/constants/languages';

import type { NotificationItem } from '@/@types/v2/Notifications';

import { useNotifications } from './useNotifications';

const dateFnsLocaleByLanguage = {
  [languageContextTypes.BR]: ptBR,
  [languageContextTypes.US]: enUS,
  [languageContextTypes.ES]: es,
};

interface NotificationPanelProps {
  trigger: React.ReactNode;
}

export function NotificationPanel({ trigger }: NotificationPanelProps) {
  const { languageGB, languageInUse } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const text = languageGB.common.navRail;

  const { notificationsQuery, items, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const dateFnsLocale = dateFnsLocaleByLanguage[languageInUse ?? languageContextTypes.BR] ?? ptBR;
  const listed = listableNotifications(items);

  function relativeTime(createdAt: string) {
    const parsed = parseISO(createdAt);
    if (!isValid(parsed)) return '';
    return formatDistanceToNow(parsed, { addSuffix: true, locale: dateFnsLocale });
  }

  function handleOpenNotification(item: NotificationItem) {
    const route = notificationRoute(item.url);
    markAsRead.mutate(item.id);
    setIsOpen(false);
    if (route) navigate(route);
  }

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => setIsOpen(e.open)}
      positioning={{ placement: 'bottom-end' }}
      lazyMount
      unmountOnExit
    >
      {/* @ts-ignore - Chakra UI v3 API */}
      <Popover.Trigger asChild>
        <Box as="span" position="relative" cursor="pointer">
          {trigger}
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              bg="topBarNotificationBadge"
              color="white"
              borderRadius="full"
              fontSize="9px"
              fontWeight="bold"
              minW="16px"
              h="16px"
              px={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="2px solid"
              borderColor="topBarBG"
              zIndex={1}
              pointerEvents="none"
              aria-label={`${unreadCount} ${text.notificationsUnreadLabel}`}
            >
              {badgeLabel}
            </Badge>
          )}
        </Box>
      </Popover.Trigger>
      <Portal>
        {/* @ts-ignore - Chakra UI v3 API */}
        <Popover.Positioner>
          {/* @ts-ignore - Chakra UI v3 API */}
          <Popover.Content
            w="420px"
            maxW="calc(100vw - 32px)"
            bg="cardBG"
            borderRadius="xl"
            boxShadow="0px 20px 25px -5px rgba(0, 0, 0, 0.2), 0px 10px 10px -5px rgba(0, 0, 0, 0.1)"
            border="1px solid"
            borderColor="cardBorder"
            overflow="hidden"
          >
            <Flex
              justify="space-between"
              align="center"
              px={4}
              py={3}
              borderBottom="1px solid"
              borderColor="border1"
            >
              <HStack gap={2}>
                <Text fontSize="md" fontWeight="semibold" color="text.primary">
                  {languageGB.defaltStrings.notifications}
                </Text>
                {unreadCount > 0 && (
                  <Badge colorPalette="cyan" variant="solid" size="sm" borderRadius="full">
                    {unreadCount}
                  </Badge>
                )}
              </HStack>
              {unreadCount > 0 && (
                <Flex
                  as="button"
                  align="center"
                  gap={1}
                  color="text.secondary"
                  fontSize="sm"
                  cursor="pointer"
                  _hover={{ color: 'cyan.500' }}
                  transition="color 0.2s"
                  aria-label={text.notificationsMarkAll}
                  title={languageGB.defaltStrings.markAsReadToolTip}
                  onClick={() => markAllAsRead.mutate()}
                  opacity={markAllAsRead.isPending ? 0.6 : 1}
                  pointerEvents={markAllAsRead.isPending ? 'none' : 'auto'}
                >
                  <Icon as={FiCheckCircle} boxSize={4} />
                  <Text>{text.notificationsMarkAll}</Text>
                </Flex>
              )}
            </Flex>

            <Box maxH="400px" overflowY="auto">
              {notificationsQuery.isPending ? (
                <Flex justify="center" align="center" py={10}>
                  <Spinner size="lg" colorPalette="cyan" />
                </Flex>
              ) : notificationsQuery.isError ? (
                <Box py={6}>
                  <QueryErrorState
                    message={text.notificationsLoadError}
                    retryLabel={text.notificationsRetry}
                    onRetry={() => notificationsQuery.refetch()}
                    isRetrying={notificationsQuery.isFetching}
                  />
                </Box>
              ) : listed.length === 0 ? (
                <VStack py={10} gap={3}>
                  <Icon as={FiBellOff} boxSize={10} color="text.secondary" opacity={0.5} />
                  <Text fontSize="sm" color="text.secondary">
                    {text.notificationsEmpty}
                  </Text>
                </VStack>
              ) : (
                <VStack align="stretch" gap={0} as="ul" listStyleType="none" m={0} p={0}>
                  {listed.map((item) => (
                    <Box
                      as="li"
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      px={4}
                      py={3}
                      borderBottom="1px solid"
                      borderColor="border1"
                      _hover={{ bg: 'cardHoverBG' }}
                      _focusVisible={{
                        bg: 'cardHoverBG',
                        outline: '2px solid',
                        outlineColor: 'cyan.500',
                      }}
                      transition="background 0.15s"
                      cursor="pointer"
                      onClick={() => handleOpenNotification(item)}
                      onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleOpenNotification(item);
                        }
                      }}
                    >
                      <Flex gap={3} align="flex-start">
                        <VStack align="flex-start" gap={1} flex={1} minW={0}>
                          <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                            {item.message}
                          </Text>
                          <Text fontSize="xs" color="text.secondary">
                            {relativeTime(item.created_at)}
                          </Text>
                        </VStack>
                        <Box w={2} h={2} borderRadius="full" bg="cyan.500" flexShrink={0} mt={1} />
                      </Flex>
                    </Box>
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

export default NotificationPanel;
