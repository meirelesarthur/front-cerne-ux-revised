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
// tentativas; outro erro — retry) · success com `status===recebida` (cartão
// "já enviada", mirror EV-069) · success com `status!==recebida` (formulário
// pronto para preencher, `RequestQuotationPublicForm`). Logo depois de um envio
// bem-sucedido mostra o cartão de confirmação com o total enviado.
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/`@/stores/*Farm*`/
// `@/services/api` neste arquivo. `useLanguage`/`useTheme`/TanStack Query são
// globais e independentes de sessão (ver `PublicQuotationLayout.tsx`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, EmptyState, Flex, Image, Spinner, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useParams } from 'react-router-dom';

import logoFull from '@/assets/Logo.svg';
import logoFullWhite from '@/assets/Logo-white.svg';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/contexts/ThemeContext';

import { useLanguage } from '@/hooks/useLanguage';

import { requestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

import { getPublicRequestQuotationByHash } from '@/services/v2/RequestQuotations/request-quotation-public-service';

import { RequestQuotationPublicForm } from './RequestQuotationPublicForm';
import {
  RequestQuotationPublicHowTo,
  RequestQuotationPublicNoticeBar,
  RequestQuotationPublicSummary,
} from './RequestQuotationPublicIntro';
import { RequestQuotationPublicSuccess } from './RequestQuotationPublicSuccess';

function StateCard({
  icon,
  title,
  description,
  retryLabel,
  onRetry,
}: {
  icon: IconName;
  title: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState.Root>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Flex
            align="center"
            justify="center"
            boxSize="56px"
            borderRadius="full"
            bg="bg.muted"
            color="cardTextSecondary"
          >
            <Icon name={icon} size="xl" />
          </Flex>
        </EmptyState.Indicator>
        <VStack textAlign="center" gap={1} role="status">
          <EmptyState.Title>{title}</EmptyState.Title>
          {description && <EmptyState.Description>{description}</EmptyState.Description>}
        </VStack>
        {retryLabel && onRetry && (
          <Button title={retryLabel} variant="outline" onClick={onRetry} />
        )}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}

export function RequestQuotationPublicPage() {
  const { hash } = useParams<{ hash: string }>();
  const { languageGB } = useLanguage();
  const { theme } = useTheme();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;

  // Total enviado agora (só depois de um POST bem-sucedido) — mostra o cartão de
  // confirmação mesmo que a reconsulta do `GET` ainda esteja em andamento.
  const [submitted, setSubmitted] = useState<{ total: number; unavailable: number } | null>(null);

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

  function handleSubmittedOrAlreadySubmitted(submitted?: { total: number; unavailable: number }) {
    if (submitted) setSubmitted(submitted);
    query.refetch();
  }

  const statusCode = isAxiosError(query.error) ? query.error.response?.status : undefined;
  const quotation = query.data?.data;
  // Resposta 200 sem a lista de itens (corpo inesperado) = mesmo tratamento de "outro erro".
  const isMalformed = query.isSuccess && !Array.isArray(quotation?.items);

  return (
    <Box as="main" minH="100vh" bg="contentOuterBG" px={4} py={{ base: 4, md: 8 }}>
      <Box
        w="full"
        maxW="1040px"
        mx="auto"
        bg="cardBG"
        borderRadius="xl"
        boxShadow="cardShadow"
        borderWidth="1px"
        borderColor="cardBorder"
        // Sem `overflow: hidden`: a barra de envio fixa (`sticky`) precisa rolar com a página.
      >
        {quotation?.note && quotation.status !== requestQuotationStatus.recebida && (
          <RequestQuotationPublicNoticeBar note={quotation.note} />
        )}
        <Flex
          align="center"
          gap={3}
          px={{ base: 4, md: 8 }}
          py={4}
          borderBottomWidth="1px"
          borderColor="cardBorder"
        >
          {/* Logo oficial do CERNE (a mesma da barra lateral), clara ou escura conforme o tema. */}
          <Image
            src={theme === 'dark' ? logoFullWhite : logoFull}
            alt={text.brandName}
            h="30px"
            w="auto"
            flexShrink={0}
            userSelect="none"
          />
          <Box minW={0} pl={3} borderLeftWidth="1px" borderColor="cardBorder">
            <Text as="h1" fontSize="lg" fontWeight="bold" color="cardTextPrimary" lineHeight="1.2">
              {text.heading}
            </Text>
          </Box>
        </Flex>

        <Box px={{ base: 4, md: 8 }} py={{ base: 5, md: 6 }}>
          {!hash || statusCode === 404 ? (
            <StateCard
              icon="search-empty"
              title={text.notFoundState.title}
              description={text.notFoundState.description}
            />
          ) : submitted !== null ? (
            <RequestQuotationPublicSuccess total={submitted.total} unavailable={submitted.unavailable} />
          ) : query.isPending ? (
            <Flex direction="column" align="center" justify="center" py={12} gap={3} role="status">
              <Spinner size="lg" />
              <Text fontSize="sm" color="cardTextSecondary">
                {text.loadingState}
              </Text>
            </Flex>
          ) : statusCode === 429 ? (
            <StateCard
              icon="clock"
              title={text.rateLimitedTitle}
              description={text.rateLimitedError}
            />
          ) : query.isError || isMalformed ? (
            <StateCard
              icon="warning"
              title={text.loadErrorState.title}
              description={text.loadErrorState.description}
              retryLabel={text.loadErrorState.retry}
              onRetry={() => query.refetch()}
            />
          ) : quotation && quotation.status === requestQuotationStatus.recebida ? (
            <RequestQuotationPublicSuccess already />
          ) : quotation ? (
            <Flex direction="column" gap={6}>
              <RequestQuotationPublicSummary quotation={quotation} />
              <RequestQuotationPublicHowTo />
              <RequestQuotationPublicForm
                hash={hash as string}
                quotation={quotation}
                onSubmittedOrAlreadySubmitted={handleSubmittedOrAlreadySubmitted}
              />
            </Flex>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

export default RequestQuotationPublicPage;
