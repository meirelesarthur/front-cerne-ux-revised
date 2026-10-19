// src/pages/Administrativo/CorrecaoEstoque/CorrecaoEstoqueDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (100% leitura) de CORREÇÃO DE ESTOQUE — TASK-FE-COR-02.
// Rota `/administrativo/correcao/:uuid` (guardada por `stock-corrections_view`
// — a mesma permissão da listagem, contrato de tela §4). Não existe edição —
// o legado nunca teve `update` unitário de correção já criada (contrato de
// API §1).
//
// Mirror estrutural de `Administrativo/SaldoEstoque/SaldoEstoqueDetalhe.tsx`
// (`FormContainer` + `SimpleGrid`/`InfoField` + `Table.Root` de sub-itens,
// 100% leitura). **Divergência deliberada do molde:** o precedente usa
// `useSearchParams` (2 UUIDs via querystring, domínio sem UUID único de
// recurso); aqui o backend expõe `GET /stock-corrections/{uuid}` com 1 ÚNICO
// UUID via path — usa `useParams<{ uuid: string }>()`, NÃO querystring.
// Mesma disciplina de guarda de entrada do precedente: `isValidGuid(uuid)`
// antes de qualquer chamada de rede.
//
// `formatQuantityPtBr`/`formatCurrencyBRL` são funções LOCAIS a este arquivo
// (mirror exato do precedente — convenção já estabelecida no projeto de
// duplicar esses 2 formatters por arquivo de detalhe, não extrair para
// `utils/` compartilhado).
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
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getStockCorrection } from '@/services/v2/StockCorrections/stock-correction-service';

const CORRECAO_ESTOQUE_LIST_ROUTE = '/administrativo/correcao';

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

export default function CorrecaoEstoqueDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.stockCorrections.stockCorrection;
  const noData = text.detail.noData;

  const hasValidParams = isValidGuid(uuid);

  // Guarda de entrada — `uuid` ausente ou mal-formado NUNCA dispara a
  // chamada de rede; redireciona à Listagem com toast. Deps somente
  // [hasValidParams] — `navigate`/`text` são estáveis por execução (mesma
  // disciplina do precedente `SaldoEstoqueDetalhe.tsx`).
  useEffect(() => {
    if (!hasValidParams) {
      toaster.create({
        type: 'error',
        title: text.detail.invalidParamsToast.title,
        description: text.detail.invalidParamsToast.description,
      });
      navigate(CORRECAO_ESTOQUE_LIST_ROUTE, { replace: true });
    }
  }, [hasValidParams]);

  const detailQuery = useQuery({
    queryKey: [queryKey.stockCorrections.stockCorrection, uuid],
    queryFn: async () => {
      const response = await getStockCorrection(uuid!);
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

  // Estado: 404 (correção inexistente ou de outra fazenda — isolamento por
  // tenant é silencioso, contrato de tela §4.2).
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
                onClick={() => navigate(CORRECAO_ESTOQUE_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const hasItems = (item?.items.length ?? 0) > 0;

  return (
    <FormContainer title={item ? item.code : text.singularLabel}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? formatDate(item.date) : text.singularLabel}
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
              <InfoField label={text.detail.fields.code} value={item?.code || noData} />
              <InfoField
                label={text.detail.fields.date}
                value={item ? formatDate(item.date) : noData}
              />
              <InfoField label={text.detail.fields.user} value={item?.user?.name || noData} />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens Corrigidos (SEMPRE renderizada, mesmo vazia) ---- */}
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
              {text.detail.sections.items}
            </Text>
            <Skeleton loading={isLoading}>
              {hasItems ? (
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.detail.table.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.detail.table.warehouse}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.detail.table.lot}</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.quantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.differenceQuantity}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.averageCost}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="end">
                        {text.detail.table.averageCostValue}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row, index) => (
                      // Sem `uuid` próprio na linha (pivot sem identificador
                      // exposto pelo Resource) — chave composta pelo índice +
                      // produto/armazém, estável para a mesma resposta.
                      <Table.Row
                        key={`${index}-${row.product?.uuid ?? 'x'}-${row.warehouse?.uuid ?? 'x'}`}
                      >
                        <Table.Cell>{row.product?.description ?? '—'}</Table.Cell>
                        <Table.Cell>{row.warehouse?.description ?? '—'}</Table.Cell>
                        <Table.Cell>{row.lot || '—'}</Table.Cell>
                        <Table.Cell textAlign="end">{formatQuantityPtBr(row.quantity)}</Table.Cell>
                        <Table.Cell
                          textAlign="end"
                          color={
                            row.difference_quantity > 0
                              ? 'green.500'
                              : row.difference_quantity < 0
                                ? 'red.500'
                                : undefined
                          }
                        >
                          {formatQuantityPtBr(row.difference_quantity)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(row.average_cost)}
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                          {formatCurrencyBRL(row.average_cost_value)}
                        </Table.Cell>
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
                        <EmptyState.Title>{text.detail.itemsEmpty.title}</EmptyState.Title>
                        <EmptyState.Description>
                          {text.detail.itemsEmpty.description}
                        </EmptyState.Description>
                      </VStack>
                    </EmptyState.Content>
                  </EmptyState.Root>
                )
              )}
            </Skeleton>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
