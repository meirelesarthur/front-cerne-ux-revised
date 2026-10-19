// src/pages/Public/Site/index.tsx
// -----------------------------------------------------------------------------
// Página STANDALONE da landing PÚBLICA do Site (97-Esteiras/061, TASK-SITE-10,
// `05-CONTRATO-TELA-pagina-publica-site.md`). Rota top-level `/site/:slug`
// (`router/index.tsx`), FORA de `PrivateRoute` E `PublicRoute` — nenhum guard
// de autenticação se aplica (a página é 100% anônima, mirror
// `Public/Rastreio/index.tsx`).
//
// Mirror ESTRUTURAL de `Public/Rastreio/index.tsx` (mesmo `useQuery` com
// `retry:false`/`refetchOnWindowFocus:false`, mesmo `StateCard` genérico via
// `EmptyState`), adaptado ao desvio deliberado desta tela: `slug` vem de PATH
// PARAM (`useParams`, decisão "Leitura do dev" item 1 do contrato de tela —
// distinto de `/rastreio?code=`, que usa querystring por constraint de
// compatibilidade que não existe aqui).
//
// Esta Tarefa (TASK-SITE-10) entrega SOMENTE a casca: rota + estados +
// header. As 7 seções de conteúdo (banner/Quem Somos/Produtos/Mapa+Contato/
// Footer/WhatsApp) ficam como slots vazios/comentados, plugados nas
// TASK-SITE-11/12/13 seguintes (`## 1` do contrato de tela).
//
// TASK-SITE-13 (esta entrega): Mapa (`SitePublicoMap`, consome
// `farm.coordinates`) + Contato (`ContactSection`) lado a lado (mirror
// `index.blade.php:248-267`, col-md-6 + col-md-6), footer com copyright
// GB Cerne (ano dinâmico, `## 1` linha 6) e botão flutuante do WhatsApp
// (mirror `Public/Rastreio/index.tsx:299-325`, `digits =
// whatsapp.replace(/\D/g,'')`, `https://api.whatsapp.com/send?phone=55
// {digits}`, SEM `text=` — SEM-002), condicional a `site.whatsapp`
// presente. A landing pública fica COMPLETA com esta wave (todas as 7
// seções do contrato de tela plugadas no estado `success`).
//
// not-found (`## 5` do contrato de tela) cobre TANTO `slug` inexistente
// QUANTO `site.published === false` com a MESMA mensagem — o backend já
// unifica os dois casos num 404 genérico indiferenciado
// (`PublicSiteInfo.published`, comentário do tipo: "backend só serve quando
// site.published === true"), então o front não precisa (nem consegue)
// diferenciar os dois cenários — não vaza qual dos dois ocorreu.
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1/DoD da Tarefa) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/store de farm/`@/services/api`
// autenticado neste arquivo nem em `src/pages/Public/Site/**`.
// `useTheme`/TanStack Query são globais e independentes de sessão (ver
// `PublicQuotationLayout.tsx`, reaproveitado por esta rota).
//
// i18n — desenho consciente do ajuste #4 (`## 6` do contrato de tela): os 5
// rótulos do MENU trocam com o seletor local (`menuLang`/`MENU_TEXT_BY_LANG`
// abaixo, lendo os 3 `languageSite.ts` DIRETO — NUNCA `useLanguage()`); o
// CONTEÚDO (`content.*`) é fixo em PT-BR, importado DIRETO de
// `languagePtBr/languageSite.ts` e nunca comutado (decisão explícita do
// dono: "NÃO recarrega nem re-traduz o conteúdo").
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Separator,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FaWhatsapp } from 'react-icons/fa';
import { FiAlertTriangle, FiSearch } from 'react-icons/fi';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/Button';

import { languageSite as languageSiteEnUs } from '@/constants/languages/languageEnUs/languageSite';
import { languageSite as languageSiteEsEs } from '@/constants/languages/languageEsEs/languageSite';
import { languageSite as languageSitePtBr } from '@/constants/languages/languagePtBr/languageSite';

import { getPublicSite } from '@/services/v2/Site/site-public-service';

import { AboutSection } from './sections/AboutSection';
import { ContactSection } from './sections/ContactSection';
import { ProductsSection } from './sections/ProductsSection';
import { SitePublicoHeader } from './SitePublicoHeader';
import { SitePublicoLanguageCode } from './SitePublicoLanguageSwitcher';
import { SitePublicoMap } from './SitePublicoMap';

// Conteúdo fixo (títulos de seção/estados/rodapé) — fatia BR única, NUNCA
// comutada pelo seletor (`## 6` do contrato de tela, ajuste #4).
const content = languageSitePtBr.publico.content;

