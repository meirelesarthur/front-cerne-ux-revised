// src/pages/Dashboards/OverviewPanel/blocks/ExcecoesSemana.tsx
// Bloco #12 — Exceções da semana (F-211, execução 062, Fase B). Mirror
// `OverviewPanel.tsx@ffe92bc L.1769-1785` (lista compacta, ponto colorido +
// rótulo + valor à direita) — SEM item "ordens de serviço" (DEC-284,
// `service_orders` vazia no legado). Fonte: `overview.exceptions` (união de
// 4 fontes já resolvida no backend — títulos vencendo, estoque abaixo do
// mínimo, DFe pendente, safra fechando em 7 dias, contrato de API §2.1).

import { Flex, Text } from '@chakra-ui/react';

import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import type { OverviewPanelExceptions } from '@/@types/v2/Dashboards/overviewPanel';

interface ExceptionRow {
  key: string;
  label: string;
  value?: string;
  tone: 'error' | 'warning' | 'info';
}

interface ExcecoesSemanaProps {
  data: OverviewPanelExceptions;
}

const TONE_COLOR: Record<ExceptionRow['tone'], string> = {
  error: 'feedBack.errorMain',
  warning: 'feedBack.warnMain',
  info: 'feedBack.infoMain',
};

export function ExcecoesSemana({ data }: ExcecoesSemanaProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.exceptions;
  const commonText = languageGB.dashboards.common;

  const rows: ExceptionRow[] = [
    ...data.due_soon_titles.map((title) => ({
      key: `title-${title.uuid}`,
      label: title.description ?? (title.type === 'income' ? text.incomeDue : text.expenseDue),
      value: `${formatCurrencyBRL(title.amount)} · ${formatDate(title.due_date, 'dd/MM/yyyy')}`,
      tone: 'warning' as const,
    })),
    ...data.low_stock_products.map((product) => ({
      key: `stock-${product.uuid}`,
      label: text.lowStockPrefix.replace('{product}', product.description),
      value: `${product.current_quantity}/${product.min_stock}`,
      tone: 'warning' as const,
    })),
    ...data.pending_dfe.map((dfe) => ({
      key: `dfe-${dfe.uuid}`,
      label: text.pendingDfePrefix.replace('{name}', dfe.razao_social),
      tone: 'info' as const,
    })),
    ...data.harvests_closing_soon.map((harvest) => ({
      key: `harvest-${harvest.uuid}`,
      label: text.harvestClosingPrefix.replace('{name}', harvest.description),
      value: formatDate(harvest.end_date, 'dd/MM/yyyy'),
      tone: 'info' as const,
    })),
  ];

  return (
    <DashboardCard
      flex={1}
      minWidth={300}
      title={text.title}
      action={<CardInfoTooltip content={text.tooltip} />}
    >
      {rows.length === 0 ? (
        <Text fontSize="sm" color="cardTextSecondary">
          {commonText.noData}
        </Text>
      ) : (
        rows.map((row) => (
          <Flex key={row.key} align="center" gap="2" marginBottom="1.5">
            <Flex
              boxSize="6px"
              borderRadius="full"
              flexShrink={0}
              background={TONE_COLOR[row.tone]}
              aria-hidden="true"
            />
            <Text flex="1" minWidth={0} fontSize="xs" color="cardTextSecondary" truncate>
              {row.label}
            </Text>
            {row.value && (
              <Text flexShrink={0} fontSize="xs" fontWeight="semibold" color="cardTextPrimary">
                {row.value}
              </Text>
            )}
          </Flex>
        ))
      )}
    </DashboardCard>
  );
}
