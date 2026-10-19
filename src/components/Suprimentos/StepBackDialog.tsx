// src/components/Suprimentos/StepBackDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo compartilhado "Voltar Etapa da Solicitação" (execução 081,
// T-081-FE-01; contrato LEGADO 04 §6 — `change_status_modal`, reaproveitado
// pelo legado em 5 telas: Solicitações, Meus Processos, Cotações, Compras e
// Recebimentos; DEP-API-03).
//
// Campos (legado MD01..MD05):
//   - somente leitura: Código, Dt. Pedido, Duração, Solicitante, Fazenda e
//     "Status Atual" (vêm do detalhe `GET request-purchases/{uuid}`);
//   - "Mudar para Status": select OBRIGATÓRIO com `available_status_transitions`
//     (elegibilidade 100% server-side, nada replicado no client);
//   - "Justificativa": textarea OBRIGATÓRIA (máx. 800, T-081-API-03).
// O servidor zera o responsável, só aceita o responsável atual e não notifica
// no destino 5. Toast de sucesso com o literal do legado ("Status atualizado
// com sucesso!"); em erro o `useRequest` mostra a mensagem de negócio da API
// (mensagem técnica genérica do legado não é reproduzida, decisão D-05).
//
// Substitui as 4 cópias estruturais que existiam por tela (Meus Processos,
// Compras, Recebimentos e o diálogo inline da Solicitação): a invalidação
// cobre todas as listas de Suprimentos (`invalidateSupplyQueries`).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { InputReadOnly } from '@/components/InputReadOnly';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';

import {
  changeRequestPurchaseStatus,
  getRequestPurchase,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type { Option } from '@/@types/option';
import type { RequestPurchaseChangeStatusPayload } from '@/@types/v2/RequestPurchases';

import { invalidateSupplyQueries } from './invalidateSupplyQueries';

export const STEP_BACK_JUSTIFY_MAX_LENGTH = 800;

// Regra de "pode salvar": status de destino E justificativa preenchidos.
export function isStepBackFormValid(
  statusValue: number | null | undefined,
  justify: string
): boolean {
  return statusValue !== null && statusValue !== undefined && justify.trim().length > 0;
}

interface StepBackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da solicitação (`null` = nenhuma linha selecionada, diálogo fechado). */
  requestPurchaseUuid: string | null;
  /** Chaves extras a invalidar além das listas de Suprimentos. */
  invalidateKeys?: string[];
  /** Chamado após o sucesso. */
  onSuccess?: () => void;
}

export function StepBackDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
  invalidateKeys,
  onSuccess,
}: StepBackDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase;
  const dialogText = text.supply.stepBackDialog;
  const queryClient = useQueryClient();

  const [statusValue, setStatusValue] = useState<Option<number> | null>(null);
  const [justify, setJustify] = useState('');

  const detailQuery = useQuery({
    queryKey: [queryKey.requestPurchases.requestPurchase, requestPurchaseUuid],
    queryFn: async () => {
      const result = await getRequestPurchase(requestPurchaseUuid as string);
      return result.data;
    },
    enabled: isOpen && !!requestPurchaseUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setStatusValue(null);
      setJustify('');
    }
  }, [isOpen]);

  const detail = detailQuery.data;

  const transitionOptions = useMemo<Option<number>[]>(
    () =>
      (detail?.available_status_transitions ?? []).map((transition) => ({
        label: transition.label,
        value: transition.value,
      })),
    [detail]
  );

  const isLoadingDetail = detailQuery.isLoading;
  const hasLoadError = detailQuery.isError;
  const hasNoTransitions = !isLoadingDetail && !hasLoadError && transitionOptions.length === 0;

  const stepBackMutation = useRequest({
    asyncFunction: async (payload: RequestPurchaseChangeStatusPayload) =>
      changeRequestPurchaseStatus(requestPurchaseUuid as string, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: dialogText.success,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient, invalidateKeys);
      onClose();
      setStatusValue(null);
      setJustify('');
      onSuccess?.();
    },
  });

  const canSave = isStepBackFormValid(statusValue?.value, justify);

  function handleSave() {
    if (!statusValue || !canSave) return;
    stepBackMutation.mutate({ status: statusValue.value, justify: justify.trim() });
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={dialogText.title}
      size="lg"
      footer={
        <Flex gap={3}>
          <Button
            title={dialogText.cancel}
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={stepBackMutation.isPending}
          />
          <Button
            title={dialogText.save}
            type="button"
            onClick={handleSave}
            loading={stepBackMutation.isPending}
            disabled={!canSave || stepBackMutation.isPending}
          />
        </Flex>
      }
    >
      {hasLoadError && (
        <Flex align="center" gap={3} mb={4} role="alert">
          <Text fontSize="sm" color="fg.muted">
            {dialogText.loadError}
          </Text>
          <Button
            title={dialogText.retry}
            variant="outline"
            type="button"
            onClick={() => detailQuery.refetch()}
            loading={detailQuery.isFetching}
          />
        </Flex>
      )}

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
        <InputReadOnly
          label={dialogText.code}
          value={detail?.code ?? ''}
          loading={isLoadingDetail}
        />
        <InputReadOnly
          label={dialogText.requestDate}
          value={detail?.request_date ? formatDate(detail.request_date) : ''}
          loading={isLoadingDetail}
        />
        <InputReadOnly
          label={dialogText.duration}
          value={detail?.duration_label ?? ''}
          loading={isLoadingDetail}
        />
        <InputReadOnly
          label={dialogText.requester}
          value={detail?.user?.name ?? ''}
          loading={isLoadingDetail}
        />
        <InputReadOnly
          label={dialogText.farm}
          value={detail?.farm?.description ?? ''}
          loading={isLoadingDetail}
        />
        <InputReadOnly
          label={dialogText.currentStatus}
          value={detail?.status_label ?? ''}
          loading={isLoadingDetail}
        />
      </SimpleGrid>

      {hasNoTransitions && (
        <Text mb={4} fontSize="sm" color="fg.muted">
          {dialogText.noTransitions}
        </Text>
      )}
      <Select
        label={dialogText.newStatus}
        name="step-back-status"
        placeholder={dialogText.newStatusPlaceholder}
        value={statusValue}
        onChange={(option: Option<number> | null) => setStatusValue(option ?? null)}
        options={transitionOptions}
        isRequired
        noClearable
        loading={isLoadingDetail}
        isDisabled={stepBackMutation.isPending || hasNoTransitions || hasLoadError}
      />
      <Box mt={4}>
        <Textarea
          name="step-back-justify"
          label={dialogText.justify}
          maxLength={STEP_BACK_JUSTIFY_MAX_LENGTH}
          value={justify}
          onChange={(event) => setJustify(event.target.value)}
          helperText={!justify.trim() ? dialogText.justifyRequired : undefined}
          isRequired
          disabled={stepBackMutation.isPending || hasNoTransitions || hasLoadError}
        />
      </Box>
    </CustomDialog>
  );
}
