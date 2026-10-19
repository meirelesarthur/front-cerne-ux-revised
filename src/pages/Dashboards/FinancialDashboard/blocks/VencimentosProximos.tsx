// src/pages/Dashboards/FinancialDashboard/blocks/VencimentosProximos.tsx
// Bloco "Vencimentos próximos (30 dias)" (`S-BLOCK-07`, bloco NOVO — sem
// equivalente ativo no legado-alvo, backend novo agrega) — lista local
// não-paginada.

import { Badge, Flex, Text } from '@chakra-ui/react';

import { DashboardCard } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { FinancialDueSoonRow } from '@/@types/v2/Dashboards/financialDashboard';

interface VencimentosProximosProps {
  data: FinancialDueSoonRow[];
}

export function VencimentosProximos({ data }: VencimentosProximosProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.financialDashboard.dueSoon;
  const overdueText = languageGB.dashboards.financialDashboard.overdue;
  const commonText = languageGB.dashboards.common;

  return (
    <DashboardCard flex={3} minWidth={340} title={text.title}>
      {data.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.empty.title}
        </Text>
      ) : (
        <Flex direction="column" gap="1">
          {data.map((item) => (
            <Flex key={item.uuid} justify="space-between" align="center" paddingY="2">
              <Flex direction="column">
                <Text fontSize="sm" fontWeight="medium" color="cardTextPrimary">
                  {item.description ?? text.noDescription}
                </Text>
                <Text fontSize="xs" color="cardTextSecondary">
                  {item.due_date}
                </Text>
              </Flex>
              <Flex align="center" gap="2">
                <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary">
                  {formatCurrencyBRL(item.amount)}
                </Text>
                <Badge colorPalette={item.type === 'income' ? 'green' : 'red'}>
                  {item.type === 'income' ? overdueText.typeIncome : overdueText.typeExpense}
                </Badge>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}
    </DashboardCard>
  );
}
