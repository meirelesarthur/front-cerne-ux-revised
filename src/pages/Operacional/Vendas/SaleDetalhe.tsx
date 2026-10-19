// src/pages/Operacional/Vendas/SaleDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente-leitura) da Venda COMERCIAL (Sale — venda de
// PRODUTOS, Operacional / Vendas, 97-Esteiras/043, SALE-FE-COM-05,
// `S-SCREEN-005`/`FM005`). Rota `/operacional/vendas/:uuid/detalhe`, guardada
// por `<RequirePermission permission="sales_view">` — destino OBRIGATÓRIO da
// ação Visualizar (`A004`, `SaleActionsMenu.tsx`, sempre presente na
// listagem legada).
//
// Mirror ESTRUTURAL de `Operacional/Pedidos/OrderDetalhe.tsx`: bloco
// read-only DEDICADO (sem `useForm`/`useFieldArray`), `useQuery` puro com a
// MESMA `queryKey` de `CreateOrUpdateSale.tsx`
// (`[queryKey.sales.sale, uuid]`) — cache compartilhado entre editar/ver.
//
// ZERO ação de escrita (DoD da Tarefa) — ao contrário de `OrderDetalhe`, esta
// tela NÃO oferece Editar/Imprimir/Gerar NFe/Gerar Adiantamento; só "Voltar".
//
// `D006` (NÃO replicado) — o `show` legado exibia `dt_sale` no campo
// rotulado "Expedição". Aqui `dt_sale`/`dt_shipping` aparecem como campos
// SEPARADOS, cada um com o rótulo correto (`SaleDetailResource` expõe os
// dois, contrato-tela §6.3).
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

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getSale } from '@/services/v2/Sales/sale-service';

import type { SaleDetail } from '@/@types/v2/Sales';

const SALES_LIST_ROUTE = '/operacional/vendas';

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

export default function SaleDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.sales.sale;
  const detailText = text.detail;
  const itemText = text.form.fields.item;
  const header = text.form.fields.header;
  const footerText = text.form.fields.footer;
  const noData = '—';

  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de entrada — `uuid` ausente/mal-formado NUNCA dispara a chamada
  // de rede (mirror `OrderDetalhe.tsx`/`CreateOrUpdateSale.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      navigate(SALES_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const detailQuery = useQuery({
    // MESMA chave de `CreateOrUpdateSale.tsx` (`useCustomFormQueryById`) —
    // cache compartilhado entre a edição e esta visualização.
    queryKey: [queryKey.sales.sale, uuid],
    queryFn: async () => {
      const response = await getSale(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
  });

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const sale = detailQuery.data as SaleDetail | undefined;
  const notFound = !isLoading && detailQuery.isError;

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
                onClick={() => navigate(SALES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const items = sale?.items ?? [];

  return (
    <FormContainer
      title={sale ? sale.code : text.singularLabel}
      headerActions={
        sale && (
          <Flex align="center" gap={3} flexShrink={0} wrap="wrap">
            <Button
              title={detailText.backButton}
              icon={FiArrowLeft as ElementType}
              variant="outline"
              size="sm"
              onClick={() => navigate(SALES_LIST_ROUTE)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Flex align="center" gap={2}>
            <Box
              boxSize="2.5"
              borderRadius="full"
              bg={sale ? `${sale.status.color}.500` : 'gray.500'}
            />
            <Text fontSize="sm" color="fg.muted">
              {sale?.status.label ?? text.singularLabel}
            </Text>
          </Flex>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Cabeçalho (`FM005`). `dt_sale`/`dt_shipping`
              SEPARADOS, cada um com o rótulo correto (`D006` não
              replicado). ---- */}
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
              <InfoField label={header.code} value={sale?.code ?? noData} />
              <InfoField
                label={header.dtSale}
                value={sale?.dt_sale ? formatDate(sale.dt_sale, 'dd/MM/yyyy') : noData}
              />
              <InfoField
                label={header.dtShipping}
                value={sale?.dt_shipping ? formatDate(sale.dt_shipping, 'dd/MM/yyyy') : noData}
              />
              <InfoField
                label={header.dueDate}
                value={sale?.due_date ? formatDate(sale.due_date, 'dd/MM/yyyy') : noData}
              />
              <InfoField label={header.user} value={sale?.user.name ?? noData} />
              <InfoField label={header.client} value={sale?.client.info ?? noData} />
              <InfoField
                label={header.paymentMethod}
                value={sale?.payment_method?.label ?? noData}
              />
              <InfoField label={header.transporter} value={sale?.transporter?.name ?? noData} />
              <InfoField label={header.proprietary} value={sale?.proprietary?.name ?? noData} />
              <InfoField label={header.driver} value={sale?.driver ?? noData} />
              <InfoField label={detailText.nfeLabel} value={sale?.nfe?.numero_nfe ?? noData} />
              {sale?.order && (
                <InfoField label={detailText.originOrderLabel} value={sale.order.code} />
              )}
            </SimpleGrid>
            <Box mt={6}>
              <InfoField label={header.note} value={sale?.note ?? noData} />
            </Box>
          </Box>

          {/* ---- Seção 2 — Itens (`S-LIST-002`, tabela estática). ---- */}
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
                      <Table.ColumnHeader>{itemText.warehouse}</Table.ColumnHeader>
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
                        <Table.Cell>{row.warehouse?.name ?? noData}</Table.Cell>
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

          {/* ---- Seção 3 — Totais (SEMPRE valores persistidos do servidor —
              sem recalcular, CV002-CV004). ---- */}
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
                label={footerText.subtotal}
                value={sale ? formatCurrencyBRL(sale.subtotal) : noData}
              />
              <InfoField
                label={footerText.icms}
                value={sale ? formatCurrencyBRL(sale.icms) : noData}
              />
              <InfoField
                label={footerText.freight}
                value={sale ? formatCurrencyBRL(sale.freight) : noData}
              />
              <InfoField
                label={footerText.otherValues}
                value={sale ? formatCurrencyBRL(sale.other_values) : noData}
              />
              <InfoField
                label={footerText.discount}
                value={sale ? formatCurrencyBRL(sale.discount) : noData}
              />
              <InfoField
                label={footerText.total}
                value={sale ? formatCurrencyBRL(sale.total) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 4 — Auditoria (created_at/updated_at). ---- */}
          <Box>
            <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
              <InfoField
                label={detailText.dates.createdAt}
                value={sale?.created_at ? formatDate(sale.created_at, 'dd/MM/yyyy HH:mm') : noData}
              />
              <InfoField
                label={detailText.dates.updatedAt}
                value={sale?.updated_at ? formatDate(sale.updated_at, 'dd/MM/yyyy HH:mm') : noData}
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
