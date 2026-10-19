// src/components/Branding/ReportCoverPreview.tsx
// Pré-visualização ao vivo da capa do relatório (página 1 do PDF), fiel ao protótipo
// aleex-melhorias: fundo escuro tingido pela cor primária da marca, formas geométricas
// decorativas, badge, título do alvo, período e rodapé com a marca (logo + nome + site
// + texto de rodapé) e o selo "gb cerne".
//
// Cores/logo vêm do formulário (valores dinâmicos escolhidos pelo usuário) → usamos
// `style` inline apenas para esses valores de runtime; o restante é layout (Chakra).

import { Box, Flex, Image, Text } from "@chakra-ui/react";

import { useLanguage } from "@/hooks/useLanguage";

export interface BrandingPreviewValues {
  company_name?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  text_color?: string | null;
  website?: string | null;
  footer_text?: string | null;
  /** URL/dataURL do logo principal (para o rodapé da capa). */
  primaryLogoUrl?: string | null;
}

export function ReportCoverPreview({ values }: { values: BrandingPreviewValues }) {
  const { languageGB } = useLanguage();

  const primary = values.primary_color || "#232366";
  const text = values.text_color || "#ffffff";
  const muted = "rgba(255,255,255,0.72)";
  const accent = values.accent_color || primary;

  const bg =
    `linear-gradient(157deg,` +
    ` color-mix(in oklab, ${primary} 46%, #1e1e4e) 0%,` +
    ` color-mix(in oklab, ${primary} 30%, #181840) 55%,` +
    ` color-mix(in oklab, ${primary} 20%, #121234) 100%)`;

  const company = values.company_name?.trim() || "Aleex AI LLC";

  return (
    <Box
      style={{ background: bg, color: text }}
      borderRadius="lg"
      overflow="hidden"
      position="relative"
      w="100%"
      // No desktop a capa preenche a altura do painel (rodapés alinhados); no mobile
      // (empilhado) mantém a proporção A4.
      h={{ base: "auto", lg: "100%" }}
      flex={{ lg: "1" }}
      minH={{ base: "auto", lg: 0 }}
      aspectRatio={{ base: "0.707", lg: "auto" }}
      boxShadow="lg"
    >
      {/* Formas decorativas */}
      <svg
        viewBox="0 0 420 594"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <circle cx="402" cy="148" r="162" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1.4" />
        <rect x="300" y="44" width="130" height="130" rx="24" transform="rotate(45 365 109)" fill="#ffffff" fillOpacity="0.06" />
        <circle cx="6" cy="492" r="150" fill="#ffffff" fillOpacity="0.04" />
      </svg>

      <Flex direction="column" h="100%" position="relative" p={{ base: 4, md: 6 }}>
        {/* Corpo */}
        <Box>
          <Text
            display="inline-block"
            fontSize="2xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="wider"
            px={2}
            py={1}
            borderRadius="md"
            style={{ background: `color-mix(in oklab, ${accent} 32%, transparent)` }}
          >
            {languageGB.common.branding.previewBadge}
          </Text>
          <Text fontSize={{ base: "xl", md: "3xl" }} fontWeight="bold" mt={3} lineHeight="1.1">
            {languageGB.common.branding.previewTitlePlaceholder}
          </Text>
          <Flex direction="column" mt={2} style={{ color: muted }} fontSize="xs">
            <span>2026-06-24 — 2026-06-24</span>
            <span>19:49:08</span>
          </Flex>
        </Box>

        {/* Rodapé (marca) */}
        <Flex mt="auto" align="flex-end" justify="space-between" gap={3}>
          <Box minW={0}>
            <Flex align="center" gap={2}>
              {values.primaryLogoUrl ? (
                <Image
                  src={values.primaryLogoUrl}
                  alt={company}
                  maxH="28px"
                  maxW="120px"
                  objectFit="contain"
                />
              ) : (
                <Text fontWeight="bold" fontSize="sm" lineClamp="1">
                  {company}
                </Text>
              )}
              {values.primaryLogoUrl && (
                <>
                  <Text style={{ color: muted }}>|</Text>
                  <Text fontSize="sm" lineClamp="1">
                    {company}
                  </Text>
                </>
              )}
            </Flex>
            {values.website?.trim() && (
              <Text fontSize="2xs" style={{ color: muted }} mt={0.5} lineClamp="1">
                {values.website}
              </Text>
            )}
            {values.footer_text?.trim() && (
              <Text fontSize="2xs" style={{ color: muted }} mt={0.5} lineClamp="1">
                {values.footer_text}
              </Text>
            )}
          </Box>

          {/* Selo do produto */}
          <Flex align="center" gap={1} flexShrink={0} fontSize="xs" fontWeight="semibold" style={{ color: muted }}>
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="3.4" transform="rotate(45 12 12)" fill="#cfe0ff" />
              <rect x="10.1" y="9.4" width="1.5" height="4.3" rx="0.75" fill="#16164d" />
              <rect x="12.5" y="9.4" width="1.5" height="4.3" rx="0.75" fill="#16164d" />
            </svg>
            gb cerne
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

export default ReportCoverPreview;
