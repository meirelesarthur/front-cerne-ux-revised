// src/pages/Administrativo/Solicitacao/RequestQuotationDetailDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Ver Cotação" (read-only) — RequestQuotation (Administrativo/
// Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-05). Acionado pela ação
// "Ver" (AM-02, sempre visível com `request-quotation_view`) do card de
// `RequestQuotationTab.tsx` (TASK-CQ-FE-03) — substitui o STUB
// `handleViewQuotation`.
//
// Variante READ-ONLY do Padrão 14 (`get_pwa_complex_screen_compositions_pattern`)
// — mesmo contrato de casca (`Dialog.Root > Portal > Backdrop+Positioner >
// Content`), mas SEM `<form>` e SEM botão de submit no Footer (só "Fechar",
// `languageGB.defaltStrings.close`) — nenhuma ação de escrita nesta tela
// (achado que reduz escopo, roteiro frontend §3.3: não existe, no legado,
// tela admin de EDIÇÃO de payments — quem escreve `RequestQuotationPayment` é
// exclusivamente o formulário público do fornecedor, TASK-CQ-FE-10).
//
// Busca PRÓPRIA por uuid (`getRequestQuotation`, TASK-CQ-FE-01) em vez de
// reaproveitar o objeto já carregado pela grade da aba (`quotes()`) —
// divergência DELIBERADA: `quotes()` eager-loada `items` SEM
// `requestItem.product` e NÃO traz `saving_responsible`/`request_purchase`
// (ver nota de eager-loading em `@/@types/v2/RequestQuotations`); só `show()`
// devolve a resposta completa que esta tela precisa exibir. `useQuery` DIRETO
// (mirror `RequestQuotationTab.tsx`) — não `useCustomFormQueryById`: esta
// tela não tem `useForm` (sem campos editáveis, sem schema, sem `reset`), e
// nenhum outro arquivo deste módulo usa aquele hook — fidelidade ao SIBLING
// real do próprio módulo (Regra 2) prevalece sobre a sugestão genérica do
// roteiro (§3.3), sem qualquer diferença de contrato de dado observável.
// `lazyMount unmountOnExit` no `Dialog.Root` garante refetch a cada abertura
// (sem cache obsoleto entre cotações diferentes).
//
// ADITIVO (UT-000745/F-088, esteira 112) — prop OPCIONAL `quotation` (objeto
// JÁ CARREGADO). A Autorização (`RequestAuthorizationQuotationsSection.tsx`)
// não pode fazer o fetch próprio acima: `getRequestQuotation`/`show()` é
// gateado por `request-quotation_view`, que o Autorizador não tem (mesma
// causa-raiz do 403 do grid, resolvida passando a ler `data.quotations` do
// detalhe da Autorização). Quando `quotation` vem preenchida, o diálogo
// renderiza DIRETO dela e PULA a query (`enabled: false`) — confirmado
// campo a campo que `data.quotations[i]` (mesmo `RequestQuotationResource`,
// agora com `quotations.requestPurchase` também eager-carregado pela API)
// cobre TODOS os campos que `renderContent()` usa, incluindo o breadcrumb
// `request_purchase.code`. Quando `quotation` está ausente (uso em
// `RequestQuotationTab.tsx`, módulo Cotações, que só tem o uuid), o
// comportamento de fetch próprio é mantido EXATAMENTE como antes.
//
// Itens/pagamentos só renderizam com `status===recebida` (CL-036/038/039,
// mirror `show.blade.php:41-149`) — nos demais status a Seção exibe um aviso
// (`text.detail.pendingReceiptNotice`), nunca uma tabela vazia sem contexto.
//
// "DetailGrid" citado no roteiro frontend §3.3/`get_pwa_ui_components_pattern`
// é descritivo, não um componente nomeado real (confirmado por leitura da
// tool) — o layout label-muted+valor abaixo é mirror EXATO de
// `RomaneioDetalhe.tsx`/`InvoiceDetalhe.tsx` (convenção real já estabelecida
// no fork para telas de detalhe read-only).
// -----------------------------------------------------------------------------

