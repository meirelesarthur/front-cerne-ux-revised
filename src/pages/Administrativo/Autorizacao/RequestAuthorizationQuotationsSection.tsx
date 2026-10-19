// src/pages/Administrativo/Autorizacao/RequestAuthorizationQuotationsSection.tsx
// -----------------------------------------------------------------------------
// Bloco "Cotações" da Autorização e da Ciência (execução 081, T-081-FE-06; legado
// `_forms.blade.php:292-409`). Lista da 2ª query (`listRequestQuotationsByPurchase`).
//
// Colunas do legado: (checkbox), Dt. Cotação, Fornecedor, Forma de pagamento (+),
// Vl.Total, Valor com Desconto, Responsável e "Visualizar". O checkbox só aparece
// quando a cotação tem forma de pagamento (escolhida ou condição única); o "+" abre
// `ChooseQuotationPaymentDialog` (PUT `selected-payment`). Botão "Mapa de Cotações"
// no cabeçalho (`QuotationsMapButton`, compartilhado) e "Justificativa" da cotação
// quando a API a enviar. Ciência (`readOnly`): sem checkbox e sem "+".
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, EmptyState, Flex, Icon, Skeleton, Table, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiEye } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { IconButtonTable } from '@/components/IconButtonTable';
import { QuotationsMapButton } from '@/components/Suprimentos/QuotationsMapButton';
import { Checkbox } from '@/components/ui/checkbox';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

import { quotationHasPayment, selectedPayment } from './authorizationRules';
import { ChooseQuotationPaymentDialog } from './ChooseQuotationPaymentDialog';

import { RequestQuotationDetailDialog } from '../Solicitacao/RequestQuotationDetailDialog';

