// src/pages/Public/RequestQuotation/RequestQuotationPublicIntro.tsx
// -----------------------------------------------------------------------------
// Introdução do formulário público: RESUMO da solicitação (cartões em grade) e
// faixa "como preencher" em 3 passos. Só apresentação — os dados vêm do `GET`
// (`PublicRequestQuotationData`), nada é calculado nem enviado daqui.
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';

import { Icon, type IconName } from '@/components/ui/Icon';

import { useLanguage } from '@/hooks/useLanguage';

import type { PublicRequestQuotationData } from '@/@types/v2/RequestQuotations';

function SummaryTile({
  icon,
  label,
  value,
  gridColumn,
}: {
  icon: IconName;
  label: string;
  value: string;
  gridColumn?: Record<string, string> | string;
}) {
  return (
    <Flex
      gap={3}
      align="flex-start"
      p={3}
      bg="cardBG"
      borderWidth="1px"
      borderColor="cardBorder"
      borderRadius="lg"
      gridColumn={gridColumn}
      minW={0}
    >
      <Flex
        display={{ base: 'none', sm: 'flex' }}
        align="center"
        justify="center"
        boxSize="34px"
        flexShrink={0}
        borderRadius="md"
        bg="selectedBG"
        color="feedBack.successMain"
      >
        <Icon name={icon} size="md" />
      </Flex>
      <Box minW={0}>
        <Text fontSize="xs" fontWeight="semibold" color="cardTextSecondary" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="md" fontWeight="semibold" color="cardTextPrimary" wordBreak="break-word">
          {value}
        </Text>
      </Box>
    </Flex>
  );
}

export function RequestQuotationPublicSummary({
  quotation,
}: {
  quotation: PublicRequestQuotationData;
}) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm.summary;
  const purchase = quotation.request_purchase;

  return (
    <Box as="section" aria-label={text.title}>
      <Text as="h2" fontSize="md" fontWeight="semibold" color="cardTextPrimary" mb={3}>
        {text.title}
      </Text>
      <SimpleGrid columns={{ base: 2, lg: 3 }} gap={3}>
        {purchase && <SummaryTile icon="hash" label={text.request} value={purchase.code} />}
        {quotation.farm && (
          <SummaryTile icon="home" label={text.farm} value={quotation.farm.description} />
        )}
        {quotation.provider && (
          <SummaryTile
            icon="building"
            label={text.provider}
            value={quotation.provider.name}
            gridColumn={{ base: '1 / -1', lg: 'span 1' }}
          />
        )}
        {purchase && (
          <SummaryTile
            icon="document"
            label={text.description}
            value={purchase.description}
            gridColumn="1 / -1"
          />
        )}
      </SimpleGrid>

      {quotation.note && (
        <Flex
          mt={3}
          gap={3}
          align="flex-start"
          p={4}
          bg="feedBack.warn"
          borderWidth="1px"
          borderColor="feedBack.warnMain"
          borderRadius="lg"
          color="cardTextPrimary"
        >
          <Box color="feedBack.warnMain" mt="2px">
            <Icon name="message" size="md" />
          </Box>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="semibold">
              {text.buyerNote}
            </Text>
            <Text fontSize="md" whiteSpace="pre-wrap" wordBreak="break-word">
              {quotation.note}
            </Text>
          </Box>
        </Flex>
      )}
    </Box>
  );
}

export function RequestQuotationPublicHowTo() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm.howTo;
  const steps = [text.step1, text.step2, text.step3];

  return (
    <Box as="section" aria-label={text.title} bg="bg.muted" borderRadius="lg" p={4}>
      <Text as="h2" fontSize="md" fontWeight="semibold" color="cardTextPrimary" mb={3}>
        {text.title}
      </Text>
      <SimpleGrid as="ol" columns={{ base: 1, sm: 3 }} gap={3} m={0} p={0}>
        {steps.map((step, index) => (
          <Flex as="li" key={step.title} gap={3} align="flex-start" listStyleType="none">
            <Flex
              align="center"
              justify="center"
              boxSize="28px"
              flexShrink={0}
              borderRadius="full"
              bg="feedBack.successMain"
              color="white"
              fontSize="sm"
              fontWeight="bold"
              aria-hidden="true"
            >
              {index + 1}
            </Flex>
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary">
                {step.title}
              </Text>
              <Text fontSize="sm" color="cardTextSecondary">
                {step.text}
              </Text>
            </Box>
          </Flex>
        ))}
      </SimpleGrid>
    </Box>
  );
}
