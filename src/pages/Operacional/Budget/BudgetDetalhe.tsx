// src/pages/Operacional/Budget/BudgetDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de Orçamento (Budget — Operacional /
// Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-05). Rota
// `/operacional/orcamentos/:uuid/visualizar`, guardada por
// `<RequirePermission permission="budgets_view">`.
//
// Mirror ESTRUTURAL de `Invoices/InvoiceDetalhe.tsx`/`Administrativo/
// Requisition/RequisitionDetalhe.tsx`: bloco read-only DEDICADO (sem
// `useForm`/`useFieldArray`), seções sequenciais (Cabeçalho → Itens →
// Pagamentos → Totais), `useQuery` puro (mesma `queryKey` de
// `CreateOrUpdateBudget.tsx`, `[queryKey.budgets.budget, uuid]`, para que a
// invalidação do E-mail — via `useRequest`/`useBudgetActions` — atualize
// esta tela também quando ela estiver montada). Os EDITORES de itens/
// pagamentos (`BudgetItemsEditor`/`BudgetPaymentsEditor`) NÃO são
// reaproveitados aqui: eles vivem sob `useFieldArray` do formulário
// mutável, e esta tela não tem (nem precisa de) um `useForm` — a
// apresentação read-only é mais simples e mais robusta como tabelas/
// `InfoField`, mesmo racional já aceito em `RequisitionDetalhe.tsx` (que
// também dispensa reaproveitar um editor mutável para uma tela sem
// `update`). `installment_details` é exibido tal como persistido
// (`calcInstallments` NÃO roda aqui — dado congelado do backend).
//
// Ações do rodapé (WhatsApp/E-mail/PDF/Copiar link) — MESMOS 4 handlers já
// usados pela grid (`Operacional/Budget/index.tsx`), via
// `@/hooks/useBudgetActions` (TASK-BG-FE-05, extraído desta Tarefa para
// eliminar duplicação, DoD). "Copiar link" passa `budget.hash` já
// carregado (`knownHash`) — evita a chamada extra que a grid precisa fazer
// (`BudgetListResource` não expõe `hash`, GAP-BG-FE-07 2ª parte).
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
import { useQuery } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiFileText, FiLink, FiMail } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useBudgetActions } from '@/hooks/useBudgetActions';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { budgetStatusColor } from '@/constants/Budgets/budget-status';
import { budgetPaymentMethodOptions } from '@/constants/Budgets/options';
import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getBudget } from '@/services/v2/Budgets/budget-service';

import type { BudgetData, BudgetPaymentData } from '@/@types/v2/Budgets';

const BUDGET_LIST_ROUTE = '/operacional/orcamentos';

// Mirror `App\Enums\BudgetStatus` — MESMO limite já usado em `index.tsx`
// (D08 preservado, client-side, `GAP-BG-06`).
const BUDGET_EDITABLE_STATUS_THRESHOLD = 3;

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

function formatClientLabel(client: BudgetData['client']): string {
  if (!client?.name) return '—';
  return client.nif ? `${client.name} - ${client.nif}` : client.name;
}

