// src/pages/Public/Budget/index.tsx
// -----------------------------------------------------------------------------
// Página STANDALONE de aprovação pública de Orçamento por hash (Budget —
// Operacional / Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-06). Rota
// top-level `/orcamento-aprovacao/:hash` (`router/index.tsx`), FORA de
// `PrivateRoute` E `PublicRoute` — nenhum guard de autenticação se aplica
// (posse do hash é o único fator de autorização, mirror
// `budgets-api-contract.md §"Rota pública": sem auth:sanctum/farm.context`).
//
// Mirror ESTRUTURAL COMPLETO de `Public/RequestQuotation/index.tsx`
// (`budgets-frontend-contract.md §5.5`). Orquestra os 4+1 estados do
// roteiro `TASK-BG-FE-06`: loading (hash resolvendo) · não encontrado
// (hash inválido/404) · rate limit (429, defensivo — throttle equivalente
// ainda não confirmado no contrato de API, `## 7`) · erro genérico (retry)
// · já respondido (`status > 2`, banner "Orçamento Respondido", mirror
// CB-52) · formulário de resposta pronto (`status <= 2`).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1/DoD da Tarefa) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/store de farm/`@/services/api`
// autenticado neste arquivo nem em `BudgetPublicForm.tsx`. `useLanguage`/
// `useTheme`/TanStack Query são globais e independentes de sessão (ver
// `PublicQuotationLayout.tsx`, reaproveitado por esta rota).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, EmptyState, Flex, Icon, Spinner, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiSearch } from 'react-icons/fi';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import { getPublicBudgetByHash } from '@/services/v2/Budgets/budget-public-service';

import { BudgetPublicForm } from './BudgetPublicForm';

function StateCard({
  icon,
  title,
  description,
  retryLabel,
  onRetry,
}: {
  icon: ElementType;
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Icon as={icon} boxSize={8} color="fg.muted" />
        </EmptyState.Indicator>
        <VStack textAlign="center" gap={1}>
          <EmptyState.Title>{title}</EmptyState.Title>
          <EmptyState.Description>{description}</EmptyState.Description>
        </VStack>
        {retryLabel && onRetry && <Button title={retryLabel} variant="outline" onClick={onRetry} />}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}

export function BudgetPublicPage() {
  const { hash } = useParams<{ hash: string }>();
  const { languageGB } = useLanguage();
  const text = languageGB.budgets.budget.publicForm;

  const query = useQuery({
    queryKey: ['public-budget', hash],
    queryFn: () => getPublicBudgetByHash(hash as string),
    enabled: !!hash,
    // Rate limit defensivo (`## 7` do contrato de tela — throttle equivalente
    // a `throttle:quotation-public` ainda não confirmado no contrato de API):
    // retry automático seria contraproducente contra um limiter apertado.
    retry: false,
    refetchOnWindowFocus: false,
  });

  function handleAnsweredOrAlreadyAnswered() {
    query.refetch();
  }

  const statusCode = isAxiosError(query.error) ? query.error.response?.status : undefined;

  return (
    <Flex minH="100vh" align="center" justify="center" p={{ base: 4, md: 8 }}>
      <Box
        w="full"
        maxW="960px"
        bg="bg.default"
        borderRadius="xl"
        boxShadow="md"
        border="1px solid"
        borderColor="border.subtle"
        p={{ base: 5, md: 8 }}
      >
        <Text fontSize="xl" fontWeight="bold" mb={6}>
          {text.pageTitle}
        </Text>

        {!hash || statusCode === 404 ? (
          <StateCard
            icon={FiSearch as ElementType}
            title={text.notFoundState.title}
            description={text.notFoundState.description}
          />
        ) : query.isPending ? (
          <Flex direction="column" align="center" justify="center" py={12} gap={3}>
            <Spinner size="lg" />
            <Text fontSize="sm" color="fg.muted">
              {text.loadingState}
            </Text>
          </Flex>
        ) : statusCode === 429 ? (
          <StateCard
            icon={FiClock as ElementType}
            title={text.pageTitle}
            description={text.rateLimitedError}
          />
        ) : query.isError ? (
          <StateCard
            icon={FiAlertTriangle as ElementType}
            title={text.loadErrorState.title}
            description={text.loadErrorState.description}
            retryLabel={text.loadErrorState.retry}
            onRetry={() => query.refetch()}
          />
        ) : query.data && query.data.data.status > 2 ? (
          <StateCard
            icon={FiCheckCircle as ElementType}
            title={text.alreadyAnsweredState.title}
            description={text.alreadyAnsweredState.description}
          />
        ) : query.data ? (
          <BudgetPublicForm
            hash={hash as string}
            budget={query.data.data}
            onAnsweredOrAlreadyAnswered={handleAnsweredOrAlreadyAnswered}
          />
        ) : null}
      </Box>
    </Flex>
  );
}

export default BudgetPublicPage;
