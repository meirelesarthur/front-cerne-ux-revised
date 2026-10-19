// src/pages/Public/Budget/BudgetPublicForm.tsx
// -----------------------------------------------------------------------------
// Formulário PÚBLICO de resposta ao Orçamento (Budget — Operacional /
// Vendas, F-018, 97-Esteiras/054, TASK-BG-FE-06). Consumido por `index.tsx`
// quando `budget.status <= 2` — o estado "já respondido" é resolvido pelo
// PAI (`index.tsx`, mirror CB-52), este componente nunca decide sozinho se
// deve renderizar.
//
// Somente-leitura dos dados do orçamento (cliente/itens/pagamentos/totais —
// reaproveita a MESMA formatação de `BudgetItemsEditor`/`BudgetDetalhe.tsx`
// em modo leitura pura, SEM `useFieldArray`/RHF mutável para os itens, que
// são só exibição, `budgets-frontend-contract.md §5.5`). A única entrada do
// cliente é a ESCOLHA de um `payment.uuid` JÁ CADASTRADO no orçamento
// (`Select`, NUNCA cria pagamento novo, mirror `SV-02`: `Rule::exists`
// payment pertence ao budget) + a decisão Aprovar/Negar.
//
// `useMutation` DIRETO (mirror Padrão 12 — "mutations diretas com
// onSuccess/onError + toaster", NUNCA `useRequest`, que invalida
// `queryKey`/usa `languageGB.defaltStrings.*` pensado para a app
// autenticada) sobre `answerPublicBudget(hash, {answer, payment_uuid})`.
//
// Guarda de estado (SV-03, `BusinessRuleException` → 422, mensagem literal
// "Orcamento já finalizado"): tratada como QUALQUER 422 desta rota — a
// mensagem do servidor SEMPRE vence sobre qualquer texto local, e o PAI
// reconsulta o `GET` para cair no banner "já respondido" automaticamente
// (fonte da verdade de `status` é sempre o servidor, nunca um estado local
// otimista deste componente).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1) — nenhum import de
// `@/contexts/AuthContext`/`@/hooks/useAuth`/`@/stores/*Farm*`/
// `@/services/api` neste arquivo nem em nenhum componente do subtree
// `src/pages/Public/**` (checável por grep/lint de import).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Table, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';

import { budgetPaymentMethodOptions } from '@/constants/Budgets/options';
import { columnsForm } from '@/constants/coluns-form';

import { answerPublicBudget } from '@/services/v2/Budgets/budget-public-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { BudgetData, PublicBudgetAnswerPayload } from '@/@types/v2/Budgets';

export interface BudgetPublicFormProps {
  hash: string;
  budget: BudgetData;
  /** Acionado após PUT bem-sucedido OU 422 `BusinessRuleException`
   *  (guarda de estado, SV-03) — em AMBOS os casos o PAI (`index.tsx`)
   *  deve reconsultar o `GET`, nunca confiar num estado local otimista. */
  onAnsweredOrAlreadyAnswered: () => void;
}

function formatClientLabel(client: BudgetData['client']): string {
  if (!client?.name) return '—';
  return client.nif ? `${client.name} - ${client.nif}` : client.name;
}

function buildPaymentOptions(budget: BudgetData, languageGB: LanguageDate): Option<string>[] {
  return budget.payments.map((payment) => ({
    value: payment.uuid,
    label: `${budgetPaymentMethodOptions.getLabel(payment.payment_method, languageGB)} — ${payment.installments}x — ${formatCurrencyBRL(payment.total)}`,
  }));
}

