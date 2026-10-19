// src/pages/Administrativo/SaldoEstoque/SaldoEstoqueDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE AGRUPADO (somente leitura) de SALDO DE ESTOQUE (Stock,
// TASK-STK-FE-02) — soma de `quantity`/`total` de todas as linhas físicas do
// par (product_uuid, warehouse_uuid), lista individual de lotes e
// endereçamento do produto (se houver). Rota
// `/administrativo/saldo-estoque/detalhe?product_uuid=&warehouse_uuid=`
// (`DA-STK-04` — 2 UUIDs via querystring, sem precedente de path com 2 UUIDs
// consecutivos), guardada por `stocks_view`. Módulo 100% leitura — Stock
// nunca foi CRUD no legado (`Stock-contrato.md ## 0`), zero botão de
// edição/exclusão.
//
// Mirror estrutural de `CadastrosBase/SaldoInicial/SaldoInicialDetalhe.tsx`
// (`FormContainer` + `SimpleGrid`/`InfoField` + `Table.Root` de sub-itens) —
// molde citado pela Tarefa. Guarda de entrada por `useSearchParams` (não
// `useParams`, `TASK-STK-FE-02 ## Tela/Rota`): `product_uuid`/
// `warehouse_uuid` ausentes ou não-UUID redirecionam à Listagem com toast de
// erro ANTES de qualquer chamada de rede (evita 422 `StockDetailRequest`).
//
// Endereçamento: `StockDetailResource.addressing` reutiliza o
// `AddressingResource` já existente (confirmado por leitura direta de
// `app/Http/Resources/V1/StockDetailResource.php`/`StockRepository::
// getGroupedDetail()` no fork `GB.Cerne.Api`) — SEM hierarquia/`path`
// (diverge do exemplo `{uuid, path:[...]}` de `Stock-contrato.md ## 4.6`,
// documentação desatualizada em relação ao código já testado; `parent` só
// viria populado se a Action carregasse a relação em cadeia, o que não faz).
// Sem formatter/componente compartilhado de hierarquia em uso por outra tela
// (grep em `src/components/**`/`src/pages/**` — único precedente é
// `ProdutoDetalhe.tsx::product?.addressing?.description`, exibição direta,
// sem breadcrumb). Exibição adotada aqui: `description`/`type_label` diretos,
// mesma disciplina — sem inventar componente de árvore novo (fora de escopo).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiMapPin } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getStockDetail } from '@/services/v2/Stocks/stock-service';

const SALDO_ESTOQUE_LIST_ROUTE = '/administrativo/saldo-estoque';

function formatQuantityPtBr(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

export default function SaldoEstoqueDetalhe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.stocks.stock;
  const noData = text.detail.noData;

  const productUuid = searchParams.get('product_uuid');
  const warehouseUuid = searchParams.get('warehouse_uuid');
  const hasValidParams = isValidGuid(productUuid) && isValidGuid(warehouseUuid);

  // Guarda de entrada — `product_uuid`/`warehouse_uuid` ausentes ou
  // mal-formados NUNCA disparam a chamada de rede (evita 422
  // `StockDetailRequest: required`); redireciona à Listagem com toast.
  useEffect(() => {
    if (!hasValidParams) {
      toaster.create({
        type: 'error',
        title: text.detail.invalidParamsToast.title,
        description: text.detail.invalidParamsToast.description,
      });
      navigate(SALDO_ESTOQUE_LIST_ROUTE, { replace: true });
    }
    // Deps somente [hasValidParams] — `navigate`/`text` são estáveis por
    // execução (mesma disciplina de `SaldoInicialDetalhe.tsx`/
    // `EstoqueInicialDetalhe.tsx`, que também guardam só pelo id de entrada).
  }, [hasValidParams]);

  const detailQuery = useQuery({
    queryKey: [queryKey.stocks.stock, productUuid, warehouseUuid],
    queryFn: async () => {
      const response = await getStockDetail({
        product_uuid: productUuid as string,
        warehouse_uuid: warehouseUuid as string,
      });
      return response.data;
    },
    enabled: hasValidParams,
    retry: false,
  });

  if (!hasValidParams) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  // Estado: 404 (`Saldo não encontrado`, `Stock-contrato.md ## 5`)
  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(SALDO_ESTOQUE_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const hasLots = (item?.lots.length ?? 0) > 0;

  return (
    <FormContainer title={item ? item.product.description : text.singularLabel}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? `${item.product.code} · ${item.warehouse.description}` : text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Identificação ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {text.detail.sections.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.detail.fields.product}
                value={item ? `${item.product.code} — ${item.product.description}` : noData}
              />
              <InfoField
                label={text.detail.fields.warehouse}
                value={item?.warehouse.description || noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Saldo Consolidado ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {text.detail.sections.balance}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.detail.fields.quantity}
                value={item !== undefined ? formatQuantityPtBr(item.quantity) : noData}
              />
              <InfoField
                label={text.detail.fields.total}
                value={item !== undefined ? formatCurrencyBRL(item.total) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 3 — Lotes (SEMPRE renderizada, mesmo vazia) ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {text.detail.sections.lots}
            </Text>
            <Skeleton loading={isLoading}>
              {hasLots ? (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.detail.table.lot}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.detail.table.providerLot}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.detail.table.expirationDate}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.quantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.averageCost}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.total}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.lots ?? []).map((lot) => (
                      <Table.Row key={lot.uuid}>
                        <Table.Cell>{lot.lot || '—'}</Table.Cell>
                        <Table.Cell>{lot.provider_lot || '—'}</Table.Cell>
                        <Table.Cell>
                          {lot.expiration_date ? formatDate(lot.expiration_date) : '—'}
                        </Table.Cell>
                        <Table.Cell textAlign="end">{formatQuantityPtBr(lot.quantity)}</Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(lot.average_cost)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">{formatCurrencyBRL(lot.total)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              ) : (
                !isLoading && (
                  <EmptyState.Root size="sm">
                    <EmptyState.Content>
                      <EmptyState.Indicator>
                        <Icon as={FiAlertTriangle} boxSize={6} color="fg.muted" />
                      </EmptyState.Indicator>
                      <VStack textAlign="center" gap={1}>
                        <EmptyState.Title>{text.detail.lotsEmpty.title}</EmptyState.Title>
                        <EmptyState.Description>
                          {text.detail.lotsEmpty.description}
                        </EmptyState.Description>
                      </VStack>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )
              )}
            </Skeleton>
          </Box>

          {/* ---- Seção 4 — Endereçamento (condicional, addressing !== null) ---- */}
          {item?.addressing && (
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="fg.default"
                mb={4}
                pb={2}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                {text.detail.sections.addressing}
              </Text>
              <Flex align="center" gap={3}>
                <Icon as={FiMapPin} boxSize={5} color="fg.muted" />
                <SimpleGrid columns={columnsForm.default} gap={6} flex={1}>
                  <InfoField
                    label={text.detail.fields.addressingType}
                    value={item.addressing.type_label}
                  />
                  <InfoField
                    label={text.detail.sections.addressing}
                    value={item.addressing.description}
                  />
                </SimpleGrid>
              </Flex>
            </Box>
          )}
        </Flex>
      </Box>
    </FormContainer>
  );
}
