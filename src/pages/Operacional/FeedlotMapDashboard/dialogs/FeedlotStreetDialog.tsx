// src/pages/Operacional/FeedlotMapDashboard/dialogs/FeedlotStreetDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo Criar/Editar/Excluir Rua (FeedlotStreet) do Mapa de Confinamento —
// TASK-FE-042-207. Único componente espacial com EXCLUSÃO real no domínio
// (`C26`, `IG14`) — exige confirmação explícita (`ConfirmDialog`/
// `DeleteConfirmDialog`, ação destrutiva).
//
// 2 campos apenas (`FM039-040`): `description` (max 100), `orientation`
// (`H`/`V`, default `H`). `feedlot_sector_uuid` só no CREATE (vem do setor
// pai clicado no board, `sectorUuid` do `FeedlotMapDialogState`) — o PATCH
// de edição NUNCA o envia (imutável, `Rule::prohibited` no backend).
// `description`/`orientation` de EDIÇÃO vêm do próprio card da árvore
// (`streetDescription`/`streetOrientation`) — sem `GET /feedlot-streets/{uuid}`
// (não consumido por esta feature, mirror do comentário do service).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Dialog, Portal, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';

import { feedlotStreetOrientationOptions } from '@/constants/FeedlotMap/options/feedlot-street-orientation-options';
import { queryKey } from '@/constants/query-key';

import { feedlotStreetSchemaResolver } from '@/validations/schemas/FeedlotStreets/feedlotStreet-schema';

import {
  createFeedlotStreet,
  deleteFeedlotStreet,
  updateFeedlotStreet,
} from '@/services/v2/FeedlotStreets/feedlot-street-service';

import type {
  CreateFeedlotStreetRequest,
  FeedlotStreetForm as FeedlotStreetFormType,
  UpdateFeedlotStreetRequest,
} from '@/@types/v2/FeedlotStreets';

export interface FeedlotStreetDialogProps {
  isOpen: boolean;
  targetUuid?: string;
  sectorUuid?: string;
  streetDescription?: string;
  streetOrientation?: 'H' | 'V';
  onClose: () => void;
}

export function FeedlotStreetDialog({
  isOpen,
  targetUuid,
  sectorUuid,
  streetDescription,
  streetOrientation,
  onClose,
}: FeedlotStreetDialogProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.feedlotMap.feedlotMap.street;
  const queryClient = useQueryClient();

  const isEditing = isValidGuid(targetUuid);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FeedlotStreetFormType>({
    mode: 'onChange',
    resolver: feedlotStreetSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      description: '',
      orientation: feedlotStreetOrientationOptions.getOption('H', languageGB),
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      description: isEditing ? (streetDescription ?? '') : '',
      orientation: feedlotStreetOrientationOptions.getOption(
        isEditing ? (streetOrientation ?? 'H') : 'H',
        languageGB
      ),
    });
  }, [isOpen, isEditing, targetUuid]);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  function invalidateTree() {
    queryClient.invalidateQueries({ queryKey: [queryKey.feedlotMap.tree] });
  }

  const mutation = useMutation({
    mutationFn: async (data: FeedlotStreetFormType) => {
      if (isEditing && targetUuid) {
        const patch: UpdateFeedlotStreetRequest = {
          description: data.description,
          orientation: data.orientation.value,
        };
        return updateFeedlotStreet(targetUuid, patch);
      }

      const payload: CreateFeedlotStreetRequest = {
        description: data.description,
        orientation: data.orientation.value,
        feedlot_sector_uuid: sectorUuid as string,
      };
      return createFeedlotStreet(payload);
    },
    onSuccess: () => {
      toaster.success({
        title: text.singularLabel,
        description: languageGB.defaltStrings.actionSuccess,
      });
      invalidateTree();
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!targetUuid) throw new Error('targetUuid inválido');
      return deleteFeedlotStreet(targetUuid);
    },
    onSuccess: () => {
      toaster.success({ title: text.singularLabel, description: text.deletedToast });
      invalidateTree();
      setIsDeleteConfirmOpen(false);
      onClose();
    },
    onError: (error) => {
      toaster.error({
        title: text.singularLabel,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
      });
    },
  });

  function onSubmit(data: FeedlotStreetFormType) {
    mutation.mutate(data);
  }

  const isSubmitting = mutation.isPending;
  const isDeleting = deleteMutation.isPending;

  const orientationOptions = feedlotStreetOrientationOptions.options(languageGB);

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(details: { open: boolean }) => {
          if (!details.open && !isSubmitting) onClose();
        }}
        size="md"
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
                <Dialog.Title>{isEditing ? text.title.edit : text.title.create}</Dialog.Title>
              </Dialog.Header>

              <form id="feedlot-street-dialog-form" onSubmit={handleSubmit(onSubmit)}>
                <Dialog.Body>
                  <SimpleGrid columns={1} gap={4}>
                    <Input
                      label={text.fields.description}
                      {...register('description')}
                      error={errors.description?.message}
                      isRequired
                      maxLength={100}
                    />

                    <Controller
                      name="orientation"
                      control={control}
                      render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                        <Select
                          label={text.fields.orientation}
                          name={name}
                          value={value}
                          onChange={onChange}
                          options={orientationOptions}
                          error={error?.message}
                          isRequired
                        />
                      )}
                    />
                  </SimpleGrid>
                </Dialog.Body>
              </form>

              <Dialog.Footer justifyContent={isEditing ? 'space-between' : 'flex-end'}>
                {isEditing && (
                  <Button
                    title={languageGB.defaltStrings.delete}
                    variant="outline"
                    colorPalette="red"
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isSubmitting}
                  />
                )}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                    form="feedlot-street-dialog-form"
                    loading={isSubmitting}
                  />
                </div>
              </Dialog.Footer>
              {/* @ts-ignore ChakraUI v3 headless dialog */}
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={isDeleting}
        title={text.deleteConfirm.title}
        tone="danger"
      />
    </>
  );
}
