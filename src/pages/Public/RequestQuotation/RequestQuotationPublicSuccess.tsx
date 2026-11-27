// src/pages/Public/RequestQuotation/RequestQuotationPublicSuccess.tsx
// -----------------------------------------------------------------------------
// Cartão de confirmação do formulário público: usado logo depois de enviar
// (`total` conhecido) e quando a cotação já tinha sido enviada antes (`already`).
// Só apresentação — quem decide qual estado mostrar é `index.tsx`.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';

import { Icon } from '@/components/ui/Icon';

import { useLanguage } from '@/hooks/useLanguage';

import { formatCurrency } from './publicQuotationProgress';

export interface RequestQuotationPublicSuccessProps {
  /** `true` quando a cotação já tinha sido enviada antes (sem total para mostrar). */
  already?: boolean;
  /** Total enviado agora (só logo depois do envio). */
  total?: number;
  /** Quantos itens foram enviados como "sem estoque" (27/11): fica explícito na devolução. */
  unavailable?: number;
}

export function RequestQuotationPublicSuccess({
  already = false,
  total,
  unavailable = 0,
}: RequestQuotationPublicSuccessProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm.successState;

  return (
    <Flex direction="column" align="center" textAlign="center" gap={4} py={{ base: 6, md: 10 }}>
      <Flex
        align="center"
        justify="center"
        boxSize="64px"
        borderRadius="full"
        bg="feedBack.success"
        color="feedBack.successMain"
      >
        <Icon name="success" size={34} />
      </Flex>

      <Box role="status" aria-live="polite">
        <Text as="h2" fontSize="xl" fontWeight="bold" color="cardTextPrimary">
          {already ? text.alreadyTitle : text.title}
        </Text>
        <Text fontSize="md" color="cardTextSecondary" mt={1} maxW="460px">
          {already ? text.alreadyDescription : text.description}
        </Text>
      </Box>

      {!already && typeof total === 'number' && (
        <Box
          px={6}
          py={3}
          bg="bg.muted"
          borderWidth="1px"
          borderColor="cardBorder"
          borderRadius="lg"
        >
          <Text fontSize="xs" fontWeight="semibold" color="cardTextSecondary" textTransform="uppercase">
            {text.totalLabel}
          </Text>
          <Text fontSize="xl" fontWeight="bold" color="cardTextPrimary">
            {formatCurrency(total)}
          </Text>
        </Box>
      )}

      {!already && unavailable > 0 && (
        <Flex align="center" gap={2} color="cardTextSecondary" fontSize="sm" fontWeight="medium">
          <Icon name="warning" size="sm" />
          <Text as="span" fontSize="inherit">
            {text.unavailableNote.replace('{n}', String(unavailable))}
          </Text>
        </Flex>
      )}

      {!already && (
        <Flex align="center" gap={2} color="feedBack.successMain" fontSize="md" fontWeight="medium">
          <Icon name="bell" size="md" />
          <Text as="span" fontSize="inherit">
            {text.notifiedNote}
          </Text>
        </Flex>
      )}

      <Text fontSize="sm" color="cardTextSecondary">
        {text.closeHint}
      </Text>
    </Flex>
  );
}
