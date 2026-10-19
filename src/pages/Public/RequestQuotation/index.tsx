// src/pages/Public/RequestQuotation/index.tsx
// -----------------------------------------------------------------------------
// Página STANDALONE do formulário público do fornecedor (hash,
// RequestQuotation — esteira 97-Esteiras/035, TASK-CQ-FE-10). Rota top-level
// `/orcamento/:hash` (mirror legado, `router/index.tsx`), FORA de
// `PrivateRoute` E `PublicRoute` — nenhum guard de autenticação se aplica
// (posse do hash é o único fator de autorização, roteiro API §9).
//
// Orquestra os 4 estados obrigatórios (roteiro frontend §1.3): loading (hash
// resolvendo) · error (hash inválido/expirado → 404 genérico, MESMA paridade
// do legado — nunca diferenciar "não existe" de "outro erro"; 429 — limite de
// tentativas; outro erro — retry) · success com `status===recebida` (banner
// "cotação finalizada", mirror EV-069) · success com `status!==recebida`
// (formulário pronto para preencher, `RequestQuotationPublicForm`).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/`@/stores/*Farm*`/
// `@/services/api` neste arquivo. `useLanguage`/`useTheme`/TanStack Query são
// globais e independentes de sessão (ver `PublicQuotationLayout.tsx`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, EmptyState, Flex, Icon, Spinner, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiCheckCircle, FiClock, FiSearch } from 'react-icons/fi';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import { requestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

import { getPublicRequestQuotationByHash } from '@/services/v2/RequestQuotations/request-quotation-public-service';

import { RequestQuotationPublicForm } from './RequestQuotationPublicForm';

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
          {description && <EmptyState.Description>{description}</EmptyState.Description>}
        </VStack>
        {retryLabel && onRetry && <Button title={retryLabel} variant="outline" onClick={onRetry} />}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}

export function RequestQuotationPublicPage() {
  const { hash } = useParams<{ hash: string }>();
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;

  const query = useQuery({
    queryKey: ['public-request-quotation', hash],
    queryFn: () => getPublicRequestQuotationByHash(hash as string),
    enabled: !!hash,
    // Rate limit dedicado (10 req/min/IP, `throttle:quotation-public`) —
    // retry automático seria contraproducente contra um limiter tão
    // apertado (roteiro API §9/TASK-CQ-API-11).
    retry: false,
    refetchOnWindowFocus: false,
  });

  function handleSubmittedOrAlreadySubmitted() {
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
        ) : query.data && query.data.data.status === requestQuotationStatus.recebida ? (
          <StateCard
            icon={FiCheckCircle as ElementType}
            title={text.alreadySubmittedState.title}
            description={text.alreadySubmittedState.description}
          />
        ) : query.data ? (
          <>
            <Flex direction="column" gap={1} mb={6} fontSize="sm" color="fg.muted">
              {query.data.data.request_purchase && (
                <>
                  {/* Legado: "Solicitação Nº {code} - {fazenda}". */}
                  <Text>
                    {text.requestHeader
                      .replace('{code}', query.data.data.request_purchase.code)
                      .replace('{farm}', query.data.data.farm?.description ?? '')}
                  </Text>
                  <Text>
                    {text.descriptionLabel} {query.data.data.request_purchase.description}
                  </Text>
                </>
              )}
              {query.data.data.provider && (
                <Text>
                  {text.providerLabel} {query.data.data.provider.name}
                </Text>
              )}
            </Flex>

            <RequestQuotationPublicForm
              hash={hash as string}
              quotation={query.data.data}
              onSubmittedOrAlreadySubmitted={handleSubmittedOrAlreadySubmitted}
            />
          </>
        ) : null}
      </Box>
    </Flex>
  );
}

export default RequestQuotationPublicPage;
