// src/pages/Operacional/Romaneios/RomaneioDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) do Romaneio — TASK-TRF-FE-05, última fatia
// da execução 001. Rota: /operacional/romaneios/:transferUuid/detalhe, gate
// `transfers_view` (src/router/index.tsx).
//
// GAP-TRF-FE-10 (aprovado) — tela DEDICADA, não o formulário em modo
// desabilitado. Molde de código (sibling-first): `src/pages/Invoices/
// InvoiceDetalhe.tsx` — sem `useForm`, seções sequenciais, `checkLoadingStatus`,
// `EmptyState`, footer com Voltar/Editar gateado. Análogos do DS (UX-GAP, a
// tela não existe no `cerne`): `CentroCustoDetalhe.tsx`/`ProdutoDetalhe.tsx`
// (front-contract-romaneios.md §2.3/§6).
//
// 5 seções, na ordem do contrato §6: Cabeçalho · Avisos (`TransferGuardBanners`,
// reusado da FE-02, NÃO reimplementado) · Itens · Totais · Despesas acessórias.
//
// Armadilhas desta Tarefa (não descobrir na marra):
//   1. SEM `useForm` — leitura direta de `transferQuery.data` (`TransferDetail`).
//   2. SEM catálogo de select chamado — todo rótulo vem hidratado do payload
//      (`product.description`, `warehouse.description`, `measurement.description`,
//      `package.description`, `payment_term.description`, `type_title.description`,
//      `user.label`, `*_label` dos enums). ZERO chamada a `*/options` aqui.
//   3. `serie`/`salesman` SÓ existem nesta tela (`FC-TYPE-06`) — o Resource os
//      expõe, o Request não os aceita; se sumissem daqui, o dado ficaria
//      invisível no produto inteiro.
//   4. `sale_contract_id_legacy` — informação de vínculo legado, NUNCA link
//      (não há tela de Contrato de Venda).
//   5. `client`/`proprietary`/`seller`/`transporter` e `expenses[].provider`
//      vêm como `{uuid, name}` (DD-078-04, T-078-API-04) — o nome é exibido
//      direto do payload, SEM GET satélite; ausente → "—" (nunca o uuid).
//   6. Totais vêm do servidor, sem recálculo — só formata.
//   7. `discount` pode vir `null`; os demais monetários são `float`.
//   8. Sem coluna de armazém/estorno na tabela de despesas — o payload não os
//      traz nesta tela (contrato §6 lista as 8 colunas exatas).
//   9. SEM "Imprimir"/"Duplicar"/"Emitir NFe"/"Gerar Financeiro" — ausência
//      limpa (GAP-TRF-FE-11), nenhum botão morto. "Finalizar" vive só no menu
//      da listagem (`RomaneioActionsMenu`, UT-000728), como em Carregamento.
//  10. "Editar" no footer respeita as travas (`has_fiscal_document`/
//      `has_financial_posting`) com `Tooltip` — nunca botão morto sem
//      explicação, mesmo racional de `RomaneioActionsMenu.tsx`.
//  11. Guard de UUID malformado ANTES de renderizar — mesmo racional de
//      `CreateOrUpdateRomaneio.tsx`/`AppropriationDetalhe.tsx`: redireciona
//      para a listagem. 404 real (uuid válido, romaneio inexistente) segue o
//      MESMO padrão de `InvoiceDetalhe.tsx`/`AppropriationDetalhe.tsx` — um
//      `EmptyState` "não encontrado" com botão de volta explícito, não um
//      redirect automático (consistência com as 2 outras telas de Visualização
//      já entregues no fork; "aviso" = a mensagem do EmptyState).
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
import { FiAlertTriangle, FiEdit, FiInbox } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';

import type { TransferDetail } from '@/@types/v2/Transfers';

import { TransferGuardBanners } from './TransferGuardBanners';
import { useTransferDetail } from './useRomaneios';

const ROMANEIOS_LIST_ROUTE = '/operacional/romaneios';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercentage(value: number): string {
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
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

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      mb={4}
      pb={2}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      {children}
    </Text>
  );
}

