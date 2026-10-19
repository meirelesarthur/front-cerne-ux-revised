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
  Badge,
  Box,
  Card,
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
import { FiDollarSign, FiEdit, FiEye, FiSend, FiTrash2, FiUsers } from 'react-icons/fi';

import { Actions } from '@/components/Action';
import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { IconButtonTable } from '@/components/IconButtonTable';
import { QuotationsMapButton } from '@/components/Suprimentos/QuotationsMapButton';
import { canSendToAuthorization } from '@/components/Suprimentos/supplyActionRules';
import { useSupplyActionContext } from '@/components/Suprimentos/useSupplyActionContext';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';
import {
  requestQuotationStatus,
  requestQuotationStatusColor,
} from '@/constants/RequestQuotations/request-quotation-status';
import type { RequestQuotationStatus } from '@/constants/RequestQuotations/request-quotation-status';

import { getRequestPurchase } from '@/services/v2/RequestPurchases/request-purchase-service';
import {
  deleteRequestQuotation,
  listRequestQuotationsByPurchase,
} from '@/services/v2/RequestQuotations/request-quotation-service';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';
import type { RequestQuotationData } from '@/@types/v2/RequestQuotations';

import { canAddQuotation, canEditStageItems, hasItemsWithoutProduct } from './quotationGuards';
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

  return (
    <Box pt={4}>
      <Flex justify="space-between" align="center" mb={4} gap={3} wrap="wrap">
        <Text fontSize="lg" fontWeight="semibold">
          {text.title}
        </Text>
        <HStack gap={2}>
          <QuotationsMapButton
            requestPurchaseUuid={requestPurchaseUuid}
            quotationsCount={items.length}
          />
          <Button
            title={text.sendEmailBatchButton}
            variant="outline"
            size="sm"
            type="button"
            onClick={handleSendEmailBatch}
            disabled={selectedUuids.length === 0}
          />
          {canAddProvider && (
            <Button
              title={text.addProviderButton}
              size="sm"
              type="button"
              onClick={handleAddProvider}
            />
          )}
        </HStack>
      </Flex>

      {isPending || purchaseQuery.isPending ? (
        <VStack gap={3} align="stretch">
          <Skeleton height="120px" borderRadius="lg" />
          <Skeleton height="120px" borderRadius="lg" />
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
        <VStack gap={3} align="stretch">
          {items.map((quotation) => {
            // `status===3` (`recebida`) — CL-039: rótulo "Editar" vira
            // "Editar Observação" e libera "Aplicar Saving" (mirror §3.1/3.4).
            const isReceived = quotation.status === requestQuotationStatus.recebida;
            const netValue = quotation.total_value - quotation.discount;

            return (
              <Card.Root
                key={quotation.uuid}
                variant="outline"
                bg="bg.panel"
                border="1px solid"
                borderColor="border.subtle"
              >
                <Card.Body p={4}>
                  <Flex justify="space-between" align="flex-start" gap={3} wrap="wrap">
                    <HStack align="flex-start" gap={3}>
                      <Box pt={1}>
                        <Checkbox
                          checked={selectedUuids.includes(quotation.uuid)}
                          onCheckedChange={() => toggleSelected(quotation.uuid)}
                          aria-label={text.card.selectAriaLabel}
                        />
                      </Box>
                      <VStack align="flex-start" gap={0}>
                        <Text fontWeight="semibold">{quotation.provider?.name ?? '—'}</Text>
                        <Text fontSize="xs" color="fg.muted">
                          {formatDate(quotation.quotation_date ?? quotation.created_at)}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack gap={2}>
                      <Badge
                        colorPalette={
                          requestQuotationStatusColor[quotation.status as RequestQuotationStatus] ??
                          'gray'
                        }
                        variant="subtle"
                        py={1}
                        px={3}
                      >
                        {quotation.status_label}
                      </Badge>

                      <IconButtonTable
                        aria-label={whatsAppText.buttonLabel}
                        mensegerTooltip={whatsAppText.buttonLabel}
                        variant="ghost"
                        colorPalette="green"
                        onClick={() => handleWhatsAppClick(quotation)}
                      >
                        <Icon as={FaWhatsapp} />
                      </IconButtonTable>

                      {(canView || canEdit || canDelete || canSendAuthorization) && (
                        <Actions size="sm">
                          {canView && (
                            <Actions.Item
                              icon={<Icon as={FiEye} />}
                              onClick={() => handleViewQuotation(quotation)}
                            >
                              {text.card.actions.view}
                            </Actions.Item>
                          )}
                          {canEdit && (
                            <Actions.Item
                              icon={<Icon as={FiEdit} />}
                              onClick={() => handleEditQuotation(quotation)}
                            >
                              {isReceived
                                ? text.card.actions.editObservation
                                : text.card.actions.edit}
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
                          {canSendAuthorization && (
                            <Actions.Item
                              icon={<Icon as={FiSend} />}
                              onClick={handleSendForAuthorization}
                            >
                              {text.card.actions.sendForAuthorization}
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
                  </Flex>

                  <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mt={4}>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">
                        {text.card.fields.creator}
                      </Text>
                      <Text fontSize="sm">{quotation.user?.name ?? '—'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">
                        {text.card.fields.totalValue}
                      </Text>
                      <Text fontSize="sm">{formatCurrencyBRL(quotation.total_value)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">
                        {text.card.fields.netValue}
                      </Text>
                      <Text fontSize="sm">{formatCurrencyBRL(netValue)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="fg.muted">
                        {text.card.fields.saving}
                      </Text>
                      <Text fontSize="sm">{quotation.saving.toFixed(2)}%</Text>
                    </Box>
                  </SimpleGrid>
                </Card.Body>
              </Card.Root>
            );
          })}
        </VStack>
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
