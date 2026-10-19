// src/pages/Dashboards/OverviewPanel/blocks/CoberturaEstoque.tsx
// Bloco #10 — Cobertura de estoque (F-211, execução 062 — fix-up GAP-FE-251).
// `GAP-FE-251` RESOLVIDO: `GET /api/v1/dashboards/home/stock-coverage`
// (TASK-F211-API-03) foi materializado no fork `GB.Cerne.Api`
// (`HomeStockCoverageDashboardController`/`GetHomeStockCoverageDashboardAction`,
// leitura direta do código, branch `feature/062-painel-controle`). Shape real
// (`{ products: [{ uuid, description, current_quantity, min_stock,
// is_below_minimum, coverage_days }], meta: { consumption_window_days } }`)
// diverge do tipo provisório da Fase A — corrigido em
// `@/@types/v2/Dashboards/overviewPanel` nesta mesma entrega.
//
// Escopo desta correção (dispatch explícito, "fix-up enxuto"): wiring real do
// bloco no MESMO formato visual dos demais blocos de lista (mirror
// `ExcecoesSemana.tsx` — ponto colorido + rótulo + valor à direita), SEM a
// barra com marcador de mínimo desenhada em `TASK-FE-211-04` (fica registrado
// como possível refinamento visual futuro, não um dado faltante). `coverage_
// days=null` (sem consumo na janela de 90 dias, `meta.consumption_window_
// days`) é um estado honesto — nunca "0 dias"/divisão por zero inventada.
//
// Query/RBAC (`home_stock_dashboard_view`) e loading/error vivem em
// `OverviewPanel/index.tsx` (mirror dos outros blocos); este componente só
// resolve os 3 estados (loading/error/empty) sobre os dados já buscados —
// SEM MOCK, SEM fetch próprio.

import { Flex, Icon, Skeleton, Text, VStack, Button as ChakraButton } from '@chakra-ui/react';
import { FiAlertTriangle, FiPackage } from 'react-icons/fi';

import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import type { OverviewPanelStockCoverageData } from '@/@types/v2/Dashboards/overviewPanel';

interface CoberturaEstoqueProps {
  data?: OverviewPanelStockCoverageData;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function CoberturaEstoque({ data, isLoading, isError, onRetry }: CoberturaEstoqueProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.stockCoverage;
  const commonText = languageGB.dashboards.common;

  const products = data?.products ?? [];

  return (
    <DashboardCard
      flex={1}
      minWidth={280}
      title={text.title}
      minHeight="180px"
      action={<CardInfoTooltip content={text.tooltip} />}
    >
      <Skeleton loading={isLoading} display="flex" flexDirection="column" flex="1" minHeight={0}>
        {isError ? (
          <VStack align="center" justify="center" height="full" gap="2" textAlign="center">
            <Icon as={FiAlertTriangle} boxSize={6} color="feedBack.errorMain" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.error.description}
            </Text>
            <ChakraButton size="sm" onClick={onRetry}>
              {commonText.error.retry}
            </ChakraButton>
          </VStack>
        ) : products.length === 0 ? (
          <VStack align="center" justify="center" height="full" gap="2" textAlign="center">
            <Icon as={FiPackage} boxSize={6} color="fg.muted" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.noData}
            </Text>
          </VStack>
        ) : (
          // Correção pós-entrega (exec. 062, regressão): a lista precisa de um
          // teto de altura FIXO (idêntico ao de `ResultadoPorProduto.tsx`) —
          // `flex="1"` sozinho, sem bound do lado da `DashboardRow`/página,
          // cresce para caber TODOS os itens e o `overflowY="auto"` nunca
          // dispara (card gigante). `align="stretch"` na `DashboardRow` (ver
          // `OverviewPanel/index.tsx`) segue igualando a altura dos 2 cards.
          <VStack align="stretch" gap="1.5" maxHeight="320px" overflowY="auto">
            {products.map((product) => (
              <Flex key={product.uuid} align="center" gap="2">
                <Flex
                  boxSize="6px"
                  borderRadius="full"
                  flexShrink={0}
                  background={
                    product.is_below_minimum ? 'feedBack.errorMain' : 'feedBack.successMain'
                  }
                  aria-hidden="true"
                />
                <Text flex="1" minWidth={0} fontSize="xs" color="cardTextSecondary" truncate>
                  {product.description}
                </Text>
                <Text
                  flexShrink={0}
                  fontSize="xs"
                  fontWeight="semibold"
                  color={product.is_below_minimum ? 'feedBack.errorMain' : 'cardTextPrimary'}
                >
                  {product.current_quantity.toLocaleString('pt-BR', {
                    maximumFractionDigits: 2,
                  })}
                  {product.min_stock !== null
                    ? ` / ${product.min_stock.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`
                    : ''}
                </Text>
                <Text
                  flexShrink={0}
                  fontSize="xs"
                  color="cardTextSecondary"
                  minWidth="72px"
                  textAlign="right"
                >
                  {product.coverage_days !== null
                    ? text.coverageDaysLabel.replace(
                        '{value}',
                        product.coverage_days.toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })
                      )
                    : text.coverageDaysUnavailable}
                </Text>
              </Flex>
            ))}
          </VStack>
        )}
      </Skeleton>
    </DashboardCard>
  );
}
