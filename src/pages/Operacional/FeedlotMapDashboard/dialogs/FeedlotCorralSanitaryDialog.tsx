// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotCorralSanitaryDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Sanitário Múltiplo — TASK-FE-042-215, `AM19`, `FM072-080`. Mirror
// `[[09-front-sanitario-morte]]` §1: `animal_id` (multi-select, default =
// TODOS os animais ativos pré-selecionados), repeater de itens (`useFieldArray`,
// adaptação estrutural de `ProcessingSanitarySection.tsx`).
//
// GAP-FE-244 (correção de fidelidade exec-042) — o submit foi corrigido de
// `FormData`+arrays paralelos com nomes legado (`warehouse_id[]`/`um[]`/...)
// para JSON `{ animal_uuids, items[] }`, mirror EXATO de
// `StoreFeedlotCorralSanitaryMultipleRequest::rules()` — o formato anterior
// não tinha correspondência com o Form Request atual (422 garantido em
// qualquer submit real). Cada item carrega `stock_uuid` (linha exata de
// `Stock`/lote escolhida), mirror do `lot` por item do legado
// `ModalSanitario.js`.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Dialog, Flex, Portal, Text } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { queryKey } from '@/constants/query-key';

import {
  multipleSanitariesSchemaResolver,
  type MultipleSanitariesFormValues,
} from '@/validations/schemas/FeedlotMap/multipleSanitaries-schema';

import {
  getCorralSanitaryData,
  saveMultipleSanitaries,
} from '@/services/v2/FeedlotMap/feedlot-map-service';

import type { SaveMultipleSanitariesRequest } from '@/@types/v2/FeedlotMap/sanitary';

import { FeedlotSanitaryItemRow } from './FeedlotSanitaryItemRow';

const EMPTY_ITEM: MultipleSanitariesFormValues['items'][number] = {
  warehouse_id: null,
  product_id: null,
  measurement_id: null,
  quantity: '',
  note_item: '',
};

const EMPTY_VALUES: MultipleSanitariesFormValues = {
  animal_id: [],
  items: [EMPTY_ITEM],
};

export interface FeedlotCorralSanitaryDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  onClose: () => void;
}

export function FeedlotCorralSanitaryDialog({
  isOpen,
  targetUuid,
  onClose,
}: FeedlotCorralSanitaryDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.sanitary;
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState } = useForm<MultipleSanitariesFormValues>({
    mode: 'onSubmit',
    resolver: multipleSanitariesSchemaResolver(languageGB) as any,
    defaultValues: EMPTY_VALUES,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const sanitaryDataQuery = useQuery({
    queryKey: [queryKey.feedlotMap.feedlotMap, 'corral-sanitary-data', targetUuid],
    queryFn: async () => (await getCorralSanitaryData(targetUuid as string)).data,
    enabled: isOpen && !!targetUuid,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      // FM072 — default: TODOS os animais ativos pré-selecionados.
      animal_id: sanitaryDataQuery.data?.animals ?? [],
      items: [EMPTY_ITEM],
    });
    // eslint-disable-next-line
  }, [isOpen, targetUuid, sanitaryDataQuery.data]);

  const mutation = useMutation({
    mutationFn: async (payload: SaveMultipleSanitariesRequest) => {
      if (!targetUuid) throw new Error('targetUuid inválido');
      return saveMultipleSanitaries(targetUuid, payload);
    },
    onSuccess: () => {
      toaster.success({ title: text.title, description: languageGB.defaltStrings.actionSuccess });
      queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: MultipleSanitariesFormValues) {
    mutation.mutate({
      animal_uuids: data.animal_id.map((option) => option.value),
      items: data.items.map((item) => ({
        warehouse_uuid: item.warehouse_id!.value,
        product_uuid: item.product_id!.product_uuid,
        stock_uuid: item.product_id!.value,
        measurement_uuid: item.measurement_id!.value,
        quantity: Number(item.quantity),
        note: item.note_item || null,
      })),
    });
  }

  const isSubmitting = mutation.isPending;
  const animalsCount = sanitaryDataQuery.data?.animals.length ?? 0;
  const warehouseOptions = sanitaryDataQuery.data?.warehouses ?? [];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details: { open: boolean }) => {
        if (!details.open && !isSubmitting) onClose();
      }}
      size="xl"
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

            <form id="feedlot-corral-sanitary-dialog-form" onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Body maxH="70vh" overflowY="auto">
                <Box mb={4}>
                  <Controller
                    name="animal_id"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Select
                        label={text.fields.animals}
                        name={field.name}
                        value={field.value}
                        onChange={field.onChange}
                        options={sanitaryDataQuery.data?.animals ?? []}
                        error={fieldState.error?.message}
                        isRequired
                        multiple
                        loading={sanitaryDataQuery.isPending}
                      />
                    )}
                  />
                </Box>

                <Flex justify="space-between" align="center" mb={3}>
                  <Text fontWeight="bold">{text.title}</Text>
                  <Button
                    title={text.addItem}
                    variant="outline"
                    type="button"
                    onClick={() => append(EMPTY_ITEM)}
                  />
                </Flex>

                {typeof formState.errors.items?.message === 'string' && (
                  <Text color="fg.error" fontSize="sm" mb={2}>
                    {formState.errors.items.message}
                  </Text>
                )}

                <Flex direction="column" gap={4}>
                  {fields.map((field, index) => (
                    <FeedlotSanitaryItemRow
                      key={field.id}
                      control={control}
                      index={index}
                      canRemove={fields.length > 1}
                      onRemove={() => remove(index)}
                      animalsCount={animalsCount}
                      warehouseOptions={warehouseOptions}
                      languageGB={languageGB}
                    />
                  ))}
                </Flex>

                {fields.length === 0 && (
                  <Text color="fg.muted" mt={3}>
                    {text.empty}
                  </Text>
                )}
              </Dialog.Body>
            </form>

            <Dialog.Footer>
              <Button
                title={languageGB.defaltStrings.cancel}
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              />
              <Button
                title={languageGB.defaltStrings.save}
                type="submit"
                form="feedlot-corral-sanitary-dialog-form"
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
