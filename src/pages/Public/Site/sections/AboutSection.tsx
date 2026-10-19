// src/pages/Public/Site/sections/AboutSection.tsx
// -----------------------------------------------------------------------------
// Seção "Quem Somos" da landing pública do Site (97-Esteiras/061,
// TASK-SITE-11, `05-CONTRATO-TELA-pagina-publica-site.md ## 1` linha 3 /
// `## 3` SUR-PUB-05/SUR-PUB-06).
//
// Ordem fiel ao legado (`agro365/resources/views/site/index.blade.php:179-
// 215`): logo da fazenda (`farm.logo_url`) → subtítulo "QUEM SOMOS" →
// `farm.description` (título) → `site.about` (HTML, SEMPRE via
// `RichTextContent` — reuso OBRIGATÓRIO, `## 7` do contrato de tela,
// PROIBIDO `dangerouslySetInnerHTML` direto neste arquivo) → ícones de redes
// sociais CONDICIONAIS (instagram/facebook/twitter/youtube, mirror
// `FaWhatsapp` já em uso em `Public/Rastreio/index.tsx`) — ícone OMITIDO
// (não desabilitado) quando o campo correspondente é `null`/vazio.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, HStack, Icon, Image, Link, Text, VStack } from '@chakra-ui/react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';

import { RichTextContent } from '@/components/RichTextEditor/RichTextContent';

import type { PublicSiteFarm } from '@/@types/v2/Site/publico';

import type { IconType } from 'react-icons';

const FARM_LOGO_HEIGHT = '96px';

interface SocialLink {
  key: 'instagram' | 'facebook' | 'twitter' | 'youtube';
  url: string | null;
  icon: IconType;
  label: string;
}

interface AboutSectionProps {
  farm: PublicSiteFarm;
  about: string;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  youtube: string | null;
  sectionTitle: string;
}

export function AboutSection({
  farm,
  about,
  instagram,
  facebook,
  twitter,
  youtube,
  sectionTitle,
}: AboutSectionProps) {
  // Logo com 403/arquivo ausente no storage não é bug nosso, mas não pode
  // aparecer quebrado — `onError` oculta o elemento por completo
  // (97-Esteiras/061, fix de runtime).
  const [logoFailed, setLogoFailed] = useState(false);

  const socials: SocialLink[] = [
    { key: 'instagram', url: instagram, icon: FaInstagram, label: 'Instagram' },
    { key: 'facebook', url: facebook, icon: FaFacebook, label: 'Facebook' },
    { key: 'twitter', url: twitter, icon: FaTwitter, label: 'Twitter' },
    { key: 'youtube', url: youtube, icon: FaYoutube, label: 'Youtube' },
  ];

  return (
    <VStack as="section" align="center" gap={4} textAlign="center" w="full">
      {farm.logo_url && !logoFailed && (
        <Image
          src={farm.logo_url}
          alt={farm.description || 'Logo da fazenda'}
          h={FARM_LOGO_HEIGHT}
          w="auto"
          maxW="100%"
          objectFit="contain"
          onError={() => setLogoFailed(true)}
        />
      )}

      <Text
        fontSize="sm"
        fontWeight="bold"
        letterSpacing="wide"
        color="fg.muted"
        textTransform="uppercase"
      >
        {sectionTitle}
      </Text>

      {farm.description && (
        <Text fontSize="xl" fontWeight="semibold" color="fg.default">
          {farm.description}
        </Text>
      )}

      <Box maxW="800px" w="full" textAlign="left">
        <RichTextContent html={about} />
      </Box>

      <HStack gap={4}>
        {socials.map(
          ({ key, url, icon, label }) =>
            url && (
              <Link
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                display="inline-flex"
              >
                <Icon as={icon} boxSize={6} color="fg.muted" _hover={{ color: 'fg.default' }} />
              </Link>
            )
        )}
      </HStack>
    </VStack>
  );
}

export default AboutSection;
