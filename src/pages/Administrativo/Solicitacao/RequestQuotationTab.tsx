// src/pages/Administrativo/Solicitacao/RequestQuotationTab.tsx
// -----------------------------------------------------------------------------
// Aba "Cotações" da tela ÚNICA de Solicitação de Compra (RequestPurchase —
// Administrativo/Suprimentos, esteira 97-Esteiras/035, TASK-CQ-FE-03).
// Grade das cotações de UMA solicitação (`GET
// /request-purchases/{uuid}/quotations`, `listRequestQuotationsByPurchase`,
// TASK-CQ-FE-01) — Padrão 12 (`get_pwa_complex_screen_compositions_pattern`,
// "Cards em Tab"): lista NÃO PAGINADA (`useQuery` direto, NÃO
// `useCustomGridQuery`/`TableProvider` — tipicamente poucos fornecedores por
// solicitação), mutations diretas (`useMutation` + `toaster` local, não
// `useRequest`).
//
// Consumida por `CreateOrUpdateSolicitacao.tsx` como 5ª aba, AUSENTE em modo
// criação (mesma regra já aplicada à aba "Histórico" — Modelo C Regra 1,
// `get_pwa_complex_screen_compositions_pattern` B.3: uma `RequestQuotation`
// só existe amarrada a uma `RequestPurchase` já persistida).
//
// Card por cotação (mirror LM-12..LM-21, roteiro frontend §3.1): checkbox de
// seleção em lote (IG-09) · fornecedor (`provider.name`) · data da cotação ·
// criador (`quotation.user.name`) · valor total · valor com desconto
// (`total_value - discount`) · saving % · responsável do saving · Badge de
// status (`requestQuotationStatusColor`).
//
// Ações de linha (AM-02..05, menu `Actions`, mirror `SolicitacaoList`
// `index.tsx`): Ver (sempre que `request-quotation_view`) · Editar — rótulo
// vira "Editar Observação" quando `status===3` (CL-039) — só com
// `request-quotation_edit` · Aplicar Saving (só `status===3`,
// `request-quotation_edit`) · Enviar para Autorização (Dimensão B — sem slug
// de permissão próprio ainda, DEC-006 do roteiro de API §4: mapeamento fica
// para quando a leva de autorizadores for aberta; default de engenharia
// nesta Tarefa reaproveita `request-quotation_edit`, registrado aqui, não
// escolhido em silêncio) · Excluir (`request-quotation_delete`, Padrão 6 —
// `DeleteConfirmDialog`, mirror `SolicitacaoList`).
//
// Excluir, Criar, Editar, Ver, Aplicar Saving E Enviar para Autorização são
// as ações de linha TOTALMENTE FUNCIONAIS nesta Tarefa (`deleteRequestQuotation`
// desde TASK-CQ-FE-01; Criar/Editar via `RequestQuotationFormDialog.tsx`,
// TASK-CQ-FE-04 — disclosure única compartilhada, `editingQuotation===null` =
// CRIAR; Ver via `RequestQuotationDetailDialog.tsx`, TASK-CQ-FE-05 —
// disclosure própria, busca os dados completos sozinha por uuid; Aplicar
// Saving via `RequestQuotationSavingDialog.tsx`, TASK-CQ-FE-06 — disclosure
// própria, só acionável com `status===3`, mesma condição já aplicada no menu
// de ações; Enviar para Autorização via `RequestQuotationAuthorizerDialog.tsx`,
// TASK-CQ-FE-07/Dimensão B — disclosure própria, opera sobre a
// `RequestPurchase` PAI, não sobre a cotação individual que originou o
// clique, ver cabeçalho daquele arquivo).
//
// Cabeçalho da aba: "Adicionar Fornecedor" (AM-01) — visível só quando
// `requestPurchaseStatus` está em [`solicitacao`, `cotacaoEmAndamento`] E
// `can('request-quotation_create')` — abre `RequestQuotationFormDialog` em
// modo CRIAR (TASK-CQ-FE-04). "Enviar E-mail em Lote" (IG-09) — habilitado
// só com `selectedUuids.length >= 1` — abre
// `RequestQuotationEmailBatchModal.tsx` (TASK-CQ-FE-08, Dimensão B) com as
// cotações selecionadas (`items` filtrado por `selectedUuids`); no sucesso,
// o Modal chama `onSent` (`handleEmailBatchSent` abaixo), que limpa
// `selectedUuids` — a seleção não sobrevive a um envio já enfileirado.
//
// Botão WhatsApp (AM-06, composição client-side, TASK-CQ-FE-09) — ícone
// próprio por card (mirror `.btn-whatsapp` do legado, `quotation.blade.php`),
// FORA do menu `Actions` (o legado também o mantém como botão avulso, não
// dentro do dropdown de ações). Handler monta o link 100% client-side via
// `buildRequestQuotationWhatsAppLink` (`src/utils/requestQuotationWhatsApp.ts`)
// a partir de dados JÁ carregados (`quotation.provider/user` desta grade +
// `requestPurchase{Code,Description,FarmDescription}` recebidos como props
// da tela-pai, `CreateOrUpdateSolicitacao.tsx` → `requestPurchaseData`) —
// SEM nenhuma chamada extra. Erro tipado (`missing-provider`/`missing-phone`)
// vira toast i18n, nunca um link `wa.me` quebrado (divergência de robustez
// consciente, comportamento final idêntico ao legado nos casos válidos).
//
// -- Execução 081, T-081-FE-08 (paridade com o legado, contrato LEGADO 05) --
//   - P20/P21: solicitação P ou U com item sem produto esconde a grade de
//     fornecedores e mostra o aviso "Informe todos os produtos para prosseguir
//     com a cotação" com os itens editáveis (`RequestQuotationItemsPanel`,
//     `PUT quotation-items`); depois de definidos, a grade volta;
//   - "Mapa de Cotações" (`QuotationsMapButton`, xlsx) no cabeçalho;
//   - coluna "Responsável" = criador da cotação (o responsável do saving sai da
//     grade, P27);
//   - WhatsApp abre o modal "Enviar mensagens" com o fornecedor e cada vendedor
//     (`RequestQuotationWhatsAppModal`, P43);
//   - "Enviar para Autorização" segue a regra da API (responsável + status 1/2 +
//     `request-quotation_view`, `canSendToAuthorization`), não mais
//     `request-quotation_edit` (P29);
//   - tipo, itens e responsável vêm do detalhe da solicitação, pela MESMA chave
//     de cache da tela (uma única requisição).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import {
  Box,
  EmptyState,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaWhatsapp } from 'react-icons/fa';
