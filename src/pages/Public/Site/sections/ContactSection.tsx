// src/pages/Public/Site/sections/ContactSection.tsx
// -----------------------------------------------------------------------------
// Seção "Contato" da landing pública do Site (97-Esteiras/061, TASK-SITE-13,
// `05-CONTRATO-TELA-pagina-publica-site.md ## 1` linha 5 / `## 3`
// SUR-PUB-10), mirror do bloco de texto centralizado
// `agro365/resources/views/site/index.blade.php:256-281`.
//
// Rótulo CPF×CNPJ decidido pelo TAMANHO de `farm.nif` (mirror `CL-27` de
// F-067, `strlen === 14` → CNPJ). O legado tinha esse rótulo TROCADO (bug:
// `strlen == 14` renderizava "CPF:") — aqui o rótulo é o CORRETO
// (14 dígitos = CNPJ, senão CPF), sem replicar o bug do legado (decisão
// "resolver gap: recomendado + legado sem bug").
//
// Cada campo é OMITIDO (não desabilitado) quando ausente/`null` — mesmo
// padrão dos ícones de rede social em `AboutSection.tsx`. `latitude`/
// `longitude` só renderizam juntos (linha única "lat, lng"), fiel ao legado.
// `city` é OBJETO (`PublicSiteCityRef | null`, divergência do contrato real
// vs. o provisório) — renderiza `city.title` + UF quando `state` existir.
//
// `farm.nif` é `string | null` (observado `null` em produção, 97-Esteiras/
// 061 fix de runtime) — a linha de CPF/CNPJ é OMITIDA por completo quando
// `nif` é `null`/vazio, mirror `strlen(null) === 0` do legado; NUNCA acessa
// `.length` direto em `farm.nif` (guard obrigatório antes do cálculo do
// rótulo).
// -----------------------------------------------------------------------------

import { VStack, Text } from '@chakra-ui/react';

import type { PublicSiteFarm } from '@/@types/v2/Site/publico';

const CNPJ_NIF_LENGTH = 14;

interface ContactSectionText {
  sectionTitle: string;
  cpfLabel: string;
  cnpjLabel: string;
  emailLabel: string;
  phoneLabel: string;
  coordinatesLabel: string;
  cityLabel: string;
}

interface ContactSectionProps {
  farm: PublicSiteFarm;
  text: ContactSectionText;
}

function ContactRow({ label, value }: { label?: string; value: string }) {
  return (
    <Text fontSize="md" fontWeight="medium" color="fg.default" textAlign="center">
      {label ? `${label}: ${value}` : value}
    </Text>
  );
}

export function ContactSection({ farm, text }: ContactSectionProps) {
  const nifLabel = farm.nif && farm.nif.length === CNPJ_NIF_LENGTH ? text.cnpjLabel : text.cpfLabel;
  const hasCoordinates = Boolean(farm.latitude && farm.longitude);
  const cityLine = farm.city
    ? farm.city.state
      ? `${farm.city.title} - ${farm.city.state.letter}`
      : farm.city.title
    : null;

  return (
    <VStack as="section" align="center" justify="center" gap={3} w="full" h="full" py={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={2} textAlign="center" color="fg.default">
        {text.sectionTitle}
      </Text>

      {farm.nif && <ContactRow label={nifLabel} value={farm.nif} />}
      {farm.email && <ContactRow label={text.emailLabel} value={farm.email} />}
      {farm.phone && <ContactRow label={text.phoneLabel} value={farm.phone} />}

      {hasCoordinates && (
        <VStack gap={0} mt={2}>
          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            {text.coordinatesLabel}
          </Text>
          <ContactRow value={`${farm.latitude}, ${farm.longitude}`} />
        </VStack>
      )}

      {cityLine && <ContactRow label={text.cityLabel} value={cityLine} />}
    </VStack>
  );
}

export default ContactSection;
