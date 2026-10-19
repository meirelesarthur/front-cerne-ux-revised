// src/pages/Administrativo/Autorizacao/AutorizarSolicitacao.tsx
// -----------------------------------------------------------------------------
// Tela de detalhe ÚNICA de Autorização e Ciência (`/administrativo/autorizacao/:uuid`).
// Execução 081, T-081-FE-06 (paridade com `request-authorization/edit` e `second` do
// legado; contrato LEGADO-SUPRIMENTOS-07). Uma busca `GET request-authorizations/{uuid}`
// e o ramo vem de `authorization_context` (decisão do servidor, nunca recalculada):
//   - `can_approve_first_level` = APROVAÇÃO (status 3, autorizador designado);
//   - `can_acknowledge_second_level` = CIÊNCIA (status 4/11, responsável atual);
//   - nenhum dos dois = abre a visualização da solicitação (legado: `request-purchase.show`).
//
// Comportamentos do legado reproduzidos:
//   - promoção automática 4 para 3 ao abrir a Ciência (`useAutoPromoteOnce`: UMA chamada
//     `POST acknowledge {auto_promote:true}`; 422 avisa e marca Safra/Classificação) e cai na Aprovação;
//   - Aprovação: itens marcados por padrão (os desmarcados ficam fora: reprovação
//     parcial), cotação só com forma de pagamento, edição de quantidade recalcula as
//     cotações, rateio do Ordenador (classificação e safra em lista), "Próxima Etapa",
//     "Voltar Etapa", "Reprovar" e "Transf. Responsável" (3 para 11);
//   - Ciência: "Próxima Etapa" pelo `next_status` do contexto (3 abre "Enviar para
//     Autorização"; 2 e 4 exigem comentário), "Voltar Etapa", "Reprovar" e
//     "Transf. Responsável" (só com `can_transfer`);
//   - UM campo "Adicionar Comentário/Justificativa" (máx. 300) usado por todas as ações,
//     com os avisos do legado ("Informe um comentário" etc.) na ordem do JS legado.
// Transferir usa o `TransferResponsibleDialog` compartilhado (Aprovação: `transfer`;
// Ciência: `reassign` com `transfer_candidates`). Ao concluir uma ação a tela volta para
// a lista, como o legado.
//
// Referência UX (Passo UX): `GB.Cerne.UX/.../autorizacao/AutorizacaoCompraPage.tsx`
// (única página do `cerne`); demais blocos seguem os padrões já presentes nas telas.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle } from 'react-icons/fi';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';
import { TransferResponsibleDialog } from '@/components/Suprimentos/TransferResponsibleDialog';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { extractApiFieldErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';
import {
  requestPurchaseStatus,
  requestPurchaseStatusColor,
  RequestPurchaseStatus,
} from '@/constants/RequestPurchases/request-purchase-status';

import {
  acknowledgeRequestAuthorization,
  approveRequestAuthorization,
  getRequestAuthorization,
  reassignRequestAuthorization,
  rejectFinalRequestAuthorization,
  rejectPartialRequestAuthorization,
  rejectSecondLevelRequestAuthorization,
  returnRequestAuthorization,
} from '@/services/v2/RequestAuthorizations/request-authorization-service';

import type {
  RequestAuthorizationAcknowledgePayload,
  RequestAuthorizationApprovePayload,
  RequestAuthorizationRejectFinalPayload,
  RequestAuthorizationRejectPartialPayload,
  RequestAuthorizationRejectSecondLevelPayload,
  RequestAuthorizationReturnPayload,
} from '@/@types/v2/RequestAuthorizations';
import type { RequestPurchaseTransferPayload } from '@/@types/v2/RequestPurchases';

import { AuthorizationJustifyBlock } from './AuthorizationJustifyBlock';
import {
  AuthorizationRatioBlock,
  initialRatioState,
  type RatioState,
} from './AuthorizationRatioBlock';
import { AuthorizationRatioReadOnly } from './AuthorizationRatioReadOnly';
import {
  canTransferInApproval,
  initialSelectedQuotations,
  isJustifyFilled,
  validateApprove,
  validateRatio,
  zipRatioRows,
  type ApproveValidationError,
  type RatioValidationError,
} from './authorizationRules';
import { RequestAuthorizationAttachments } from './RequestAuthorizationAttachments';
import { RequestAuthorizationInfoSection } from './RequestAuthorizationInfoSection';
import { RequestAuthorizationItemsSection } from './RequestAuthorizationItemsSection';
import { RequestAuthorizationQuotationsSection } from './RequestAuthorizationQuotationsSection';
import { SendForAuthorizationDialog } from './SendForAuthorizationDialog';
import { useAutoPromoteOnce } from './useAutoPromoteOnce';

import { RequestMovementHistory } from '../Solicitacao/RequestMovementHistory';

const LIST_PATH = '/administrativo/autorizacao';

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

interface RatioFieldErrors {
  harvest?: string;
  classification?: string;
}

export default function AutorizarSolicitacao() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const text = languageGB.requestAuthorizations.requestAuthorization;
  const detailText = text.detail;
  const validationText = detailText.clientValidation;

  const canEdit = can('request-authorization_edit');
  const isGuidValid = isValidGuid(uuid);

  // Guarda de navegação — `uuid` presente mas não-GUID → volta para a listagem.
  useEffect(() => {
    if (uuid && !isValidGuid(uuid)) {
      navigate(LIST_PATH, { replace: true });
    }
  }, [uuid, navigate]);

  const detailQuery = useQuery({
    queryKey: [queryKey.requestAuthorizations.requestAuthorization, uuid],
    queryFn: async () => (await getRequestAuthorization(uuid as string)).data,
    enabled: isGuidValid,
    refetchOnWindowFocus: false,
  });

  const data = detailQuery.data;
  const context = data?.authorization_context;
  const requiresRatio = !!context?.requires_ratio_block;

  // Cotações: ADITIVO esteira 112 (F-088) — vêm embutidas no detalhe da
  // Autorização (`data.quotations`, gate `request-authorization_view`), não
  // mais de uma 2ª query contra o módulo Cotações (`request-quotation_view`,
  // 403 para o Autorizador). Loading/erro seguem o `detailQuery`.
  const quotations = data?.quotations ?? [];

  // ---- Promoção automática 4 para 3 (legado `second`, sem escrita em GET) --------
  const { isPromoting } = useAutoPromoteOnce({
    uuid: isGuidValid ? uuid : undefined,
    context,
    canEdit,
    refetch: () => detailQuery.refetch(),
    onError: () =>
      toaster.error({
        title: text.singularLabel,
        description: detailText.actions.autoPromoteError,
        duration: 7000,
      }),
    onUnprocessable: (error) => {
      toaster.create({
        title: text.singularLabel,
        description: extractApiFieldErrorMessage(error) ?? detailText.actions.autoPromoteError,
        type: 'warning',
        duration: 7000,
      });
      applyRatioFieldErrors(error);
    },
  });

  // ---- Estado da tela ------------------------------------------------------------
  const [justify, setJustify] = useState('');

  // Itens: todos marcados por padrão (legado FF01). Reinicia só quando troca a solicitação,
  // nunca a cada refetch (apagaria a seleção ao editar um item).
  const [selectedItemUuids, setSelectedItemUuids] = useState<string[]>([]);
  useEffect(() => {
    if (data) setSelectedItemUuids(data.items.map((item) => item.uuid));
  }, [data?.uuid]);

  // Cotações: marca sozinha só a cotação única com forma de pagamento (legado FF02).
  const [selectedQuotationUuids, setSelectedQuotationUuids] = useState<string[]>([]);
  useEffect(() => {
    const initial = initialSelectedQuotations(quotations);
    if (initial.length > 0) {
      setSelectedQuotationUuids((prev) =>
        prev.includes(initial[0]) ? prev : [...prev, initial[0]]
      );
    }
  }, [data?.quotations]);

  const [ratio, setRatio] = useState<RatioState>(initialRatioState);
  // Erros de campo do rateio vindos do 422 da API (D-100-22: sem exigência local).
  const [ratioFieldErrors, setRatioFieldErrors] = useState<RatioFieldErrors>({});
  useEffect(() => {
    setRatio(initialRatioState());
    setRatioFieldErrors({});
    setJustify('');
  }, [data?.uuid]);

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSendForAuthorizationOpen, setIsSendForAuthorizationOpen] = useState(false);

  function toggleItem(itemUuid: string) {
    setSelectedItemUuids((prev) =>
      prev.includes(itemUuid) ? prev.filter((id) => id !== itemUuid) : [...prev, itemUuid]
    );
  }

  function toggleQuotation(quotationUuid: string) {
    setSelectedQuotationUuids((prev) =>
      prev.includes(quotationUuid)
        ? prev.filter((id) => id !== quotationUuid)
        : [...prev, quotationUuid]
    );
  }

  // ---- Ações (Lei 3: wrappers nomeados; a lista é recarregada e a tela volta a ela) --
  function afterAction() {
    invalidateSupplyQueries(queryClient);
    navigate(LIST_PATH);
  }

  function actionConfig() {
    return {
      entityName: text.singularLabel,
      queryKey: queryKey.requestAuthorizations.requestAuthorization,
      queryKey2: queryKey.requestAuthorizations.requestAuthorizationsList,
      typesRequest: 'update' as const,
      personalizedMessage: detailText.actions.updateToast,
      actionSuccess: afterAction,
    };
  }

  const approveMutation = useRequest({
    ...actionConfig(),
    asyncFunction: async (payload: RequestAuthorizationApprovePayload) =>
      approveRequestAuthorization(uuid as string, payload),
  });
  const rejectPartialMutation = useRequest({
    ...actionConfig(),
    asyncFunction: async (payload: RequestAuthorizationRejectPartialPayload) =>
      rejectPartialRequestAuthorization(uuid as string, payload),
  });
  const rejectFinalMutation = useRequest({
    ...actionConfig(),
    asyncFunction: async (payload: RequestAuthorizationRejectFinalPayload) =>
      rejectFinalRequestAuthorization(uuid as string, payload),
  });
  const acknowledgeMutation = useRequest({
    ...actionConfig(),
    asyncFunction: async (payload: RequestAuthorizationAcknowledgePayload) =>
      acknowledgeRequestAuthorization(uuid as string, payload),
  });
  const returnMutation = useRequest({
    ...actionConfig(),
    asyncFunction: async (payload: RequestAuthorizationReturnPayload) =>
      returnRequestAuthorization(uuid as string, payload),
  });
  const rejectSecondLevelMutation = useRequest({
    ...actionConfig(),
    asyncFunction: async (payload: RequestAuthorizationRejectSecondLevelPayload) =>
      rejectSecondLevelRequestAuthorization(uuid as string, payload),
  });

  const isBusy =
    isPromoting ||
    approveMutation.isPending ||
    rejectPartialMutation.isPending ||
    rejectFinalMutation.isPending ||
    acknowledgeMutation.isPending ||
    returnMutation.isPending ||
    rejectSecondLevelMutation.isPending;

  // ---- Validações do legado (swal "Atenção") ---------------------------------------
  function warn(message: string) {
    toaster.create({ title: validationText.warningTitle, description: message, type: 'warning' });
  }

  const approveMessages: Record<ApproveValidationError, string> = {
    comment: validationText.commentRequired,
    quotation: validationText.quotationRequired,
    items: validationText.itemsRequired,
    singleItemQuotations: validationText.singleItemQuotations,
  };
  const ratioMessages: Record<RatioValidationError, string> = {
    sum: validationText.ratioSumInvalid,
    category: validationText.categoryRequired,
    center: validationText.centerRequired,
  };

  // Avisa pelo toast "Atenção" (soma, categoria, centro).
  function reportRatioError(error: RatioValidationError) {
    warn(ratioMessages[error]);
  }

  // 422 do servidor em `harvest_uuid`/`classification` (T-743-FE-04): marca o campo do
  // bloco com a 1ª mensagem da API. O toast continua a cargo de quem chamou.
  function applyRatioFieldErrors(error: unknown) {
    if (!isAxiosError(error) || error.response?.status !== 422) return;
    const errors = (error.response.data as { errors?: Record<string, string[]> } | undefined)
      ?.errors;
    const harvest = errors?.harvest_uuid?.[0];
    const classification = errors?.classification?.[0];
    if (!harvest && !classification) return;
    setRatioFieldErrors({ harvest, classification });
  }

  // O erro de um campo some quando ele é preenchido.
  function handleRatioChange(next: RatioState) {
    setRatio(next);
    setRatioFieldErrors((prev) => {
      if (!prev.harvest && !prev.classification) return prev;
      return {
        harvest: next.harvestUuid ? undefined : prev.harvest,
        classification: next.classification ? undefined : prev.classification,
      };
    });
  }

  // Rateio visível e editável: soma 100, categoria e centro (IG07, IG08). Safra e
  // Classificação não bloqueiam (D-100-22, igual ao legado). `true` = ok.
  function ratioIsValid(): boolean {
    if (!requiresRatio) return true;
    const error = validateRatio(ratio);
    if (error) {
      reportRatioError(error);
      return false;
    }
    return true;
  }

  // Cabeçalho do rateio (Classificação e Safra) enviado junto com a ação SÓ quando
  // preenchido (D-100-22): chave vazia é omitida, como os hidden do legado.
  function buildRatioHeaderPayload() {
    return {
      ...(ratio.classification ? { classification: ratio.classification } : {}),
      ...(ratio.harvestUuid ? { harvest_uuid: ratio.harvestUuid } : {}),
    };
  }

  // IG05/IG10/IG12: comentário preenchido. `true` = ok.
  function justifyIsFilled(): boolean {
    if (isJustifyFilled(justify)) return true;
    warn(validationText.commentRequired);
    return false;
  }

  function buildRatioPayload() {
    return {
      ...buildRatioHeaderPayload(),
      ...zipRatioRows(ratio.rows),
    };
  }

  // ---- Aprovação -------------------------------------------------------------------
  // Ordem do legado: comentário e cotação (JS), rateio (JS), depois itens (servidor).
  function handleApproveNext() {
    const input = {
      justify,
      type: data?.type,
      quotationsCount: quotations.length,
      selectedQuotationCount: selectedQuotationUuids.length,
      itemsCount: data?.items.length ?? 0,
      selectedItemCount: selectedItemUuids.length,
    };
    const error = validateApprove(input);
    if (error === 'comment' || error === 'quotation') {
      warn(approveMessages[error]);
      return;
    }
    if (!ratioIsValid()) return;
    if (error) {
      warn(approveMessages[error]);
      return;
    }

    approveMutation.mutate(
      {
        final_justification: justify.trim(),
        items: selectedItemUuids,
        quotations: selectedQuotationUuids,
        ...(requiresRatio ? buildRatioPayload() : {}),
      },
      { onError: applyRatioFieldErrors }
    );
  }

  // "Voltar Etapa" da Aprovação: grava também classificação e safra quando preenchidas
  // (legado `update`); nada é exigido (D-100-22).
  function handleApproveBack() {
    if (!justifyIsFilled()) return;
    rejectPartialMutation.mutate(
      {
        justify: justify.trim(),
        ...(requiresRatio ? buildRatioHeaderPayload() : {}),
      },
      { onError: applyRatioFieldErrors }
    );
  }

  function handleApproveReject() {
    if (!justifyIsFilled()) return;
    rejectFinalMutation.mutate({ final_justification: justify.trim() });
  }

  // ---- Ciência -----------------------------------------------------------------------
  // "Próxima Etapa": `next_status` do contexto. 3 abre "Enviar para Autorização" (a
  // justificativa pode ficar vazia ali); 2 e 4 exigem comentário (IG11, IG12).
  function handleAcknowledgeNext() {
    if (!context) return;
    if (context.next_status === requestPurchaseStatus.aguardandoAprovacao) {
      if (!ratioIsValid()) return;
      setIsSendForAuthorizationOpen(true);
      return;
    }
    if (!justifyIsFilled()) return;
    acknowledgeMutation.mutate(
      {
        status: context.next_status,
        justify: justify.trim(),
        ...(requiresRatio ? buildRatioHeaderPayload() : {}),
      },
      { onError: applyRatioFieldErrors }
    );
  }

  // D-100-22: Devolver e Reprovar mandam só a justificativa (forms legados `_forms:761-774`).
  function handleAcknowledgeBack() {
    if (!justifyIsFilled()) return;
    returnMutation.mutate({ justify: justify.trim() });
  }

  function handleAcknowledgeReject() {
    if (!justifyIsFilled()) return;
    rejectSecondLevelMutation.mutate({ justify: justify.trim() });
  }

  // ---- Estados de carregamento e erro ------------------------------------------------
  if (!isGuidValid) return null;

  if (detailQuery.isLoading || isPromoting) {
    return (
      <FormContainer title={text.pageTitle}>
        <VStack gap={3} align="stretch">
          <Skeleton height="120px" borderRadius="lg" />
          <Skeleton height="240px" borderRadius="lg" />
          <Skeleton height="180px" borderRadius="lg" />
        </VStack>
      </FormContainer>
    );
  }

  if (detailQuery.isError || !data || !context) {
    return (
      <FormContainer title={text.pageTitle}>
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{detailText.errorState.title}</EmptyState.Title>
              <EmptyState.Description>{detailText.errorState.description}</EmptyState.Description>
            </VStack>
            <Button
              title={detailText.errorState.retry}
              variant="outline"
              size="sm"
              onClick={() => detailQuery.refetch()}
            />
          </EmptyState.Content>
        </EmptyState.Root>
      </FormContainer>
    );
  }

  // Ramo (decisão do servidor). Sem ação pendente: abre a visualização da solicitação
  // (legado: `request-purchase.show`), em vez de um beco sem saída.
  const isFirstLevel = context.can_approve_first_level;
  const isSecondLevel = !isFirstLevel && context.can_acknowledge_second_level;

  if (!isFirstLevel && !isSecondLevel) {
    return <Navigate to={`/administrativo/solicitacao/${data.uuid}/visualizar`} replace />;
  }

  const showActions = canEdit;
  const hasRatioToShow = requiresRatio || (data.ratio?.length ?? 0) > 0;
  const showTransfer = isFirstLevel
    ? canTransferInApproval({ userUuid: user?.uuid, can }, data.responsible?.uuid)
    : context.can_transfer;

  const footer = showActions ? (
    <Flex gap={2} wrap="wrap" justify="flex-end" width="full">
      {showTransfer && (
        <Button
          title={detailText.actions.transfer}
          variant="outline"
          size="sm"
          type="button"
          onClick={() => setIsTransferOpen(true)}
          disabled={isBusy}
        />
      )}
      <Button
        title={detailText.actions.reject}
        variant="outline"
        colorPalette="red"
        size="sm"
        type="button"
        onClick={isFirstLevel ? handleApproveReject : handleAcknowledgeReject}
        loading={isFirstLevel ? rejectFinalMutation.isPending : rejectSecondLevelMutation.isPending}
        disabled={isBusy}
      />
      <Button
        title={detailText.actions.back}
        variant="outline"
        size="sm"
        type="button"
        onClick={isFirstLevel ? handleApproveBack : handleAcknowledgeBack}
        loading={isFirstLevel ? rejectPartialMutation.isPending : returnMutation.isPending}
        disabled={isBusy}
      />
      <Button
        title={detailText.actions.next}
        size="sm"
        type="button"
        onClick={isFirstLevel ? handleApproveNext : handleAcknowledgeNext}
        loading={isFirstLevel ? approveMutation.isPending : acknowledgeMutation.isPending}
        disabled={isBusy}
      />
    </Flex>
  ) : undefined;

  return (
    <FormContainer
      title={isFirstLevel ? detailText.approvalTitle : detailText.acknowledgeTitle}
      subtitle={[data.code, data.type_label].filter(Boolean).join(' · ')}
      headerActions={
        <Badge
          colorPalette={requestPurchaseStatusColor[data.status as RequestPurchaseStatus] ?? 'gray'}
          variant="subtle"
          py={1}
          px={3}
        >
          {data.status_label}
        </Badge>
      }
      footer={footer}
    >
      {/* Padding padrão do container de visualização, sempre aplicado (F-088, esteira 089). */}
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <VStack align="stretch" gap={8}>
          <RequestAuthorizationInfoSection data={data} />

          <RequestAuthorizationAttachments attachments={data.attachments ?? []} />

          <Box>
            <SectionTitle>{detailText.movements.title}</SectionTitle>
            <RequestMovementHistory movements={data.movements} />
          </Box>

          <RequestAuthorizationItemsSection
            authorizationUuid={data.uuid}
            type={data.type}
            quotationsCount={quotations.length}
            items={data.items}
            showObservation={!!data.observation}
            selectedItemUuids={selectedItemUuids}
            onToggleItem={toggleItem}
            readOnly={!isFirstLevel}
            canEdit={canEdit}
          />

          {quotations.length > 0 && (
            <RequestAuthorizationQuotationsSection
              requestPurchaseUuid={data.uuid}
              quotations={quotations}
              isLoading={false}
              isError={false}
              onRetry={() => detailQuery.refetch()}
              selectedQuotationUuids={selectedQuotationUuids}
              onToggleQuotation={toggleQuotation}
              quotationJustification={data.quotation_justification}
              readOnly={!isFirstLevel}
              canEdit={canEdit}
            />
          )}

          {hasRatioToShow &&
            (requiresRatio ? (
              <AuthorizationRatioBlock
                farmUuid={data.farm?.uuid}
                value={ratio}
                onChange={handleRatioChange}
                disabled={isBusy}
                harvestError={ratioFieldErrors.harvest}
                classificationError={ratioFieldErrors.classification}
              />
            ) : (
              <AuthorizationRatioReadOnly data={data} />
            ))}

          {showActions && (
            <AuthorizationJustifyBlock
              authorizationUuid={data.uuid}
              value={justify}
              onChange={setJustify}
              disabled={isBusy}
            />
          )}
        </VStack>
      </Box>

      {isFirstLevel ? (
        <TransferResponsibleDialog
          isOpen={isTransferOpen}
          onClose={() => setIsTransferOpen(false)}
          requestPurchaseUuid={data.uuid}
          onSuccess={() => navigate(LIST_PATH)}
        />
      ) : (
        <>
          <TransferResponsibleDialog
            isOpen={isTransferOpen}
            onClose={() => setIsTransferOpen(false)}
            requestPurchaseUuid={data.uuid}
            options={context.transfer_candidates}
            submit={(payload: RequestPurchaseTransferPayload) =>
              reassignRequestAuthorization(data.uuid, payload)
            }
            justifyMaxLength={400}
            onSuccess={() => navigate(LIST_PATH)}
          />
          <SendForAuthorizationDialog
            isOpen={isSendForAuthorizationOpen}
            onClose={() => setIsSendForAuthorizationOpen(false)}
            authorizationUuid={data.uuid}
            eligibleAuthorizers={context.eligible_authorizers}
            requiresRatio={requiresRatio}
            getRatioPayload={buildRatioPayload}
            initialJustify={justify}
            onRatioServerError={applyRatioFieldErrors}
            onSuccess={() => navigate(LIST_PATH)}
          />
        </>
      )}
    </FormContainer>
  );
}
