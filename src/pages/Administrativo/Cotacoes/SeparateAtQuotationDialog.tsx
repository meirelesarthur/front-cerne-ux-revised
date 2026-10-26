// src/pages/Administrativo/Cotacoes/SeparateAtQuotationDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Criar Sub Solicitação" no estágio de COTAÇÃO (execução 081,
// T-081-FE-08; contrato LEGADO 05 P73, 10 PS12/PS13; `request-quotations/
// separated.blade.php`, `RQC:601-714`; API `POST request-purchases/{uuid}/
// quotation-separate`, EXEC-API-07).
//
// Diferente do diálogo de Compras (itens das cotações APROVADAS), aqui o
// checkbox é por item da PRÓPRIA solicitação (status 1 ou 2): os itens marcados
// vão para a sub solicitação nova (código seguinte do tenant), as cotações são
// replicadas só com esses itens e os totais dos dois lados são refeitos pela
// API. Validação mínima do legado: "Selecione ao menos um item". A API recusa
// mover todos os itens (422) e quem não é o responsável (403); a mensagem de
// negócio aparece pelo toast do `useRequest`.
//
// Itens vêm de `GET request-purchases/{uuid}` (mesma chave de cache da tela);
// estados de UI: carregando, erro com "Tentar novamente", vazio e lista.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import { getRequestPurchase } from '@/services/v2/RequestPurchases/request-purchase-service';
import { separateRequestPurchaseAtQuotation } from '@/services/v2/RequestQuotations/request-quotation-service';

import type { RequestPurchaseData } from '@/@types/v2/RequestPurchases';
import type { QuotationSeparatePayload } from '@/@types/v2/RequestQuotations';

import { buildSeparateItemLabel, canSubmitSeparation } from './separateAtQuotationRules';

const FORM_ID = 'separate-at-quotation-form';

interface SeparateAtQuotationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da linha clicada (`null` = diálogo fechado). */
  requestPurchaseUuid: string | null;
}

export function SeparateAtQuotationDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
}: SeparateAtQuotationDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestQuotations.requestQuotation.stage.separate;
  const purchaseText = languageGB.requestPurchases.requestPurchase;

  const [selectedUuids, setSelectedUuids] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showRequiredError, setShowRequiredError] = useState(false);

  const purchaseQuery = useQuery({
    queryKey: [queryKey.requestPurchases.requestPurchase, requestPurchaseUuid],
    queryFn: async () => (await getRequestPurchase(requestPurchaseUuid as string)).data,
    enabled: isOpen && !!requestPurchaseUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedUuids([]);
      setSearch('');
      setShowRequiredError(false);
    }
  }, [isOpen]);

  const items: CheckboxListItem<string>[] = (purchaseQuery.data?.items ?? []).map((item) => ({
    value: item.uuid,
    label: buildSeparateItemLabel(item),
  }));
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const visibleItems = normalizedSearch
    ? items.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(normalizedSearch))
    : items;

  const separateMutation = useRequest<RequestPurchaseData>({
    asyncFunction: async (payload: QuotationSeparatePayload) =>
      separateRequestPurchaseAtQuotation(requestPurchaseUuid as string, payload),
    entityName: purchaseText.singularLabel,
    queryKey: queryKey.requestPurchases.inQuotationList,
    queryKey2: queryKey.requestQuotations.requestQuotationsByPurchase,
    typesRequest: 'create',
    personalizedMessage: text.successToast,
    actionSuccess: (data) => {
      invalidateSupplyQueries(queryClient, [
        queryKey.requestQuotations.requestQuotationsByPurchase,
      ]);
      // Informa o código da sub solicitação criada (toast à parte do sucesso).
      toaster.create({
        type: 'info',
        title: purchaseText.singularLabel,
        description: `${text.createdCode}: ${data?.code ?? data?.uuid ?? ''}`,
      });
      onClose();
    },
  });

  function handleSubmit() {
    if (!canSubmitSeparation(selectedUuids)) {
      setShowRequiredError(true);
      return;
    }
    separateMutation.mutate({ items: selectedUuids });
  }

  const isBusy = separateMutation.isPending;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={() => {
        if (!isBusy) onClose();
      }}
      title={text.title}
      size="lg"
      scrollableBody
      footer={
        <Flex gap={3}>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isBusy}
          />
          <Button
            title={text.submit}
            type="button"
            onClick={handleSubmit}
            loading={isBusy}
            disabled={purchaseQuery.isLoading || purchaseQuery.isError}
          />
        </Flex>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <VStack align="stretch" gap={4}>
          <Text fontSize="sm" color="fg.muted">
            {text.description}
          </Text>

          {purchaseQuery.data && (
            <Text fontSize="sm" fontWeight="medium">
              {text.requestLabel} {purchaseQuery.data.code ?? ''}
              {purchaseQuery.data.description ? ` — ${purchaseQuery.data.description}` : ''}
            </Text>
          )}

          <CheckboxListField
            label={text.itemsLabel}
            items={visibleItems}
            selectedValues={selectedUuids}
            onChange={(values) => {
              setSelectedUuids(values);
              setShowRequiredError(false);
            }}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder={text.searchPlaceholder}
            selectAllLabel={text.selectAllLabel}
            deselectAllLabel={text.deselectAllLabel}
            selectedCountLabel={text.selectedCountLabel}
            emptyLabel={text.emptyLabel}
            isLoading={purchaseQuery.isLoading}
            isError={purchaseQuery.isError}
            errorLabel={text.loadError}
            onRetry={() => purchaseQuery.refetch()}
            retryLabel={text.retry}
            isDisabled={isBusy}
          />

          {showRequiredError && (
            <Box role="alert">
              <Text fontSize="sm" color="red.400">
                {text.itemsRequired}
              </Text>
            </Box>
          )}
        </VStack>
      </form>
    </CustomDialog>
  );
}
