// src/pages/Fiscal/NfeEmitidas/NfeEmissionPanel.tsx
// -----------------------------------------------------------------------------
// Painel de Status de Emissão SEFAZ — TASK-FE-036-511/512 (Onda 1) +
// Cancelar/Corrigir/Consultar — TASK-FE-036-513/514 (Onda 2, esteira
// 036fe-financeiro-fiscal, Área A). Inserido em `NfeDetalhe.tsx` entre o
// Badge de estado e a seção "Cabeçalho" — mostra número/chave/recibo/data de
// envio (quando persistidos) e hospeda as ações "Emitir"/"Cancelar"/
// "Corrigir"/"Consultar SEFAZ".
//
// Downloads de XML/DANFE/PDFs de evento (TASK-FE-036-560/561/562, Onda 3) —
// handlers locais (leitura, SEM `useRequest`/mutation, mirror
// `NfseRecebidas/index.tsx::handleDownloadXml/handleGenerateDanfe`), com
// loading POR AÇÃO (não há múltiplas linhas aqui, um único documento por
// vez). `estado` decide preview vs. final: `novo`/`rejeitado` (rascunho,
// ainda não transmitido com sucesso) usam `xml-preview`/`danfe-preview`;
// `aprovado`/`cancelado` (já transmitido ao menos uma vez) usam o
// documento FINAL `xml`/`danfe`. PDF de Cancelamento só existe quando
// `estado === 'cancelado'`; PDF da Carta de Correção (`correction-pdf`) só
// quando a NF-e segue `aprovado` e já sofreu ao menos 1 evento de correção
// (`status.sequencia_evento > 0` — `CorrectNfeAction` NUNCA muda `estado`,
// só `CancelNfeAction` move para `cancelado`, docblock acima) — "conforme
// houver" do task-packet, decisão do executor sem endpoint dedicado de
// "há CC-e?" para não inventar sinal que a API não expõe (SEM MOCK).
//
// GAP-FE-036-402 (default (a) já implementado nesta Tarefa): hidrata os
// campos satélite via `GET /nfes/{uuid}/emission-status`
// (`useNfeEmissionStatus`, leitura pura, nunca chama a SEFAZ) sempre que
// `estado !== 'novo'` — sem isso, um F5 numa NFe já aprovada perderia
// número/chave/recibo até o usuário agir de novo.
//
// Rejeição SEFAZ (`SefazRejectionException`, 422, `errors: {cStat, motivo}`,
// confirmado por leitura direta de `TransmitNfeAction`/
// `SefazRejectionException.php`) vira BANNER PERSISTENTE aqui (não só
// toast) — o motivo estruturado é dado de domínio (contrato de tela §3
// "estados de UI obrigatórios"), e o backend já persiste `estado=rejeitado`
// mesmo com a resposta HTTP em erro (CL-011 item 12) — por isso o `onError`
// também invalida a query de status, para o painel refletir o novo estado
// assim que o usuário fechar o banner/tentar de novo. `CancelNfeAction`/
// `CorrectNfeAction` (leitura direta) NÃO persistem estado parcial em falha
// (guarda de estado local ANTES de chamar a SEFAZ, `BusinessRuleException`
// pré-transmissão) — a invalidação de status no `onError` de
// cancelar/corrigir é, portanto, uma rede de segurança (idempotente, nunca
// nociva), não uma correção de um caso conhecido como o do `emit`.
//
// Banner de erro SEPARADO por ação (`rejectionMessage` do Emitir,
// `eventErrorMessage` de Cancelar/Corrigir/Consultar) — evita que o sucesso
// de uma ação limpe silenciosamente o aviso de outra que ainda não foi
// revisado pelo usuário.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import {
  Box,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiDownload, FiSearch, FiSend, FiXCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { downloadBlob } from '@/utils/downloadBlob';
import formatDate from '@/utils/formatDate';

import { isNfeEditable } from '@/constants/Fiscal/nfe-estado-options';
import { queryKey } from '@/constants/query-key';

