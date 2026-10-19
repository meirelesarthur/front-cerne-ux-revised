// src/pages/Administrativo/Compras/SeparateRequestPurchaseDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Criar Sub Solicitação" (bifurcação, AM-08 do legado) da fila Compras
// (`TASK-CPS-FE-04`, esteira 97-Esteiras/036) — abre a partir do dropdown de
// `index.tsx` (`status===6`), busca `GET /request-purchases/{uuid}/
// separated-preview` (`getSeparatedPreview`, TASK-CP-API-03) e, ao confirmar,
// `POST /request-purchases/{uuid}/separate` (`separateRequestPurchase`) com os
// uuids de `RequestItem` selecionados — o backend (`SeparateRequestPurchase
// Action`) faz TODO o trabalho pesado (réplica de cotação/pagamentos,
// recálculo de totais); o front só monta `{items: string[]}`.
//
// Execução 081, T-081-FE-09 (PS01, PS11): diálogo ÚNICO de Compras e Meus
// Processos. Como a tela de separação do legado (`request-buy/separated`),
// mostra o cabeçalho "Informação do Pedido" somente leitura e as
// "Movimentações" (`separated-preview` devolve a solicitação completa) antes
// das cotações aprovadas. A API só aceita responsável atual, status 6 e 2+
// cotações aprovadas (403/422 pela mensagem do `useRequest`). Invalida todas as
// listas de Suprimentos (`invalidateSupplyQueries`).
//
// ⚠️ CHAVE DE SELEÇÃO (achado real, `TASK-CPS-FE-01` "Leitura do dev" item 2):
// `approved_quotations[].items[].request_item_uuid` — uuid do `RequestItem`
// pai, NUNCA um índice de posição nem o uuid da `RequestQuotationItem` (que
// não existe). Itens com `request_item_uuid` nulo/ausente (relação não
// eager-loaded) são EXCLUÍDOS da lista selecionável (`getEligibleItems`) —
// nunca chegam a compor o payload.
//
// Mirror ESTRUTURAL (Passo UX, `get_spa_ux_fidelity_pattern`, UX-GAP — tela
// equivalente não existe pronta no `cerne`) de `AutorizacaoCompraPage.tsx`
// (Modal de revisão em 2 passos) + `MultiAreaModal` de `FazendasLista.tsx`
// (`ux_root` commit `24bd91603a6ee4e19b58fa5efe2221835c83e306`) — ADAPTADO à
// stack do fork (Chakra v3 + tokens de `src/theme.ts`, NUNCA cópia direta do
// Storybook): 1 `CheckboxListField` (componente já existente do design system
// `cerne` adaptado, ver `Form/CheckboxListField.tsx`) POR cotação aprovada —
// cada instância já resolve sozinha o cabeçalho de agrupamento + "Marcar/
// Desmarcar todos" POR cotação (CL-40/IG-08 do legado), sem precisar
// reimplementar essa composição.
//
// ⚠️ EXCLUSIVIDADE CROSS-COTAÇÃO (CL-40, decisão documentada — Leitura do dev
// da ficha): o legado só permitia 1 linha/cotação selecionada por vez —
// regra SÓ de UX (o backend/`SeparateRequestPurchaseRequest` aceita seleção
// cross-cotação sem restrição). Replicada em `handleGroupChange` abaixo (nova
// marcação numa cotação diferente da que já tinha itens substitui a seleção
// anterior) SEM travar tecnicamente o caso cross-cotação — é só um `if` no
// client, não uma regra de schema/validação; relaxar no futuro (dono decidir)
// é remover esse bloco, não uma migração de contrato.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';

import { separateRequestPurchaseSchemaResolver } from '@/validations/schemas/Compras/separate-request-purchase-schema';

import {
  getSeparatedPreview,
  separateRequestPurchase,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type {
  RequestPurchaseData,
  RequestQuotationPreview,
  SeparateRequestPurchaseForm,
  SeparateRequestPurchasePayload,
} from '@/@types/v2/RequestPurchases';

import { RequestMovementHistory } from '../Solicitacao/RequestMovementHistory';

const FORM_ID = 'separate-request-purchase-form';

const DEFAULT_VALUES: SeparateRequestPurchaseForm = {
  selected_item_uuids: [],
};

// Mesmo padrão inline de `RequestQuotationTab.tsx`/`RequestQuotationDetailDialog.tsx`
// (`formatCurrencyBRL` local, não um util compartilhado — mirror, não invenção).
function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface SeparateRequestPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da linha clicada na grade (`null` = nenhuma linha selecionada —
   *  dialog fechado). */
  requestPurchaseUuid: string | null;
  /** Chamado após o sucesso. */
  onSuccess?: () => void;
}

export function SeparateRequestPurchaseDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
  onSuccess,
}: SeparateRequestPurchaseDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestPurchases.requestPurchase;
  const dialogText = text.inPurchase.dialogs.separate;
  const quotationLabel = languageGB.requestQuotations.requestQuotation.singularLabel;

  // Busca controlada pelo consumidor (`CheckboxListField` NUNCA decide
  // sozinho busca local/remota) — uma entrada por cotação, todas iniciam
  // vazias a cada abertura do dialog.
  const [searchByQuotation, setSearchByQuotation] = useState<Record<string, string>>({});

  const {
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeparateRequestPurchaseForm>({
    resolver: separateRequestPurchaseSchemaResolver(languageGB),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const selectedItemUuids = watch('selected_item_uuids');

  // Busca dedicada (mirror `VoltarEtapaDialog`/`InformRequestPurchaseStatusDialog`
  // — ad hoc `useQuery`, não há "form" a preencher além da lista de seleção,
  // conforme a seção "## Hooks" da ficha). Chave PRÓPRIA (`'separated-
  // preview'`), distinta de `getRequestPurchase` (mesmo uuid, endpoint
  // diferente — evita colisão de cache).
  const previewQuery = useQuery({
    queryKey: [queryKey.requestPurchases.requestPurchase, 'separated-preview', requestPurchaseUuid],
    queryFn: async () => {
      const result = await getSeparatedPreview(requestPurchaseUuid as string);
      return result.data;
    },
    enabled: isOpen && !!requestPurchaseUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      setSearchByQuotation({});
    }
  }, [isOpen]);

  function handleClose() {
    reset(DEFAULT_VALUES);
    setSearchByQuotation({});
    onClose();
  }

  // Itens SELECIONÁVEIS de uma cotação — exclui `request_item_uuid`
  // nulo/ausente (Risco documentado na ficha: relação não eager-loaded).
  function getEligibleItems(quotation: RequestQuotationPreview): CheckboxListItem<string>[] {
    return quotation.items
      .filter(
        (item): item is typeof item & { request_item_uuid: string } => !!item.request_item_uuid
      )
      .map((item) => ({
        value: item.request_item_uuid,
        label: item.description ?? item.product?.description ?? item.request_item_uuid,
      }));
  }

  function getVisibleItems(quotation: RequestQuotationPreview): CheckboxListItem<string>[] {
    const search = (searchByQuotation[quotation.uuid] ?? '').trim().toLocaleLowerCase('pt-BR');
    const eligible = getEligibleItems(quotation);
    if (!search) return eligible;
    return eligible.filter((item) => item.label.toLocaleLowerCase('pt-BR').includes(search));
  }

  function handleGroupChange(quotation: RequestQuotationPreview, groupValues: string[]) {
    const groupUuids = new Set(getEligibleItems(quotation).map((item) => item.value));
    const previousSelectedInGroup = selectedItemUuids.filter((uuid) => groupUuids.has(uuid));
    const otherSelected = selectedItemUuids.filter((uuid) => !groupUuids.has(uuid));
    const isAdding = groupValues.length > previousSelectedInGroup.length;

    // Exclusividade CL-40 (ver nota de cabeçalho) — só entra quando o usuário
    // está ADICIONANDO seleção nesta cotação e já existe seleção presa a
    // outra cotação; desmarcar nunca é bloqueado.
    const nextSelected =
      isAdding && otherSelected.length > 0 ? groupValues : [...otherSelected, ...groupValues];

    setValue('selected_item_uuids', nextSelected, { shouldDirty: true, shouldValidate: true });
  }

  const separateMutation = useRequest<RequestPurchaseData>({
    asyncFunction: async (payload: SeparateRequestPurchasePayload) =>
      separateRequestPurchase(requestPurchaseUuid as string, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.inPurchaseList,
    queryKey2: queryKey.requestPurchases.myProcessesList,
    typesRequest: 'create',
    personalizedMessage: text.inPurchase.toasts.separateSuccess,
    actionSuccess: (data) => {
      // Informa o `code` da nova sub-solicitação (DoD) — toast SEPARADO do
      // aviso genérico de sucesso já disparado pelo `useRequest` acima.
      toaster.create({
        type: 'info',
        title: text.singularLabel,
        description: data.code ?? data.uuid,
      });
      invalidateSupplyQueries(queryClient);
      handleClose();
      onSuccess?.();
    },
  });

  async function onSubmit(data: SeparateRequestPurchaseForm) {
    await separateMutation.mutateAsync({ items: data.selected_item_uuids });
  }

  const approvedQuotations = previewQuery.data?.approved_quotations ?? [];
  const request = previewQuery.data?.request_purchase;
  const columnsText = text.supply.columns;
  const isLoadingPreview = previewQuery.isLoading;
  const hasPreviewError = previewQuery.isError;
  const isSubmitDisabled = isSubmitting || isLoadingPreview || hasPreviewError;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={handleClose}
      title={dialogText.title}
      size="xl"
      scrollableBody
      footer={
        <Flex gap={3}>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <Button
            title={dialogText.confirmButton}
            type="submit"
            form={FORM_ID}
            loading={isSubmitting}
            disabled={isSubmitDisabled}
          />
        </Flex>
      }
    >
      <Form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noPadding>
        <VStack align="stretch" gap={4}>
          {request && (
            <>
              <Text fontSize="sm" fontWeight="semibold">
                {dialogText.headerTitle}
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <InputReadOnly label={columnsText.code} value={request.code ?? ''} />
                <InputReadOnly
                  label={columnsText.requestDate}
                  value={request.request_date ? formatDate(request.request_date) : ''}
                />
                <InputReadOnly label={columnsText.duration} value={request.duration_label ?? ''} />
                <InputReadOnly label={columnsText.type} value={request.type_label ?? ''} />
                <InputReadOnly
                  label={text.list.table.priority}
                  value={request.priority_label ?? ''}
                />
                <InputReadOnly label={columnsText.nfe} value={request.nfe ?? ''} />
                <InputReadOnly label={columnsText.requester} value={request.user?.name ?? ''} />
                <InputReadOnly
                  label={columnsText.responsible}
                  value={request.responsible?.name ?? ''}
                />
              </SimpleGrid>
              <InputReadOnly
                label={text.list.table.justification}
                value={request.justification ?? ''}
              />
              <InputReadOnly label={columnsText.description} value={request.description ?? ''} />
              <InputReadOnly label={dialogText.observation} value={request.observation ?? ''} />
              <InputReadOnly
                label={dialogText.finalizationNote}
                value={request.finalization_note ?? ''}
              />

              <Text fontSize="sm" fontWeight="semibold">
                {dialogText.movementsTitle}
              </Text>
              <RequestMovementHistory movements={request.movements ?? []} />
            </>
          )}

          <Text fontSize="sm" fontWeight="semibold">
            {dialogText.quotationsTitle}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {dialogText.subtitle}
          </Text>

          {isLoadingPreview ? (
            <Text fontSize="sm" color="fg.muted">
              …
            </Text>
          ) : hasPreviewError ? (
            <Text fontSize="sm" color="red.400">
              {languageGB.common.errorLog.unknownError}
            </Text>
          ) : (
            approvedQuotations.map((quotation) => (
              <CheckboxListField
                key={quotation.uuid}
                label={`${quotationLabel} ${quotation.hash} · ${
                  quotation.quotation_date ? formatDate(quotation.quotation_date) : '--'
                } · ${formatCurrencyBRL(quotation.total_value)}`}
                items={getVisibleItems(quotation)}
                selectedValues={selectedItemUuids.filter((uuid) =>
                  getEligibleItems(quotation).some((item) => item.value === uuid)
                )}
                onChange={(values) => handleGroupChange(quotation, values)}
                searchValue={searchByQuotation[quotation.uuid] ?? ''}
                onSearchChange={(value) =>
                  setSearchByQuotation((prev) => ({ ...prev, [quotation.uuid]: value }))
                }
                selectAllLabel={dialogText.selectAll}
                deselectAllLabel={dialogText.deselectAll}
                selectedCountLabel={dialogText.selectedCount}
                isDisabled={isSubmitting}
              />
            ))
          )}

          {errors.selected_item_uuids && (
            <Box>
              <Text fontSize="sm" color="red.400">
                {errors.selected_item_uuids.message as string}
              </Text>
            </Box>
          )}
        </VStack>
      </Form>
    </CustomDialog>
  );
}
