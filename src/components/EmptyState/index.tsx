// src/components/EmptyState/index.tsx
// -----------------------------------------------------------------------------
// EmptyState — componente GENÉRICO (não específico de nenhuma feature),
// adaptado de `GB.Cerne.UX/src/components/ui/EmptyState.tsx` (Passo UX,
// Tarefa 38, `FID-G3F §1`: componente AUSENTE no `frontend_root` até esta
// Tarefa) para primitivas Chakra UI v3 + tokens semânticos de `src/theme.ts`
// — NUNCA import direto do Storybook (adaptação, não cópia,
// `get_spa_ux_fidelity_pattern`).
//
// 3 variantes (mirror do `cerne`): `empty` (lista/agregado vazio), `search`
// (busca sem resultado) e `error` (falha de carga, com retry). Ícones:
// `react-icons/fi` (já em uso no fork, ex. `CheckboxListField.tsx`),
// substituindo `lucide-react` do design system — dependência já presente no
// projeto em vez de uma nova.
//
// `message` é OBRIGATÓRIO (sem default hardcoded): este componente não
// decide o texto de nenhuma tela — o consumidor sempre traz a string de
// `languageGB` (i18n sem string hardcoda, `get_spa_ux_fidelity_pattern §5`).
// Quando `onRetry` é passado, `retryLabel` é OBRIGATÓRIO pelo mesmo motivo
// (union discriminada abaixo, em vez de um default em português).
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Box, Button, HStack, Icon, VStack, Text } from '@chakra-ui/react';
import { FiAlertTriangle, FiFolder, FiSearch } from 'react-icons/fi';

export type EmptyStateVariant = 'empty' | 'search' | 'error';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateBaseProps {
  variant?: EmptyStateVariant;
  message: string;
  description?: string;
  icon?: ReactNode;
  action?: EmptyStateAction;
}

interface EmptyStateWithoutRetryProps extends EmptyStateBaseProps {
  onRetry?: undefined;
  retryLabel?: undefined;
}

interface EmptyStateWithRetryProps extends EmptyStateBaseProps {
  /** Reexecuta a query que falhou (ex.: `query.refetch()`). */
  onRetry: () => void;
  retryLabel: string;
}

export type EmptyStateProps = EmptyStateWithoutRetryProps | EmptyStateWithRetryProps;

// mirror `CheckboxListField.tsx` (`<Icon as={FiAlertCircle} .../>`) — o
// componente do `react-icons` sempre entra via `as`, nunca renderizado
// direto como JSX (evita incompatibilidade de tipos entre `react-icons` e
// a versão de `@types/react` do fork).
const DEFAULT_ICON: Record<EmptyStateVariant, ReactNode> = {
  empty: <Icon as={FiFolder} boxSize={10} />,
  search: <Icon as={FiSearch} boxSize={10} />,
  error: <Icon as={FiAlertTriangle} boxSize={10} />,
};

export function EmptyState({
  variant = 'empty',
  message,
  description,
  icon,
  action,
  onRetry,
  retryLabel,
}: EmptyStateProps) {
  const isError = variant === 'error';

  return (
    <VStack
      role={isError ? 'alert' : undefined}
      aria-live={isError ? 'polite' : undefined}
      gap={3}
      paddingY={10}
      paddingX={4}
      width="full"
      textAlign="center"
    >
      <Box color={isError ? 'red.400' : 'fg.muted'} opacity={isError ? 0.9 : 0.65}>
        {icon ?? DEFAULT_ICON[variant]}
      </Box>

      <Text fontSize="md" fontWeight="medium" color="text.primary">
        {message}
      </Text>

      {description && (
        <Text fontSize="sm" color="fg.muted" maxW="360px">
          {description}
        </Text>
      )}

      {(action || (isError && onRetry)) && (
        <HStack gap={2} mt={1}>
          {isError && onRetry && (
            <Button variant="solid" colorPalette="blue" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {action && (
            <Button variant={isError && onRetry ? 'outline' : 'solid'} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </HStack>
      )}
    </VStack>
  );
}

export default EmptyState;
