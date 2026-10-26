// src/pages/Administrativo/Compras/InformRequestPurchaseStatusDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo ÚNICO "Informar Status" da etapa Compras (`PUT /request-purchases/
// {uuid}/inform-status`), usado por Compras e Meus Processos (execução 081,
// T-081-FE-09; contrato LEGADO-SUPRIMENTOS-08 §4.2 e §5.4; API EXEC-API-04).
//
// Igual ao legado:
//  - Código e Responsável somente leitura (Responsável = usuário logado);
//  - Status com 7 (Compra Efetuada) e 10 (Pedido Cancelado);
//  - "Venc. Financeiro" abre preenchido com `financial_due_date`; limpar grava nulo;
//  - "Observações"/justificativa obrigatória, máx. 400 (limite do servidor);
//  - tabela de itens SÓ com cotação autorizada (`is_authorized`), coluna
//    "Dt. Entrega" aberta com `forecast_delivery_date ?? delivery_date`; TODAS
//    as linhas vão no payload e linha em branco zera a previsão;
//  - sucesso: "Registro atualizado com sucesso.".
// A "Data Movimento" do legado é omitida: o servidor nunca a gravava (P-19).
// O erro de negócio da API (422/403) aparece pelo toast do `useRequest`.
// A invalidação cobre todas as listas de Suprimentos (`invalidateSupplyQueries`).
//
// Casca de submit externo (`get_pwa_form_query_pattern`): `<Form id>` + botão
// `form="id"` no rodapé; `fillForm` nomeada com guarda de `dirtyFields` (Lei 2).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { invalidateSupplyQueries } from '@/components/Suprimentos/invalidateSupplyQueries';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { informRequestPurchaseStatusSchemaResolver } from '@/validations/schemas/Compras/inform-request-purchase-status-schema';

import {
  getRequestPurchase,
  informRequestPurchaseStatus,
} from '@/services/v2/RequestPurchases/request-purchase-service';

import type { Option } from '@/@types/option';
import type {
  InformRequestPurchaseStatusForm,
  InformRequestPurchaseStatusPayload,
  RequestPurchaseData,
} from '@/@types/v2/RequestPurchases';

import { buildDeliveryDateRows, buildInformStatusPayload, toDateOnly } from './informStatusPayload';

const FORM_ID = 'inform-request-purchase-status-form';

const DEFAULT_VALUES: InformRequestPurchaseStatusForm = {
  status: null,
  financial_due_date: null,
  justify: '',
  item_delivery_dates: [],
};

const QUANTITY_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

interface InformRequestPurchaseStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** `uuid` da linha clicada (`null` = nenhuma linha selecionada, diálogo fechado). */
  requestPurchaseUuid: string | null;
  /** Chamado após o sucesso. */
  onSuccess?: () => void;
}

export function InformRequestPurchaseStatusDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
  onSuccess,
}: InformRequestPurchaseStatusDialogProps) {
  const { languageGB } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const text = languageGB.requestPurchases.requestPurchase;
  const dialogText = text.inPurchase.dialogs.informStatus;

  const statusOptions: Option<7 | 10>[] = [
    { value: 7, label: dialogText.statusOptions.effected },
    { value: 10, label: dialogText.statusOptions.cancelled },
  ];

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<InformRequestPurchaseStatusForm>({
    resolver: informRequestPurchaseStatusSchemaResolver(languageGB),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const { fields } = useFieldArray({ control, name: 'item_delivery_dates' });

  const requestPurchaseQuery = useQuery({
    queryKey: [queryKey.requestPurchases.requestPurchase, requestPurchaseUuid],
    queryFn: async () => {
      const result = await getRequestPurchase(requestPurchaseUuid as string);
      return result.data;
    },
    enabled: isOpen && !!requestPurchaseUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const detail = requestPurchaseQuery.data;

  // Lei 2: o reset só acontece aqui e respeita as edições do usuário, salvo na
  // carga inicial (`resetForce`).
  function fillForm(data: RequestPurchaseData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;
    reset({
      ...DEFAULT_VALUES,
      financial_due_date: toDateOnly(data.financial_due_date),
      item_delivery_dates: buildDeliveryDateRows(data.items ?? []),
    });
  }

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      return;
    }
    if (detail) fillForm(detail, true);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && detail) fillForm(detail);
  }, [detail]);

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  const informStatusMutation = useRequest({
    asyncFunction: async (payload: InformRequestPurchaseStatusPayload) =>
      informRequestPurchaseStatus(requestPurchaseUuid as string, payload),
    entityName: text.singularLabel,
    queryKey: queryKey.requestPurchases.inPurchaseList,
    queryKey2: queryKey.requestPurchases.requestPurchase,
    typesRequest: 'update',
    personalizedMessage: text.inPurchase.toasts.informStatusSuccess,
    actionSuccess: () => {
      invalidateSupplyQueries(queryClient);
      handleClose();
      onSuccess?.();
    },
  });

  async function onSubmit(data: InformRequestPurchaseStatusForm) {
    await informStatusMutation.mutateAsync(buildInformStatusPayload(data));
  }

  const isLoadingDetail = requestPurchaseQuery.isLoading;
  const hasLoadError = requestPurchaseQuery.isError;
  const columns = dialogText.fields.itemColumns;

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
            variant="secondary"
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <Button
            title={languageGB.defaltStrings.save}
            type="submit"
            form={FORM_ID}
            loading={isSubmitting}
            disabled={isSubmitting || isLoadingDetail || hasLoadError}
          />
        </Flex>
      }
    >
      {hasLoadError && (
        <Flex align="center" gap={3} mb={4} role="alert">
          <Text fontSize="sm" color="fg.muted">
            {languageGB.common.errorLog.unknownError}
          </Text>
          <Button
            title={languageGB.defaltStrings.tryAgain}
            variant="outline"
            type="button"
            onClick={() => requestPurchaseQuery.refetch()}
            loading={requestPurchaseQuery.isFetching}
          />
        </Flex>
      )}

      <Form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noPadding>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <InputReadOnly
            label={dialogText.fields.code}
            value={detail?.code ?? ''}
            loading={isLoadingDetail}
          />
          <InputReadOnly label={dialogText.fields.responsible} value={user?.username ?? ''} />

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                label={dialogText.fields.status}
                name="status"
                value={field.value}
                onChange={field.onChange}
                options={statusOptions}
                isRequired
                noClearable
                error={errors.status?.message}
                isDisabled={isSubmitting}
              />
            )}
          />

          <Controller
            control={control}
            name="financial_due_date"
            render={({ field }) => (
              <DateInput
                label={dialogText.fields.financialDueDate}
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={4}>
          <Textarea
            label={dialogText.fields.justify}
            maxLength={400}
            isRequired
            {...register('justify')}
            error={errors.justify?.message}
            disabled={isSubmitting}
          />
        </Box>

        {fields.length > 0 && (
          <Box mt={6}>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              {dialogText.fields.itemsTitle}
            </Text>
            <Box overflowX="auto" border="1px solid" borderColor="border.subtle" borderRadius="md">
              <Box minW="560px">
                <Flex
                  gap={3}
                  px={3}
                  py={2}
                  bg="bg.muted"
                  borderBottom="1px solid"
                  borderColor="border.subtle"
                >
                  <Text flex="2" fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {columns.item}
                  </Text>
                  <Text flex="1" fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {columns.quantity}
                  </Text>
                  <Text flex="2" fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {columns.description}
                  </Text>
                  <Text flex="2" fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {columns.deliveryDate}
                  </Text>
                </Flex>
                {fields.map((fieldRow, index) => (
                  <Flex
                    key={fieldRow.id}
                    gap={3}
                    px={3}
                    py={2}
                    align="center"
                    borderBottom={index < fields.length - 1 ? '1px solid' : undefined}
                    borderColor="border.subtle"
                  >
                    <Text flex="2" fontSize="sm">
                      {fieldRow.item_label}
                    </Text>
                    <Text flex="1" fontSize="sm">
                      {fieldRow.quantity !== null && fieldRow.quantity !== undefined
                        ? Number(fieldRow.quantity).toLocaleString('pt-BR', QUANTITY_FORMAT)
                        : '—'}
                    </Text>
                    <Text flex="2" fontSize="sm" color="fg.muted">
                      {fieldRow.item_description ?? '—'}
                    </Text>
                    <Box flex="2">
                      <Controller
                        control={control}
                        name={`item_delivery_dates.${index}.delivery_date`}
                        render={({ field }) => (
                          <DateInput
                            value={field.value ?? null}
                            onChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                    </Box>
                  </Flex>
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </Form>
    </CustomDialog>
  );
}