export function BudgetPublicForm({
  hash,
  budget,
  onAnsweredOrAlreadyAnswered,
}: BudgetPublicFormProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.budgets.budget;
  const publicText = text.publicForm;
  const itemText = text.form.fields.item;
  const footerText = text.form.fields.footer;
  const noData = '—';

  const [selectedPayment, setSelectedPayment] = useState<Option<string> | null>(null);
  const [paymentError, setPaymentError] = useState<string | undefined>(undefined);

  const paymentOptions = buildPaymentOptions(budget, languageGB);

  const answerMutation = useMutation({
    mutationFn: (payload: PublicBudgetAnswerPayload) => answerPublicBudget(hash, payload),
    onSuccess: (_, variables) => {
      toaster.success({
        title: publicText.pageTitle,
        description: variables.answer
          ? publicText.approveSuccessToast
          : publicText.denySuccessToast,
        duration: 7000,
      });
      onAnsweredOrAlreadyAnswered();
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data as { message?: string } | undefined;

        // 429 — rate limit defensivo (`## 7` do contrato de tela). NUNCA
        // decidir um cooldown/retry automático aqui.
        if (status === 429) {
          toaster.error({
            title: publicText.pageTitle,
            description: publicText.rateLimitedError,
            duration: 9000,
          });
          return;
        }

        // 422 — `BusinessRuleException` (SV-03, guarda de estado: orçamento
        // já finalizado por outra resposta entre o GET e este PUT). A
        // mensagem literal do backend SEMPRE vence — o servidor é a
        // autoridade sobre `status`, o PAI reconsulta e troca para o banner
        // "já respondido" a partir do dado real, nunca um texto fixo aqui.
        if (status === 422) {
          toaster.error({
            title: publicText.pageTitle,
            description: body?.message || publicText.errorFallback,
            duration: 9000,
          });
          onAnsweredOrAlreadyAnswered();
          return;
        }

        toaster.error({
          title: publicText.pageTitle,
          description: body?.message || publicText.errorFallback,
          duration: 9000,
        });
        return;
      }

      toaster.error({
        title: publicText.pageTitle,
        description: publicText.errorFallback,
        duration: 9000,
      });
    },
  });

  const isSubmitting = answerMutation.isPending;

  function handleApprove() {
    if (!selectedPayment) {
      setPaymentError(publicText.paymentSelection.requiredError);
      return;
    }
    setPaymentError(undefined);
    answerMutation.mutate({ answer: true, payment_uuid: selectedPayment.value });
  }

  function handleDeny() {
    setPaymentError(undefined);
    answerMutation.mutate({ answer: false, payment_uuid: selectedPayment?.value ?? '' });
  }

  return (
    <Flex direction="column" gap={6}>
      {/* ---- Cabeçalho — cliente/código/data (mirror farmLabel/purchaseCodeLabel
          de `RequestQuotationPublicPage`) ---- */}
      <Flex direction="column" gap={1} fontSize="sm" color="fg.muted">
        <Text>
          {publicText.clientLabel}: {formatClientLabel(budget.client)}
        </Text>
        <Text>
          {text.list.columns.code}: {budget.code}
        </Text>
        <Text>
          {text.list.columns.date}: {formatDate(budget.date, 'dd/MM/yyyy')}
        </Text>
      </Flex>

      {/* ---- Itens — somente leitura (reaproveita a formatação de
          `BudgetItemsEditor`/`BudgetDetalhe.tsx`, sem RHF mutável) ---- */}
      <Box>
        <Text fontSize="sm" fontWeight="semibold" mb={3}>
          {itemText.sectionTitle}
        </Text>
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
              {budget.items.map((row) => (
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
      </Box>

      {/* ---- Totais — SEMPRE valores persistidos do servidor (sem
          recalcular no cliente, CV-02/03/04). ---- */}
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Text fontSize="sm">
          {footerText.subtotal}: {formatCurrencyBRL(budget.subtotal)}
        </Text>
        <Text fontSize="sm">
          {footerText.freight}: {formatCurrencyBRL(budget.freight)}
        </Text>
        <Text fontSize="sm">
          {footerText.discount}: {formatCurrencyBRL(budget.discount)}
        </Text>
        <Text fontSize="sm" fontWeight="semibold">
          {footerText.total}: {formatCurrencyBRL(budget.total)}
        </Text>
      </SimpleGrid>

      {/* ---- Seção de resposta — escolha de UM pagamento já cadastrado
          (mirror SV-02, `Rule::exists` payment pertence ao budget — NUNCA
          cria pagamento novo) + Aprovar/Negar. ---- */}
      <Box pt={2} borderTop="1px solid" borderColor="border.subtle">
        <Text fontSize="sm" fontWeight="semibold" mb={3}>
          {publicText.paymentSelection.title}
        </Text>
        <Select
          name="payment_uuid"
          label={publicText.paymentSelection.label}
          placeholder={publicText.paymentSelection.placeholder}
          options={paymentOptions}
          value={selectedPayment}
          onChange={(value) => {
            setSelectedPayment(value as Option<string> | null);
            setPaymentError(undefined);
          }}
          error={paymentError}
          isDisabled={isSubmitting}
          noClearable
        />

        <Flex justify="flex-end" gap={3} mt={6}>
          <Button
            title={publicText.denyButton}
            variant="outline"
            colorPalette="red"
            onClick={handleDeny}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
          <Button
            title={publicText.approveButton}
            onClick={handleApprove}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </Flex>
      </Box>
    </Flex>
  );
}