import {
  cancelNfe,
  consultNfe,
  correctNfe,
  downloadNfeCancellationPdf,
  downloadNfeCorrectionPdf,
  downloadNfeDanfe,
  downloadNfeDanfePreview,
  downloadNfeXml,
  downloadNfeXmlPreview,
  emitNfe,
} from '@/services/v2/Fiscal/nfe-service';

import type {
  NfeDetail,
  NfeEmissionResult,
  NfeEmitPayload,
  NfeEventPayload,
  NfeSefazConsultResult,
} from '@/@types/v2/Nfes';

import {
  NFE_CANCEL_MOTIVO_MAX,
  NFE_CORRECTION_MOTIVO_MAX,
  NFE_EVENT_MOTIVO_MIN,
} from './nfe-event-limits';
import { NfeEmitModal } from './NfeEmitModal';
import { NfeMotivoModal } from './NfeMotivoModal';
import { useNfeEmissionStatus } from './useNfeEmissionStatus';

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

/**
 * Extrai `{cStat, motivo}` de uma rejeição SEFAZ (`SefazRejectionException`,
 * 422, `errors: {cStat, motivo}` — ambos STRINGS soltas, não arrays; leitura
 * direta do backend). Guarda defensiva em cada nível (nunca assume o shape
 * sem checar `undefined`, mirror `get_pwa_error_loading_and_notification_
 * pattern §1`) — cai no `message` genérico do envelope quando os campos
 * estruturados não vêm no formato esperado. Reusado por Emitir/Cancelar/
 * Corrigir/Consultar — os 4 endpoints de `NfeEmissionController` propagam
 * a mesma `SefazRejectionException` quando a SEFAZ rejeita o evento.
 *
 * @param {unknown} error - erro capturado do `mutate(...).onError` (shape desconhecido).
 * @return {string | undefined} mensagem humanizada de rejeição, ou `undefined`
 *   se o erro não for um 422 reconhecível (o chamador aplica seu próprio fallback).
 */
function extractSefazRejectionMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  if (error.response?.status !== 422) return undefined;

  const errors = error.response?.data?.errors as Record<string, unknown> | null | undefined;
  const cStat = errors && typeof errors.cStat === 'string' ? errors.cStat : undefined;
  const motivo = errors && typeof errors.motivo === 'string' ? errors.motivo : undefined;

  if (motivo && cStat) return `${motivo} (cStat ${cStat})`;
  if (motivo) return motivo;

  const message = error.response?.data?.message;
  return typeof message === 'string' ? message : undefined;
}

/**
 * Extrai a primeira mensagem de `errors.motivo` de um 422 de validação
 * (Laravel devolve ARRAY por campo; aceita também string). Devolve
 * `undefined` para erro não-422 ou sem `errors.motivo`. Sem `isEmpty`
 * (ERRO-FE-001).
 *
 * @param {unknown} error - erro capturado da mutação.
 * @return {string | undefined} mensagem do campo `motivo`, se houver.
 */
export function extractMotivoFieldError(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  if (error.response?.status !== 422) return undefined;

  const errors = error.response?.data?.errors as Record<string, unknown> | null | undefined;
  const motivo = errors?.motivo;
  if (Array.isArray(motivo)) {
    const first = motivo.find((item) => typeof item === 'string');
    return typeof first === 'string' ? first : undefined;
  }
  return typeof motivo === 'string' ? motivo : undefined;
}

export interface NfeEmissionPanelProps {
  nfeDetail: NfeDetail;
}

