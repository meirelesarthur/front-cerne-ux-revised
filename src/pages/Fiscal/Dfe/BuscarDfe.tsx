// src/pages/Fiscal/Dfe/BuscarDfe.tsx
// -----------------------------------------------------------------------------
// Tela "Buscar DFe" (Dfe — domínio Fiscal, execução 044, TASK-DFE-FE-07).
// Mirror QUASE 1:1 `BaseRegistrations/NfseRecebidas/BuscarDfe.tsx` (mesmo
// domínio Fiscal, mesmo problema — sincronizar documentos fiscais de um
// Emissor). Dispara `POST /dfes/sync` (SÍNCRONO, `GAP-DFE-02` opção A —
// `DECISOES-DONO.md`).
//
// DIV-10 NÃO replicada (`CONTRATO-TELA-DFE-FE.md §8`): a tabela vazia da
// tela `dfe.create` do legado era um bug (nunca consumia a resposta) — este
// componente segue o precedente real `BuscarDfe.tsx` (Nfse), já aprovado:
// SEM tabela, toast + navega para o index já filtrado pelo Emissor usado.
//
// UT-000752 (T-752-FE-02, P-FE-01 default): a API devolve `data: null` + `message`
// (o toast usa a `message`, não mais uma contagem). Falhas:
//   409 (sync em andamento)  → toast warning, fica na tela, sem banner;
//   422 ambiente ausente     → banner `feedBack.warn` + link p/ o cadastro do Emissor;
//   422/401 certificado      → banner com link p/ o certificado;
//   demais (SEFAZ, 656, 5xx) → toast error + redireciona p/ a lista filtrada (C-08).
//
// A resposta é SÍNCRONA e PODE DEMORAR (webservice nacional SEFAZ) — Lei UX
// "nenhum estado silencioso": mensagem de loading explícita durante toda a
// chamada.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { classifyDfeSyncError, type DfeSyncErrorKind } from '@/utils/classifyDfeSyncError';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import { syncDfe } from '@/services/v2/Fiscal/dfe-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { Option } from '@/@types/option';
import type { DfeSyncPayload } from '@/@types/v2/Fiscal/dfe';
import type { IssuerListItem } from '@/@types/v2/Issuers';

import { DFE_RECEBIDAS_STORAGE_KEY } from './storage';

interface BuscarDfeFormValues {
  issue_uuid: Option<string> | null;
}

export default function BuscarDfe() {
  const { languageGB } = useLanguage();
  const navigate = useNavigate();
  const text = languageGB.dfes.dfe.syncScreen;

  const { control, handleSubmit, watch } = useForm<BuscarDfeFormValues>({
    defaultValues: { issue_uuid: null },
  });

  const issuerOption = watch('issue_uuid');
  const queryClient = useQueryClient();

  const [errorKind, setErrorKind] = useState<DfeSyncErrorKind | null>(null);

  // Handoff para o index JÁ FILTRADO pelo Emissor usado — escreve direto no
  // mesmo slot de storage que `usePaginatedQueryStorage` lê.
  function handoffToList(issueUuid: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'storageKeyGB' + DFE_RECEBIDAS_STORAGE_KEY,
        JSON.stringify({
          pageIndex: 1,
          pageSize: 10,
          filter: { issue_uuid: issueUuid },
        })
      );
    }
    navigate('/fiscal/dfes');
  }

  // `useMutation` DIRETO (não `useRequest`) — precisa CLASSIFICAR o erro
  // (409/422 ambiente/422 certificado/outros) para decidir o feedback.
  const syncMutation = useMutation({
    mutationFn: (payload: DfeSyncPayload) => syncDfe(payload),
    onMutate: () => setErrorKind(null),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.dfes.dfesList] });

      toaster.success({
        title: languageGB.dfes.dfe.pluralLabel,
        description: response?.message || text.successToast,
      });

      handoffToList(variables.issue_uuid);
    },
    onError: (error, variables) => {
      const kind = classifyDfeSyncError(error);
      const message = extractApiErrorMessage(error);
      setErrorKind(kind);

      if (kind === 'in-progress') {
        toaster.warning({
          title: languageGB.dfes.dfe.pluralLabel,
          description: message || text.syncInProgress,
        });
        return;
      }

      if (kind === 'environment' || kind === 'certificate') return; // banner

      toaster.error({
        title: languageGB.dfes.dfe.pluralLabel,
        description: message || text.errorToast,
      });
      // Legado (C-08): na falha também redireciona para a lista do emissor.
      handoffToList(variables.issue_uuid);
    },
  });

  function onSubmit(data: BuscarDfeFormValues) {
    if (!data.issue_uuid?.value) return;

    syncMutation.mutate({ issue_uuid: data.issue_uuid.value });
  }

  const isSubmitting = syncMutation.isPending;

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
          name="issue_uuid"
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

        {/* Lei de UX "nenhum estado silencioso" — chamada SÍNCRONA, pode demorar. */}
        {isSubmitting && (
          <Text fontSize="sm" color="fg.muted" mt={3}>
            {text.loadingMessage}
          </Text>
        )}

        {(errorKind === 'environment' || errorKind === 'certificate') && (
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
              {errorKind === 'environment'
                ? text.environmentMissingError
                : text.certificateMissingError}
            </Text>
            {issuerOption?.value && (
              <Button
                title={
                  errorKind === 'environment'
                    ? text.environmentMissingLink
                    : text.certificateMissingLink
                }
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    errorKind === 'environment'
                      ? `/cadastros-base/emissores/${issuerOption.value}`
                      : `/cadastros-base/emissores/${issuerOption.value}/certificado`
                  )
                }
              />
            )}
          </VStack>
        )}
      </Box>
    </ContainerGrid>
  );
}
