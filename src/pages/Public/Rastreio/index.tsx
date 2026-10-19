// src/pages/Public/Rastreio/index.tsx
// -----------------------------------------------------------------------------
// Página STANDALONE de rastreio público por código (Rastreabilidade — F-067,
// `97-Esteiras/058`, TASK-TR-PUB-FE-02/03). Rota top-level `/rastreio?code=`
// (`router/index.tsx`), FORA de `PrivateRoute` E `PublicRoute` — nenhum guard
// de autenticação se aplica (posse do `code` é o único fator de autorização,
// mirror `CONTRATO-TELA-F067-rastreio-publico.md ## 3`).
//
// Mirror ESTRUTURAL de `Public/Budget/index.tsx` (mesmo `useQuery` com
// `retry:false`, mesmo `StateCard` genérico via `EmptyState`), adaptado ao
// desvio deliberado desta tela: o `code` vem de QUERYSTRING da URL do FRONT
// (`useSearchParams`, `?code=`, fiel à URL já impressa em etiquetas/QR do
// legado, `CL-01`), mas é passado como PATH PARAM na chamada à API
// (`GET /public/traceability/{code}`, `traceability-public-service.ts`) — os
// dois esquemas de URL são independentes, sem conflito.
//
// TASK-TR-PUB-FE-03: plugadas as 8 seções de CONTEÚDO somente-leitura do
// estado `success` — `## 4.3`–`## 4.8`/`## 4.10`/`## 4.12` do contrato de
// tela (produto, imagem, tracking/lote/embalagem, tabela nutricional,
// disponibilidade, área condicional, produtor/config, rodapé). Cabeçalho/
// logo (`## 4.2`) plugado ACIMA do switch de estados (mirror
// `BudgetPublicPage`, que mostra `text.pageTitle` mesmo durante
// loading/error).
//
// TASK-TR-PUB-FE-04: mapa Leaflet read-only (`## 4.9`/`## 7`,
// `RastreioMap.tsx`) plugado dentro do card de sucesso + botão flutuante do
// WhatsApp (`## 4.11`/`## 8`) — `href` montado com `encodeURIComponent()`
// no texto, corrigindo o bug `CL-09` (o legado concatenava
// `whatsapp_texto` cru, sem `urlencode`).
//
// TASK-TR-PUB-FE-05 (esta entrega): seletor de idioma (`## 4.13`/`## 6`)
// plugado no cabeçalho + seed inicial a partir de `?lang=` da querystring
// (mirror do deep-link do legado, `pt-BR→BR`/`en→US`/`es→ES`, default `BR`),
// rodando UMA ÚNICA VEZ no mount via `useRef` guard (nunca a cada render).
// Troca de idioma é PURA apresentação — SEM refetch, SEM invalidação de
// query: a API já devolve as 3 variantes de nome/descrição no mesmo
// payload (`## 4.3`/`## 2` do contrato), a `queryKey` abaixo NÃO leva
// idioma, então trocar o Context não dispara nova requisição.
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1/DoD da Tarefa) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/store de farm/`@/services/api`
// autenticado neste arquivo, nem de `useLanguageSwitcher`/`updatePreferences`
// (persistem no perfil via endpoint AUTENTICADO — proibido nesta tela
// anônima). `useLanguage`/`useTheme`/TanStack Query são globais e
// independentes de sessão (ver `PublicQuotationLayout.tsx`, reaproveitado
// por esta rota).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useRef } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Image,
  Link,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FaWhatsapp } from 'react-icons/fa';
import { FiAlertTriangle, FiSearch } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';

import { useTheme } from '@/contexts/ThemeContext';

import { useLanguage } from '@/hooks/useLanguage';

import { getPublicTraceabilityByCode } from '@/services/v2/Rastreabilidade/traceability-public-service';

import { RastreioLanguageSwitcher } from './RastreioLanguageSwitcher';
import { RastreioMap } from './RastreioMap';
import { AvailabilityGrid } from './sections/AvailabilityGrid';
import { NutritionTable } from './sections/NutritionTable';
import { ProducerCard } from './sections/ProducerCard';
import { ProductSection } from './sections/ProductSection';

