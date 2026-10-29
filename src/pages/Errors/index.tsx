// src/pages/Errors/index.tsx
// Telas de erro por status HTTP. Rotas (públicas, sem layout):
//   /404            → 404 (também é o catch-all do sistema, via `NotFound`)
//   /erro/:code     → qualquer status da lista (400, 401, 403, 404, …, 500, 503, 504)
//   /erros          → índice com TODOS os exemplos das faixas 4xx e 5xx (para revisão de design)

import { Box, Flex, Text } from '@chakra-ui/react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorStatusPage } from '@/components/ui/ErrorStatusPage';
import { useLanguage } from '@/hooks/useLanguage';

import { CHROME, ERROR_CODES, ERROR_STATUSES, HEADLINE, isServerError, type ErrorLang } from './copy';

const asLang = (l: unknown): ErrorLang => (l === 'US' || l === 'ES' ? l : 'BR');

export function ErrorStatus({ code, detail }: { code: number; detail?: string }) {
  const { languageInUse } = useLanguage();
  const navigate = useNavigate();
  const lang = asLang(languageInUse);
  const known = ERROR_STATUSES[code] ?? ERROR_STATUSES[404];
  const status = ERROR_STATUSES[code] ? code : 404;

  return (
    <ErrorStatusPage
      status={status}
      statusName={known.name}
      headline={HEADLINE[isServerError(status) ? 'server' : 'client'][lang]}
      message={known.message[lang]}
      detail={detail}
      labels={CHROME[lang]}
      onBack={() => navigate(-1)}
      onHome={() => navigate('/home')}
      onRetry={() => window.location.reload()}
    />
  );
}

/** /erro/:code */
export default function ErrorRoute() {
  const { code } = useParams();
  return <ErrorStatus code={Number(code)} />;
}

/** /erros — índice de exemplos. */
export function ErrorsIndex() {
  const { languageInUse } = useLanguage();
  const lang = asLang(languageInUse);
  const group = (title: string, codes: number[]) => (
    <Box>
      <Text fontSize="lg" fontWeight="semibold" mb={3}>
        {title}
      </Text>
      <Flex wrap="wrap" gap={3}>
        {codes.map((c) => (
          <Link key={c} to={`/erro/${c}`}>
            <Box borderWidth="1px" borderColor="border.muted" borderRadius="lg" p={3} minW="220px" bg="cardBG" _hover={{ borderColor: 'green.600' }}>
              <Text fontSize="xl" fontWeight="bold">
                {c}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {ERROR_STATUSES[c].name}
              </Text>
            </Box>
          </Link>
        ))}
      </Flex>
    </Box>
  );
  return (
    <Box minH="100vh" bg="contentOuterBG" p={8}>
      <Text as="h1" fontSize="2xl" fontWeight="bold" mb={1}>
        {CHROME[lang].all}
      </Text>
      <Text color="fg.muted" mb={6}>
        /erro/:code
      </Text>
      <Flex direction="column" gap={8}>
        {group('4xx', ERROR_CODES.filter((c) => c < 500))}
        {group('5xx', ERROR_CODES.filter((c) => c >= 500))}
      </Flex>
    </Box>
  );
}
