// src/pages/Administrativo/Autorizacao/ChooseQuotationPaymentDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo "Formas de pagamento" da cotação (legado `show-pay`, botão "+"; execução
// 081, T-081-FE-06, DEP-API-06). Lista as condições da PRÓPRIA cotação
// (`quotation.payments[]`, sem GET extra) e grava a escolhida com
// `PUT request-quotations/{uuid}/selected-payment { request_quotation_payment_uuid }`
// (T-081-API-07). Depois invalida o DETALHE da Autorização (esteira 112, F-088 —
// as cotações passaram a vir embutidas em `data.quotations`), que passa a
// trazer `selected_payment_uuid` (o checkbox da cotação só aparece com pagamento).
// Mutação via `useRequest` (toast + invalidação), erro de negócio em toast.
// -----------------------------------------------------------------------------

import { Flex, Table, Text } from '@chakra-ui/react';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { selectRequestQuotationPayment } from '@/services/v2/RequestQuotations/request-quotation-service';

import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

export interface ChooseQuotationPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Cotação cujas condições são listadas — `null` = diálogo fechado. */
  quotation: RequestQuotationData | null;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ChooseQuotationPaymentDialog({
  isOpen,
  onClose,
  quotation,
}: ChooseQuotationPaymentDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestAuthorizations.requestAuthorization.detail.choosePayment;

  const selectMutation = useRequest({
    asyncFunction: async (paymentUuid: string) =>
      selectRequestQuotationPayment(quotation!.uuid, {
        request_quotation_payment_uuid: paymentUuid,
      }),
    entityName: languageGB.requestAuthorizations.requestAuthorization.singularLabel,
    // ADITIVO esteira 112 (F-088) — a lista de cotações desta tela vem embutida
    // no detalhe da Autorização (`data.quotations`), não mais de
    // `requestQuotationsByPurchase`; invalidar o detalhe é o que atualiza
    // `selected_payment_uuid` após a escolha (preserva o fluxo de aprovação).
    queryKey: queryKey.requestAuthorizations.requestAuthorization,
    typesRequest: 'update',
    personalizedMessage: text.selectedToast,
    actionSuccess: () => onClose(),
  });

  const payments = quotation?.payments ?? [];

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={text.title}
      size="lg"
      footer={
        <Flex gap={3}>
          <Button
            title={languageGB.defaltStrings.close}
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={selectMutation.isPending}
          />
        </Flex>
      }
    >
      {payments.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {text.empty}
        </Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{text.table.method}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.table.installments}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.table.interval}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.table.installmentValue}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.table.total}</Table.ColumnHeader>
              <Table.ColumnHeader>{text.table.actions}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payments.map((payment) => (
              <Table.Row key={payment.uuid}>
                <Table.Cell>{payment.payment_method_label}</Table.Cell>
                <Table.Cell>{payment.installments}</Table.Cell>
                <Table.Cell>{payment.interval}</Table.Cell>
                <Table.Cell>{formatCurrencyBRL(payment.amount)}</Table.Cell>
                <Table.Cell>{formatCurrencyBRL(payment.total)}</Table.Cell>
                <Table.Cell>
                  <Button
                    title={text.selectButton}
                    size="xs"
                    variant={
                      quotation?.selected_payment_uuid === payment.uuid ? 'solid' : 'outline'
                    }
                    type="button"
                    onClick={() => selectMutation.mutate(payment.uuid)}
                    loading={selectMutation.isPending && selectMutation.variables === payment.uuid}
                    disabled={selectMutation.isPending}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </CustomDialog>
  );
}