const NO_DATA = '—';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface RequestAuthorizationQuotationsSectionProps {
  /** `uuid` da solicitação — usado pelo Mapa de Cotações. */
  requestPurchaseUuid: string;
  quotations: RequestQuotationData[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedQuotationUuids: string[];
  onToggleQuotation: (quotationUuid: string) => void;
  /** "Justificativa" da cotação (somente leitura; só aparece quando a API enviar). */
  quotationJustification?: string | null;
  /** Ciência: só leitura (sem checkbox e sem escolher forma de pagamento). */
  readOnly?: boolean;
  /** Permissão de escrita (`request-authorization_edit`) para escolher o pagamento. */
  canEdit?: boolean;
}

export function RequestAuthorizationQuotationsSection({
  requestPurchaseUuid,
  quotations,
  isLoading,
  isError,
  onRetry,
  selectedQuotationUuids,
  onToggleQuotation,
  quotationJustification,
  readOnly = false,
  canEdit = true,
}: RequestAuthorizationQuotationsSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.quotations;

  const [payingQuotationUuid, setPayingQuotationUuid] = useState<string | null>(null);
  const [viewingQuotationUuid, setViewingQuotationUuid] = useState<string | null>(null);

  const showSelection = !readOnly;
  const showPaymentAction = !readOnly && canEdit;
  const payingQuotation = quotations.find((quotation) => quotation.uuid === payingQuotationUuid);
  // ADITIVO (esteira 112, F-088) — já carregada via `data.quotations` (prop
  // `quotations` desta Seção); passada ao diálogo "Visualizar" para pular o
  // fetch gateado por `request-quotation_view` (403 pro Autorizador).
  const viewingQuotation = quotations.find((quotation) => quotation.uuid === viewingQuotationUuid);

  return (
    <Box>
      <Flex
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={3}
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Text fontSize="sm" fontWeight="semibold" color="fg.default">
          {text.title}
        </Text>
        <QuotationsMapButton
          requestPurchaseUuid={requestPurchaseUuid}
          quotationsCount={quotations.length}
        />
      </Flex>

      {!readOnly && quotations.length > 0 && (
        <Box
          role="note"
          mb={4}
          px={3}
          py={2}
          borderRadius="md"
          bg="orange.subtle"
          color="orange.fg"
          fontSize="sm"
        >
          {text.hint}
        </Box>
      )}

      {isLoading ? (
        <VStack gap={3} align="stretch">
          <Skeleton height="40px" borderRadius="lg" />
          <Skeleton height="40px" borderRadius="lg" />
        </VStack>
      ) : isError ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.errorState.title}</EmptyState.Title>
              <EmptyState.Description>{text.errorState.description}</EmptyState.Description>
            </VStack>
            <Button title={text.errorState.retry} variant="outline" size="sm" onClick={onRetry} />
          </EmptyState.Content>
        </EmptyState.Root>
      ) : quotations.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {text.empty}
        </Text>
      ) : (
        <Box overflowX="auto">
          <Text fontSize="xs" color="fg.muted" mb={2}>
            {text.recordsCount} {quotations.length}
          </Text>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                {showSelection && <Table.ColumnHeader>{text.table.select}</Table.ColumnHeader>}
                <Table.ColumnHeader>{text.table.date}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.table.provider}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.table.payment}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">{text.table.total}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">{text.table.net}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.table.responsible}</Table.ColumnHeader>
                <Table.ColumnHeader>{text.table.actions}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {quotations.map((quotation) => {
                const netValue = quotation.total_value - quotation.discount;
                const payment = selectedPayment(quotation);

                return (
                  <Table.Row key={quotation.uuid}>
                    {showSelection && (
                      <Table.Cell>
                        {quotationHasPayment(quotation) && (
                          <Checkbox
                            checked={selectedQuotationUuids.includes(quotation.uuid)}
                            onCheckedChange={() => onToggleQuotation(quotation.uuid)}
                            aria-label={text.table.select}
                          />
                        )}
                      </Table.Cell>
                    )}
                    <Table.Cell>
                      {quotation.quotation_date ? formatDate(quotation.quotation_date) : NO_DATA}
                    </Table.Cell>
                    <Table.Cell>{quotation.provider?.name ?? NO_DATA}</Table.Cell>
                    <Table.Cell>
                      <Flex align="center" gap={2}>
                        <Text fontSize="sm">{payment?.payment_method_label ?? NO_DATA}</Text>
                        {showPaymentAction && (
                          <IconButtonTable
                            aria-label={text.choosePaymentButton}
                            mensegerTooltip={text.choosePaymentButton}
                            variant="outline"
                            size="xs"
                            onClick={() => setPayingQuotationUuid(quotation.uuid)}
                          >
                            +
                          </IconButtonTable>
                        )}
                      </Flex>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      {formatCurrencyBRL(quotation.total_value)}
                    </Table.Cell>
                    <Table.Cell textAlign="end">{formatCurrencyBRL(netValue)}</Table.Cell>
                    <Table.Cell>{quotation.user?.name ?? NO_DATA}</Table.Cell>
                    <Table.Cell>
                      <IconButtonTable
                        aria-label={text.viewButton}
                        mensegerTooltip={text.viewButton}
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingQuotationUuid(quotation.uuid)}
                      >
                        <Icon as={FiEye} />
                      </IconButtonTable>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      {!!quotationJustification && (
        <Box mt={4}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={1}
          >
            {
              languageGB.requestAuthorizations.requestAuthorization.detail.info
                .quotationJustification
            }
          </Text>
          <Text fontSize="sm" color="fg.default">
            {quotationJustification}
          </Text>
        </Box>
      )}

      <ChooseQuotationPaymentDialog
        isOpen={!!payingQuotation}
        onClose={() => setPayingQuotationUuid(null)}
        quotation={payingQuotation ?? null}
      />

      <RequestQuotationDetailDialog
        isOpen={!!viewingQuotationUuid}
        onClose={() => setViewingQuotationUuid(null)}
        quotationUuid={viewingQuotationUuid}
        quotation={viewingQuotation}
      />
    </Box>
  );
}
