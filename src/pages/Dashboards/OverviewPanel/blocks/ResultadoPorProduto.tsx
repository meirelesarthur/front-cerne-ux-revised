// src/pages/Dashboards/OverviewPanel/blocks/ResultadoPorProduto.tsx
// Bloco #13 — Resultado por PRODUTO (F-211, execução 062 — fix-up GAP-FE-251).
// `GAP-FE-251` RESOLVIDO: `GET /api/v1/dashboards/home/product-result`
// (TASK-F211-API-04) foi materializado no fork `GB.Cerne.Api`
// (`HomeProductResultDashboardController`/`GetHomeProductResultDashboardAction`,
// leitura direta do código, branch `feature/062-painel-controle`). Shape real
// (`{ products: [{ uuid, description, quantity_harvested, productivity,
// revenue, quantity_sold, average_price }], meta: { area_id,
// productive_area_hectares } }`) diverge do tipo provisório da Fase A —
// corrigido em `@/@types/v2/Dashboards/overviewPanel` nesta mesma entrega.
// DEC-284: a Action NUNCA monta custo/margem — nenhum campo desse tipo existe
// no shape, então nenhum vaza aqui.
//
// Escopo desta correção (dispatch explícito, "fix-up enxuto"): wiring real do
// bloco como lista compacta (mirror `ExcecoesSemana.tsx`/`CoberturaEstoque.tsx`
// desta mesma entrega), SEM o filtro completo Produto/Período/Área desenhado
// em `TASK-FE-211-06` (fica registrado como refinamento futuro, não um dado
// faltante) — o endpoint é chamado sem `area_id` (todas as áreas da fazenda
// ativa, default do próprio backend). `productivity=null` (sem área produtiva
// cadastrada) é um estado honesto — nunca "0"/divisão por zero inventada.
//
// Query/RBAC (`home_product_result_view`) e loading/error vivem em
// `OverviewPanel/index.tsx` (mirror dos outros blocos); este componente só
// resolve os 3 estados (loading/error/empty) sobre os dados já buscados —
// SEM MOCK, SEM fetch próprio.

import { Flex, Icon, Skeleton, Text, VStack, Button as ChakraButton } from '@chakra-ui/react';
import { FiAlertTriangle, FiBarChart2 } from 'react-icons/fi';

import { DashboardCard, CardInfoTooltip } from '@/components/Dashboard';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';

import type { OverviewPanelProductResultData } from '@/@types/v2/Dashboards/overviewPanel';

interface ResultadoPorProdutoProps {
  data?: OverviewPanelProductResultData;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function ResultadoPorProduto({
  data,
  isLoading,
  isError,
  onRetry,
}: ResultadoPorProdutoProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.dashboards.overviewPanel.productResult;
  const commonText = languageGB.dashboards.common;

  const products = data?.products ?? [];

  return (
    <DashboardCard
      minHeight="180px"
      title={text.title}
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
            <Icon as={FiBarChart2} boxSize={6} color="fg.muted" />
            <Text fontSize="sm" color="cardTextSecondary">
              {commonText.noData}
            </Text>
          </VStack>
        ) : (
          // Correção pós-entrega (exec. 062, regressão): teto de altura FIXO
          // (mesmo valor de `CoberturaEstoque.tsx`, mirror) — ver nota lá.
          <VStack align="stretch" gap="2" maxHeight="320px" overflowY="auto">
            {products.map((product) => (
              <Flex
                key={product.uuid}
                direction="column"
                gap="1"
                paddingBottom="2"
                borderBottomWidth="1px"
                borderColor="cardBorder"
                _last={{ borderBottomWidth: 0, paddingBottom: 0 }}
              >
                <Text fontSize="sm" fontWeight="semibold" color="cardTextPrimary" truncate>
                  {product.description}
                </Text>
                <Flex wrap="wrap" gap="4">
                  <Flex direction="column">
                    <Text fontSize="2xs" color="cardTextSecondary">
                      {text.columnQuantity}
                    </Text>
                    <Text fontSize="xs" fontWeight="medium" color="cardTextPrimary">
                      {product.quantity_harvested.toLocaleString('pt-BR', {
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text fontSize="2xs" color="cardTextSecondary">
                      {text.columnRevenue}
                    </Text>
                    <Text fontSize="xs" fontWeight="medium" color="cardTextPrimary">
                      {formatCurrencyBRL(product.revenue)}
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text fontSize="2xs" color="cardTextSecondary">
                      {text.columnAveragePrice}
                    </Text>
                    <Text fontSize="xs" fontWeight="medium" color="cardTextPrimary">
                      {product.average_price !== null
                        ? formatCurrencyBRL(product.average_price)
                        : commonText.noData}
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Text fontSize="2xs" color="cardTextSecondary">
                      {text.columnProductivity}
                    </Text>
                    <Text fontSize="xs" fontWeight="medium" color="cardTextPrimary">
                      {product.productivity !== null
                        ? product.productivity.toLocaleString('pt-BR', {
                            maximumFractionDigits: 2,
                          })
                        : text.productivityUnavailable}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            ))}
          </VStack>
        )}
      </Skeleton>
    </DashboardCard>
  );
}
