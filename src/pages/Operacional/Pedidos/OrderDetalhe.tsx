// src/pages/Operacional/Pedidos/OrderDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) do Pedido (Order — Operacional /
// Vendas, F-051, 97-Esteiras/043, PED-FE-06, SURF-032, F-077..F-100). Rota
// `/operacional/pedidos/:uuid/detalhe`, guardada por
// `<RequirePermission permission="orders_view">`.
//
// Mirror ESTRUTURAL de `Operacional/Budget/BudgetDetalhe.tsx` (módulo
// espelho direto, contrato-tela §2 "Detalhe read-only" → `BudgetDetalhe.tsx`):
// bloco read-only DEDICADO (sem `useForm`/`useFieldArray`), seções
// sequenciais (Cabeçalho → Itens → Pagamento/Parcelas → Totais), `useQuery`
// puro com a MESMA `queryKey` de `CreateOrUpdateOrder.tsx`
// (`[queryKey.orders.order, uuid]`) — cache compartilhado entre editar/ver.
//
// Gancho PED-04 (Budget→Order, SURF-046 display-only): quando
// `OrderDetail.budget` não é `null`, exibe badge "Origem: Orçamento" —
// NUNCA navegação de escrita a partir daqui (a aprovação de orçamento é
// fluxo público por hash, fora da SPA autenticada de Pedidos, contrato-tela
// §7.3).
//
// Ações do cabeçalho: Editar (`status < 2 && orders_edit`, mirror AM-008 da
// listagem) · Imprimir (`getOrderReportBlob`, SEMPRE quando `orders_view`,
// blob + `URL.createObjectURL` — NUNCA `window.open` cru, perderia o header
// `X-Farm-Id`, contrato-tela §3, mirror `handlePrint` de `index.tsx`) ·
// Gerar Venda (`status < 3 && sales_create`, SALE-FE-COM-10, 97-Esteiras/063
// — navega para `/operacional/pedidos/{uuid}/gerar-venda`, mesmo gate de
// `OrderActionsMenu.tsx`).
//
// `installment_details` é exibido tal como persistido (cronograma editável
// NÃO roda aqui — dado congelado do backend, mirror `BudgetDetalhe.tsx`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Badge,
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
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiFileText, FiShoppingCart } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getOrder, getOrderReportBlob } from '@/services/v2/Orders/order-service';

import type { OrderDetail } from '@/@types/v2/Orders';

const ORDER_LIST_ROUTE = '/operacional/pedidos';

// Mirror `ORDER_EDITABLE_STATUS_THRESHOLD` (`OrderActionsMenu.tsx`) — gate
// de Editar (`status < 2`, contrato-tela §7.4, AM-008).
const ORDER_EDITABLE_STATUS_THRESHOLD = 2;
// Mirror `ORDER_SALE_GENERATABLE_STATUS_THRESHOLD` (`OrderActionsMenu.tsx`)
// — gate de "Gerar Venda" (`status < 3`, `SaleFromOrderRequest`, roteiro §2).
const ORDER_SALE_GENERATABLE_STATUS_THRESHOLD = 3;

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

