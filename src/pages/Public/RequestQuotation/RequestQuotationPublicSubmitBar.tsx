// src/pages/Public/RequestQuotation/RequestQuotationPublicSubmitBar.tsx
// -----------------------------------------------------------------------------
// Barra de envio do formulário público: total geral em destaque (anunciado a
// leitor de tela por `aria-live`), "N de M itens preenchidos" e o botão Enviar.
// Fica FIXA no rodapé enquanto o formulário está à vista (`position: sticky`).
// Só apresentação — o total vem pronto de `publicQuotationTotals`.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { Icon } from '@/components/ui/Icon';

import { useLanguage } from '@/hooks/useLanguage';

import { formatCurrency } from './publicQuotationProgress';

export interface RequestQuotationPublicSubmitBarProps {
  total: number;
  filled: number;
  count: number;
  isSubmitting: boolean;
  /** Mensagem de erro do total (ex.: "O valor deve ser maior que zero"). */
  totalError?: string;
}

export function RequestQuotationPublicSubmitBar({
  total,
  filled,
  count,
  isSubmitting,
  totalError,
}: RequestQuotationPublicSubmitBarProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;
  const complete = count > 0 && filled === count;
  const progress = text.submitBar.itemsProgress
    .replace('{filled}', String(filled))
    .replace('{total}', String(count));
  const hintId = 'public-quotation-submit-hint';

  return (
    <Box
      position="sticky"
      bottom={0}
      zIndex={10}
      mx={{ base: -4, md: -8 }}
      px={{ base: 4, md: 8 }}
      py={3}
      bg="cardBG"
      borderTopWidth="1px"
      borderColor="cardBorder"
      boxShadow="cardShadow"
    >
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'stretch', md: 'center' }}
        justify="space-between"
        gap={3}
      >
        <Flex align="center" justify="space-between" gap={4} minW={0}>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="cardTextSecondary" textTransform="uppercase">
              {text.submitBar.totalLabel}
            </Text>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="cardTextPrimary"
              lineHeight="1.2"
              aria-live="polite"
              aria-atomic="true"
              css={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCurrency(total)}
            </Text>
          </Box>
          <Flex
            align="center"
            gap={1}
            fontSize="sm"
            fontWeight="medium"
            color={complete ? 'feedBack.successMain' : 'cardTextSecondary'}
            aria-live="polite"
          >
            <Icon name={complete ? 'check-circle' : 'clock'} size="sm" />
            <Text as="span" fontSize="inherit">
              {progress}
            </Text>
          </Flex>
        </Flex>

        <Box>
          <Button
            title={text.submitButton}
            type="submit"
            size="lg"
            w={{ base: 'full', md: 'auto' }}
            minW={{ md: '220px' }}
            loading={isSubmitting}
            disabled={isSubmitting || !complete}
            aria-describedby={hintId}
          />
        </Box>
      </Flex>

      <Text
        id={hintId}
        mt={2}
        fontSize="sm"
        color={totalError ? 'feedBack.errorMain' : 'cardTextSecondary'}
        role={totalError ? 'alert' : undefined}
      >
        {totalError ?? (complete ? text.submitBar.ready : text.submitBar.missingPrice)}
      </Text>
    </Box>
  );
}
