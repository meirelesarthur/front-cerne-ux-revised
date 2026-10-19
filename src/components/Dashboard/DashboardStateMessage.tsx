// src/components/Dashboard/DashboardStateMessage.tsx
// Estado empty/error compartilhado pelas 4 dashboards (execução 046) — mirror
// EXATO do padrão já usado em `FeedlotMapDashboard/index.tsx` (`EmptyState`
// compound do Chakra v3), extraído aqui para não repetir o mesmo bloco em
// cada tela (Lei dos 5 estados: loading/empty/error/success + retry).

import { Button as ChakraButton, EmptyState, Icon, VStack } from '@chakra-ui/react';

import { DashboardCard } from './DashboardGrid';

import type { IconType } from 'react-icons';

interface DashboardStateMessageProps {
  icon: IconType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Bloco de estado vazio/erro do dashboard — mesmo card do kit, com o
 * conteúdo compound `EmptyState` do Chakra v3.
 * @return {JSX.Element} `DashboardCard` largura total com ícone/título/descrição/ação opcional.
 */
export function DashboardStateMessage({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: DashboardStateMessageProps) {
  return (
    <DashboardCard minHeight="240px">
      <EmptyState.Root>
        <EmptyState.Content>
          <EmptyState.Indicator>
            <Icon as={icon} boxSize={8} color="fg.muted" />
          </EmptyState.Indicator>
          <VStack textAlign="center" gap={1}>
            <EmptyState.Title>{title}</EmptyState.Title>
            <EmptyState.Description>{description}</EmptyState.Description>
          </VStack>
          {actionLabel && onAction && (
            <ChakraButton size="sm" onClick={onAction}>
              {actionLabel}
            </ChakraButton>
          )}
        </EmptyState.Content>
      </EmptyState.Root>
    </DashboardCard>
  );
}