export default function RomaneioDetalhe() {
  const { transferUuid } = useParams<{ transferUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.transfers.transfer;
  const formText = text.form;
  const detailText = text.detail;
  const noData = '—';

  // Armadilha #11 — guard de UUID malformado ANTES de qualquer chamada.
  useEffect(() => {
    if (!isValidGuid(transferUuid)) {
      navigate(ROMANEIOS_LIST_ROUTE, { replace: true });
    }
  }, [transferUuid, navigate]);

  const transferQuery = useTransferDetail(isValidGuid(transferUuid) ? transferUuid : undefined);

  const isLoading = checkLoadingStatus([transferQuery as any]);
  const item = transferQuery.data as TransferDetail | undefined;
  const notFound = !isLoading && (transferQuery as any).isError;

  if (!isValidGuid(transferUuid)) {
    return null;
  }

  const canEdit = can('transfers_edit');
  const isLocked = !!item && (item.has_fiscal_document || item.has_financial_posting);

  if (notFound) {
    return (
      <FormContainer title={formText.notFound}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{formText.notFound}</EmptyState.Title>
                <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={detailText.notFound.back}
                variant="outline"
                size="sm"
                onClick={() => navigate(ROMANEIOS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // DD-078-04 — rótulos vêm do payload (`{uuid, name}`); sem `name` cai em
  // `noData` ("sem dado"), NUNCA no uuid.
  const clientLabel = item?.client?.name || noData;
  const proprietaryLabel = item?.proprietary?.name || noData;
  const sellerLabel = item?.seller?.name || noData;
  const transporterLabel = item?.transporter?.name || noData;

  function providerLabelFor(provider: { name?: string | null } | null | undefined): string {
    return provider?.name || noData;
  }

  return (
    <FormContainer
      title={item ? `${text.singularLabel} nº ${item.code}` : text.singularLabel}
      footer={
        <>
          <Button
            title={formText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canEdit && (
            <Button
              title={text.list.actions.edit}
              icon={FiEdit as ElementType}
              type="button"
              disabled={isLocked}
              tooltip={isLocked ? text.list.actions.editDisabledTooltip : undefined}
              onClick={() => navigate(`${ROMANEIOS_LIST_ROUTE}/${transferUuid}`)}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? clientLabel : text.singularLabel}
          </Text>
        </Skeleton>

        <TransferGuardBanners detail={item} languageGB={languageGB} />

        <Flex direction="column" gap={6} mt={2}>
          {/* ---- Seção 1 — Cabeçalho (contrato §6) ---- */}
          <Box>
            <SectionTitle>{formText.tabs.header}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.list.table.code} value={item ? String(item.code) : noData} />
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={1}
                >
                  {text.list.table.status}
                </Text>
                {item ? (
                  <Badge colorPalette={item.status === 'F' ? 'green' : 'red'} variant="subtle">
                    {item.status_label}
                  </Badge>
                ) : (
                  <Text fontSize="sm">{noData}</Text>
                )}
              </Box>
              <InfoField label={formText.fields.type} value={item?.type_label ?? noData} />
              <InfoField
                label={formText.fields.dtSale}
                value={item ? formatDate(item.dt_sale) : noData}
              />
              <InfoField
                label={formText.fields.dtShipping}
                value={item ? formatDate(item.dt_shipping) : noData}
              />
              <InfoField
                label={formText.fields.dueDate}
                value={item?.due_date ? formatDate(item.due_date) : noData}
              />
              <InfoField label={formText.fields.client} value={clientLabel} />
              <InfoField label={formText.fields.user} value={item?.user?.label ?? noData} />
              <InfoField label={formText.fields.seller} value={sellerLabel} />
              <InfoField
                label={formText.fields.commission}
                value={
                  item?.commission !== undefined && item?.commission !== null
                    ? formatPercentage(item.commission)
                    : noData
                }
              />
              <InfoField label={formText.fields.nfe} value={item?.nfe || noData} />
              <InfoField label={detailText.fields.serie} value={item?.serie || noData} />
              <InfoField label={detailText.fields.salesman} value={item?.salesman || noData} />
              <InfoField
                label={formText.fields.paymentTerm}
                value={item?.payment_term?.description ?? noData}
              />
              <InfoField
                label={formText.fields.typePayment}
                value={item?.type_payment_label ?? noData}
              />
              <InfoField
                label={formText.fields.paymentIndicator}
                value={item?.payment_indicator_label ?? noData}
              />
              <InfoField
                label={formText.fields.typeTitle}
                value={item?.type_title?.description ?? noData}
              />
              <InfoField label={formText.fields.transporter} value={transporterLabel} />
              <InfoField label={formText.fields.proprietary} value={proprietaryLabel} />
              <InfoField label={formText.fields.driver} value={item?.driver || noData} />
              <InfoField
                label={formText.fields.fiscalDocument}
                value={
                  item
                    ? item.fiscal_document
                      ? languageGB.defaltStrings.yes
                      : languageGB.defaltStrings.no
                    : noData
                }
              />
              {!!item?.sale_contract_id_legacy && (
                <InfoField
                  label={detailText.fields.saleContractLegacy}
                  value={`#${item.sale_contract_id_legacy}`}
                />
              )}
            </SimpleGrid>
            {item?.note && (
              <Box mt={4}>
                <InfoField label={formText.fields.note} value={item.note} />
              </Box>
            )}
          </Box>

          {/* ---- Seção 2 — Itens (contrato §6) ---- */}
          <Box>
            <SectionTitle>{formText.sections.items}</SectionTitle>
            {(item?.items ?? []).length === 0 && !isLoading ? (
              <Text fontSize="sm" color="fg.muted">
                {noData}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{formText.itemRow.fields.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.warehouse}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.measurement}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.package}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.lot}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.totalAmount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.discardKg}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {formText.itemRow.fields.discardPercentage}
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.itemRow.fields.note}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>
                          {row.warehouse?.description ?? formText.itemRow.fields.noStock}
                        </Table.Cell>
                        <Table.Cell>{row.measurement?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.package?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.lot ?? noData}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.amount)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.total_amount)}</Table.Cell>
                        <Table.Cell>{row.discard_kg ?? noData}</Table.Cell>
                        <Table.Cell>
                          {row.discard_percentage !== null && row.discard_percentage !== undefined
                            ? formatPercentage(row.discard_percentage)
                            : noData}
                        </Table.Cell>
                        <Table.Cell>{row.note ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Totais (contrato §6) — sem recálculo, só formata ---- */}
          <Box>
            <SectionTitle>{formText.sections.totals}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={formText.totals.fields.totalProducts}
                value={item ? formatCurrencyBRL(item.total_products) : noData}
              />
              <InfoField
                label={formText.totals.fields.icms}
                value={item ? formatCurrencyBRL(item.icms) : noData}
              />
              <InfoField
                label={formText.totals.fields.freight}
                value={item ? formatCurrencyBRL(item.freight) : noData}
              />
              <InfoField
                label={formText.totals.fields.othersValues}
                value={item ? formatCurrencyBRL(item.others_values) : noData}
              />
              {/* Armadilha #7 — `discount` é o único monetário que pode vir `null`. */}
              <InfoField
                label={formText.totals.fields.discount}
                value={
                  item?.discount !== null && item?.discount !== undefined
                    ? formatCurrencyBRL(item.discount)
                    : noData
                }
              />
              <InfoField
                label={formText.totals.fields.funruralPercentage}
                value={item ? formatPercentage(item.funrural_percentage) : noData}
              />
              <InfoField
                label={formText.totals.fields.funrural}
                value={item ? formatCurrencyBRL(item.funrural) : noData}
              />
              <InfoField
                label={formText.totals.fields.total}
                value={item ? formatCurrencyBRL(item.total) : noData}
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 4 — Despesas acessórias (contrato §6) ----
              8 colunas EXATAS do contrato — SEM armazém/estorno (armadilha #8,
              o payload desta tela não os traz para exibição em tabela). */}
          <Box>
            <SectionTitle>{formText.tabs.expenses}</SectionTitle>
            {(item?.expenses ?? []).length === 0 && !isLoading ? (
              <EmptyState.Root size="sm">
                <EmptyState.Content>
                  <EmptyState.Indicator>
                    <Icon as={FiInbox} boxSize={6} color="fg.muted" />
                  </EmptyState.Indicator>
                  <EmptyState.Title>{formText.expenseRow.emptyState}</EmptyState.Title>
                </EmptyState.Content>
              </EmptyState.Root>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{formText.expenseRow.fields.type}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.expenseRow.fields.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.expenseRow.fields.provider}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.expenseRow.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.expenseRow.fields.vlUnit}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.expenseRow.fields.value}</Table.ColumnHeader>
                      <Table.ColumnHeader>{formText.expenseRow.fields.whoPay}</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        {formText.expenseRow.fields.apropriation}
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.expenses ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.type_label}</Table.Cell>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{providerLabelFor(row.provider)}</Table.Cell>
                        <Table.Cell>{row.quantity ?? noData}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.vl_unit ?? 0)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.value ?? 0)}</Table.Cell>
                        <Table.Cell>{row.who_pay_label}</Table.Cell>
                        <Table.Cell>{row.apropriation_label}</Table.Cell>
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
