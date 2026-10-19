// src/pages/Dashboards/CashbookDashboard/blocks/SaldoPorConta.tsx
// Bloco "Saldo por conta" (CV-05/06) — barra de participação % por conta,
// mirror `SaldoPorConta` da Referência UX (`DashLivroCaixa.tsx`), adaptado
// para Chakra v3 `Progress` (mesma técnica de `StatusDosAtivos.tsx`). `total`
// (movimentado no período) é o valor exibido — `balance` existe no payload
// mas NÃO é mostrado no card (mirror da omissão do legado, `CV-12`).

import { Flex, Progress, Text } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { CashbookAccountSummary } from '@/@types/v2/Dashboards/cashbookDashboard';

interface SaldoPorContaProps {
  data: CashbookAccountSummary[];
}

export function SaldoPorConta({ data }: SaldoPorContaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.cashbookDashboard.accounts;
  const commonText = languageGB.dashboards.common;

  return (
    <DashboardCard flex={2} title={text.title}>
      {data.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : (
        <Flex direction="column" gap="4">
          {data.map((account) => (
            <Flex key={account.uuid} direction="column" gap="1">
              <Flex justify="space-between" align="baseline">
                <Text fontSize="sm" color="cardTextPrimary" fontWeight="medium">
                  {account.description ?? account.bank ?? account.uuid}
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="cardTextPrimary">
                  {formatCurrencyBRL(account.total)}
                </Text>
              </Flex>
              {/* @ts-ignore - Chakra UI v3 compound type issue, mesmo padrão de StatusDosAtivos.tsx */}
              <Progress.Root
                value={account.share}
                max={100}
                colorPalette="green"
                size="sm"
                borderRadius="full"
              >
                {/* @ts-ignore - Chakra UI v3 compound type issue */}
                <Progress.Track borderRadius="full">
                  {/* @ts-ignore - Chakra UI v3 compound type issue */}
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
              <Text fontSize="xs" color="cardTextSecondary">
                {account.share}%
              </Text>
            </Flex>
          ))}
        </Flex>
      )}
    </DashboardCard>
  );
}
