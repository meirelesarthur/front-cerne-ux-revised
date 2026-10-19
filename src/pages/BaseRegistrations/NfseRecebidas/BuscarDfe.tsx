// src/pages/BaseRegistrations/NfseRecebidas/BuscarDfe.tsx
// -----------------------------------------------------------------------------
// Tela "Buscar DFe" (Nfse — domínio Fiscal, execução 033, TASK-FE-2734, spec
// visual §4 imagem #29 — "Consulte os documentos"). Dispara `POST /nfses`
// (sincronização SÍNCRONA — `GAP-BE-519` já decidido pelo dono: sem Job/202,
// o fork não tem infra de fila hoje). Depende de `TASK-FE-2730` (fundação).
//
// A resposta é SÍNCRONA e PODE DEMORAR (contrato §8.4 — chamada de rede real
// ao webservice nacional SEFIN/ADN, loop de até `MAX_LOOPS=15`/
// `MAX_RETRIES=3` por página de NSU; risco de timeout conhecido e
// PRÉ-EXISTENTE, não é regressão da migração). A UI comunica isso com
// mensagem explícita de loading — Lei de UX "nenhum estado silencioso",
// NUNCA um spinner mudo.
//
// A resposta devolve `NfseListItem[]` — o DELTA sincronizado NESTA CHAMADA
// (RN-9, NSU incremental), NÃO a lista final do Emissor (pode ser 0
// documentos novos se já estava tudo sincronizado). Ao concluir: toast "N
// documento(s) sincronizado(s)" + navega para a Listagem JÁ FILTRADA pelo
// Emissor usado — `usePaginatedQueryStorage` (dono do estado da Listagem,
// `TASK-FE-2732`) NÃO lê querystring, só `localStorage`; por isso o handoff
// escreve DIRETO no mesmo slot de storage (`NFSE_RECEBIDAS_STORAGE_KEY`,
// exportada de `./index.tsx`) antes de navegar — mesma ideia de "o front
// detecta conclusão via refetch da listagem" do contrato §8.4, aplicada ao
// caminho síncrono real.
//
// UT-000754 (FLX-113 P3): a contagem vem de `meta.synced_count` (fallback
// `data.length` para API antiga) e `meta.environment === 'homologacao'` ganha
// sufixo no toast. Erros são distintos (sem texto fixo de "certificado
// ausente"): 422 mostra a mensagem REAL da API (certificado, SEFIN ou emissor
// sem ambiente) + links do emissor/certificado; 503 e falha de rede/timeout
// mostram "Tentar novamente"; 403/404 só toast.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { syncNfses } from '@/services/v2/BaseRegistrations/nfse-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { Option } from '@/@types/option';
import type { NfseSyncEnvelope, NfseSyncPayload } from '@/@types/v2/BaseRegistrations/nfse';
import type { IssuerListItem } from '@/@types/v2/Issuers';

import { NFSE_RECEBIDAS_STORAGE_KEY } from './storage';

interface BuscarDfeFormValues {
  issuer_uuid: Option<string> | null;
}

type SyncErrorKind = 'validation' | 'unavailable' | 'network' | 'toast-only';

// Classifica o erro do `POST /nfses` pelo STATUS (nunca pelo texto da mensagem).
function classifySyncError(error: unknown): SyncErrorKind {
  if (!isAxiosError(error) || !error.response) return 'network';
  const status = error.response.status;
  if (status === 422) return 'validation';
  if (status === 503) return 'unavailable';
  return 'toast-only';
}

