// src/pages/Fiscal/Mdfe/MdfeEmissionPanel.tsx
// -----------------------------------------------------------------------------
// Painel de ações SEFAZ do MDFe — TASK-MDFE-FE-09 (`CONTRATO-FRONT-MDFE.md
// §8`, Onda 2 — PARTIAL, depende de infraestrutura externa). Mirror
// ESTRUTURAL de `NfeEmitidas/NfeEmissionPanel.tsx`, simplificado: o MDFe já
// devolve `mdfe_numero`/`chave`/`protocolo`/`date_send_sefaz` no PRÓPRIO
// `MdfeResource` (`GET /mdfes/{uuid}`, ver `@/@types/v2/Fiscal/Mdfe`) — SEM
// endpoint satélite de status equivalente a `GET /nfes/{uuid}/emission-
// status`, então este painel só CONSOME o `mdfeDetail` já carregado pelo pai
// (`MdfeDetalhe.tsx`), nunca dispara uma 2ª query de status.
//
// Todas as 3 mutações (`emit`/`cancel`/`close`) usam `useRequest` com
// `typesRequest: 'apply'` (valor REAL do enum `typeRequest`,
// `src/hooks/useRequest.tsx` — nunca `'update'`/`'create'`, que são de CRUD
// comum), mirror exato `CONTRATO-FRONT-MDFE.md §8`.
//
// D3 (T-DEF02-FE-01) — o emissor é ESCOLHIDO na emissão: "Emitir" abre
// `MdfeEmitModal` (Select de emissor obrigatório, opções de `GET /mdfes/
// issuer-options`, pré-selecionado com o emissor do MDFe) e faz `POST /mdfes/
// {uuid}/emit` com `{ issuer_uuid }` (legado `MdfeEmiteController`, obrigatório).
// Substitui a premissa antiga (Execução 045) de que `emit` era bodyless. `cancel`/
// `close` seguem usando o emissor gravado no MDFe.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiDownload, FiSend, FiXCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { downloadBlob } from '@/utils/downloadBlob';

import { queryKey } from '@/constants/query-key';

import { cancelMdfe, downloadMdfeXml, emitMdfe } from '@/services/v2/Fiscal/mdfe-service';

import type { MdfeData, MdfeEmitPayload } from '@/@types/v2/Fiscal/Mdfe';

import { MdfeEmitModal } from './MdfeEmitModal';
import { MdfeMotivoModal } from './MdfeMotivoModal';

/**
 * Extrai `{cStat, motivo}` de uma rejeição SEFAZ — mirror
 * `NfeEmissionPanel.tsx::extractSefazRejectionMessage` (mesmo `MDFeService`,
 * mesma classe de exceção esperada, `CONTRATO-API-MDFE.md §6`: "mirror
 * direto de `NfeEmissionController`"). Duplicado localmente (não
 * compartilhado entre módulos Nfe/Mdfe) — mesma convenção já adotada pelo
 * resto do fork fiscal.
 *
 * @param {unknown} error - erro capturado do `mutate(...).onError` (shape desconhecido).
 * @return {string | undefined} mensagem humanizada de rejeição, ou `undefined`
 *   se o erro não for um 422 reconhecível (o chamador aplica seu próprio fallback).
 */