import { FiDollarSign, FiEdit, FiEye, FiTrash2, FiUsers } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { IconButtonTable } from '@/components/IconButtonTable';
import { QuotationsMapButton } from '@/components/Suprimentos/QuotationsMapButton';
import { PURCHASE_ORDER_PROTOTYPE } from '@/config/v2/purchaseOrderPrototype';

import { QuotationMapDialog } from './prototype/QuotationMapDialog';
import { canSendToAuthorization } from '@/components/Suprimentos/supplyActionRules';
import { useSupplyActionContext } from '@/components/Suprimentos/useSupplyActionContext';
import { Badge as UiBadge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { StatusTag } from '@/components/ui/StatusTag';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';
import { requestQuotationStatusColor } from '@/constants/RequestQuotations/request-quotation-status';
import type { RequestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

import { getRequestPurchase } from '@/services/v2/RequestPurchases/request-purchase-service';
import {
  deleteRequestQuotation,
  listRequestQuotationsByPurchase,
} from '@/services/v2/RequestQuotations/request-quotation-service';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';
import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

import { canAddQuotation, canEditStageItems, hasItemsWithoutProduct } from './quotationGuards';
import { rankQuotations, summarizeQuotations } from './quotationRanking';
import { RequestQuotationAuthorizerDialog } from './RequestQuotationAuthorizerDialog';
import { RequestQuotationDetailDialog } from './RequestQuotationDetailDialog';
import { RequestQuotationEmailBatchModal } from './RequestQuotationEmailBatchModal';
import { RequestQuotationFormDialog } from './RequestQuotationFormDialog';
import { RequestQuotationItemsPanel } from './RequestQuotationItemsPanel';
import { RequestQuotationSavingDialog } from './RequestQuotationSavingDialog';
import { RequestQuotationWhatsAppModal } from './RequestQuotationWhatsAppModal';

export interface RequestQuotationTabProps {
  requestPurchaseUuid: string;
  /** Status CRU da `RequestPurchase` pai (AM-01: "Adicionar Fornecedor" só
   *  aparece quando `status in [solicitacao, cotacaoEmAndamento]`). */
  requestPurchaseStatus: number | undefined;
  /** Código da `RequestPurchase` PAI (`requestPurchaseData.code`, já
   *  carregado por `CreateOrUpdateSolicitacao.tsx`) — usado SÓ pela
   *  composição do WhatsApp (TASK-CQ-FE-09, AM-06); `RequestQuotationData.
   *  request_purchase` (quando presente) só expõe `{uuid,code}` também, mas
   *  fica AUSENTE na resposta de `quotes()` usada por esta grade (ver nota
   *  de eager-loading em `@/@types/v2/RequestQuotations`) — por isso o dado
   *  vem via prop da tela-pai, nunca de dentro do item da grade. */
  requestPurchaseCode: string | null;
  /** Descrição/chamado da `RequestPurchase` PAI (`requestPurchaseData.
   *  description`) — idem nota acima, só para o corpo da mensagem de
   *  WhatsApp. */
  requestPurchaseDescription: string | null;
  /** `requestPurchaseData.farm.description` — idem, só para o bloco
   *  "#Fazenda {farm}#" da mensagem de WhatsApp (EV-081). */
  requestPurchaseFarmDescription: string | null;
}

function formatCurrencyBRL(value: number): string {
  // Mirror do formato já usado em `Invoices/index.tsx`/`ContasAPagar/index.tsx`
  // (única convenção de moeda de exibição real do projeto).
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function RequestQuotationTab({
  requestPurchaseUuid,
  requestPurchaseStatus: purchaseStatus,
  requestPurchaseCode,
  requestPurchaseDescription,
  requestPurchaseFarmDescription,
}: RequestQuotationTabProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();

  const text = languageGB.requestQuotations.requestQuotation.tab;
  const compare = text.compare;

  const canView = can('request-quotation_view');
  const canEdit = can('request-quotation_edit');
  const canDelete = can('request-quotation_delete');

  const quotationsQueryKey = [
    queryKey.requestQuotations.requestQuotationsByPurchase,
    requestPurchaseUuid,
  ];

  // `useQuery` DIRETO (Pattern 12) — lista sem paginação de UMA solicitação.
  const { data: quotations, isPending } = useQuery({
    queryKey: quotationsQueryKey,
    queryFn: async () => (await listRequestQuotationsByPurchase(requestPurchaseUuid)).data ?? [],
    enabled: !!requestPurchaseUuid,
  });

  const items = quotations ?? [];

  // Detalhe da solicitação (tipo, itens e responsável) — MESMA chave de cache
  // da tela (`useCustomFormQueryByGuid`), então não gera requisição extra.
  const purchaseQuery = useQuery({
    queryKey: [queryKey.requestPurchases.requestPurchase, requestPurchaseUuid],
    queryFn: async () =>
      (await getRequestPurchase(requestPurchaseUuid)).data as RequestPurchaseData,
    enabled: !!requestPurchaseUuid,
    refetchOnWindowFocus: false,
  });
  const purchase = purchaseQuery.data;
  const isBlockedByItems = hasItemsWithoutProduct(purchase?.type, purchase?.items);
  const canEditItems = canEditStageItems(isBlockedByItems, purchaseStatus, can);
  const supplyContext = useSupplyActionContext();
  const canSendAuthorization = purchase
    ? canSendToAuthorization(
        { status: purchase.status, type: purchase.type, responsible: purchase.responsible },
        supplyContext
      )
    : false;
  const isEmpty = !isPending && items.length === 0;

  // ---- Seleção em lote (IG-09 — habilita "Enviar E-mail em Lote") --------
  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [mapOpen, setMapOpen] = useState(false);

  function toggleSelected(uuid: string) {
    setSelectedUuids((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid]
    );
  }

  // ---- Exclusão (Padrão 6 — ÚNICA ação de linha funcional nesta Tarefa) --
  const [toDelete, setToDelete] = useState<RequestQuotationData | null>(null);
  const deleteDisclosure = useDisclosure();

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteRequestQuotation(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotationsQueryKey });
      // Mantém a coluna "Cotações" do hub (TASK-CQ-FE-02) coerente após a
      // exclusão — mesma fonte de contagem (`quotations_count`).
      queryClient.invalidateQueries({ queryKey: [queryKey.requestPurchases.requestPurchasesList] });
      toaster.success({ title: text.deletedToast });
      setSelectedUuids((prev) => prev.filter((id) => id !== toDelete?.uuid));
      deleteDisclosure.onClose();
      setToDelete(null);
    },
    onError: (error: any) => {
      toaster.error({
        title: error?.response?.data?.message || text.deleteErrorFallback,
      });
    },
  });

  function handleDeleteClick(quotation: RequestQuotationData) {
    setToDelete(quotation);
    deleteDisclosure.onOpen();
  }

  function handleConfirmDelete() {
    if (toDelete) {
      deleteMutation.mutate(toDelete.uuid);
    }
  }

  // ---- Dialog Criar/Editar Cotação (TASK-CQ-FE-04) — disclosure única
  // compartilhada entre os dois modos; `editingQuotation===null` = CRIAR,
  // preenchido = EDITAR (mesmos 4 campos, ver cabeçalho de
  // `RequestQuotationFormDialog.tsx`). ------------------------------------
  const quotationFormDisclosure = useDisclosure();
  const [editingQuotation, setEditingQuotation] = useState<RequestQuotationData | null>(null);

  // ---- Dialog "Ver Cotação" (TASK-CQ-FE-05) — disclosure própria; o Dialog
  // busca os dados completos sozinho por uuid (ver cabeçalho do arquivo do
  // Dialog), então aqui só guardamos o uuid selecionado. -------------------
  const detailDisclosure = useDisclosure();
  const [viewingQuotationUuid, setViewingQuotationUuid] = useState<string | null>(null);

  function handleAddProvider() {
    setEditingQuotation(null);
    quotationFormDisclosure.onOpen();
  }

  function handleViewQuotation(quotation: RequestQuotationData) {
    setViewingQuotationUuid(quotation.uuid);
    detailDisclosure.onOpen();
  }

  function handleCloseDetail() {
    detailDisclosure.onClose();
    setViewingQuotationUuid(null);
  }

  function handleEditQuotation(quotation: RequestQuotationData) {
    setEditingQuotation(quotation);
    quotationFormDisclosure.onOpen();
  }

  function handleCloseQuotationForm() {
    quotationFormDisclosure.onClose();
    setEditingQuotation(null);
  }

  // ---- Dialog "Aplicar Saving" (TASK-CQ-FE-06) — disclosure própria; só
  // acionável com `status===3` (mesma condição já aplicada no menu de ações
  // abaixo, AM-03). -----------------------------------------------------
  const savingDisclosure = useDisclosure();
  const [applyingSavingQuotation, setApplyingSavingQuotation] =
    useState<RequestQuotationData | null>(null);

  function handleApplySaving(quotation: RequestQuotationData) {
    setApplyingSavingQuotation(quotation);
    savingDisclosure.onOpen();
  }

  function handleCloseSavingDialog() {
    savingDisclosure.onClose();
    setApplyingSavingQuotation(null);
  }

  // ---- Dialog "Enviar para Autorização" (TASK-CQ-FE-07, Dimensão B) —
  // disclosure própria; opera sobre a `RequestPurchase` PAI (`requestPurchaseUuid`
  // já disponível na aba inteira), não sobre a cotação individual que
  // originou o clique — ver cabeçalho de `RequestQuotationAuthorizerDialog.tsx`. --
  const authorizerDisclosure = useDisclosure();

  function handleSendForAuthorization() {
    authorizerDisclosure.onOpen();
  }

  // ---- Modal "Enviar E-mail em Lote" (TASK-CQ-FE-08, Dimensão B) —
  // disclosure própria; recebe as cotações SELECIONADAS (subconjunto de
  // `items` filtrado por `selectedUuids`, nunca vazio quando aberto — o
  // botão só habilita com `>=1`). --------------------------------------
  const emailBatchDisclosure = useDisclosure();
  const selectedQuotations = items.filter((quotation) => selectedUuids.includes(quotation.uuid));

  function handleSendEmailBatch() {
    emailBatchDisclosure.onOpen();
  }

  function handleEmailBatchSent() {
    setSelectedUuids([]);
  }

  // ---- Modal "Enviar mensagens" (WhatsApp, P43) — fornecedor + vendedores. ----
  const whatsAppDisclosure = useDisclosure();
  const [whatsAppQuotation, setWhatsAppQuotation] = useState<RequestQuotationData | null>(null);
  const whatsAppText = languageGB.requestQuotations.requestQuotation.whatsApp;

  function handleWhatsAppClick(quotation: RequestQuotationData) {
    if (!quotation.provider) {
      // Legado: swal "Os dados do fornecedor não foram encontrados."
      toaster.error({ title: whatsAppText.providerMissingError });
      return;
    }
    setWhatsAppQuotation(quotation);
    whatsAppDisclosure.onOpen();
  }

  function handleCloseWhatsApp() {
    whatsAppDisclosure.onClose();
    setWhatsAppQuotation(null);
  }

  const canAddProvider = canAddQuotation(purchaseStatus, can);

  // Quadro de itens (P20/P21): aviso + edição enquanto houver item sem produto.
  const itemsPanel =
    purchase && isBlockedByItems ? (
      <RequestQuotationItemsPanel
        requestPurchaseUuid={requestPurchaseUuid}
        items={purchase.items}
        editable={canEditItems}
        showBlockedNotice
      />
    ) : null;

  if (isBlockedByItems) {
    // Legado: sem produto em todos os itens a grade de cotações não aparece.
    return <Box pt={4}>{itemsPanel}</Box>;
  }

  // Comparativo: recebidas do menor para o maior valor final; menor valor marcado.
  const ranked = rankQuotations(items);
  const summary = summarizeQuotations(ranked);
  const allSelected = items.length > 0 && selectedUuids.length === items.length;

  function toggleSelectAll() {
    setSelectedUuids(allSelected ? [] : items.map((quotation) => quotation.uuid));
  }

  // Com cotação recebida, o próximo passo é a autorização: ela vira a ação principal.
  const authorizationIsPrimary = canSendAuthorization && summary.received > 0;

  const columns: SimpleTableColumn[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleSelectAll}
          aria-label={compare.selectAllAriaLabel}
        />
      ),
    },
    { key: 'provider', header: compare.columns.provider },
    { key: 'status', header: compare.columns.status },
    { key: 'total', header: compare.columns.totalValue, align: 'right' },
    { key: 'discount', header: compare.columns.discount, align: 'right' },
    { key: 'net', header: compare.columns.netValue, align: 'right' },
    { key: 'saving', header: compare.columns.saving, align: 'right' },
    { key: 'actions', header: '', align: 'right' },
  ];

  const moneyOrDash = (value: number | null) =>
    value === null ? <Text color="fg.muted">—</Text> : formatCurrencyBRL(value);

  const rows: SimpleTableRow[] = ranked.map(({ quotation, netValue, isReceived, isBest }) => ({
    key: quotation.uuid,
    cells: {
      select: (
        <Checkbox
          checked={selectedUuids.includes(quotation.uuid)}
          onCheckedChange={() => toggleSelected(quotation.uuid)}
          aria-label={text.card.selectAriaLabel}
        />
      ),
      provider: (
        <Box minW="180px">
          <HStack gap={2}>
            <Text fontWeight="semibold" color="strongText" lineClamp="1">
              {quotation.provider?.name ?? '—'}
            </Text>
            {isBest && <UiBadge label={compare.bestTag} variant="success" />}
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineClamp="1">
            {compare.quotedOn.replace(
              '{date}',
              formatDate(quotation.quotation_date ?? quotation.created_at)
            )}
            {quotation.user?.name ? ` ${compare.quotedBy.replace('{name}', quotation.user.name)}` : ''}
          </Text>
        </Box>
      ),
      status: (
        <StatusTag
          label={quotation.status_label}
          color={`${requestQuotationStatusColor[quotation.status as RequestQuotationStatus] ?? 'gray'}.500`}
          size="sm"
        />
      ),
      total: (
        <Text fontVariantNumeric="tabular-nums" color="fg.muted">
          {moneyOrDash(isReceived ? quotation.total_value : null)}
        </Text>
      ),
      discount: (
        <Text fontVariantNumeric="tabular-nums" color="fg.muted">
          {moneyOrDash(isReceived && quotation.discount > 0 ? quotation.discount : isReceived ? 0 : null)}
        </Text>
      ),
      net: (
        <Text
          fontVariantNumeric="tabular-nums"
          fontWeight="semibold"
          color={isBest ? 'green.700' : 'strongText'}
        >
          {moneyOrDash(netValue)}
        </Text>
      ),
      saving: (
        <Text fontVariantNumeric="tabular-nums" color="fg.muted">
          {isReceived ? `${quotation.saving.toFixed(2)}%` : '—'}
        </Text>
      ),
      actions: (
        <HStack gap={1} justify="flex-end">
          <IconButtonTable
            aria-label={whatsAppText.buttonLabel}
            mensegerTooltip={whatsAppText.buttonLabel}
            variant="ghost"
            colorPalette="green"
            onClick={() => handleWhatsAppClick(quotation)}
          >
            <Icon as={FaWhatsapp} />
          </IconButtonTable>
          {(canView || canEdit || canDelete) && (
            <Actions size="sm">
              {canView && (
                <Actions.Item icon={<Icon as={FiEye} />} onClick={() => handleViewQuotation(quotation)}>
                  {text.card.actions.view}
                </Actions.Item>
              )}
              {canEdit && (
                <Actions.Item icon={<Icon as={FiEdit} />} onClick={() => handleEditQuotation(quotation)}>
                  {isReceived ? text.card.actions.editObservation : text.card.actions.edit}
                </Actions.Item>
              )}
              {canEdit && isReceived && (
                <Actions.Item
                  icon={<Icon as={FiDollarSign} />}
                  onClick={() => handleApplySaving(quotation)}
                >
                  {text.card.actions.applySaving}
                </Actions.Item>
              )}
              {canDelete && (
                <Actions.Item
                  icon={<Icon as={FiTrash2} />}
                  onClick={() => handleDeleteClick(quotation)}
                  tone="danger"
                  disabled={deleteMutation.isPending}
                >
                  {text.card.actions.delete}
                </Actions.Item>
              )}
            </Actions>
          )}
        </HStack>
      ),
    },
  }));

  return (
    <Box pt={4}>
      <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
        <HStack gap={2}>
          <Text fontSize="xl" fontWeight="semibold" color="strongText">
            {text.title}
          </Text>
          {items.length > 0 && (
            <Box
              as="span"
              px="7px"
              borderRadius="md"
              bg="semanticNeutral.100"
              color="fg.muted"
              fontSize="sm"
              fontWeight="medium"
            >
              {items.length}
            </Box>
          )}
        </HStack>
        <HStack gap={2} wrap="wrap">
          {selectedUuids.length > 0 && (
            <Button
              title={compare.sendEmailSelected.replace('{count}', String(selectedUuids.length))}
              variant="outline"
              size="sm"
              type="button"
              onClick={handleSendEmailBatch}
            />
          )}
          {/* PROTÓTIPO (27/11): o mapa abre em pop-up (`QuotationMapDialog`) no lugar do Excel. */}
          {PURCHASE_ORDER_PROTOTYPE ? (
            items.length > 0 && (
              <Button
                title={languageGB.requestPurchases.requestPurchase.supply.quotationsMap.button}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setMapOpen(true)}
              />
            )
          ) : (
            <QuotationsMapButton
              requestPurchaseUuid={requestPurchaseUuid}
              quotationsCount={items.length}
            />
          )}
          {canAddProvider && (
            <Button
              title={text.addProviderButton}
              variant={authorizationIsPrimary ? 'outline' : undefined}
              size="sm"
              type="button"
              onClick={handleAddProvider}
            />
          )}
          {canSendAuthorization && (
            <Button
              title={compare.sendForAuthorization}
              variant={authorizationIsPrimary ? undefined : 'outline'}
              size="sm"
              type="button"
              onClick={handleSendForAuthorization}
            />
          )}
        </HStack>
      </Flex>

      {isPending || purchaseQuery.isPending ? (
        <VStack gap={3} align="stretch">
          <Skeleton height="64px" borderRadius="xl" />
          <Skeleton height="160px" borderRadius="xl" />
        </VStack>
      ) : isEmpty ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiUsers} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.emptyState.title}</EmptyState.Title>
              <EmptyState.Description>{text.emptyState.description}</EmptyState.Description>
            </VStack>
            {canAddProvider && (
              <Button title={text.addProviderButton} size="sm" onClick={handleAddProvider} />
            )}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <VStack gap={4} align="stretch">
          <SimpleGrid
            columns={{ base: 1, sm: 3 }}
            borderWidth="1px"
            borderColor="semanticNeutral.200"
            borderRadius="xl"
            bg="cardBG"
            divideX={{ base: '0px', sm: '1px' }}
            divideY={{ base: '1px', sm: '0px' }}
            divideColor="semanticNeutral.200"
          >
            <Box px={4} py={3}>
              <Text fontSize="sm" color="fg.muted">
                {compare.summary.providers}
              </Text>
              <Text fontSize="xl" fontWeight="semibold" color="strongText">
                {summary.total}
              </Text>
            </Box>
            <Box px={4} py={3}>
              <Text fontSize="sm" color="fg.muted">
                {compare.summary.answered}
              </Text>
              <Text fontSize="xl" fontWeight="semibold" color="strongText">
                {compare.summary.answeredOf
                  .replace('{received}', String(summary.received))
                  .replace('{total}', String(summary.total))}
              </Text>
            </Box>
            <Box px={4} py={3} minW={0}>
              <Text fontSize="sm" color="fg.muted">
                {compare.summary.bestPrice}
              </Text>
              {summary.best ? (
                <HStack gap={2} align="baseline" minW={0}>
                  <Text fontSize="xl" fontWeight="semibold" color="green.700" whiteSpace="nowrap">
                    {formatCurrencyBRL(summary.best.netValue ?? 0)}
                  </Text>
                  <Text fontSize="sm" color="fg.muted" lineClamp="1">
                    {summary.best.quotation.provider?.name}
                  </Text>
                </HStack>
              ) : (
                <Text fontSize="xl" fontWeight="semibold" color="fg.muted">
                  {compare.summary.noAnswerYet}
                </Text>
              )}
            </Box>
          </SimpleGrid>

          <SimpleTable columns={columns} rows={rows} ariaLabel={text.title} />
        </VStack>
      )}


      {PURCHASE_ORDER_PROTOTYPE && (
        <QuotationMapDialog
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          requestPurchaseUuid={requestPurchaseUuid}
          requestCode={requestPurchaseCode}
        />
      )}

      <DeleteConfirmDialog
        isOpen={deleteDisclosure.open}
        onClose={() => {
          deleteDisclosure.onClose();
          setToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        itemName={toDelete?.provider?.name ?? undefined}
        tone="danger"
        title={text.deleteDialog.title}
      />

      <RequestQuotationFormDialog
        isOpen={quotationFormDisclosure.open}
        onClose={handleCloseQuotationForm}
        requestPurchaseUuid={requestPurchaseUuid}
        quotation={editingQuotation}
      />

      <RequestQuotationDetailDialog
        isOpen={detailDisclosure.open}
        onClose={handleCloseDetail}
        quotationUuid={viewingQuotationUuid}
      />

      <RequestQuotationSavingDialog
        isOpen={savingDisclosure.open}
        onClose={handleCloseSavingDialog}
        requestPurchaseUuid={requestPurchaseUuid}
        quotation={applyingSavingQuotation}
      />

      <RequestQuotationAuthorizerDialog
        isOpen={authorizerDisclosure.open}
        onClose={authorizerDisclosure.onClose}
        requestPurchaseUuid={requestPurchaseUuid}
      />

      <RequestQuotationWhatsAppModal
        isOpen={whatsAppDisclosure.open}
        onClose={handleCloseWhatsApp}
        quotation={whatsAppQuotation}
        purchase={{
          code: requestPurchaseCode,
          description: requestPurchaseDescription,
          farmDescription: requestPurchaseFarmDescription,
        }}
      />

      <RequestQuotationEmailBatchModal
        isOpen={emailBatchDisclosure.open}
        onClose={emailBatchDisclosure.onClose}
        quotations={selectedQuotations}
        requestPurchaseUuid={requestPurchaseUuid}
        onSent={handleEmailBatchSent}
      />
    </Box>
  );
}