export default function BuscarDfe() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.baseRegistrations.nfse.syncScreen;

  const { control, handleSubmit, watch } = useForm<BuscarDfeFormValues>({
    defaultValues: { issuer_uuid: null },
  });

  const issuerOption = watch('issuer_uuid');
  const [lastIssuerUuid, setLastIssuerUuid] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // `useMutation` DIRETO (não `useRequest`) — o toast de sucesso precisa da
  // CONTAGEM dinâmica do delta sincronizado ("N documento(s)
  // sincronizado(s)"), que o toast automático de `useRequest` (mensagem
  // estática por `typesRequest`) não expressa (get_pwa_mutation_query_pattern
  // — regra "ação sem toast automático padrão → useMutation direto +
  // invalidação manual"). Invalidação manual da MESMA queryKey da Listagem.
  const syncMutation = useMutation({
    mutationFn: (payload: NfseSyncPayload) => syncNfses(payload),
    onSuccess: (response: NfseSyncEnvelope) => {
      const data = response?.data ?? [];
      // `meta.synced_count` é a contagem real; sem `meta` (API antiga) cai em `data.length`.
      const count = response?.meta?.synced_count ?? (Array.isArray(data) ? data.length : 0);
      const homologation = response?.meta?.environment === 'homologacao';

      queryClient.invalidateQueries({ queryKey: [queryKey.baseRegistrations.nfses] });

      const baseMessage = count > 0 ? `${count} ${text.successToast}` : text.successNone;
      toaster.success({
        title: languageGB.baseRegistrations.nfse.pluralLabel,
        description: homologation ? `${baseMessage} ${text.environmentHomologation}` : baseMessage,
      });

      // Handoff para a Listagem JÁ FILTRADA pelo Emissor usado — escreve
      // direto no mesmo slot de storage que `usePaginatedQueryStorage` lê
      // (ver cabeçalho do arquivo).
      if (lastIssuerUuid && typeof window !== 'undefined') {
        localStorage.setItem(
          'storageKeyGB' + NFSE_RECEBIDAS_STORAGE_KEY,
          JSON.stringify({
            pageIndex: 1,
            pageSize: 10,
            filter: { issuer_uuid: lastIssuerUuid },
          })
        );
      }

      navigate('/cadastros-base/nfse-recebidas');
    },
    onError: (error) => {
      // Sem resposta (timeout/rede) usa o texto i18n; com resposta, a mensagem da API.
      const description =
        classifySyncError(error) === 'network'
          ? text.timeoutError
          : extractApiErrorMessage(error) || text.errorToast;
      toaster.error({
        title: languageGB.baseRegistrations.nfse.pluralLabel,
        description,
      });
    },
  });

  function onSubmit(data: BuscarDfeFormValues) {
    if (!data.issuer_uuid?.value) return;

    setLastIssuerUuid(data.issuer_uuid.value);
    syncMutation.mutate({ issuer_uuid: data.issuer_uuid.value });
  }

  const isSubmitting = syncMutation.isPending;

  const errorKind = syncMutation.isError ? classifySyncError(syncMutation.error) : null;
  const errorMessage =
    errorKind === 'network'
      ? text.timeoutError
      : extractApiErrorMessage(syncMutation.error) || text.errorToast;
  // Emissor da última tentativa (o painel/retry não depende do select atual).
  const failedIssuerUuid = syncMutation.variables?.issuer_uuid ?? issuerOption?.value;

  function handleRetry() {
    if (!failedIssuerUuid) return;
    setLastIssuerUuid(failedIssuerUuid);
    syncMutation.mutate({ issuer_uuid: failedIssuerUuid });
  }

  return (
    <ContainerGrid>
      <VStack align="stretch" gap={1} mb={6}>
        <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
          {text.pageTitle}
        </Text>
        <Text fontSize="sm" color="fg.muted">
          {text.pageSubtitle}
        </Text>
      </VStack>

      <Box maxW="480px">
        <Controller
          name="issuer_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={`${text.issuer} *`}
              placeholder={text.issuerPlaceholder}
              service={listIssuers}
              mapOptions={(item: IssuerListItem) => ({
                label: item.razao_social,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isReadOnly={isSubmitting}
            />
          )}
        />

        <Button
          title={text.submitButton}
          mt={4}
          loading={isSubmitting}
          disabled={!issuerOption?.value || isSubmitting}
          onClick={handleSubmit(onSubmit)}
        />

        {/* Lei de UX "nenhum estado silencioso" — a chamada é SÍNCRONA e
            pode demorar (contrato §8.4, webservice nacional real). */}
        {isSubmitting && (
          <Text fontSize="sm" color="fg.muted" mt={3}>
            {text.loadingMessage}
          </Text>
        )}

        {errorKind && errorKind !== 'toast-only' && !isSubmitting && (
          <VStack
            align="stretch"
            gap={2}
            mt={4}
            p={3}
            borderRadius="md"
            bg="feedBack.warn"
            role="alert"
          >
            <Text fontSize="sm" color="feedBack.warnMain">
              {errorMessage}
            </Text>
            {errorKind === 'validation' && failedIssuerUuid && (
              <>
                <Button
                  title={text.issuerLink}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/cadastros-base/emissores/${failedIssuerUuid}`)}
                />
                <Button
                  title={text.certificateMissingLink}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/cadastros-base/emissores/${failedIssuerUuid}/certificado`)
                  }
                />
              </>
            )}
            {(errorKind === 'unavailable' || errorKind === 'network') && (
              <Button title={text.retryButton} variant="outline" size="sm" onClick={handleRetry} />
            )}
          </VStack>
        )}
      </Box>
    </ContainerGrid>
  );
}
