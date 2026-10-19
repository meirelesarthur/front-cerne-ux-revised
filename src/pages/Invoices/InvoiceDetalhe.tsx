// src/pages/Invoices/InvoiceDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Invoice (Doc. Fiscal/Entrada) —
// TASK-FE-2768. Mirror estrutural de `EstoqueInicialDetalhe.tsx` — bloco
// read-only, sem `useForm`, seções sequenciais (sem abas, mesma decisão já
// tomada por `EstoqueInicialDetalhe.tsx` mesmo com várias zonas).
//
// Seções: Cabeçalho + Itens + Totais + Parcelas (tabela Vencimento/Valor).
// Rateio (`categories[]`) NÃO aparece aqui — confirmado por leitura direta do
// backend (`InvoiceResource`/`InvoiceRepository::findByUuidOrFail`): o
// rateio é WRITE-ONLY, nunca devolvido pelo GET (nem no cabeçalho, nem
// embutido na parcela `InvoiceExpenseResource`) — SEM MOCK, não inventamos
// uma seção vazia para um dado que nunca existirá aqui.
//
// Botão "Imprimir" — `window.print()` + CSS `@media print` (via `sx`/`css`
// inline do Chakra, ocultando `header-actions`/botões) — sem dependência de
// nenhum endpoint (não é o fluxo de DANFE/XML, que segue bloqueado,
// TASK-FE-2767 fora de escopo). "Gerar DANFE"/"Baixar XML" ausentes, mesma
// decisão de `index.tsx`/`InvoiceActionsMenu.tsx`.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

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
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiPrinter } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { invoiceApportionmentTypeOptions } from '@/constants/invoices/options/apportionment-type-options';
import { invoiceClassificationOptions } from '@/constants/invoices/options/classification-options';
import { invoiceDocumentTypeOptions } from '@/constants/invoices/options/document-type-options';

import { useInvoiceDetail } from './useInvoiceDetail';

const INVOICES_LIST_ROUTE = '/administrativo/doc-fiscal';

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

export default function InvoiceDetalhe() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.invoices.invoice;
  const detailText = text.detail;
  const noData = detailText.table.noData;

  useEffect(() => {
    if (!isValidGuid(invoiceId)) {
      navigate(INVOICES_LIST_ROUTE, { replace: true });
    }
  }, [invoiceId, navigate]);

  if (!isValidGuid(invoiceId)) {
    return null;
  }

  const detailQuery = useInvoiceDetail(invoiceId, true);

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && (detailQuery as any).isError;
  const canEdit = can('invoices_edit');

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
                onClick={() => navigate(INVOICES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? `${item.number}/${item.series}` : text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0} className="invoice-detail-header-actions">
            <Button
              title={detailText.printButton}
              icon={FiPrinter as ElementType}
              variant="outline"
              size="sm"
              onClick={() => window.print()}
            />
            {canEdit && (
              <Button
                title={detailText.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${INVOICES_LIST_ROUTE}/${invoiceId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <style>
        {'@media print { .invoice-detail-header-actions { display: none !important; } }'}
      </style>

      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item?.provider?.name ?? text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Cabeçalho ---- */}
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
              <InfoField
                label={text.form.fields.number}
                value={item ? `${item.number}/${item.series}` : noData}
              />
              <InfoField label={text.form.fields.provider} value={item?.provider?.name ?? noData} />
              <InfoField
                label={text.form.fields.proprietary}
                value={item?.proprietary?.name ?? noData}
              />
              <InfoField
                label={text.form.fields.state}
                value={item?.state?.abbreviation ?? noData}
              />
              <InfoField label={text.form.fields.dtEmission} value={item?.dt_emission ?? noData} />
              <InfoField
                label={text.form.fields.deliveryDate}
                value={item?.delivery_date ?? noData}
              />
              <InfoField
                label={text.form.fields.type}
                value={item ? invoiceDocumentTypeOptions.getLabel(item.type, languageGB) : noData}
              />
              <InfoField
                label={text.form.fields.classification}
                value={
                  item?.classification
                    ? invoiceClassificationOptions.getLabel(item.classification, languageGB)
                    : noData
                }
              />
              <InfoField
                label={text.form.fields.apportionmentType}
                value={
                  item
                    ? invoiceApportionmentTypeOptions.getLabel(item.apportionment_type, languageGB)
                    : noData
                }
              />
              <InfoField
                label={text.form.fields.stateRegistration}
                value={item?.state_registration ?? noData}
              />
              <InfoField label={text.form.totalsFields.conveyor} value={item?.conveyor ?? noData} />
              <InfoField label={text.form.fields.note} value={item?.note ?? noData} />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens ---- */}
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
            {(item?.items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyItems}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.fields.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.totalAmount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.warehouse}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.amount)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.total_amount)}</Table.Cell>
                        <Table.Cell>{row.warehouse?.description ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Totais ---- */}
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
                label={text.form.totalsFields.vlItems}
                value={item ? formatCurrencyBRL(item.vl_items) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vlIpi}
                value={item ? formatCurrencyBRL(item.vl_ipi) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vlDiscount}
                value={item ? formatCurrencyBRL(item.vl_discount) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vlFreight}
                value={item ? formatCurrencyBRL(item.vl_freight) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vlSafe}
                value={item ? formatCurrencyBRL(item.vl_safe) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vlExpense}
                value={item ? formatCurrencyBRL(item.vl_expense) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vlTotal}
                value={item ? formatCurrencyBRL(item.vl_total) : noData}
              />
              <InfoField label={text.list.table.code} value={item?.code ?? noData} />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 4 — Parcelas ---- */}
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
              {detailText.sections.installments}
            </Text>
            {(item?.expenses ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyInstallments}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.table.installment}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.table.dueDate}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.table.value}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.table.balance}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.expenses ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.installment}</Table.Cell>
                        <Table.Cell>{row.due_date}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.value)}</Table.Cell>
                        <Table.Cell>
                          <Badge
                            colorPalette={row.balance <= 0 ? 'green' : 'orange'}
                            variant="subtle"
                          >
                            {formatCurrencyBRL(row.balance)}
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
