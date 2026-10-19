// src/pages/Public/Site/sections/ProductsSection.tsx
// -----------------------------------------------------------------------------
// Seção "Nossos Produtos" da landing pública do Site (97-Esteiras/061,
// TASK-SITE-12, `05-CONTRATO-TELA-pagina-publica-site.md ## 1` linha 4 /
// `## 3` SUR-PUB-07/SUR-PUB-08).
//
// Grid de `data.products` (mirror `columnsForm.threeColumns` já usado em
// `Site/index.tsx` admin) — imagem (`ImageWithFallback`, reuso ESTRUTURAL de
// F-067, `Public/Rastreio/ImageWithFallback.tsx`) + nome + descrição
// truncada NO FRONT (200 chars, mirror legado `substr($item->
// description_pt, 0, 200)`) + botão "Ver Produto" → `/rastreio?code={hash}`
// (rota SPA pública já existente, F-067), sempre em nova aba.
//
// Correção deliberada do bug do legado (`## roteiro TASK-SITE-12`): o
// legado concatenava "..." mesmo em descrições já curtas (nunca truncadas de
// fato) — aqui as reticências só aparecem quando o corte realmente ocorreu.
//
// Grid vazio usa `EmptyState` (mesmo padrão de `SitePublicoPage`) — nunca
// uma seção em branco/quebrada (aceite da Tarefa).
// -----------------------------------------------------------------------------

import { Box, EmptyState, Icon, Link, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { FiPackage } from 'react-icons/fi';

import { ImageWithFallback } from '@/pages/Public/Rastreio/ImageWithFallback';

import { columnsForm } from '@/constants/coluns-form';

import type { PublicSiteProduct } from '@/@types/v2/Site/publico';

const PRODUCT_DESCRIPTION_MAX_LENGTH = 200;
const PRODUCT_IMAGE_HEIGHT = { base: '180px', md: '200px' };

interface ProductsSectionText {
  sectionTitle: string;
  viewProductButton: string;
  emptyState: {
    title: string;
    description: string;
  };
}

interface ProductsSectionProps {
  products: PublicSiteProduct[];
  text: ProductsSectionText;
}

/**
 * Trunca a descrição em `PRODUCT_DESCRIPTION_MAX_LENGTH` chars — mirror do
 * `substr()` do legado, mas SÓ concatena reticências quando o texto foi de
 * fato cortado (corrige o bug do legado, que sempre concatenava "..." mesmo
 * em descrições já curtas). `null`/vazio observado em produção (97-Esteiras/
 * 061, fix de runtime) — guard ANTES do `.length`, retorna vazio.
 * @param {string | null} description - Descrição COMPLETA vinda da API (`## 12` do roteiro — sem `substr()` no backend), `null` possível.
 * @return {string} Descrição truncada com reticências só quando necessário.
 */
function truncateDescription(description: string | null): string {
  if (!description) return '';
  if (description.length <= PRODUCT_DESCRIPTION_MAX_LENGTH) return description;
  return `${description.slice(0, PRODUCT_DESCRIPTION_MAX_LENGTH)}...`;
}

function ProductCard({
  product,
  viewProductLabel,
}: {
  product: PublicSiteProduct;
  viewProductLabel: string;
}) {
  return (
    <VStack
      align="stretch"
      gap={3}
      p={4}
      bg="bg.default"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
    >
      <ImageWithFallback src={product.image_url} alt={product.name} height={PRODUCT_IMAGE_HEIGHT} />

      <Text fontSize="md" fontWeight="semibold" color="fg.default">
        {product.name}
      </Text>

      <Text fontSize="sm" color="fg.muted" flex="1">
        {truncateDescription(product.description)}
      </Text>

      {/* Botão "Ver Produto" — rota SPA pública já existente (F-067), NUNCA
          URL do monólito legado (`SUR-PUB-08`). Sempre nova aba. */}
      <Link
        href={`/rastreio?code=${product.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        px={4}
        py={2}
        borderRadius="md"
        bg="buttonSolidBG"
        color="buttonSolidColor"
        fontSize="sm"
        fontWeight="semibold"
        _hover={{ opacity: 0.9, textDecoration: 'none' }}
      >
        {viewProductLabel}
      </Link>
    </VStack>
  );
}

export function ProductsSection({ products, text }: ProductsSectionProps) {
  // Blindagem defensiva — o endpoint contratualmente devolve `[]`, nunca
  // `null`/`undefined`, mas `.length` direto num valor ausente derruba a
  // seção inteira (97-Esteiras/061, fix de runtime).
  const safeProducts = products ?? [];

  return (
    <Box as="section" w="full">
      <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center" color="fg.default">
        {text.sectionTitle}
      </Text>

      {safeProducts.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiPackage} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.emptyState.title}</EmptyState.Title>
              <EmptyState.Description>{text.emptyState.description}</EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          {safeProducts.map((product) => (
            <ProductCard
              key={product.hash}
              product={product}
              viewProductLabel={text.viewProductButton}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

export default ProductsSection;