// Os 5 rótulos do menu + seletor GENUINAMENTE 3-idiomas — mapa lido direto
// dos 3 dicionários já populados na Wave A (TASK-SITE-09), indexado pelo
// estado LOCAL `menuLang` (nunca pelo Context global `useLanguage()`).
const MENU_TEXT_BY_LANG: Record<SitePublicoLanguageCode, typeof languageSitePtBr.publico.menu> = {
  BR: languageSitePtBr.publico.menu,
  US: languageSiteEnUs.publico.menu,
  ES: languageSiteEsEs.publico.menu,
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

export function SitePublicoPage() {
  const { slug } = useParams<{ slug: string }>();

  // Estado LOCAL do seletor de idioma do menu (ajuste #4) — elevado aqui
  // (pai), repassado como prop ao header. `useState`, NUNCA
  // `useLanguage()/updateLanguageGB()` (isolamento do `localStorage`
  // global, ver `SitePublicoLanguageSwitcher.tsx`).
  const [menuLang, setMenuLang] = useState<SitePublicoLanguageCode>('BR');
  const menuText = MENU_TEXT_BY_LANG[menuLang];

  // Banner com 403/arquivo ausente no storage não é bug nosso, mas não pode
  // aparecer quebrado (`<img>` com ícone de imagem inválida do browser) —
  // `onError` oculta o elemento por completo (97-Esteiras/061, fix de
  // runtime), mirror do padrão de omissão já usado nesta tela.
  const [bannerFailed, setBannerFailed] = useState(false);

  const query = useQuery({
    queryKey: ['public-site', slug],
    queryFn: () => getPublicSite(slug as string),
    enabled: !!slug,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const statusCode = isAxiosError(query.error) ? query.error.response?.status : undefined;
  const isNotFound = !slug || statusCode === 404;

  // Botão flutuante do WhatsApp (`## 1` linha 7 / `## 3` SUR-PUB-12) —
  // condicional a `site.whatsapp` (telefone cru), mirror
  // `Public/Rastreio/index.tsx:179-183`, mas SEM `text=` (SEM-002: a API do
  // Site não tem campo de mensagem pré-setada, diferente de
  // `config.whatsapp_texto` de F-067).
  const whatsapp = query.data?.data.site.whatsapp ?? null;
  const whatsappDigits = whatsapp ? whatsapp.replace(/\D/g, '') : '';
  const whatsappHref =
    whatsapp && whatsappDigits ? `https://api.whatsapp.com/send?phone=55${whatsappDigits}` : null;

  return (
    <Box minH="100vh">
      {/* ---- Header (`## 1` linha 1) — logo GBCerne + 5 itens de menu
          inertes + seletor de idioma local. Visível em TODOS os estados
          (mirror `RastreioPublicoPage`, cabeçalho acima do switch). ---- */}
      <SitePublicoHeader menuText={menuText} menuLang={menuLang} onMenuLangChange={setMenuLang} />

      <Flex direction="column" align="center" justify="center" p={{ base: 4, md: 8 }}>
        {isNotFound ? (
          <StateCard
            icon={FiSearch as ElementType}
            title={content.states.notFound.title}
            description={content.states.notFound.description}
          />
        ) : query.isPending ? (
          <Flex direction="column" align="center" justify="center" py={12} gap={3}>
            <Spinner size="lg" />
            <Text fontSize="sm" color="fg.muted">
              {content.states.loading}
            </Text>
          </Flex>
        ) : query.isError ? (
          <StateCard
            icon={FiAlertTriangle as ElementType}
            title={content.states.error.title}
            description={content.states.error.description}
            retryLabel={content.states.error.retry}
            onRetry={() => query.refetch()}
          />
        ) : query.data ? (
          // ---- Seções de conteúdo (success) — as 7 seções do contrato de
          // tela (`## 1`) completas nesta wave: banner (TASK-SITE-11), Quem
          // Somos (TASK-SITE-11), Nossos Produtos (TASK-SITE-12), Mapa +
          // Contato + Footer + WhatsApp flutuante (TASK-SITE-13, abaixo). ----
          <VStack align="stretch" gap={8} w="full" maxW="1200px">
            {/* Banner (`## 1` linha 2 do contrato de tela) — full-width,
                omitido quando `banner_url` ausente (nunca `<Image>` quebrada
                sem `src`). */}
            {query.data.data.site.banner_url && !bannerFailed && (
              <Image
                src={query.data.data.site.banner_url}
                alt={query.data.data.farm.description || 'Banner do site'}
                w="full"
                maxW="100%"
                borderRadius="lg"
                objectFit="cover"
                onError={() => setBannerFailed(true)}
              />
            )}

            <AboutSection
              farm={query.data.data.farm}
              about={query.data.data.site.about}
              instagram={query.data.data.site.instagram}
              facebook={query.data.data.site.facebook}
              twitter={query.data.data.site.twitter}
              youtube={query.data.data.site.youtube}
              sectionTitle={content.about.sectionTitle}
            />

            <ProductsSection products={query.data.data.products} text={content.products} />

            {/* Mapa + Contato (`## 1` linha 5 do contrato de tela, mirror
                `index.blade.php:248-267` col-md-6 + col-md-6) — lado a lado
                em telas médias+, empilhados em mobile. */}
            <Separator />
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} w="full">
              <SitePublicoMap
                coordinates={query.data.data.farm.coordinates}
                unavailableText={content.map.unavailable}
              />
              <ContactSection farm={query.data.data.farm} text={content.contact} />
            </SimpleGrid>

            {/* Footer (`## 1` linha 6) — copyright GB Cerne (NUNCA
                "© AGRO365"), ano dinâmico equivalente a `date('Y')`
                server-side do legado. */}
            <Separator />
            <Text fontSize="xs" color="fg.muted" textAlign="center">
              {content.footer.rightsTemplate.replace('{year}', String(new Date().getFullYear()))}
            </Text>
          </VStack>
        ) : null}
      </Flex>

      {/* ---- WhatsApp (`## 1` linha 7 / `## 3` SUR-PUB-12) — botão
          flutuante fixo, `target="_blank"`, mirror posição/estilo de
          `Public/Rastreio/index.tsx:299-325`. Omitido quando `site.whatsapp`
          ausente. ---- */}
      {whatsappHref && (
        <Link
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={content.whatsapp.buttonLabel}
          title={content.whatsapp.buttonLabel}
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
    </Box>
  );
}

export default SitePublicoPage;
