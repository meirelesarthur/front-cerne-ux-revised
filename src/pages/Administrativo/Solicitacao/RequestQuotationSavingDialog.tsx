// src/pages/Administrativo/Solicitacao/RequestQuotationSavingDialog.tsx
// -----------------------------------------------------------------------------
// Dialog "Aplicar Saving" (RequestQuotation — Administrativo/Suprimentos,
// esteira 97-Esteiras/035, TASK-CQ-FE-06). Substitui o STUB
// `handleApplySaving` de `RequestQuotationTab.tsx` (TASK-CQ-FE-03) — só
// acionável quando `quotation.status===3` (`recebida`, AM-03), mesma condição
// já aplicada no menu de ações do card.
//
// Composição: PADRÃO 14 (`get_pwa_complex_screen_compositions_pattern`,
// "Modal Form com Dialog Chakra V3") — mirror estrutural EXATO de
// `RequestQuotationFormDialog.tsx` (`useMutation` DIRETO + `toaster` local,
// fill via `useEffect`+`reset`, 422 mapeado por campo via `setError`).
//
// Consome `PUT /request-quotations/{uuid}/saving`
// (`applyRequestQuotationSaving`, TASK-CQ-FE-01) — payload real
// (`RequestQuotationSavingRequest::rules()`, confirmado por leitura direta do
// backend): `{responsible_uuid, discount}`, ambos `required`.
//
// ⚠️ ARMADILHA SEMÂNTICA PRESERVADA DO LEGADO (CV-04/CL-045) — o campo
// `discount` do payload NÃO é o desconto: é o VALOR LÍQUIDO (valor final da
// cotação após o desconto negociado). O rótulo exibido ao usuário é
// "Valor com Desconto" (mirror EXATO do form legado, `saving.blade.php`),
// mesma confusão de nomenclatura do original, preservada de propósito (a
// correção do rótulo mudaria comportamento observável sem necessidade —
// roteiro frontend §2, linha CL-045/046). O servidor
// (`ApplyRequestQuotationSavingAction::handle`) é quem calcula e PERSISTE os
// valores reais a partir do que este Dialog envia:
//   discount (persistido) = total_value - discount (enviado, = valor líquido)
//   saving   (persistido) = 100 - (discount (enviado) * 100 / total_value)
// O campo "Saving (%)" desta tela é só PREVIEW client-side dessa MESMA
// fórmula (CV-04) — `readOnly`, recalculado ao vivo no `onChange` do "Valor
// com Desconto" — o servidor recalcula/valida de novo e é a autoridade final
// (TASK-CQ-API-04); nenhum valor de preview é enviado no payload.
//
// Guarda de negócio server-side (CL-045, `ApplyRequestQuotationSavingAction
// ::guardLiquidoNotGreaterThanTotal`): rejeita com `BusinessRuleException`
// (422, campo `discount`) quando `total_value <= discount (valor líquido)` —
// isto é, o "desconto" não pode ser zero/negativo. O schema Yup
// (`request-quotation-saving-schema.ts`) reproduz essa guarda como PREVIEW
// client-side (`totalValue` passado como 2º argumento da fábrica), mas o
// `onError` abaixo SEMPRE prioriza a mensagem literal devolvida pelo backend
// (`setError`) — nunca hardcoda o texto da exceção aqui.
//
// `responsible_uuid` (FIELD-14) — `SelectAsyncPaginate` sobre `listUsers`
// (`@/services/v2/Users/user-service`), MESMO lookup já usado para o filtro
// `responsible_uuid` de `FilterSideSolicitacao.tsx` (nenhum endpoint novo
// inventado, mirror exato de `mapOptions`/`findParams`).
//
// `disablePortal` no `SelectAsyncPaginate` — OBRIGATÓRIO dentro de
// `Dialog.Root` (TASK-FE-706/DF-31, mesma nota de
// `RequestQuotationFormDialog.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Dialog, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { queryKey } from '@/constants/query-key';

import requestQuotationSavingSchemaResolver from '@/validations/schemas/RequestQuotations/request-quotation-saving-schema';

import { applyRequestQuotationSaving } from '@/services/v2/RequestQuotations/request-quotation-service';
import { listUsers } from '@/services/v2/Users/user-service';

import type {
  RequestQuotationData,
  RequestQuotationSavingForm as RequestQuotationSavingFormValues,
  RequestQuotationSavingPayload,
} from '@/@types/v2/RequestQuotations';
import type { UserListItem } from '@/@types/v2/Users';

export interface RequestQuotationSavingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** UUID da `RequestPurchase` pai — só usado para a invalidação de cache da
   *  grade da aba (mirror `RequestQuotationFormDialog.tsx`). */
  requestPurchaseUuid: string;
  /** `null` enquanto nenhuma cotação está selecionada — o Dialog não é
   *  desmontado (`unmountOnExit`) então `null` é um estado transitório
   *  seguro entre uma abertura e outra. */
  quotation: RequestQuotationData | null;
}

