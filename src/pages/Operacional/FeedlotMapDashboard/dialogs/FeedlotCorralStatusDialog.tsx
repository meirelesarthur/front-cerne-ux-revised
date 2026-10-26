// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralStatusDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Alterar Status do Curral — TASK-FE-042-208, `AM13`/`IG15`. Campos
// `status`/`available_at`/`note` (`FM041-043`) — os 2 últimos obrigatórios
// só quando o destino é `VS`/`LI`/`MA`/`FE` (`.when` condicional, mirror
// `UpdateFeedlotCorralStatusRequest`).
//
// Confirmação EXPLÍCITA de detach (`IG15`/`SE09`, upgrade de clareza sobre
// o `confirm()` genérico do legado) quando o status ANTERIOR era `OC`
// (ocupado) e há lotes vinculados — a mensagem nomeia quantos lotes serão
// removidos e que as datas/dieta serão apagadas (mirror
// `UpdateFeedlotCorralStatusAction`, efeito real do backend).
//
// 063-est03-9-reprovacoes — prefill de "Liberação"/"Observação" (achado do
// dono): o `reset()` hardcodava `available_at: null`/`note: ''` mesmo
// quando o curral JÁ tinha esses dados. `available_at` vem de
// `CorralCardData` no formato `d/m/Y` (ex.: "19/09/2026", texto pronto pra
// exibição do card, `CardCurral.tsx` — NÃO tocado aqui) — convertido
// LOCALMENTE (`parseAvailableAtToFormValue` abaixo) para `yyyy-MM-dd`, o
// único formato que `DateInput`/`dateNativeBridge.ts` aceitam. `note` usa
// `corralData?.last_status_note` — campo AINDA NÃO devolvido pela API
// (pendente de fix de override do dono, fora do escopo desta correção);
// `?? ''` degrada para o comportamento atual (Observação vazia) até lá, SEM
// MOCK.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Field } from '@/components/Form/Field';
import { Select } from '@/components/Form/Select';
import { Textarea } from '@/components/Form/Textarea';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  feedlotCorralStatusSchemaResolver,
  FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED,
  type FeedlotCorralStatusFormValues,
} from '@/validations/schemas/FeedlotCorrals/feedlotCorralStatus-schema';

import {
  getFeedlotCorralOptions,
  updateCorralStatus,
} from '@/services/v2/FeedlotCorrals/feedlot-corral-service';

import type { UpdateFeedlotCorralStatusRequest } from '@/@types/v2/FeedlotCorrals';
import type { CorralCardData } from '@/@types/v2/FeedlotMap';

const EMPTY_VALUES: FeedlotCorralStatusFormValues = {
  status: null,
  available_at: null,
  note: '',
};

// Converte `CorralCardData.available_at` (`d/m/Y`, ex.: "19/09/2026") para
// `yyyy-MM-dd` (contrato do `DateInput`, `dateNativeBridge.ts`). Conversão
// ISOLADA deste diálogo — `CardCurral.tsx` continua consumindo
// `available_at` como texto pronto, sem alteração de payload/formato ali.
function parseAvailableAtToFormValue(availableAt: string | null | undefined): string | null {
  if (!availableAt) return null;
  const parsed = parse(availableAt, 'dd/MM/yyyy', new Date());
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'yyyy-MM-dd');
}

export interface FeedlotCorralStatusDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  corralData?: CorralCardData;
  onClose: () => void;
}

export function FeedlotCorralStatusDialog({
  isOpen,
  targetUuid,
  corralData,
  onClose,
}: FeedlotCorralStatusDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.status;
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FeedlotCorralStatusFormValues>({
    mode: 'onChange',
    resolver: feedlotCorralStatusSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });

  const optionsQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-status-options'],
    queryFn: async () => (await getFeedlotCorralOptions()).data,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      status: corralData ? { label: corralData.status_label, value: corralData.status } : null,
      // 063-est03-9-reprovacoes — hidrata com a data REAL de liberação do
      // curral (convertida de `d/m/Y` para `yyyy-MM-dd`), NUNCA mais
      // hardcoded `null`.
      available_at: parseAvailableAtToFormValue(corralData?.available_at),
      // `last_status_note` ainda não vem da API (ver nota de topo) — `?? ''`
      // é o único fallback possível até o backend expor o campo.
      note: corralData?.last_status_note ?? '',
    });
  }, [isOpen, targetUuid]);

  const watchedStatus = watch('status');
  const requiresDetail =
    !!watchedStatus &&
    (FEEDLOT_CORRAL_STATUS_DETAIL_REQUIRED as readonly string[]).includes(watchedStatus.value);

  const [pendingPayload, setPendingPayload] = useState<UpdateFeedlotCorralStatusRequest | null>(
    null
  );

  const mutation = useMutation({
    mutationFn: async (payload: UpdateFeedlotCorralStatusRequest) => {
      if (!targetUuid) throw new Error('targetUuid inválido');
      return updateCorralStatus(targetUuid, payload);
    },
    onSuccess: () => {
      toaster.success({ title: text.title, description: languageGB.defaltStrings.actionSuccess });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      setPendingPayload(null);
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  const willDetachBatches =
    corralData?.status === 'OC' &&
    watchedStatus?.value !== 'OC' &&
    (corralData?.batches.length ?? 0) > 0;

  function onSubmit(data: FeedlotCorralStatusFormValues) {
    const payload: UpdateFeedlotCorralStatusRequest = {
      status: data.status!.value,
      available_at: data.available_at,
      note: data.note || null,
    };

    if (willDetachBatches) {
      setPendingPayload(payload);
      return;
    }

    mutation.mutate(payload);
  }

  const isSubmitting = mutation.isPending;

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open && !isSubmitting) onClose();
        }}
        size="sm"
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
                <Dialog.Title>{text.title}</Dialog.Title>
              </Dialog.Header>

              <form id="feedlot-corral-status-dialog-form" onSubmit={handleSubmit(onSubmit)}>
                <Dialog.Body>
                  <SimpleGrid columns={1} gap={4}>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.status}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={optionsQuery.data?.statuses ?? []}
                          error={error?.message}
                          isRequired
                          loading={optionsQuery.isPending}
                        />
                      )}
                    />

                    {requiresDetail && (
                      <>
                        <Controller
                          name="available_at"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Field
                              label={text.fields.availableAt}
                              isRequired
                              errorText={fieldState.error?.message}
                            >
                              <DateInput value={field.value} onChange={field.onChange} />
                            </Field>
                          )}
                        />

                        <Textarea
                          label={text.fields.note}
                          {...register('note')}
                          error={errors.note?.message}
                          isRequired
                          minH="100px"
                        />
                      </>
                    )}
                  </SimpleGrid>
                </Dialog.Body>
              </form>

              <Dialog.Footer>
                <Button
                  title={languageGB.defaltStrings.cancel}
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                />
                <Button
                  title={languageGB.defaltStrings.save}
                  type="submit"
                  form="feedlot-corral-status-dialog-form"
                  loading={isSubmitting}
                />
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <DeleteConfirmDialog
        isOpen={pendingPayload !== null}
        onClose={() => setPendingPayload(null)}
        onConfirm={() => pendingPayload && mutation.mutate(pendingPayload)}
        isLoading={isSubmitting}
        title={text.detachConfirm.title}
        description={text.detachConfirm.description.replace(
          '{count}',
          String(corralData?.batches.length ?? 0)
        )}
        tone="warning"
      />
    </>
  );
}
