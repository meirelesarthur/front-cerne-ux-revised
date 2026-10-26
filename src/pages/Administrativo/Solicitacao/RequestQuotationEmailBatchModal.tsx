// src/pages/Administrativo/Solicitacao/RequestQuotationEmailBatchModal.tsx
// -----------------------------------------------------------------------------
// Modal "Enviar E-mail em Lote" (RequestQuotation — Administrativo/Suprimentos,
// esteira 97-Esteiras/035, TASK-CQ-FE-08, Dimensão B). Substitui o STUB
// `handleSendEmailBatch` de `RequestQuotationTab.tsx` (TASK-CQ-FE-03, IG-09) —
// acionado pelo botão "Enviar E-mail em Lote" do cabeçalho da aba, habilitado
// só com `selectedUuids.length>=1`.
//
// Composição: Dialog v3 (`Dialog.Root>Portal>Backdrop+Positioner>Content`,
// mirror estrutural dos demais Dialogs deste módulo), MAS sem
// `react-hook-form`/schema Yup — não há nenhum campo de TEXTO validado aqui,
// só checkboxes; o payload é 100% derivado do estado de seleção local
// (`useState`), mesma disciplina já usada para a seleção em lote em
// `RequestQuotationTab.tsx`. `BulkActionBar.tsx` do `cerne` é UX-GAP (roteiro
// frontend §1.2) — este Modal É a construção mínima pedida (uma seção por
// cotação selecionada + `CheckboxListField` de vendedores, componente
// GENÉRICO já existente no projeto — `@/components/Form/CheckboxListField`,
// nenhum componente novo de "barra de ação" inventado do zero).
//
// Payload — `POST /request-quotations/email-batch` (roteiro de API,
// TASK-CQ-API-08, Seção 8.2): `{quotations: [{quotation_uuid,
// provider_selected, seller_uuids[]}]}` — formato decidido pela API, NÃO o
// array posicional por checkbox do legado (CL-050). `provider_selected`/
// `seller_uuids` são SEMPRE enviados (mesmo vazios/`false`) para toda
// cotação do lote — o Form Request real usa `present` (LAC-05, ver tipo).
//
// Vendedores por cotação — `GET /providers/{uuid}` (`ProviderDetail.sellers`,
// `getProviderByUuid`), MESMO endpoint já consumido pela cascata
// `branch_uuid` de `RequestQuotationFormDialog.tsx` (CL-021/022) — nenhum
// endpoint novo. Deduplicado por `provider.uuid` via `useQueries` (a mesma
// cotação pode repetir fornecedor entre cotações selecionadas; cada
// fornecedor só é buscado UMA vez, mesmo aparecendo em N cotações).
//
// 422 `errors.invalid_emails[]` (`BusinessRuleException`,
// `SendRequestQuotationEmailBatchAction`, CL-050: "aborta o lote inteiro se
// algum e-mail resolvido não contém '@'") — shape PRÓPRIO deste endpoint,
// DISTINTO do 422 flat-por-campo (`setError`) dos demais Dialogs deste
// módulo. O front NUNCA decide client-side quem é válido — só exibe a lista
// completa devolvida pelo servidor (Alert inline + toast), nenhuma
// verificação de formato de e-mail é feita aqui.
//
// Guarda client-side de "nenhum destinatário selecionado" (`handleSubmit`)
// NÃO é validação de e-mail — só evita um POST que o servidor processaria
// como no-op total (mirror `resolveRecipients`==`[]` silenciosamente
// ignorado na Action real).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Alert, Badge, Box, Dialog, Flex, Icon, Portal, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FiAlertTriangle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Checkbox } from '@/components/ui/checkbox';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import { getProviderByUuid } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { sendRequestQuotationEmailBatch } from '@/services/v2/RequestQuotations/request-quotation-service';

import type {
  RequestQuotationData,
  RequestQuotationEmailBatchItemPayload,
} from '@/@types/v2/RequestQuotations';

export interface RequestQuotationEmailBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Cotações SELECIONADAS (subconjunto de `items` já filtrado por
   *  `selectedUuids` — `RequestQuotationTab.tsx`, IG-09). O botão que abre
   *  este Modal só habilita com `>=1` selecionada. */
  quotations: RequestQuotationData[];
  /** UUID da `RequestPurchase` pai — só para invalidar a grade da aba no
   *  sucesso (mirror `RequestQuotationAuthorizerDialog.tsx`). */
  requestPurchaseUuid: string;
  /** Chamado no sucesso do envio — o Tab limpa `selectedUuids` (a seleção
   *  não sobrevive a um envio já enfileirado). */
  onSent: () => void;
}

type SelectionEntry = { providerSelected: boolean; sellerUuids: string[] };
type SelectionState = Record<string, SelectionEntry>;