import {
  Badge,
  Box,
  Dialog,
  EmptyState,
  Flex,
  Icon,
  Portal,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';
import { requestQuotationRequiresFileOptions } from '@/constants/RequestQuotations/options';
import {
  requestQuotationStatus,
  requestQuotationStatusColor,
} from '@/constants/RequestQuotations/request-quotation-status';
import type { RequestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

import { getRequestQuotation } from '@/services/v2/RequestQuotations/request-quotation-service';

import type {
  RequestQuotationData,
  RequestQuotationItemRow,
  RequestQuotationPaymentRow,
} from '@/@types/v2/RequestQuotations';

export interface RequestQuotationDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `null` enquanto nenhuma cotação está selecionada — controla `enabled`
   *  da query (aqui é só o uuid, não o objeto inteiro — ver cabeçalho do
   *  arquivo sobre por que este Dialog busca os dados sozinho). */
  quotationUuid: string | null;
  /** ADITIVO (esteira 112, F-088) — cotação JÁ CARREGADA (ex.:
   *  `data.quotations[i]` do detalhe da Autorização). Quando presente, o
   *  diálogo renderiza direto dela e NÃO chama `getRequestQuotation` (pula a
   *  query). Ausente = comportamento atual (fetch próprio por `quotationUuid`),
   *  preservado 1:1 para `RequestQuotationTab.tsx` (módulo Cotações). */
  quotation?: RequestQuotationData | null;
}

const NO_DATA = '—';

function formatCurrencyBRL(value: number): string {
  // Mirror do formato já usado em `RequestQuotationTab.tsx`/`Invoices`/
  // `ContasAPagar` (única convenção de moeda de exibição real do projeto).
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mirror EXATO de `RomaneioDetalhe.tsx`/`InvoiceDetalhe.tsx` — convenção real
// de "grid de detalhe read-only" já estabelecida no fork.
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

export function RequestQuotationDetailDialog({
  isOpen,
  onClose,
  quotationUuid,
  quotation: preloadedQuotation,
}: RequestQuotationDetailDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation;
  const detailText = text.detail;

  // `quotation` pré-carregada: pula o fetch (ver cabeçalho do arquivo, ADITIVO
  // esteira 112). `enabled` já cobre esse caso (string vs. boolean), mas o
  // `!preloadedQuotation` deixa a intenção explícita e não depende de
  // detalhe de semântica de `isLoading`/`isError` de query desabilitada.
  const detailQuery = useQuery({
    queryKey: [queryKey.requestQuotations.requestQuotation, quotationUuid],
    queryFn: async () => (await getRequestQuotation(quotationUuid!)).data,
    enabled: isOpen && !!quotationUuid && !preloadedQuotation,
  });

  const quotation = preloadedQuotation ?? detailQuery.data;
  const isLoading = !preloadedQuotation && detailQuery.isLoading;
  const isError = !preloadedQuotation && detailQuery.isError;

  // CL-036/038/039 — itens/pagamentos só existem depois que o fornecedor
  // responde via formulário público (mirror `show.blade.php:41-149`).
  const isReceived = quotation?.status === requestQuotationStatus.recebida;

  function renderItemsTable(items: RequestQuotationItemRow[]) {
    if (items.length === 0) {
      return (
        <Text fontSize="sm" color="fg.muted">
          {detailText.itemsSection.empty}
        </Text>
      );
    }

    const columns = detailText.itemsSection.columns;

    return (
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{columns.description}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.brand}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.quantity}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.unitaryValue}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.total}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.observation}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item, index) => (
              // Sem `uuid` próprio (`RequestQuotationItemRow` nunca é
              // endereçado isoladamente, ver comentário do tipo) — `index` é
              // seguro aqui: lista somente-leitura, nunca reordenada/editada.
              <Table.Row key={item.request_item_uuid ?? index}>
                <Table.Cell>{item.description ?? item.product?.description ?? NO_DATA}</Table.Cell>
                <Table.Cell>{item.brand ?? NO_DATA}</Table.Cell>
                <Table.Cell>{item.quantity}</Table.Cell>
                <Table.Cell>{formatCurrencyBRL(item.amount)}</Table.Cell>
                <Table.Cell>{formatCurrencyBRL(item.total)}</Table.Cell>
                <Table.Cell>{item.observation ?? NO_DATA}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  function renderPaymentsTable(payments: RequestQuotationPaymentRow[]) {
    if (payments.length === 0) {
      return (
        <Text fontSize="sm" color="fg.muted">
          {detailText.paymentsSection.empty}
        </Text>
      );
    }

    const columns = detailText.paymentsSection.columns;

    return (
      <Box overflowX="auto">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{columns.paymentMethod}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.installments}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.interval}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.installmentValue}</Table.ColumnHeader>
              <Table.ColumnHeader>{columns.total}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {payments.map((payment, index) => (
              // Sem identificador próprio (mesmo shape em show()/quotes()/
              // GET .../payments, ver comentário do tipo) — lista
              // somente-leitura, `index` é seguro.
              // eslint-disable-next-line react/no-array-index-key
              <Table.Row key={index}>
                <Table.Cell>{payment.payment_method_label}</Table.Cell>
                <Table.Cell>{payment.installments}</Table.Cell>
                <Table.Cell>{payment.interval}</Table.Cell>
                <Table.Cell>{formatCurrencyBRL(payment.amount)}</Table.Cell>
                <Table.Cell>{formatCurrencyBRL(payment.total)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  function renderContent(data: RequestQuotationData) {
    const netValue = data.total_value - data.discount;

    return (
      <VStack gap={6} align="stretch">
        <Box>
          <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap" mb={4}>
            <VStack align="flex-start" gap={0}>
              <Text fontWeight="semibold" fontSize="lg">
                {data.provider?.name ?? NO_DATA}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {data.request_purchase?.code ? `#${data.request_purchase.code}` : NO_DATA}
              </Text>
            </VStack>
            <Badge
              colorPalette={
                requestQuotationStatusColor[data.status as RequestQuotationStatus] ?? 'gray'
              }
              variant="subtle"
              py={1}
              px={3}
            >
              {data.status_label}
            </Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <InfoField label={text.form.fields.branch} value={data.branch?.name || NO_DATA} />
            <InfoField
              label={text.form.fields.requiresFile}
              value={requestQuotationRequiresFileOptions.getLabel(data.requires_file, languageGB)}
            />
            <InfoField
              label={detailText.fields.quotationDate}
              value={data.quotation_date ? formatDate(data.quotation_date) : NO_DATA}
            />
            <InfoField
              label={detailText.fields.expirationDate}
              value={data.expiration_date ? formatDate(data.expiration_date) : NO_DATA}
            />
            <InfoField
              label={text.tab.card.fields.totalValue}
              value={formatCurrencyBRL(data.total_value)}
            />
            <InfoField label={text.tab.card.fields.netValue} value={formatCurrencyBRL(netValue)} />
            <InfoField label={text.tab.card.fields.saving} value={`${data.saving.toFixed(2)}%`} />
            <InfoField
              label={text.tab.card.fields.savingResponsible}
              value={data.saving_responsible?.name ?? NO_DATA}
            />
            <InfoField label={text.tab.card.fields.creator} value={data.user?.name ?? NO_DATA} />
            <InfoField
              label={detailText.fields.providerResponsible}
              value={data.reponsible ?? NO_DATA}
            />
          </SimpleGrid>

          {!!data.observation && (
            <Box mt={4}>
              <InfoField label={detailText.fields.observation} value={data.observation} />
            </Box>
          )}
          {!!data.note && (
            <Box mt={4}>
              <InfoField label={text.form.fields.note} value={data.note} />
            </Box>
          )}
        </Box>

        {isReceived ? (
          <>
            <Box>
              <SectionTitle>{detailText.itemsSection.title}</SectionTitle>
              {renderItemsTable(data.items ?? [])}
            </Box>
            <Box>
              <SectionTitle>{detailText.paymentsSection.title}</SectionTitle>
              {renderPaymentsTable(data.payments ?? [])}
            </Box>
          </>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            {detailText.pendingReceiptNotice}
          </Text>
        )}
      </VStack>
    );
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) onClose();
      }}
      size="xl"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{detailText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {isLoading ? (
                <VStack gap={3} align="stretch">
                  <Skeleton height="80px" borderRadius="lg" />
                  <Skeleton height="120px" borderRadius="lg" />
                </VStack>
              ) : isError ? (
                <EmptyState.Root>
                  <EmptyState.Content>
                    <EmptyState.Indicator>
                      <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
                    </EmptyState.Indicator>
                    <VStack textAlign="center" gap={1}>
                      <EmptyState.Title>{detailText.errorState.title}</EmptyState.Title>
                      <EmptyState.Description>
                        {detailText.errorState.description}
                      </EmptyState.Description>
                    </VStack>
                    <Button
                      title={detailText.errorState.retry}
                      variant="outline"
                      size="sm"
                      onClick={() => detailQuery.refetch()}
                    />
                  </EmptyState.Content>
                </EmptyState.Root>
              ) : quotation ? (
                renderContent(quotation)
              ) : null}
            </Dialog.Body>

            <Dialog.Footer>
              <Button title={languageGB.defaltStrings.close} variant="outline" onClick={onClose} />
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
