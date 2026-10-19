// src/components/QueryErrorState.tsx
// -----------------------------------------------------------------------------
// Esteira 003, Onda 3 (CONTRATO-FE-ERRO-ESTADO-QUERY.md, §3). Componente único
// que consolida os dois formatos inline de erro de leitura (GET) hoje
// duplicados no projeto:
//   - Listagem (ex. `Administrativo/Sla/index.tsx`): ícone + texto + retry.
//   - Detalhe  (ex. `Operacional/Appropriations/AppropriationDetalhe.tsx`):
//     `EmptyState.Root/Content/Indicator/Title/Description` + ação de voltar.
//
// Implementado sobre os primitivos `EmptyState.*` do Chakra v3 (já em uso no
// projeto) — adaptação do `variant="error"` do `EmptyState` do design system
// `cerne`, não cópia do componente React do Storybook (bibliotecas de base
// diferentes). Consolida o ícone único `FiAlertTriangle` (o `cerne` usa
// `AlertTriangle` do lucide-react; a listagem usava `FiAlertCircle` — unificado
// aqui, ver contrato §2).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { EmptyState, Icon, VStack } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import { getQueryErrorPresentation } from '@/utils/extractApiErrorMessage';

export interface QueryErrorStateProps {
  /** Mensagem principal. Default: languageGB.common.errorLog.byStatus.server. */
  message?: string;
  /** Contexto adicional opcional, exibido abaixo da mensagem principal. */
  description?: string;
  /** Presente → mostra botão "Tentar novamente" (caso grid/listagem). */
  onRetry?: () => void;
  /** Repassa loading ao botão de retry (Button já suporta prop `loading`). */
  isRetrying?: boolean;
  /** Rótulo do botão de retry — a tela fornece (reuso de i18n já existente na tela). */
  retryLabel?: string;
  /** Presente → mostra ação secundária de voltar (caso detalhe/not-found). */
  onBack?: () => void;
  backLabel?: string;
  /** Ícone do botão de voltar (opcional — ex. FiArrowLeft). */
  backIcon?: ElementType;
  /** Ícone customizado do indicador principal. Default: FiAlertTriangle. */
  icon?: ElementType;
  /** Presente → deriva `message` e `retryable` via `getQueryErrorPresentation`.
   *  Quando `retryable` resultante for `false`, o botão de retry NÃO renderiza
   *  mesmo que `onRetry` tenha sido passado pelo caller. `message` explícita
   *  (prop acima) continua tendo prioridade sobre a derivada do `error` —
   *  retrocompat total com as telas do canário da Onda 3 (que não passam
   *  `error`). */
  error?: unknown;
}

export function QueryErrorState({
  message,
  description,
  onRetry,
  isRetrying,
  retryLabel,
  onBack,
  backLabel,
  backIcon,
  icon,
  error,
}: QueryErrorStateProps) {
  const { languageGB } = useLanguage();

  const presentation = error ? getQueryErrorPresentation(error, languageGB) : null;
  const resolvedMessage =
    message ?? presentation?.message ?? languageGB.common.errorLog.byStatus.server;
  const resolvedIcon = icon ?? (FiAlertTriangle as ElementType);
  const showRetryButton = Boolean(onRetry) && (presentation?.retryable ?? true);

  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Icon as={resolvedIcon} boxSize={8} color="fg.muted" />
        </EmptyState.Indicator>
        <VStack textAlign="center" gap={1}>
          <EmptyState.Title>{resolvedMessage}</EmptyState.Title>
          {description && <EmptyState.Description>{description}</EmptyState.Description>}
        </VStack>
        {(showRetryButton || onBack) && (
          <VStack gap={2}>
            {showRetryButton && (
              <Button
                title={retryLabel ?? ''}
                variant="outline"
                size="sm"
                loading={isRetrying}
                onClick={onRetry}
              />
            )}
            {onBack && (
              <Button
                title={backLabel ?? ''}
                icon={backIcon}
                variant="outline"
                size="sm"
                onClick={onBack}
              />
            )}
          </VStack>
        )}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