const EMPTY_ENTRY: SelectionEntry = { providerSelected: false, sellerUuids: [] };

export function RequestQuotationEmailBatchModal({
  isOpen,
  onClose,
  quotations,
  requestPurchaseUuid,
  onSent,
}: RequestQuotationEmailBatchModalProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestQuotations.requestQuotation;
  const batchText = text.emailBatch;

  const [selection, setSelection] = useState<SelectionState>({});
  const [searchByQuotation, setSearchByQuotation] = useState<Record<string, string>>({});
  const [invalidEmails, setInvalidEmails] = useState<string[] | null>(null);

  function getEntry(quotationUuid: string): SelectionEntry {
    return selection[quotationUuid] ?? EMPTY_ENTRY;
  }

  function toggleProviderSelected(quotationUuid: string) {
    setInvalidEmails(null);
    setSelection((prev) => {
      const entry = prev[quotationUuid] ?? EMPTY_ENTRY;
      return {
        ...prev,
        [quotationUuid]: { ...entry, providerSelected: !entry.providerSelected },
      };
    });
  }

  function setSellerUuids(quotationUuid: string, sellerUuids: string[]) {
    setInvalidEmails(null);
    setSelection((prev) => {
      const entry = prev[quotationUuid] ?? EMPTY_ENTRY;
      return { ...prev, [quotationUuid]: { ...entry, sellerUuids } };
    });
  }

  // ---- Fornecedores das cotações selecionadas (`GET /providers/{uuid}`,
  // `ProviderDetail.sellers` — ver cabeçalho do arquivo) — deduplicado por
  // uuid via `useQueries`. -------------------------------------------------
  const uniqueProviderUuids = useMemo(
    () =>
      Array.from(
        new Set(
          quotations
            .map((quotation) => quotation.provider?.uuid)
            .filter((uuid): uuid is string => !!uuid)
        )
      ),
    [quotations]
  );

  const providerQueries = useQueries({
    queries: uniqueProviderUuids.map((providerUuid) => ({
      queryKey: [queryKey.cadastrosBase.provider, providerUuid],
      queryFn: async () => (await getProviderByUuid(providerUuid)).data,
      enabled: isOpen,
    })),
  });

  const providerDetailByUuid = useMemo(() => {
    const map = new Map<string, (typeof providerQueries)[number]>();
    uniqueProviderUuids.forEach((providerUuid, index) => {
      map.set(providerUuid, providerQueries[index]);
    });
    return map;
  }, [uniqueProviderUuids, providerQueries]);

  // ---- Envio (`useMutation` DIRETO + `toaster` local — mirror
  // `RequestQuotationAuthorizerDialog.tsx`). --------------------------------
  const sendMutation = useMutation({
    mutationFn: (items: RequestQuotationEmailBatchItemPayload[]) =>
      sendRequestQuotationEmailBatch({ quotations: items }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestQuotations.requestQuotationsByPurchase, requestPurchaseUuid],
      });
      toaster.success({
        title: text.singularLabel,
        description: batchText.sentToast,
        duration: 7000,
      });
      setSelection({});
      setInvalidEmails(null);
      onSent();
      onClose();
    },
    onError: (error: unknown) => {
      // 422 `errors.invalid_emails[]` (CL-050) — shape PRÓPRIO deste
      // endpoint, ver cabeçalho do arquivo. Sem `setError` de RHF: não há
      // form nem campos por linha a apontar, só a lista devolvida.
      if (isAxiosError(error) && error.response?.status === 422) {
        const errors = error.response.data?.errors as { invalid_emails?: string[] } | undefined;
        if (errors?.invalid_emails && errors.invalid_emails.length > 0) {
          setInvalidEmails(errors.invalid_emails);
          toaster.error({
            title: batchText.invalidEmailsError.title,
            description: errors.invalid_emails
              .map((value) => batchText.invalidEmailsError.line.replace('{value}', value))
              .join(' '),
            duration: 9000,
          });
          return;
        }
      }

      const errorMessage =
        isAxiosError(error) && (error.response?.data as { message?: string })?.message
          ? (error.response!.data as { message: string }).message
          : batchText.errorFallback;

      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
    },
  });

  function handleClose() {
    if (sendMutation.isPending) return;
    setSelection({});
    setInvalidEmails(null);
    onClose();
  }

  function handleOpenChange(details: { open: boolean }) {
    if (!details.open) handleClose();
  }

  function handleSubmit() {
    const items: RequestQuotationEmailBatchItemPayload[] = quotations.map((quotation) => {
      const entry = getEntry(quotation.uuid);
      return {
        quotation_uuid: quotation.uuid,
        provider_selected: entry.providerSelected,
        seller_uuids: entry.sellerUuids,
      };
    });

    // Guarda client-side — NÃO é validação de e-mail (CL-050 continua 100%
    // server-side); só evita um POST que o servidor processaria como no-op
    // total (nenhuma cotação com destinatário marcado, ver cabeçalho).
    const hasAnyRecipient = items.some(
      (item) => item.provider_selected || item.seller_uuids.length > 0
    );
    if (!hasAnyRecipient) {
      toaster.error({ title: text.singularLabel, description: batchText.emptySelectionError });
      return;
    }

    setInvalidEmails(null);
    sendMutation.mutate(items);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange} size="xl" lazyMount unmountOnExit>
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{batchText.title}</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text fontSize="sm" color="fg.muted" mb={4}>
                {batchText.description}
              </Text>

              {invalidEmails && invalidEmails.length > 0 && (
                <Alert.Root status="error" borderRadius="md" mb={4}>
                  <Alert.Indicator>
                    <Icon as={FiAlertTriangle} />
                  </Alert.Indicator>
                  <Alert.Content>
                    <Alert.Title>{batchText.invalidEmailsError.title}</Alert.Title>
                    <Alert.Description>
                      {/* P37 (081): uma linha por e-mail inválido, literal do legado. */}
                      {invalidEmails.map((value) => (
                        <Text key={value}>
                          {batchText.invalidEmailsError.line.replace('{value}', value)}
                        </Text>
                      ))}
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}

              <VStack gap={4} align="stretch">
                {quotations.map((quotation) => {
                  const entry = getEntry(quotation.uuid);
                  const providerUuid = quotation.provider?.uuid;
                  const providerQuery = providerUuid
                    ? providerDetailByUuid.get(providerUuid)
                    : undefined;
                  const sellers = providerQuery?.data?.sellers ?? [];
                  const search = searchByQuotation[quotation.uuid] ?? '';
                  const filteredSellers = search
                    ? sellers.filter((seller) =>
                        seller.name.toLowerCase().includes(search.toLowerCase())
                      )
                    : sellers;
                  const hasNoRecipient = !entry.providerSelected && entry.sellerUuids.length === 0;

                  return (
                    <Box
                      key={quotation.uuid}
                      p={4}
                      borderWidth="1px"
                      borderColor="border.subtle"
                      borderRadius="lg"
                    >
                      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                        <Text fontWeight="semibold">{quotation.provider?.name ?? '—'}</Text>
                        {hasNoRecipient && (
                          <Badge colorPalette="orange" variant="subtle">
                            {batchText.noRecipientsSelected}
                          </Badge>
                        )}
                      </Flex>

                      <Checkbox
                        checked={entry.providerSelected}
                        onCheckedChange={() => toggleProviderSelected(quotation.uuid)}
                        disabled={sendMutation.isPending}
                        mb={3}
                      >
                        <Text fontSize="sm">
                          {batchText.providerRecipient.label}
                          {quotation.provider?.email ? ` (${quotation.provider.email})` : ''}
                        </Text>
                      </Checkbox>
                      {!quotation.provider?.email && (
                        <Text fontSize="xs" color="fg.muted" mb={3}>
                          {batchText.providerRecipient.noEmailNotice}
                        </Text>
                      )}

                      <CheckboxListField
                        label={batchText.sellers.label}
                        items={filteredSellers.map((seller) => ({
                          value: seller.uuid,
                          label: seller.email ? `${seller.name} (${seller.email})` : seller.name,
                        }))}
                        selectedValues={entry.sellerUuids}
                        onChange={(values) => setSellerUuids(quotation.uuid, values)}
                        searchValue={search}
                        onSearchChange={(value) =>
                          setSearchByQuotation((prev) => ({ ...prev, [quotation.uuid]: value }))
                        }
                        searchPlaceholder={batchText.sellers.searchPlaceholder}
                        selectAllLabel={batchText.sellers.selectAllLabel}
                        deselectAllLabel={batchText.sellers.deselectAllLabel}
                        selectedCountLabel={batchText.sellers.selectedCountLabel}
                        emptyLabel={batchText.sellers.emptyLabel}
                        isLoading={providerQuery?.isLoading}
                        isError={providerQuery?.isError}
                        errorLabel={batchText.sellers.loadErrorLabel}
                        onRetry={() => providerQuery?.refetch()}
                        retryLabel={batchText.sellers.retryLabel}
                        isDisabled={sendMutation.isPending}
                        maxHeight="180px"
                      />
                    </Box>
                  );
                })}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="secondary"
                type="button"
                onClick={handleClose}
                disabled={sendMutation.isPending}
              />
              <Button
                title={batchText.submitButton}
                type="button"
                onClick={handleSubmit}
                loading={sendMutation.isPending}
              />
            </Dialog.Footer>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