export function extractSefazRejectionMessage(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  if (error.response?.status !== 422) return undefined;

  const errors = error.response?.data?.errors as Record<string, unknown> | null | undefined;
  const cStat = errors && typeof errors.cStat === 'string' ? errors.cStat : undefined;
  const motivo = errors && typeof errors.motivo === 'string' ? errors.motivo : undefined;

  if (motivo && cStat) return `${motivo} (cStat ${cStat})`;
  if (motivo) return motivo;

  // 422 real de CIOT (MdfeRequest/EmitMdfeAction): `message` é o genérico do ApiExceptionHandler
  // ("Os dados informados são inválidos.") e o texto útil está em `errors.ciots` /
  // `errors['ciots.N.codigo']` — precisa vir ANTES de `message`.
  if (errors) {
    for (const [key, value] of Object.entries(errors)) {
      if (key !== 'ciots' && !key.startsWith('ciots.')) continue;
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string' && first) return first;
    }
  }

  const message = error.response?.data?.message;
  if (typeof message === 'string' && message) return message;

  // UT-000776 (T-776-API-05): CIOT ausente / emissor sem ambiente/cidade/UF/IE voltam como 422;
  // sem `message`, mostra a 1ª mensagem por campo (flat) em vez do texto genérico.
  if (errors) {
    for (const value of Object.values(errors)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string' && first) return first;
    }
  }
  return undefined;
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

export interface MdfeEmissionPanelProps {
  mdfeDetail: MdfeData;
}

export function MdfeEmissionPanel({ mdfeDetail }: MdfeEmissionPanelProps) {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.mdfes.mdfe.emission;

  const [eventErrorMessage, setEventErrorMessage] = useState<string | undefined>(undefined);
  const [isDownloadingXml, setIsDownloadingXml] = useState(false);

  const emitDisclosure = useDisclosure();
  const cancelDisclosure = useDisclosure();

  function invalidateMdfeQueries() {
    queryClient.invalidateQueries({ queryKey: [queryKey.mdfes.mdfe, mdfeDetail.uuid] });
    queryClient.invalidateQueries({ queryKey: [queryKey.mdfes.mdfesList] });
  }

  // Erro esperado no ambiente é 422 de regra (emissor ausente/não habilitado) ou
  // indisponibilidade real de webservice SEFAZ/certificado (BLOCKED_EXTERNAL) — o
  // `onError` invalida as queries (o backend pode ter persistido `estado=rejeitado`) e
  // mostra a mensagem real da API no modal e no banner (SEM MOCK de sucesso).
  const emitMutation = useRequest<MdfeData>({
    asyncFunction: async (payload: MdfeEmitPayload) => emitMdfe(mdfeDetail.uuid, payload),
    queryKey: queryKey.mdfes.mdfe,
    queryKey2: queryKey.mdfes.mdfesList,
    typesRequest: 'apply',
    entityName: languageGB.mdfes.mdfe.singularLabel,
    personalizedMessage: text.emitSuccessToast,
    actionSuccess: () => {
      setEventErrorMessage(undefined);
      emitDisclosure.onClose();
    },
  });

  function handleConfirmEmit(payload: MdfeEmitPayload) {
    setEventErrorMessage(undefined);
    emitMutation.mutate(payload, {
      onError: (error) => {
        invalidateMdfeQueries();
        setEventErrorMessage(extractSefazRejectionMessage(error) ?? text.emitGenericError);
      },
    });
  }

  const cancelMutation = useRequest<MdfeData>({
    asyncFunction: async (payload: { motivo: string }) => cancelMdfe(mdfeDetail.uuid, payload),
    queryKey: queryKey.mdfes.mdfe,
    queryKey2: queryKey.mdfes.mdfesList,
    typesRequest: 'apply',
    entityName: languageGB.mdfes.mdfe.singularLabel,
    personalizedMessage: text.cancelSuccessToast,
    actionSuccess: () => {
      setEventErrorMessage(undefined);
      cancelDisclosure.onClose();
    },
  });

  function handleConfirmCancel(motivo: string) {
    setEventErrorMessage(undefined);
    cancelMutation.mutate(
      { motivo },
      {
        onError: (error) => {
          invalidateMdfeQueries();
          setEventErrorMessage(extractSefazRejectionMessage(error) ?? text.cancelGenericError);
        },
      }
    );
  }

  async function handleDownloadXml() {
    setIsDownloadingXml(true);
    try {
      const blob = await downloadMdfeXml(mdfeDetail.uuid);
      downloadBlob(blob, `mdfe-${mdfeDetail.chave || mdfeDetail.uuid}.xml`);
    } catch {
      toaster.error({ title: text.panelTitle, description: text.downloadXmlError });
    } finally {
      setIsDownloadingXml(false);
    }
  }

  // Visibilidade (não `disabled`) por estado do MDFe (só emitível em
  // `'novo'`) + gate de permissão `mdfe_edit` — RBAC deny-by-default, mirror
  // `canCancel`/`canDownloadXml` abaixo.
  const canEmit = can('mdfe_edit') && mdfeDetail.estado === 'novo';
  const canCancel = can('mdfe_delete') && mdfeDetail.estado === 'aprovado';
  const canDownloadXml = can('mdfe_view') && mdfeDetail.estado === 'aprovado';
  const hasAnyAction = canEmit || canCancel || canDownloadXml;

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
            {canCancel && (
              <Button
                title={text.cancelButton}
                icon={FiXCircle as ElementType}
                variant="secondary"
                colorPalette="red"
                size="sm"
                onClick={cancelDisclosure.onOpen}
              />
            )}
            {canDownloadXml && (
              <Button
                title={text.downloadXmlButton}
                icon={FiDownload as ElementType}
                variant="outline"
                size="sm"
                loading={isDownloadingXml}
                onClick={handleDownloadXml}
              />
            )}
          </Flex>
        )}
      </Flex>

      {/* Com o modal de emissão aberto, o erro aparece dentro dele (sem duplicar). */}
      {eventErrorMessage && !emitDisclosure.open && (
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

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <InfoField label={text.fields.mdfeNumero} value={String(mdfeDetail.mdfe_numero ?? '—')} />
        <InfoField label={text.fields.chave} value={mdfeDetail.chave || '—'} />
        <InfoField label={text.fields.protocolo} value={mdfeDetail.protocolo || '—'} />
        <InfoField label={text.fields.dateSendSefaz} value={mdfeDetail.date_send_sefaz || '—'} />
      </SimpleGrid>

      <MdfeEmitModal
        isOpen={emitDisclosure.open}
        onClose={() => {
          setEventErrorMessage(undefined);
          emitDisclosure.onClose();
        }}
        mdfeDetail={mdfeDetail}
        languageGB={languageGB}
        mutation={emitMutation}
        onConfirm={handleConfirmEmit}
        errorMessage={eventErrorMessage}
      />

      <MdfeMotivoModal
        isOpen={cancelDisclosure.open}
        onClose={cancelDisclosure.onClose}
        title={text.cancelModal.title}
        description={text.cancelModal.description}
        motivoLabel={text.motivoLabel}
        motivoPlaceholder={text.cancelModal.motivoPlaceholder}
        motivoRequiredMessage={text.motivoRequired}
        motivoMinLengthMessage={text.motivoMinLength}
        confirmLabel={text.cancelModal.confirmButton}
        cancelLabel={languageGB.defaltStrings.cancel}
        mutation={cancelMutation}
        onConfirm={handleConfirmCancel}
      />
    </Box>
  );
}
