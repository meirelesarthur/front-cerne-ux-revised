// src/pages/Public/Rastreio/sections/ProductSection.tsx
// -----------------------------------------------------------------------------
// Seções `## 4.3`–`## 4.5` do contrato de tela (F-067, `97-Esteiras/058`,
// TASK-TR-PUB-FE-03): nome+descrição do produto (localizados NO CLIENTE, a
// API devolve as 3 variantes cruas), imagem principal (fallback tratado via
// `ImageWithFallback`) e a linha de identificação tracking_code/lote/
// embalagem (rótulo "LOTE" TRADUZIDO — corrige `CL-08`, hardcoded PT no
// legado).
// -----------------------------------------------------------------------------

import { Badge, Text, VStack, Wrap } from '@chakra-ui/react';

import { resolveStorageUrl } from '@/utils/resolveStorageUrl';

import type { RastreioPublicoLanguage } from '@/@types/language/module-rastreabilidade/rastreio-publico';
import type { PublicTraceabilityData } from '@/@types/v2/Rastreabilidade/rastreio-publico';

import { ImageWithFallback } from '../ImageWithFallback';

// Diretório FIXO do disco `public` da galeria de rastreabilidade — MESMO
// diretório já usado pela galeria admin (`Traceability/Galery/index.tsx`,
// `TRACEABILITY_GALERY_DIRECTORY`); `image` cru desta API pública devolve só
// o nome do arquivo (`galery->first()?->image`, `PublicTraceabilityResource`),
// mesma convenção do Resource interno.
const TRACEABILITY_GALERY_DIRECTORY = 'traceability-galeries';

const PRODUCT_IMAGE_HEIGHT = { base: '200px', md: '280px' };

interface LocalizedTextFields {
  pt: string;
  en: string | null;
  es: string | null;
}

/**
 * Escolhe a variante do idioma ativo, com fallback SEMPRE em `pt` quando a
 * variante ausente for `null`/vazia — mirror do default `CL-06` do legado,
 * resolvido agora no cliente (`## 4.3` do contrato de tela). Helper LOCAL
 * (não Zustand, `Hooks/utilitários` da Tarefa).
 * @param {LocalizedTextFields} fields - As 3 variantes cruas (`pt`/`en`/`es`) devolvidas pela API.
 * @param {string | null | undefined} languageInUse - Idioma ativo (`'BR'|'US'|'ES'`, `useLanguage()`).
 * @return {string} O texto na variante do idioma ativo, ou `pt` se ausente.
 */
function pickLocalizedField(
  fields: LocalizedTextFields,
  languageInUse: string | null | undefined
): string {
  if (languageInUse === 'US') return fields.en || fields.pt;
  if (languageInUse === 'ES') return fields.es || fields.pt;
  return fields.pt;
}

interface ProductSectionProps {
  data: PublicTraceabilityData;
  languageInUse: string | null | undefined;
  text: RastreioPublicoLanguage['product'];
}

export function ProductSection({ data, languageInUse, text }: ProductSectionProps) {
  const name = pickLocalizedField(
    { pt: data.name_pt, en: data.name_en, es: data.name_es },
    languageInUse
  );
  const description = pickLocalizedField(
    { pt: data.description_pt, en: data.description_en, es: data.description_es },
    languageInUse
  );

  const imageUrl = data.image
    ? resolveStorageUrl(`${TRACEABILITY_GALERY_DIRECTORY}/${data.image}`)
    : null;

  return (
    <VStack align="stretch" gap={4}>
      <ImageWithFallback src={imageUrl} alt={text.imageAlt} height={PRODUCT_IMAGE_HEIGHT} />

      <VStack align="stretch" gap={1}>
        <Text fontSize="2xl" fontWeight="bold">
          {name}
        </Text>
        {description && (
          <Text fontSize="sm" color="fg.muted">
            {description}
          </Text>
        )}
      </VStack>

      <Wrap gap={2}>
        <Badge variant="subtle" colorPalette="gray" px={3} py={1}>
          {text.trackingCodeLabel}: {data.tracking_code}
        </Badge>
        <Badge variant="subtle" colorPalette="gray" px={3} py={1}>
          {text.lotLabel}: {data.lot_number}
        </Badge>
        <Badge variant="subtle" colorPalette="gray" px={3} py={1}>
          {text.packingLabel}: {data.packing}
        </Badge>
      </Wrap>
    </VStack>
  );
}

export default ProductSection;
