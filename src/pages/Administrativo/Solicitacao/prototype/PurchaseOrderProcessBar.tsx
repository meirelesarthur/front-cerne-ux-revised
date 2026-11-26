// src/pages/Administrativo/Solicitacao/prototype/PurchaseOrderProcessBar.tsx
// -----------------------------------------------------------------------------
// PROTÓTIPO (só com `PURCHASE_ORDER_PROTOTYPE`) — faixa do topo da Ordem de
// SOLICITAÇÃO: as ETAPAS do processo (`StepTrack`, regra em
// `purchaseOrderSteps.ts`; as que o perfil de fluxo pula não aparecem) e, à
// direita, COMPRADOR e quantas ORDENS de compra a Solicitação já gerou.
// 26/11: Fornecedor e Previsão de entrega saíram daqui — são da Ordem (uma por
// fornecedor, tela própria). `flow_profile` e `buyer` ainda não existem na API:
// vêm dos dados de demonstração (`mocks/dev-api/handlers/purchaseOrdersDemo.ts`).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';

import { StepTrack, type StepTrackItem } from '@/components/ui/StepTrack';

import { useLanguage } from '@/hooks/useLanguage';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';

import { purchaseOrderSteps } from './purchaseOrderSteps';
import type { PurchaseOrderPrototypeFields } from './prototypeFields';

interface PurchaseOrderProcessBarProps {
  data: RequestPurchaseData & PurchaseOrderPrototypeFields;
  /** Sem uso desde 26/11 (a previsão é da Ordem); mantido para não mudar quem chama. */
  canChangeForecast?: boolean;
}

function PartyLabel({ children }: { children: string }) {
  return (
    <Text fontSize="xs" color="fg.muted" fontWeight="medium" textTransform="uppercase" letterSpacing="0.05em">
      {children}
    </Text>
  );
}

function Party({ label, value, empty }: { label: string; value?: string | null; empty: string }) {
  return (
    <Box minW={0}>
      <PartyLabel>{label}</PartyLabel>
      <Text
        fontSize="base"
        fontWeight={value ? 'semibold' : 'medium'}
        color={value ? 'strongText' : 'fg.muted'}
        lineClamp="1"
        title={value ?? undefined}
      >
        {value || empty}
      </Text>
    </Box>
  );
}

export function PurchaseOrderProcessBar({ data }: PurchaseOrderProcessBarProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form.statusBar;
  const ordersText = languageGB.requestPurchases.requestPurchase.form.prototype.links;
  const profile = data.flow_profile ?? 'padrao';
  const ordersCount = (data.generated_orders ?? []).length;

  // Etapa que o perfil não tem NÃO aparece (decisão do dono, 25/11): nada de
  // etapa riscada; a numeração conta só as que existem.
  const items: StepTrackItem[] = purchaseOrderSteps(data.status, profile, data.cancelled_at_step)
    .filter((step) => step.state !== 'skipped')
    .map((step) => ({
      key: step.key,
      label: text.steps[step.key],
      state: step.state,
    }));

  return (
    <Flex
      gap={6}
      align="center"
      wrap={{ base: 'wrap', lg: 'nowrap' }}
      mb={6}
      px={5}
      py={4}
      borderWidth="1px"
      borderColor="semanticNeutral.200"
      borderRadius="xl"
      bg="cardBG"
    >
      <Box flex="1" minW="420px">
        <StepTrack items={items} ariaLabel={text.stepsAriaLabel} />
      </Box>
      <Flex
        gap={6}
        flexShrink={0}
        pl={{ base: 0, lg: 6 }}
        borderLeftWidth={{ base: 0, lg: '1px' }}
        borderColor="semanticNeutral.200"
        w={{ base: 'full', lg: 'auto' }}
        maxW={{ lg: '560px' }}
      >
        {/* 26/11: Fornecedor e Previsão de entrega são da ORDEM (uma por fornecedor);
            a Solicitação mostra o comprador e quantas ordens já gerou. */}
        <Party label={text.buyer} value={data.buyer?.name} empty={text.notDefined} />
        <Party
          label={ordersText.ordersTitle}
          value={ordersCount ? String(ordersCount) : undefined}
          empty={ordersText.noneShort}
        />
      </Flex>
    </Flex>
  );
}
