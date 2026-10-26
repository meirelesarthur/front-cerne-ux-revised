// src/pages/Operacional/LoteFazenda/TransferBatchFarms/ChangeBatchModuleAreaModal.tsx
// -----------------------------------------------------------------------------
// Modal "Transferência Módulo/Área" (DLG-AREA/FRM-AREA, 97-Esteiras/041,
// TASK-FE-041-LF-03) — chamado de dentro do wizard de Processamentos
// (`ProcessingAnimalRow.tsx`), aberto automaticamente (ACT-30) quando o Lote
// selecionado no card não tem `area`/`grazing` (INT-25). Padrão Pattern 14
// (Modal Form, `Dialog.Root` v3).
//
// `POST /transfer-batch-farms/module-area` (ACT-32, R-23) — `code`/`date`
// preenchidos pelo usuário (o backend NÃO gera `code` aqui — mirror
// `ChangeBatchModuleAreaRequest::rules()`, `code` é `required|string`, sem
// geração server-side documentada); `batch`/`qtd` (total de animais do lote)
// exibidos como CONTEXTO somente-leitura (recebidos via prop, não campos
// editáveis); `area_uuid` XOR `grazing_uuid` (`required_without` mútuo).
//
// LKP-35 — antes de abrir, o caller consulta `GET .../module-area/last` para
// hidratar o HISTÓRICO mais recente (exibido como contexto informativo
// abaixo do form, nunca pré-preenchendo `area_uuid`/`grazing_uuid` — o Lote
// está SEM área/módulo agora, então não há valor atual a herdar, só
// referência do que foi a última transferência da fazenda).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Dialog, Portal, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { changeBatchModuleAreaSchemaResolver } from '@/validations/schemas/LoteFazenda/changeBatchModuleArea-schema';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';
import {
  changeBatchModuleArea,
  getLastTransferBatchGrazingArea,
} from '@/services/v2/LoteFazenda/transferBatchFarm-service';

import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';
import type {
  BatchDetail,
  ChangeBatchModuleAreaRequest,
} from '@/@types/v2/LoteFazenda/transferBatchFarm';

import { computeNextTransferCode } from './transferCode';

interface ChangeBatchModuleAreaFormValues {
  code: string;
  date: string | null;
  batch_uuid: Option<string> | null;
  area_uuid: Option<string> | null;
  grazing_uuid: Option<string> | null;
}

const emptyFormValues: ChangeBatchModuleAreaFormValues = {
  code: '',
  date: null,
  batch_uuid: null,
  area_uuid: null,
  grazing_uuid: null,
};

export interface ChangeBatchModuleAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchUuid: string | null;
  batchLabel: string;
  totalAnimals: number;
  currentFarmUuid?: string;
  onChanged: (batch: BatchDetail) => void;
}