export function NfeEmissionPanel({ nfeDetail }: NfeEmissionPanelProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.nfes.nfe.emission;

  const [rejectionMessage, setRejectionMessage] = useState<string | undefined>(undefined);
  const [eventErrorMessage, setEventErrorMessage] = useState<string | undefined>(undefined);
  const [consultResult, setConsultResult] = useState<NfeSefazConsultResult | undefined>(undefined);
  const [consultError, setConsultError] = useState<string | undefined>(undefined);
  // UT-000748 — erros dos modais de motivo (campo = 422 `errors.motivo`;
  // server = 422 de negócio, ex.: emissor sem ambiente).
  const [cancelFieldError, setCancelFieldError] = useState<string | undefined>(undefined);
  const [cancelServerError, setCancelServerError] = useState<string | undefined>(undefined);
  const [correctFieldError, setCorrectFieldError] = useState<string | undefined>(undefined);
  const [correctServerError, setCorrectServerError] = useState<string | undefined>(undefined);

  // TASK-FE-036-560/561/562 — loading por ação de download (documento único
  // por vez nesta tela, diferente do loading-por-linha da grid/NfseRecebidas).
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);
  const [isDownloadingDanfe, setIsDownloadingDanfe] = useState(false);
  const [isDownloadingCancellationPdf, setIsDownloadingCancellationPdf] = useState(false);
  const [isDownloadingCorrectionPdf, setIsDownloadingCorrectionPdf] = useState(false);

  const emitDisclosure = useDisclosure();
  const cancelDisclosure = useDisclosure();
  const correctDisclosure = useDisclosure();

  const statusQuery = useNfeEmissionStatus(nfeDetail.uuid, nfeDetail.estado);

  // Invalida detalhe (`estado`/badge) + status satélite (`sequencia_evento`)
  // + listagem — mesmo trio de queryKey do `emitMutation` (CL-011 já cobre
  // o prefixo `[queryKey.nfes.nfe, uuid, 'emission']` via `queryKey.nfes.nfe`).
  function invalidateEmissionQueries() {
    queryClient.invalidateQueries({
      queryKey: [queryKey.nfes.nfe, nfeDetail.uuid, 'emission'],
    });
  }

  const emitMutation = useRequest<NfeEmissionResult>({
    asyncFunction: async (payload: NfeEmitPayload) => emitNfe(nfeDetail.uuid, payload),
    queryKey: queryKey.nfes.nfe,
    queryKey2: queryKey.nfes.nfesList,
    typesRequest: 'apply',
    entityName: languageGB.nfes.nfe.singularLabel,
    personalizedMessage: text.emitSuccessToast,
    actionSuccess: () => {
      setRejectionMessage(undefined);
      emitDisclosure.onClose();
    },
  });

  const cancelMutation = useRequest<NfeEmissionResult>({
    asyncFunction: async (payload: NfeEventPayload) => cancelNfe(nfeDetail.uuid, payload),
    queryKey: queryKey.nfes.nfe,
    queryKey2: queryKey.nfes.nfesList,
    typesRequest: 'apply',
    entityName: languageGB.nfes.nfe.singularLabel,
    personalizedMessage: text.cancelSuccessToast,
    actionSuccess: () => {
      setEventErrorMessage(undefined);
      cancelDisclosure.onClose();
    },
  });

  const correctMutation = useRequest<NfeEmissionResult>({
    asyncFunction: async (payload: NfeEventPayload) => correctNfe(nfeDetail.uuid, payload),
    queryKey: queryKey.nfes.nfe,
    queryKey2: queryKey.nfes.nfesList,
    typesRequest: 'apply',
    entityName: languageGB.nfes.nfe.singularLabel,
    personalizedMessage: text.correctSuccessToast,
    actionSuccess: () => {
      setEventErrorMessage(undefined);
      correctDisclosure.onClose();
    },
  });

  // `consultNfe` devolve `NfeSefazConsultResult` — shape DISTINTO de
  // `NfeEmissionResult` (leitura direta de `NfeEmissionController::
  // consult()`), então NÃO passa por `useRequest` (que assume o mesmo shape
  // de entidade nas 3 mutações acima) — ação "leitura contra a SEFAZ", sem
  // toast de entidade persistida (mirror da tabela de decisão `useRequest`
  // vs `useMutation` direto: sem `entidade nomeável` alterada, resultado
  // precisa ser EXIBIDO, não só confirmado por toast).
  const consultMutation = useMutation({
    mutationFn: async () => {
      const response = await consultNfe(nfeDetail.uuid);
      return response.data;
    },
    onSuccess: (data) => {
      setConsultResult(data);
      setConsultError(undefined);
      // UT-000748 — a API sincroniza `estado` na consulta: recarrega detalhe
      // (badge/botões) e listagem sem reload manual.
      queryClient.invalidateQueries({ queryKey: [queryKey.nfes.nfe] });
      queryClient.invalidateQueries({ queryKey: [queryKey.nfes.nfesList] });
      if (data.estado === 'cancelado' && nfeDetail.estado === 'aprovado') {
        toaster.create({
          title: text.panelTitle,
          description: text.consultCancelledNotice,
          type: 'warning',
        });
      }
    },
    onError: (error) => {
      setConsultResult(undefined);
      setConsultError(extractSefazRejectionMessage(error) ?? text.consultGenericError);
    },
  });

  // GAP-FE-036-516 (RESOLVIDO) — o payload agora vem PRONTO do
  // `NfeEmitModal` (Emissor + IE do EMISSOR, escolhidos na cascata do
  // próprio modal via `GET /nfes/issuer-options`), nunca mais montado aqui a
  // partir de `nfeDetail.issuer`/`state_registration_client` (IE do
  // CLIENTE, campo ERRADO usado até a Onda 3).
  function handleConfirmEmit(payload: NfeEmitPayload) {
    setRejectionMessage(undefined);
    emitMutation.mutate(payload, {
      onError: (error) => {
        // CL-011 item 12 — o backend persiste `estado=rejeitado` mesmo
        // devolvendo 422; invalida a query de status para o painel
        // refletir o novo estado assim que o usuário fechar o banner.
        invalidateEmissionQueries();
        setRejectionMessage(extractSefazRejectionMessage(error) ?? text.emitGenericError);
      },
    });
  }

  function openCancelModal() {
    setCancelFieldError(undefined);
    setCancelServerError(undefined);
    cancelDisclosure.onOpen();
  }

  function openCorrectModal() {
    setCorrectFieldError(undefined);
    setCorrectServerError(undefined);
    correctDisclosure.onOpen();
  }

  function handleConfirmCancel(motivo: string) {
    setEventErrorMessage(undefined);
    setCancelFieldError(undefined);
    setCancelServerError(undefined);
    cancelMutation.mutate(
      { motivo },
      {
        onError: (error) => {
          invalidateEmissionQueries();
          const fieldError = extractMotivoFieldError(error);
          if (fieldError) setCancelFieldError(fieldError);
          else setCancelServerError(extractSefazRejectionMessage(error) ?? text.cancelGenericError);
        },
      }
    );
  }

  function handleConfirmCorrect(motivo: string) {
    setEventErrorMessage(undefined);
    setCorrectFieldError(undefined);
    setCorrectServerError(undefined);
    correctMutation.mutate(
      { motivo },
      {
        onError: (error) => {
          invalidateEmissionQueries();
          const fieldError = extractMotivoFieldError(error);
          if (fieldError) setCorrectFieldError(fieldError);
          else
            setCorrectServerError(extractSefazRejectionMessage(error) ?? text.correctGenericError);
        },
      }
    );
  }

  function handleConsult() {
    setConsultError(undefined);
    consultMutation.mutate();
  }

  // TASK-FE-036-560/561/562 — nome de arquivo derivado da `chave` (satélite,
  // só disponível após transmissão) com fallback ao `code` do cabeçalho e,
  // em último caso, ao `uuid` (nunca vazio, SEM MOCK).
  function documentFileBaseName(): string {
    return statusQuery.data?.chave || nfeDetail.code || nfeDetail.uuid;
  }

  async function handleDownloadXml() {
    setIsDownloadingXml(true);
    try {
      const isFinal = isDocumentFinalState;
      const blob = isFinal
        ? await downloadNfeXml(nfeDetail.uuid)
        : await downloadNfeXmlPreview(nfeDetail.uuid);
      downloadBlob(blob, `${isFinal ? 'nfe' : 'nfe-preview'}-${documentFileBaseName()}.xml`);
    } catch {
      toaster.error({ title: text.panelTitle, description: text.documents.downloadXmlError });
    } finally {
      setIsDownloadingXml(false);
    }
  }

  async function handleDownloadDanfe() {
    setIsDownloadingDanfe(true);
    try {
      const isFinal = isDocumentFinalState;
      const blob = isFinal
        ? await downloadNfeDanfe(nfeDetail.uuid)
        : await downloadNfeDanfePreview(nfeDetail.uuid);
      downloadBlob(blob, `${isFinal ? 'danfe' : 'danfe-preview'}-${documentFileBaseName()}.pdf`);
    } catch {
      toaster.error({ title: text.panelTitle, description: text.documents.downloadDanfeError });
    } finally {
      setIsDownloadingDanfe(false);
    }
  }

  async function handleDownloadCancellationPdf() {
    setIsDownloadingCancellationPdf(true);
    try {
      const blob = await downloadNfeCancellationPdf(nfeDetail.uuid);
      downloadBlob(blob, `cancelamento-${documentFileBaseName()}.pdf`);
    } catch {
      toaster.error({
        title: text.panelTitle,
        description: text.documents.downloadCancellationPdfError,
      });
    } finally {
      setIsDownloadingCancellationPdf(false);
    }
  }

  async function handleDownloadCorrectionPdf() {
    setIsDownloadingCorrectionPdf(true);
    try {
      const blob = await downloadNfeCorrectionPdf(nfeDetail.uuid);
      downloadBlob(blob, `carta-correcao-${documentFileBaseName()}.pdf`);
    } catch {
      toaster.error({
        title: text.panelTitle,
        description: text.documents.downloadCorrectionPdfError,
      });
    } finally {
      setIsDownloadingCorrectionPdf(false);
    }
  }

  const canEmit = can('nfe_edit') && isNfeEditable(nfeDetail.estado);
  // TASK-FE-036-513 — Cancelar/Corrigir só fazem sentido para NF-e já
  // `aprovado` na SEFAZ (mirror `CancelNfeAction::guardCancellableState()`/
  // `NfeEmissionController::middleware()`, permissões distintas por verbo).
  const canCancel = can('nfe_delete') && nfeDetail.estado === 'aprovado';
  const canCorrect = can('nfe_edit') && nfeDetail.estado === 'aprovado';
  // TASK-FE-036-514 — Consultar reusa `nfe_view` (mirror
  // `NfeEmissionController::middleware()`, `only: ['consult']` exige só
  // `nfe_view`) e só faz sentido após a NF-e ter sido transmitida ao menos
  // uma vez (mesma guarda de `useNfeEmissionStatus`: `estado !== 'novo'`).
  const canConsult = can('nfe_view') && nfeDetail.estado !== 'novo';

  // TASK-FE-036-560/561/562 — Downloads de documento, gate único `nfe_view`
  // (leitura, `NfeDocumentController`). `isDocumentFinalState` (aprovado/
  // cancelado — já transmitido com sucesso ao menos 1 vez) decide qual par
  // de endpoint (preview/final) XML/DANFE chamam e como se rotulam; PDF de
  // Cancelamento e Carta de Correção só aparecem "conforme houver" (ver
  // docblock no topo do arquivo).
  const canViewDocuments = can('nfe_view');
  const isDocumentFinalState = nfeDetail.estado === 'aprovado' || nfeDetail.estado === 'cancelado';
  const canDownloadXml = canViewDocuments;
  const canDownloadDanfe = canViewDocuments;
  const canDownloadCancellationPdf = canViewDocuments && nfeDetail.estado === 'cancelado';
  const canDownloadCorrectionPdf =
    canViewDocuments &&
    nfeDetail.estado === 'aprovado' &&
    (statusQuery.data?.sequencia_evento ?? 0) > 0;
  const hasAnyDocumentAction =
    canDownloadXml || canDownloadDanfe || canDownloadCancellationPdf || canDownloadCorrectionPdf;
  const hasAnyAction = canEmit || canCancel || canCorrect || canConsult || hasAnyDocumentAction;

  const isStatusLoading = statusQuery.isLoading;
  const status = statusQuery.data;

  return (
    <Box borderWidth="1px" borderColor="border.subtle" borderRadius="md" p={4} mt={4}>
      <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Text fontSize="sm" fontWeight="semibold" color="fg.default">
          {text.panelTitle}
        </Text>
        {hasAnyAction && (
          <Flex gap={2} wrap="wrap">
            {canEmit && (
              <Button
                title={text.emitButton}
                icon={FiSend as ElementType}
                size="sm"
                onClick={emitDisclosure.onOpen}
              />
            )}
            {canCorrect && (
              <Button
                title={text.correctButton}
                variant="outline"
                size="sm"
                onClick={openCorrectModal}
              />
            )}
            {canCancel && (
              <Button
                title={text.cancelButton}
                icon={FiXCircle as ElementType}
                variant="outline"
                colorPalette="red"
                size="sm"
                onClick={openCancelModal}
              />
            )}
            {canConsult && (
              <Button
                title={text.consultButton}
                icon={FiSearch as ElementType}
                variant="outline"
                size="sm"
                loading={consultMutation.isPending}
                onClick={handleConsult}
              />
            )}
            {canDownloadXml && (
              <Button
                title={
                  isDocumentFinalState
                    ? text.documents.downloadXmlButton
                    : text.documents.downloadXmlPreviewButton
                }
                icon={FiDownload as ElementType}
                variant="outline"
                size="sm"
                loading={isDownloadingXml}
                onClick={handleDownloadXml}
              />
            )}
            {canDownloadDanfe && (
              <Button
                title={
                  isDocumentFinalState
                    ? text.documents.downloadDanfeButton
                    : text.documents.downloadDanfePreviewButton
                }
                icon={FiDownload as ElementType}
                variant="outline"
                size="sm"
                loading={isDownloadingDanfe}
                onClick={handleDownloadDanfe}
              />
            )}
            {canDownloadCorrectionPdf && (
              <Button
                title={text.documents.downloadCorrectionPdfButton}
                icon={FiDownload as ElementType}
                variant="outline"
                size="sm"
                loading={isDownloadingCorrectionPdf}
                onClick={handleDownloadCorrectionPdf}
              />
            )}
            {canDownloadCancellationPdf && (
              <Button
                title={text.documents.downloadCancellationPdfButton}
                icon={FiDownload as ElementType}
                variant="outline"
                size="sm"
                loading={isDownloadingCancellationPdf}
                onClick={handleDownloadCancellationPdf}
              />
            )}
          </Flex>
        )}
      </Flex>

      {statusQuery.isError && (
        <Flex
          align="center"
          gap={2}
          p={3}
          mb={4}
          bg="orange.500/10"
          border="1px solid"
          borderColor="orange.500/30"
          borderRadius="lg"
        >
          <Icon as={FiAlertTriangle as ElementType} color="orange.400" boxSize={4} flexShrink={0} />
          <Text fontSize="sm" color="fg.default">
            {text.statusErrorBanner}
          </Text>
        </Flex>
      )}

      {rejectionMessage && (
        <Flex
          align="center"
          gap={2}
          p={3}
          mb={4}
          bg="red.500/10"
          border="1px solid"
          borderColor="red.500/30"
          borderRadius="lg"
        >
          <Icon as={FiAlertTriangle as ElementType} color="fg.error" boxSize={4} flexShrink={0} />
          <Text fontSize="sm" fontWeight="semibold" color="fg.error">
            {rejectionMessage}
          </Text>
        </Flex>
      )}

      {eventErrorMessage && (
        <Flex
          align="center"
          gap={2}
          p={3}
          mb={4}
          bg="red.500/10"
          border="1px solid"
          borderColor="red.500/30"
          borderRadius="lg"
        >
          <Icon as={FiAlertTriangle as ElementType} color="fg.error" boxSize={4} flexShrink={0} />
          <Text fontSize="sm" fontWeight="semibold" color="fg.error">
            {eventErrorMessage}
          </Text>
        </Flex>
      )}

      {consultError && (
        <Flex
          align="center"
          gap={2}
          p={3}
          mb={4}
          bg="red.500/10"
          border="1px solid"
          borderColor="red.500/30"
          borderRadius="lg"
        >
          <Icon as={FiAlertTriangle as ElementType} color="fg.error" boxSize={4} flexShrink={0} />
          <Text fontSize="sm" fontWeight="semibold" color="fg.error">
            {consultError}
          </Text>
        </Flex>
      )}

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <Skeleton loading={isStatusLoading}>
          <InfoField label={text.fields.numeroNfe} value={status?.numero_nfe ?? '—'} />
        </Skeleton>
        <Skeleton loading={isStatusLoading}>
          <InfoField label={text.fields.chave} value={status?.chave ?? '—'} />
        </Skeleton>
        <Skeleton loading={isStatusLoading}>
          <InfoField label={text.fields.receipt} value={status?.receipt ?? '—'} />
        </Skeleton>
        <Skeleton loading={isStatusLoading}>
          <InfoField
            label={text.fields.dateSendSefaz}
            value={status?.date_send_sefaz ? formatDate(status.date_send_sefaz) : '—'}
          />
        </Skeleton>
      </SimpleGrid>

      {/* TASK-FE-036-514 — resultado da consulta manual SEFAZ, shape
          `NfeSefazConsultResult` (DISTINTO de `NfeEmissionResult` — nunca
          reaproveitar os `InfoField` acima, que leem `status`). */}
      {consultResult && (
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="border.subtle">
          <Text fontSize="sm" fontWeight="semibold" color="fg.default" mb={3}>
            {text.consultResult.title}
          </Text>
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <InfoField
              label={text.consultResult.situacao}
              value={
                text.consultResult.situacaoLabels[consultResult.situacao] ??
                (consultResult.situacao || text.consultResult.noData)
              }
            />
            <InfoField
              label={text.consultResult.protocolNumber}
              value={consultResult.protocol_number ?? text.consultResult.noData}
            />
            <InfoField
              label={text.consultResult.protocolStatus}
              value={consultResult.protocol_status ?? text.consultResult.noData}
            />
            <InfoField
              label={text.consultResult.chave}
              value={consultResult.chave || text.consultResult.noData}
            />
          </SimpleGrid>
          {consultResult.protocol_motivo && (
            <VStack align="stretch" mt={3} gap={1}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
              >
                {text.consultResult.protocolMotivo}
              </Text>
              <Text fontSize="sm" color="fg.default">
                {consultResult.protocol_motivo}
              </Text>
            </VStack>
          )}
        </Box>
      )}

      <NfeEmitModal
        isOpen={emitDisclosure.open}
        onClose={emitDisclosure.onClose}
        nfeDetail={nfeDetail}
        languageGB={languageGB}
        mutation={emitMutation}
        onConfirm={handleConfirmEmit}
      />

      <NfeMotivoModal
        isOpen={cancelDisclosure.open}
        onClose={cancelDisclosure.onClose}
        title={text.cancelModal.title}
        description={text.cancelModal.description}
        motivoLabel={text.cancelModal.motivoLabel}
        motivoPlaceholder={text.cancelModal.motivoPlaceholder}
        motivoRequiredMessage={text.cancelModal.motivoRequired}
        minLength={NFE_EVENT_MOTIVO_MIN}
        maxLength={NFE_CANCEL_MOTIVO_MAX}
        minLengthMessage={text.cancelModal.motivoMin}
        maxLengthMessage={text.cancelModal.motivoMax}
        helperText={text.cancelModal.motivoHelper}
        fieldError={cancelFieldError}
        serverError={cancelServerError}
        confirmLabel={text.cancelModal.confirmButton}
        cancelLabel={languageGB.defaltStrings.cancel}
        mutation={cancelMutation}
        onConfirm={handleConfirmCancel}
      />

      <NfeMotivoModal
        isOpen={correctDisclosure.open}
        onClose={correctDisclosure.onClose}
        title={text.correctModal.title}
        description={text.correctModal.description}
        motivoLabel={text.correctModal.motivoLabel}
        motivoPlaceholder={text.correctModal.motivoPlaceholder}
        motivoRequiredMessage={text.correctModal.motivoRequired}
        minLength={NFE_EVENT_MOTIVO_MIN}
        maxLength={NFE_CORRECTION_MOTIVO_MAX}
        minLengthMessage={text.correctModal.motivoMin}
        maxLengthMessage={text.correctModal.motivoMax}
        helperText={text.correctModal.motivoHelper}
        fieldError={correctFieldError}
        serverError={correctServerError}
        confirmLabel={text.correctModal.confirmButton}
        cancelLabel={languageGB.defaltStrings.cancel}
        mutation={correctMutation}
        onConfirm={handleConfirmCorrect}
      />
    </Box>
  );
}