export default function BudgetDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.budgets.budget;
  const detailText = text.detail;
  const itemText = text.form.fields.item;
  const paymentText = text.form.fields.payment;
  const financialText = paymentText.installmentDetails;
  const noData = '—';

  const canEdit = can('budgets_edit');
  const hasValidUuid = isValidGuid(uuid ?? null);

  // Guarda de entrada — `uuid` ausente/mal-formado NUNCA dispara a chamada
  // de rede (mirror `RequisitionDetalhe.tsx`/`CreateOrUpdateBudget.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      navigate(BUDGET_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const detailQuery = useQuery({
    // MESMA chave de `CreateOrUpdateBudget.tsx` (`useCustomFormQueryById`) —
    // permite que a invalidação do E-mail (`useBudgetActions`/`useRequest`)
    // atualize esta tela quando montada.
    queryKey: [queryKey.budgets.budget, uuid],
    queryFn: async () => {
      const response = await getBudget(uuid as string);
      return response.data;
    },
    enabled: hasValidUuid,
    retry: false,
  });

  // ---- Ações compartilhadas com a grid (`Operacional/Budget/index.tsx`) —
  // MESMOS handlers via `useBudgetActions` (TASK-BG-FE-05, DoD "nenhum
  // handler duplicado"). Sem grid para refetch — `onWhatsappOpened`
  // re-consulta o PRÓPRIO detalhe (status pode ter sido promovido 1→2). ----
  const {
    downloadingReportUuid,
    openingWhatsappUuid,
    copyingLinkUuid,
    isSendingEmail,
    sendEmail,
    handleGenerateReport,
    handleWhatsappClick,
    handleCopyPublicLink,
  } = useBudgetActions({
    languageGB,
    onWhatsappOpened: () => detailQuery.refetch(),
  });

  if (!hasValidUuid) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const budget = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;
  const isEditable = !!budget && budget.status < BUDGET_EDITABLE_STATUS_THRESHOLD;
  const isActioning =
    downloadingReportUuid === uuid || openingWhatsappUuid === uuid || copyingLinkUuid === uuid;

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
                onClick={() => navigate(BUDGET_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={budget ? budget.code : text.singularLabel}
      headerActions={
        budget && (
          <Flex align="center" gap={3} flexShrink={0} wrap="wrap">
            <Button
              title={text.list.actions.whatsapp}
              icon={FaWhatsapp as ElementType}
              variant="outline"
              size="sm"
              onClick={() => handleWhatsappClick(budget.uuid)}
              disabled={isActioning}
            />
            <Button
              title={text.list.actions.email}
              icon={FiMail as ElementType}
              variant="outline"
              size="sm"
              onClick={() => sendEmail(budget.uuid)}
              disabled={isSendingEmail}
            />
            <Button
              title={text.list.actions.report}
              icon={FiFileText as ElementType}
              variant="outline"
              size="sm"
              onClick={() => handleGenerateReport(budget.uuid)}
              disabled={isActioning}
            />
            <Button
              title={text.list.actions.copyLink}
              icon={FiLink as ElementType}
              variant="outline"
              size="sm"
              onClick={() => handleCopyPublicLink(budget.uuid, budget.hash)}
              disabled={isActioning}
            />
            {canEdit && isEditable && (
              <Button
                title={text.list.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${BUDGET_LIST_ROUTE}/${budget.uuid}`)}
              />
            )}
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
              bg={budget ? `${budgetStatusColor[budget.status]}.500` : 'gray.500'}
            />
            <Text fontSize="sm" color="fg.muted">
              {budget?.status_label ?? text.singularLabel}
            </Text>
          </Flex>
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
              <InfoField label={text.list.columns.code} value={budget?.code ?? noData} />
              <InfoField
                label={text.list.columns.date}
                value={budget?.date ? formatDate(budget.date, 'dd/MM/yyyy') : noData}
              />
              <InfoField
                label={text.list.columns.client}
                value={budget ? formatClientLabel(budget.client) : noData}
              />
              <InfoField label={text.list.columns.user} value={budget?.responsavel ?? noData} />
              <InfoField label={text.list.columns.status} value={budget?.status_label ?? noData} />
              <InfoField label={text.form.fields.header.note} value={budget?.note ?? noData} />
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
            {(budget?.items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyItems}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{itemText.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.unit}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.discount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{itemText.total}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(budget?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.product?.unit ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.amount)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.discount ?? 0)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.total)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Pagamentos (+ parcelamento detalhado, quando
              `installments > 1`) — `installment_details` exibido tal como
              persistido, sem recalcular (`calcInstallments` NÃO roda aqui). ---- */}
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
              {detailText.sections.payments}
            </Text>
            {(budget?.payments ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyPayments}
              </Text>
            ) : (
              <Flex direction="column" gap={4}>
                {(budget?.payments ?? []).map((payment: BudgetPaymentData) => {
                  const details = payment.installment_details;
                  const showFinancialBlock = payment.installments > 1 && !!details;

                  return (
                    <Box
                      key={payment.uuid}
                      p={4}
                      bg="bg.panel"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="border.subtle"
                    >
                      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {budgetPaymentMethodOptions.getLabel(payment.payment_method, languageGB)}
                        </Text>
                        {payment.is_selected && (
                          <Badge colorPalette="green" variant="subtle">
                            {detailText.isSelectedLabel}
                          </Badge>
                        )}
                      </Flex>

                      <SimpleGrid columns={columnsForm.default} gap={4}>
                        <InfoField
                          label={paymentText.installments}
                          value={String(payment.installments)}
                        />
                        <InfoField label={paymentText.interval} value={String(payment.interval)} />
                        <InfoField
                          label={paymentText.dueDate}
                          value={formatDate(payment.due_date, 'dd/MM/yyyy')}
                        />
                        <InfoField
                          label={paymentText.total}
                          value={formatCurrencyBRL(payment.total)}
                        />
                      </SimpleGrid>

                      {showFinancialBlock && details && (
                        <Box mt={4} pt={4} borderTop="1px dashed" borderColor="border.subtle">
                          <Text fontSize="sm" fontWeight="semibold" mb={3}>
                            {financialText.sectionTitle}
                          </Text>

                          <SimpleGrid columns={columnsForm.threeColumns} gap={4} mb={4}>
                            <InfoField
                              label={financialText.hasInput}
                              value={
                                details.has_input
                                  ? languageGB.defaltStrings.yes
                                  : languageGB.defaltStrings.no
                              }
                            />
                            {details.has_input && (
                              <>
                                <InfoField
                                  label={financialText.inputDate}
                                  value={
                                    details.input_date
                                      ? formatDate(details.input_date, 'dd/MM/yyyy')
                                      : noData
                                  }
                                />
                                <InfoField
                                  label={financialText.inputValue}
                                  value={formatCurrencyBRL(details.input_value ?? 0)}
                                />
                              </>
                            )}
                            <InfoField
                              label={financialText.qtdInstallments}
                              value={String(details.qtd_installments ?? noData)}
                            />
                            <InfoField
                              label={financialText.firstInstallment}
                              value={
                                details.first_installment
                                  ? formatDate(details.first_installment, 'dd/MM/yyyy')
                                  : noData
                              }
                            />
                            <InfoField
                              label={financialText.intInstallments}
                              value={String(details.int_installments ?? noData)}
                            />
                            <InfoField
                              label={financialText.fiscalDocument}
                              value={
                                details.fiscal_document
                                  ? languageGB.defaltStrings.yes
                                  : languageGB.defaltStrings.no
                              }
                            />
                          </SimpleGrid>

                          {details.installments.length > 0 && (
                            <Box overflowX="auto">
                              <Table.Root size="sm">
                                <Table.Header>
                                  <Table.Row>
                                    <Table.ColumnHeader>
                                      {financialText.installmentsTable.date}
                                    </Table.ColumnHeader>
                                    <Table.ColumnHeader>
                                      {financialText.installmentsTable.value}
                                    </Table.ColumnHeader>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  {details.installments.map((installment, index) => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <Table.Row key={`${payment.uuid}-${index}`}>
                                      <Table.Cell>
                                        {formatDate(installment.date, 'dd/MM/yyyy')}
                                      </Table.Cell>
                                      <Table.Cell>
                                        {formatCurrencyBRL(installment.value)}
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
                  );
                })}
              </Flex>
            )}
          </Box>

          {/* ---- Seção 4 — Totais (SEMPRE valores persistidos do servidor —
              sem recalcular, fonte única de verdade CV-02/03/04). ---- */}
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
                value={budget ? formatCurrencyBRL(budget.subtotal) : noData}
              />
              <InfoField
                label={text.form.fields.footer.freight}
                value={budget ? formatCurrencyBRL(budget.freight) : noData}
              />
              <InfoField
                label={text.form.fields.footer.discount}
                value={budget ? formatCurrencyBRL(budget.discount) : noData}
              />
              <InfoField
                label={text.form.fields.footer.total}
                value={budget ? formatCurrencyBRL(budget.total) : noData}
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