export function ChangeBatchModuleAreaModal({
  isOpen,
  onClose,
  batchUuid,
  batchLabel,
  totalAnimals,
  currentFarmUuid,
  onChanged,
}: ChangeBatchModuleAreaModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.loteFazenda.changeBatchModuleArea;

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ChangeBatchModuleAreaFormValues>({
    mode: 'onChange',
    resolver: changeBatchModuleAreaSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: emptyFormValues,
  });

  // correção 097-v3 (§4.1c) — Data default = HOJE ao abrir, mirror
  // `change_batch_grazing_area_modal.blade.php:19` (`->value(today())`).
  // `DateInput` consome ISO 'yyyy-MM-dd' (contrato do componente).
  //
  // correção 097 (fix — batch_uuid nunca populado) — `batch_uuid` é
  // `optionSchema.required(...)` no schema (`changeBatchModuleArea-
  // schema.ts`), mas o Lote só chegava via PROP `batchUuid` (exibido
  // read-only em `InputReadOnly`) — NUNCA escrito no campo do form. O
  // resolver barrava SEMPRE (`errors.batch_uuid` required), confirmado por
  // instrumentação de runtime (removida após a correção). Populamos o campo
  // no mesmo reset de abertura, no shape `Option<string>` que o schema e o
  // `SelectAsyncPaginate`/demais campos usam.
  useEffect(() => {
    if (isOpen) {
      reset({
        ...emptyFormValues,
        date: format(new Date(), 'yyyy-MM-dd'),
        batch_uuid: batchUuid ? { label: batchLabel, value: batchUuid } : null,
      });
    }
  }, [isOpen, reset, batchUuid, batchLabel]);

  // LKP-35 — histórico mais recente, só contexto informativo.
  const lastQuery = useQuery({
    queryKey: ['transfer-batch-grazing-area-last'],
    queryFn: () => getLastTransferBatchGrazingArea(),
    enabled: isOpen,
  });
  const last = lastQuery.data?.data;

  // correção 097-v3 (§4.1d) — Código auto-preenchido (sequencial, a partir
  // do `code` do histórico), mirror `handleBatch()` do legado. Reaproveita a
  // MESMA query `lastQuery` acima (já ativa só para exibir `area_next`) —
  // sem 2ª chamada de rede.
  useEffect(() => {
    if (isOpen && lastQuery.isSuccess) {
      setValue('code', computeNextTransferCode(lastQuery.data?.data?.code), {
        shouldValidate: true,
      });
    }
  }, [isOpen, lastQuery.isSuccess, lastQuery.data, setValue]);

  const watchedArea = useWatch({ control, name: 'area_uuid' });
  const watchedGrazing = useWatch({ control, name: 'grazing_uuid' });

  // `listAreas` exige `farm_uuid` (`AreaIndexRequest::rules()`) — adapter
  // local fecha sobre `currentFarmUuid` (prop) para casar com a assinatura
  // `(pageParams: PaginationQueryParams) => Promise<ResponsePagination<T>>`
  // exigida por `SelectAsyncPaginate`.
  function listAreaOptions(params: { page?: number; per_page?: number }) {
    return listAreas({
      farm_uuid: currentFarmUuid ?? '',
      page: params.page,
      per_page: params.per_page,
    });
  }

  const createMutation = useMutation({
    mutationFn: (payload: ChangeBatchModuleAreaRequest) => changeBatchModuleArea(payload),
    onSuccess: (response) => {
      toaster.success({ title: text.title, description: text.successToast, duration: 7000 });
      onChanged(response.data);
      onClose();
    },
    onError: (error) => {
      const message = isAxiosError(error) ? (error.response?.data as any)?.message : undefined;
      toaster.error({
        title: text.title,
        description: message ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  function onSubmit(data: ChangeBatchModuleAreaFormValues) {
    if (!batchUuid) return;
    const payload: ChangeBatchModuleAreaRequest = {
      code: data.code.trim(),
      date: data.date as string,
      batch_uuid: batchUuid,
      area_uuid: data.area_uuid?.value ?? undefined,
      grazing_uuid: data.grazing_uuid?.value ?? undefined,
    };
    createMutation.mutate(payload);
  }

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="lg"
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

            <form id="change-batch-module-area-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={4}>
                  <InputReadOnly label={text.fields.batch} value={batchLabel} />
                  <InputReadOnly label={text.fields.qtd} value={String(totalAnimals)} />
                </SimpleGrid>

                {last && (
                  <Box mb={4} p={3} bg="bg.muted" borderRadius="md">
                    <Text fontSize="xs" color="fg.muted">
                      {last.area_next?.description ?? last.grazing_next?.description ?? '—'}
                    </Text>
                  </Box>
                )}

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Input
                    label={text.fields.code}
                    isRequired
                    {...register('code')}
                    readOnly
                    error={errors.code?.message}
                    disabled={isSubmitting}
                  />

                  <Controller
                    name="date"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field
                        label={text.fields.date}
                        isRequired
                        errorText={fieldState.error?.message}
                      >
                        <DateInput
                          value={field.value ?? null}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </Field>
                    )}
                  />

                  <Controller
                    name="area_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.fields.area}
                        service={listAreaOptions}
                        mapOptions={(item: AreaListItem) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          if (option) setValue('grazing_uuid', null, { shouldValidate: true });
                        }}
                        error={fieldState.error?.message}
                        isDisabled={isSubmitting || !!watchedGrazing}
                        disablePortal
                      />
                    )}
                  />

                  <Controller
                    name="grazing_uuid"
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={text.fields.grazing}
                        service={listGrazings}
                        mapOptions={(item: GrazingListItem) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        value={field.value ?? null}
                        onChange={(option: any) => {
                          field.onChange(option ?? null);
                          if (option) setValue('area_uuid', null, { shouldValidate: true });
                        }}
                        error={fieldState.error?.message}
                        isDisabled={isSubmitting || !!watchedArea}
                        disablePortal
                      />
                    )}
                  />
                </SimpleGrid>
              </Dialog.Body>
            </form>

            <Dialog.Footer>
              <Button
                title={text.cancelButton}
                variant="secondary"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              />
              {/* correção 097 (fix final) — este modal é renderizado DENTRO do
                  <Form id="processing-finish-form"> de FinishProcessing.tsx
                  (via ProcessingAnimalRow, dentro da lista de animais do
                  wizard). HTML descarta <form> aninhado — o `form="change-
                  batch-module-area-form"` do botão abaixo apontava para um
                  form inexistente no DOM, então o clique submetia o form
                  ANCESTRAL (Finalizar) em vez do form deste modal, e o
                  `onSubmit` daqui nunca rodava. `type="button"` +
                  `onClick={handleSubmit(onSubmit)}` dispara a validação e o
                  submit do MODAL programaticamente, sem tocar o form pai —
                  mirror da exceção documentada em
                  `get_pwa_complex_screen_compositions_pattern` (Pattern 14 /
                  wizard regra 6: `onClick={handleSubmit(...)}` aceito quando
                  o `form="id"` nativo não é viável, motivo comentado aqui). */}
              <Button
                title={text.submitButton}
                type="button"
                onClick={handleSubmit(onSubmit)}
                loading={isSubmitting}
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