export default function OrderDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.orders.order;
  const detailText = text.detail;
  const itemText = text.form.fields.item;
  const paymentText = text.form.fields.payment;
  const noData = '—';

  const canEdit = can('orders_edit');
  const canGenerateSale = can('sales_create');
  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de entrada — `uuid` ausente/mal-formado NUNCA dispara a chamada
  // de rede (mirror `BudgetDetalhe.tsx`/`CreateOrUpdateOrder.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      navigate(ORDER_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const detailQuery = useQuery({
    // MESMA chave de `CreateOrUpdateOrder.tsx` (`useCustomFormQueryById`) —
    // cache compartilhado entre a edição e esta visualização.
    queryKey: [queryKey.orders.order, uuid],
    queryFn: async () => {
      const response = await getOrder(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
  });

  // ---- Imprimir (PDF blob, contrato-tela §3, mirror `handlePrint` de
  // `Operacional/Pedidos/index.tsx`) ------------------------------------
  const [isPrinting, setIsPrinting] = useState(false);

  async function handlePrint(orderUuid: string) {
    setIsPrinting(true);
    try {
      const blob = await getOrderReportBlob(orderUuid);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toaster.error({ title: text.singularLabel, description: text.list.printErrorToast });
    } finally {
      setIsPrinting(false);
    }
  }

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const order = detailQuery.data as OrderDetail | undefined;
  const notFound = !isLoading && detailQuery.isError;
  const isEditable = !!order && order.status.value < ORDER_EDITABLE_STATUS_THRESHOLD;
  const canGenerateSaleNow =
    !!order && order.status.value < ORDER_SALE_GENERATABLE_STATUS_THRESHOLD;

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
                <EmptyState.Title>{detailText.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={detailText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(ORDER_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const items = order?.items ?? [];
  const details = order?.installment_details ?? null;
  const showInstallmentDetails = order && order.installments > 1 && !!details;

  return (
    <FormContainer
      title={order ? order.code : text.singularLabel}
      headerActions={
        order && (
          <Flex align="center" gap={3} flexShrink={0} wrap="wrap">
            <Button
              title={detailText.printButton}
              icon={FiFileText as ElementType}
              variant="outline"
              size="sm"
              onClick={() => handlePrint(order.uuid)}
              disabled={isPrinting}
            />
            {canGenerateSale && (
              <Button
                title={detailText.generateSaleButton}
                icon={FiShoppingCart as ElementType}
                variant="outline"
                size="sm"
                disabled={!canGenerateSaleNow}
                tooltip={
                  !canGenerateSaleNow ? text.list.table.actions.generateSaleTooltip : undefined
                }
                onClick={() => navigate(`${ORDER_LIST_ROUTE}/${order.uuid}/gerar-venda`)}
              />
            )}
            {canEdit && isEditable && (
              <Button
                title={detailText.editButton}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${ORDER_LIST_ROUTE}/${order.uuid}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Flex align="center" gap={3} wrap="wrap">
            <Flex align="center" gap={2}>
              <Box
                boxSize="2.5"
                borderRadius="full"
                bg={order ? `${order.status.color}.500` : 'gray.500'}
              />
              <Text fontSize="sm" color="fg.muted">
                {order?.status.label ?? text.singularLabel}
              </Text>
            </Flex>
            {order?.budget && (
              <Badge colorPalette="blue" variant="subtle">
                {detailText.originBudgetLabel}
              </Badge>
            )}
          </Flex>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Cabeçalho (F-077..F-081) ---- */}
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
              {detailText.sections.header}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.list.table.columns.code} value={order?.code ?? noData} />
              <InfoField
                label={text.list.table.columns.date}
                value={order?.date ? formatDate(order.date, 'dd/MM/yyyy') : noData}
              />
              <InfoField
                label={text.list.table.columns.status}
                value={order?.status.label ?? noData}
              />
              <InfoField
                label={text.list.table.columns.client}
                value={order?.client.info ?? noData}
              />
              <InfoField label={text.list.table.columns.user} value={order?.user.name ?? noData} />
              <InfoField label={text.form.fields.header.note} value={order?.note ?? noData} />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens (F-082..F-089) ---- */}
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
              {detailText.sections.items}
            </Text>
            {items.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyItems}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{itemText.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.um}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.price}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.discount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.total}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {items.map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.product?.measurement ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity.toFixed(4)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.price)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.discount ?? 0)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.total)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Pagamento/Parcelas (F-090..F-099,
              `installment_details` exibido tal como persistido — sem
              recalcular, mirror `BudgetDetalhe.tsx`). ---- */}
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
              {detailText.sections.payment}
            </Text>
            <Box
              p={4}
              bg="bg.panel"
              borderRadius="lg"
              border="1px solid"
              borderColor="border.subtle"
            >
              <SimpleGrid columns={columnsForm.default} gap={4}>
                <InfoField
                  label={paymentText.paymentMethod}
                  value={order?.payment_method?.label ?? noData}
                />
                <InfoField
                  label={paymentText.installments}
                  value={order ? String(order.installments) : noData}
                />
                <InfoField
                  label={paymentText.interval}
                  value={order ? String(order.interval) : noData}
                />
                <InfoField
                  label={paymentText.dueDate}
                  value={order?.due_date ? formatDate(order.due_date, 'dd/MM/yyyy') : noData}
                />
              </SimpleGrid>

              {details && (
                <Box mt={4} pt={4} borderTop="1px dashed" borderColor="border.subtle">
                  <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
                    <InfoField
                      label={paymentText.hasInput}
                      value={
                        details.has_input
                          ? languageGB.defaltStrings.yes
                          : languageGB.defaltStrings.no
                      }
                    />
                    {details.has_input && (
                      <>
                        <InfoField
                          label={paymentText.inputDate}
                          value={
                            details.input_date
                              ? formatDate(details.input_date, 'dd/MM/yyyy')
                              : noData
                          }
                        />
                        <InfoField
                          label={paymentText.inputValue}
                          value={formatCurrencyBRL(details.input_value ?? 0)}
                        />
                      </>
                    )}
                    <InfoField
                      label={paymentText.fiscalDocument}
                      value={
                        details.fiscal_document
                          ? languageGB.defaltStrings.yes
                          : languageGB.defaltStrings.no
                      }
                    />
                  </SimpleGrid>

                  {showInstallmentDetails && details.installments.length > 0 && (
                    <Box mt={4} overflowX="auto">
                      <Table.Root size="sm">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>
                              {paymentText.installmentsTable.date}
                            </Table.ColumnHeader>
                            <Table.ColumnHeader>
                              {paymentText.installmentsTable.value}
                            </Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {details.installments.map((installment, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <Table.Row key={`${order?.uuid}-${index}`}>
                              <Table.Cell>
                                {formatDate(installment.date_installment, 'dd/MM/yyyy')}
                              </Table.Cell>
                              <Table.Cell>
                                {formatCurrencyBRL(installment.value_installment)}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* ---- Seção 4 — Totais (SEMPRE valores persistidos do
              servidor — sem recalcular, fonte única de verdade
              CV-009/010/011). ---- */}
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
              {detailText.sections.totals}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.form.fields.footer.subtotal}
                value={order ? formatCurrencyBRL(order.subtotal) : noData}
              />
              <InfoField
                label={text.form.fields.footer.freight}
                value={order ? formatCurrencyBRL(order.freight) : noData}
              />
              <InfoField
                label={text.form.fields.footer.discount}
                value={order ? formatCurrencyBRL(order.discount) : noData}
              />
              <InfoField
                label={text.form.fields.footer.total}
                value={order ? formatCurrencyBRL(order.total) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 5 — Auditoria (created_at/updated_at). ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <InfoField
                label={detailText.dates.createdAt}
                value={
                  order?.created_at ? formatDate(order.created_at, 'dd/MM/yyyy HH:mm') : noData
                }
              />
              <InfoField
                label={detailText.dates.updatedAt}
                value={
                  order?.updated_at ? formatDate(order.updated_at, 'dd/MM/yyyy HH:mm') : noData
                }
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
