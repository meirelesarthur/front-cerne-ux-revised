// src/components/Suprimentos/TransferResponsibleDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo compartilhado "Transferir Responsável" de Suprimentos (execução 081,
// T-081-FE-01; contratos LEGADO 03/04 §7, DEP-API-01).
//
// Legado: a tela de transferência lista os usuários ativos da fazenda ativa
// ("Novo Responsável", obrigatório: "Este campo deve ser preenchido.") e pede a
// justificativa. O servidor grava o movimento "Transferência: {justify}" e, no
// status 3, leva a solicitação ao 11 (regra 100% server-side).
//
// Fonte das opções:
//   - padrão: `GET request-purchases/{uuid}/transfer-options` (T-081-API-03);
//   - Ciência: `options` pré-carregadas (`authorization_context.transfer_candidates`,
//     T-081-API-01) — não há GET próprio (ajuste A-01/A-05 do plano do front).
// Envio: `POST request-purchases/{uuid}/transfer` por padrão; a Ciência injeta
// `submit` (`POST request-authorizations/{uuid}/reassign`).
//
// Estados de UI: skeleton no select (carregando), vazio "Nenhum usuário
// disponível" e erro com "Tentar novamente". Sem mock: dado ausente = estado
// honesto. Mutação via `useRequest` (toast + invalidação), invalidando todas as
// listas de Suprimentos (`invalidateSupplyQueries`).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { queryKey } from '@/constants/query-key';

import {
  listTransferOptions,
  transferRequestPurchase,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type { Option } from '@/@types/option';
import type { Response } from '@/@types/response-api';
import type { RequestPurchaseTransferPayload, TransferOption } from '@/@types/v2/RequestPurchases';

import { invalidateSupplyQueries } from './invalidateSupplyQueries';

export const TRANSFER_JUSTIFY_MAX_LENGTH = 800;

const NO_OPTIONS: TransferOption[] = [];

// Regra de "pode confirmar": novo responsável E justificativa preenchidos.
export function isTransferFormValid(
  responsibleUuid: string | null | undefined,
  justify: string
): boolean {
  return !!responsibleUuid && justify.trim().length > 0;
}

interface TransferResponsibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da solicitação (`null` = nenhuma linha selecionada, diálogo fechado). */
  requestPurchaseUuid: string | null;
  /** Opções já carregadas (ex.: `transfer_candidates` da Ciência). Quando
   *  informadas, não há chamada a `transfer-options`. */
  options?: TransferOption[];
  /** Envio alternativo (Ciência: `reassign`). Padrão: `transferRequestPurchase`. */
  submit?: (payload: RequestPurchaseTransferPayload) => Promise<Response<any> | undefined>;
  /** Chaves extras a invalidar além das listas de Suprimentos. */
  invalidateKeys?: string[];
  /** Chamado após o sucesso (ex.: navegar para a lista). */
  onSuccess?: () => void;
  /** Limite da justificativa (padrão 800; a Ciência/`reassign` aceita no máximo 400). */
  justifyMaxLength?: number;
}

export function TransferResponsibleDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
  options,
  submit,
  invalidateKeys,
  onSuccess,
  justifyMaxLength = TRANSFER_JUSTIFY_MAX_LENGTH,
}: TransferResponsibleDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase;
  const dialogText = text.supply.transferDialog;
  const queryClient = useQueryClient();

  const [responsible, setResponsible] = useState<Option<string> | null>(null);
  const [justify, setJustify] = useState('');

  const hasPreloadedOptions = options !== undefined;

  const optionsQuery = useQuery({
    queryKey: [queryKey.requestPurchases.transferOptions, requestPurchaseUuid],
    queryFn: () => listTransferOptions(requestPurchaseUuid as string),
    enabled: isOpen && !!requestPurchaseUuid && !hasPreloadedOptions,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!isOpen) {
      setResponsible(null);
      setJustify('');
    }
  }, [isOpen]);

  const sourceOptions: TransferOption[] = options ?? optionsQuery.data ?? NO_OPTIONS;
  const selectOptions = useMemo<Option<string>[]>(
    () => sourceOptions.map((item) => ({ label: item.name, value: item.uuid })),
    [sourceOptions]
  );

  const isLoadingOptions = !hasPreloadedOptions && optionsQuery.isLoading;
  const hasLoadError = !hasPreloadedOptions && optionsQuery.isError;
  const hasNoOptions = !isLoadingOptions && !hasLoadError && selectOptions.length === 0;

  const transferMutation = useRequest({
    asyncFunction: async (payload: RequestPurchaseTransferPayload) =>
      submit ? submit(payload) : transferRequestPurchase(requestPurchaseUuid as string, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: dialogText.success,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient, invalidateKeys);
      onClose();
      setResponsible(null);
      setJustify('');
      onSuccess?.();
    },
  });

  const canConfirm = isTransferFormValid(responsible?.value, justify);

  function handleConfirm() {
    if (!responsible || !canConfirm) return;
    transferMutation.mutate({ responsible_uuid: responsible.value, justify: justify.trim() });
  }

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={dialogText.title}
      footer={
        <Flex gap={3}>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={transferMutation.isPending}
          />
          <Button
            title={languageGB.defaltStrings.confirm}
            type="button"
            onClick={handleConfirm}
            loading={transferMutation.isPending}
            disabled={!canConfirm || transferMutation.isPending}
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
            onClick={() => optionsQuery.refetch()}
            loading={optionsQuery.isFetching}
          />
        </Flex>
      )}
      {hasNoOptions && (
        <Text mb={4} fontSize="sm" color="fg.muted">
          {dialogText.noUsers}
        </Text>
      )}
      <Select
        label={dialogText.newResponsible}
        name="transfer-responsible"
        placeholder={dialogText.newResponsiblePlaceholder}
        value={responsible}
        onChange={(option: Option<string> | null) => setResponsible(option ?? null)}
        options={selectOptions}
        isRequired
        noClearable
        loading={isLoadingOptions}
        isDisabled={transferMutation.isPending || hasNoOptions || hasLoadError}
      />
      <Box mt={4}>
        <Textarea
          name="transfer-justify"
          label={dialogText.justify}
          maxLength={justifyMaxLength}
          value={justify}
          onChange={(event) => setJustify(event.target.value)}
          helperText={!justify.trim() ? dialogText.required : undefined}
          isRequired
          disabled={transferMutation.isPending}
        />
      </Box>
    </CustomDialog>
  );
}