function formatCurrencyBRL(value: number): string {
  // Mirror do formato já usado em `RequestQuotationTab.tsx`/
  // `RequestQuotationDetailDialog.tsx` (única convenção de moeda de exibição
  // real do projeto).
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function RequestQuotationSavingDialog({
  isOpen,
  onClose,
  requestPurchaseUuid,
  quotation,
}: RequestQuotationSavingDialogProps) {
  const { languageGB } = useLanguage();
  const queryClient = useQueryClient();
  const text = languageGB.requestQuotations.requestQuotation;
  const savingText = text.saving;

  const totalValue = quotation?.total_value ?? 0;

  function buildDefaultValues(
    source: RequestQuotationData | null
  ): RequestQuotationSavingFormValues {
    // Default = valor líquido ATUAL (`total_value - discount`, mesmo cálculo
    // de `netValue` já usado no card/detalhe) — roteiro frontend §3.4.
    const currentNetValue = source ? source.total_value - source.discount : null;

    return {
      responsible_uuid: source?.saving_responsible
        ? { label: source.saving_responsible.name ?? '', value: source.saving_responsible.uuid }
        : null,
      discount: currentNetValue,
    };
  }

  const { control, handleSubmit, reset, setError, watch } =
    useForm<RequestQuotationSavingFormValues>({
      resolver: requestQuotationSavingSchemaResolver(languageGB, totalValue),
      defaultValues: buildDefaultValues(null),
    });

  // Fill via `useEffect` + `reset` — Pattern 14 regra 6 (mirror
  // `RequestQuotationFormDialog.tsx`; o dado já chega pronto via prop
  // `quotation`, populado pelo card da aba).
  useEffect(() => {
    if (!isOpen) return;
    reset(buildDefaultValues(quotation));
  }, [isOpen, quotation]);

  // CV-04 — preview client-side da MESMA fórmula do servidor (ver cabeçalho
  // do arquivo). `netValueInput` é o "Valor com Desconto" digitado
  // (armadilha CL-045: é o valor líquido, não o desconto).
  const netValueInput = watch('discount');
  const savingPreview =
    totalValue > 0 && netValueInput != null && !Number.isNaN(netValueInput)
      ? 100 - (netValueInput * 100) / totalValue
      : 0;

  const savingMutation = useMutation({
    mutationFn: (payload: RequestQuotationSavingPayload) =>
      applyRequestQuotationSaving(quotation!.uuid, payload),
    onSuccess: () => {
      // Invalidação da grade + hub ao sucesso (mirror
      // `RequestQuotationFormDialog.tsx` — mesmas 2 chaves).
      queryClient.invalidateQueries({
        queryKey: [queryKey.requestQuotations.requestQuotationsByPurchase, requestPurchaseUuid],
      });
      queryClient.invalidateQueries({ queryKey: [queryKey.requestPurchases.requestPurchasesList] });
      toaster.success({
        title: text.singularLabel,
        description: savingText.appliedToast,
        duration: 7000,
      });
      onClose();
    },
    onError: (error: unknown) => {
      // 422 do backend mapeado por campo (mirror
      // `RequestQuotationFormDialog.tsx`) — inclui a `BusinessRuleException`
      // da guarda CL-045 (`errors.discount`, mensagem literal do backend,
      // NUNCA hardcoded aqui).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof RequestQuotationSavingFormValues, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }

      const errorMessage =
        isAxiosError(error) && (error.response?.data as { message?: string })?.message
          ? (error.response!.data as { message: string }).message
          : savingText.errorFallback;

      toaster.error({ title: text.singularLabel, description: errorMessage, duration: 7000 });
    },
  });

  function onSubmit(data: RequestQuotationSavingFormValues) {
    if (!data.responsible_uuid || data.discount == null || !quotation) return; // guarda defensiva — schema já exige

    const payload: RequestQuotationSavingPayload = {
      responsible_uuid: data.responsible_uuid.value,
      discount: data.discount,
    };

    savingMutation.mutate(payload);
  }

  function handleClose() {
    if (savingMutation.isPending) return;
    onClose();
  }

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open) handleClose();
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
        <Dialog.Positioner>
          {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
          <Dialog.Content>
            <Dialog.Header>
              {/* @ts-ignore ChakraUI v3 headless dialog: tipos ainda não compatíveis */}
              <Dialog.Title>{savingText.title}</Dialog.Title>
            </Dialog.Header>

            <Form noPadding onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <Text fontSize="sm" color="fg.muted" mb={4}>
                  {text.tab.card.fields.totalValue}: {formatCurrencyBRL(totalValue)}
                </Text>

                <SimpleGrid columns={1} gap={4}>
                  {/* FIELD-14 — responsible_id, required, SelectAsyncPaginate
                      sobre o lookup de usuários já existente na SPA
                      (`listUsers`, mirror `FilterSideSolicitacao.tsx`). */}
                  <Controller
                    name="responsible_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={savingText.fields.responsible}
                        placeholder={savingText.placeholders.responsible}
                        error={fieldState.error?.message as string | undefined}
                        service={listUsers}
                        mapOptions={(item: UserListItem) => ({
                          label: item.name,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={field.value ?? undefined}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        isRequired
                        isDisabled={savingMutation.isPending}
                        disablePortal
                      />
                    )}
                  />
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                  {/* FIELD-15 — discount ("Valor com Desconto" = valor
                      líquido, CV-04/CL-045, ver cabeçalho do arquivo). */}
                  <Controller
                    name="discount"
                    control={control}
                    render={({ field, fieldState }) => (
                      <MoneyInput
                        name={field.name}
                        label={savingText.fields.netValue}
                        tooltip={savingText.fields.netValueHelper}
                        error={fieldState.error?.message}
                        value={field.value}
                        onValueChange={field.onChange}
                        isRequired
                        disabled={savingMutation.isPending}
                      />
                    )}
                  />

                  {/* Preview CV-04 — readOnly, recalculado ao vivo, nunca
                      enviado no payload (servidor recalcula e persiste). */}
                  <PercentInput
                    name="saving_preview"
                    label={savingText.fields.savingPreview}
                    value={savingPreview}
                    readOnly
                    disabled
                  />
                </SimpleGrid>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="secondary"
                  type="button"
                  onClick={handleClose}
                  disabled={savingMutation.isPending}
                />
                <Button
                  title={savingText.applyButton}
                  type="submit"
                  loading={savingMutation.isPending}
                />
              </Dialog.Footer>
            </Form>

            {/* @ts-ignore ChakraUI v3 headless dialog */}
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
