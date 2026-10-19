// src/pages/Public/Rastreio/sections/ProducerCard.tsx
// -----------------------------------------------------------------------------
// Seção `## 4.10` do contrato de tela (F-067, `97-Esteiras/058`,
// TASK-TR-PUB-FE-03): Produtor/Configuração (`FD-15..20,23,24`) — nome,
// documento com rótulo condicional CPF/CNPJ (`CL-27`), endereço+número,
// telefone, e-mail, fazenda, cidade+UF (bloco omitido se `city` ausente,
// mirror `CONTRATO-DESTINO ## 5`), logo (fallback tratado, mirror `## 4.4`).
// -----------------------------------------------------------------------------

import { Box, Grid, Text, VStack } from '@chakra-ui/react';

import { docTypeOfDigits, normalizeDocument } from '@/utils/cpfCnpj';
import formatDocument from '@/utils/format-document';
import formatPhone from '@/utils/format-phone';
import { resolveStorageUrl } from '@/utils/resolveStorageUrl';

import type { RastreioPublicoLanguage } from '@/@types/language/module-rastreabilidade/rastreio-publico';
import type { PublicTraceabilityConfig } from '@/@types/v2/Rastreabilidade/rastreio-publico';

import { ImageWithFallback } from '../ImageWithFallback';

const PRODUCER_LOGO_SIZE = { base: '96px', md: '96px' };

interface ProducerCardProps {
  config: PublicTraceabilityConfig;
  text: RastreioPublicoLanguage['producer'];
}

function ProducerField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="sm">{value}</Text>
    </Box>
  );
}

export function ProducerCard({ config, text }: ProducerCardProps) {
  // Rótulo CPF×CNPJ pelo tamanho do documento CRU — `strlen==14` do legado
  // (`CL-27`), agora via `docTypeOfDigits` (núcleo FE-06): conta `[0-9A-Z]`,
  // então CNPJ alfanumérico é rotulado corretamente.
  const documentDigits = normalizeDocument(config.cpf_cnpj);
  const isCnpj = docTypeOfDigits(config.cpf_cnpj) === 'cnpj';
  const documentLabel = isCnpj ? text.cnpjLabel : text.cpfLabel;

  const logoUrl = resolveStorageUrl(config.logo);

  return (
    <Box border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4} bg="bg.subtle">
      <VStack align="stretch" gap={4}>
        <Text fontSize="lg" fontWeight="semibold">
          {text.title}
        </Text>

        <Grid templateColumns={{ base: '1fr', md: '96px 1fr' }} gap={4}>
          <Box w={PRODUCER_LOGO_SIZE.base}>
            <ImageWithFallback
              src={logoUrl}
              alt={text.logoAlt}
              height={PRODUCER_LOGO_SIZE}
              borderRadius="md"
            />
          </Box>

          <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={3}>
            <ProducerField label={text.nameLabel} value={config.name} />
            <ProducerField label={documentLabel} value={formatDocument(documentDigits)} />
            <ProducerField
              label={text.addressLabel}
              value={[config.address, config.number].filter(Boolean).join(', ')}
            />
            <ProducerField label={text.farmLabel} value={config.farm.description} />
            <ProducerField label={text.phoneLabel} value={formatPhone(config.phone)} />
            <ProducerField label={text.emailLabel} value={config.email} />
            {config.city && (
              <ProducerField
                label={text.cityLabel}
                value={
                  config.city.state
                    ? `${config.city.title}/${config.city.state.letter}`
                    : config.city.title
                }
              />
            )}
          </Grid>
        </Grid>
      </VStack>
    </Box>
  );
}

export default ProducerCard;