import logoMinWhite from '@/assets/logo-min-white.svg';
import logoMin from '@/assets/logo-min.svg';

// Formatação fixa pt-BR (não varia por idioma, `CV-01`/`## 5` do contrato de
// tela) — mesmo padrão local-ao-arquivo já usado em `FeedlotYards/
// DetalheFeedlotYard.tsx`, aqui só para a área (`## 4.8`, `FD-21`).
const areaFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Seed inicial de idioma (`## 6` do contrato de tela) — mapeia o valor de
// `?lang=` (deep-link, mirror do legado) para o código interno do app
// (`get_pwa_i18n_pattern ## 5`, `BR|US|ES`). Qualquer valor ausente/
// desconhecido cai no default `BR`, mesmo comportamento observável do
// legado (`CL-03`/`CL-06`).
const LANG_QUERY_PARAM_MAP: Record<string, 'BR' | 'US' | 'ES'> = {
  'pt-BR': 'BR',
  en: 'US',
  es: 'ES',
};

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

export function RastreioPublicoPage() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const langParam = searchParams.get('lang');

  const { languageGB, languageInUse, updateLanguageGB } = useLanguage();
  const text = languageGB.rastreabilidade.rastreioPublico;

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Guard de execução ÚNICA (`useRef`, não `useState`) — roda só uma vez no
  // mount, nunca a cada render/troca manual subsequente do seletor (DoD da
  // Tarefa: "seed roda só uma vez por mount").
  const didSeedLanguage = useRef(false);
  useEffect(() => {
    if (didSeedLanguage.current) return;
    didSeedLanguage.current = true;
    updateLanguageGB(LANG_QUERY_PARAM_MAP[langParam ?? ''] ?? 'BR');
    // Deps vazias DELIBERADAMENTE — guard `useRef` acima já garante execução
    // única no mount; incluir `langParam`/`updateLanguageGB` reexecutaria o
    // seed a cada troca manual do seletor (regressão do DoD).
  }, []);

  const query = useQuery({
    // Query key SEM idioma — a API não localiza (devolve as 3 variantes
    // sempre no mesmo payload), trocar idioma não deve gerar refetch
    // (`CONTRATO-TELA-F067-rastreio-publico.md ## 2`).
    queryKey: ['public-traceability', code],
    queryFn: () => getPublicTraceabilityByCode(code as string),
    enabled: !!code,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const statusCode = isAxiosError(query.error) ? query.error.response?.status : undefined;

  const config = query.data?.data.config;
  // Botão flutuante do WhatsApp (`## 4.11`/`## 8` do contrato de tela) —
  // sempre visível quando `config.whatsapp_fone` existe (mirror legado,
  // ícone flutuante fixo). `digits` mantém o mesmo `replace(/\D/g, '')` do
  // legado (dígitos apenas); `text` passa por `encodeURIComponent()` antes
  // de compor a URL — CORRIGIDO, o legado concatenava `whatsapp_texto` cru,
  // sem `urlencode` (`CL-09`, capaz de quebrar a URL com `&`/espaços).
  const whatsappDigits = config?.whatsapp_fone ? config.whatsapp_fone.replace(/\D/g, '') : '';
  const whatsappHref =
    config?.whatsapp_fone && whatsappDigits
      ? `https://api.whatsapp.com/send?phone=55${whatsappDigits}&text=${encodeURIComponent(config.whatsapp_texto)}`
      : null;

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
        {/* ---- Cabeçalho/logo (`## 4.2`) — logo do produto GB Cerne (não do
            produtor, que aparece na seção Produtor/`## 4.10`), sem dado de
            API. Visível em TODOS os estados (mirror `BudgetPublicPage`,
            `text.pageTitle` acima do switch). Seletor de idioma (`## 4.13`/
            `## 6`) plugado ao lado do logo — TASK-TR-PUB-FE-05; empilha
            abaixo em telas estreitas, mantendo o logo centrado. ---- */}
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          align="center"
          justify="center"
          gap={3}
          mb={6}
        >
          <Box flex={{ sm: 1 }} />
          <Image src={isDark ? logoMinWhite : logoMin} alt="GB Cerne" h="32px" w="auto" />
          <Flex flex={{ sm: 1 }} justify={{ base: 'center', sm: 'flex-end' }}>
            <RastreioLanguageSwitcher
              groupLabel={text.languageSwitcher.groupLabel}
              ptLabel={text.languageSwitcher.pt}
              enLabel={text.languageSwitcher.en}
              esLabel={text.languageSwitcher.es}
            />
          </Flex>
        </Flex>
        <Separator mb={6} />

        {!code || statusCode === 404 ? (
          <StateCard
            icon={FiSearch as ElementType}
            title={text.states.notFound.title}
            description={text.states.notFound.description}
          />
        ) : query.isPending ? (
          <Flex direction="column" align="center" justify="center" py={12} gap={3}>
            <Spinner size="lg" />
            <Text fontSize="sm" color="fg.muted">
              {text.states.loading}
            </Text>
          </Flex>
        ) : query.isError ? (
          <StateCard
            icon={FiAlertTriangle as ElementType}
            title={text.states.error.title}
            description={text.states.error.description}
            retryLabel={text.states.error.retry}
            onRetry={() => query.refetch()}
          />
        ) : query.data ? (
          // ---- Seções de conteúdo (success), `## 4.3`–`## 4.12` do
          // contrato de tela, ordem fiel ao legado. ----
          <VStack align="stretch" gap={8}>
            <ProductSection
              data={query.data.data}
              languageInUse={languageInUse}
              text={text.product}
            />

            <Separator />
            <NutritionTable data={query.data.data} text={text.nutritionalTable} />

            <Separator />
            <AvailabilityGrid
              availability={query.data.data.availability}
              text={text.availability}
            />

            {/* ---- Área (`## 4.8`, `FD-21`) — bloco condicional, omitido
                por completo quando `area` for `null` (mirror `@if($item->area)`
                do legado). ---- */}
            {query.data.data.area && (
              <>
                <Separator />
                <VStack align="stretch" gap={1}>
                  <Text fontSize="lg" fontWeight="semibold">
                    {text.area.title}
                  </Text>
                  <Text fontSize="sm">{query.data.data.area.description}</Text>
                  <Text fontSize="sm" color="fg.muted">
                    {`${areaFormatter.format(query.data.data.area.total_area)} ${text.area.hectaresLabel}`}
                  </Text>
                </VStack>
              </>
            )}

            {/* ---- Mapa (`## 4.9`/`## 7`) — Leaflet read-only, marcador
                único de `latlng`, parse defensivo (`CL-17`/`OQ-05`). ---- */}
            <Separator />
            <RastreioMap latlng={query.data.data.latlng} text={text.map} />

            <Separator />
            <ProducerCard config={query.data.data.config} text={text.producer} />

            <Separator />
            {/* Rodapé (`## 4.12`, `FD-25`) — ano dinâmico, equivalente a
                `date('Y')` server-side do legado. */}
            <Text fontSize="xs" color="fg.muted" textAlign="center">
              {text.footer.rightsTemplate.replace('{year}', String(new Date().getFullYear()))}
            </Text>
          </VStack>
        ) : null}
      </Box>

      {/* ---- WhatsApp (`## 4.11`/`## 8`) — botão flutuante fixo, `target=
          "_blank"` (mirror posição/estilo do legado, `EV-40`). Sempre
          visível quando `config.whatsapp_fone` existe. ---- */}
      {whatsappHref && (
        <Link
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={text.whatsapp.buttonLabel}
          title={text.whatsapp.buttonLabel}
          position="fixed"
          bottom={6}
          right={6}
          boxSize="56px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="full"
          bg="feedBack.successMain"
          color="white"
          boxShadow="lg"
          zIndex="toast"
          _hover={{ opacity: 0.9, textDecoration: 'none' }}
        >
          <Icon as={FaWhatsapp} boxSize={6} />
        </Link>
      )}
    </Flex>
  );
}

export default RastreioPublicoPage;
