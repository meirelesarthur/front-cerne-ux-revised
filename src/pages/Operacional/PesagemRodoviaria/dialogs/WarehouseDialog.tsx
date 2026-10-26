// src/pages/Operacional/PesagemRodoviaria/dialogs/WarehouseDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de sub-cadastro Armazém (FE-DLG-WAREHOUSE, TASK-MWG-FE-10) — 4
// campos (`initials`/`description`/`type`/`is_active`), plugado no select
// `warehouse_uuid` de `CreateOrUpdateModuleWeighing.tsx`.
//
// GATED-MOUNT (mirror `ClientFormModal.tsx`/`ProviderFormModal.tsx`): o
// corpo (`WarehouseDialogBody`) só monta quando o diálogo está de fato
// aberto E o dado (modo edição) já chegou, com `key={warehouseUuid ?? 'new'}`
// — reabrir em modo "criar" depois de editar remonta do zero (sem `reset()`
// manual necessário, sem dado residual). Quem tem o controller
// (`WarehouseDialogBody`) é quem renderiza o próprio `CustomDialog` com
// `footer={...}` — footer no SLOT real, header/footer fixos, só o body
// rola, SEM sticky/margem-negativa (que geravam faixa morta abaixo do
// footer).
// -----------------------------------------------------------------------------

import { Box, Flex, Skeleton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import {
  getWarehouse,
  createWarehouse,
  updateWarehouse,
} from '@/services/v2/Warehouses/warehouse-service';

import type { LanguageDate } from '@/@types/language';
import type { WarehouseDetail, WarehousePayload, WarehouseTypeSlug } from '@/@types/v2/Warehouses';

export interface WarehouseDialogSavedPayload {
  uuid: string;
  label: string;
}

export interface WarehouseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Armazém para EDITAR; `undefined`/vazio = modo CRIAR. */
  warehouseUuid?: string;
  onSaved: (warehouse: WarehouseDialogSavedPayload) => void;
}

function warehouseTypeOptions(
  languageGB: LanguageDate
): Array<{ value: WarehouseTypeSlug; label: string }> {
  const typeLabels = languageGB.warehouses.warehouse.filter.typeOptions;
  return [
    { value: 'insumos', label: typeLabels.insumos },
    { value: 'producao', label: typeLabels.producao },
    { value: 'formulacao', label: typeLabels.formulacao },
  ];
}

export function WarehouseDialog({ isOpen, onClose, warehouseUuid, onSaved }: WarehouseDialogProps) {
  const { languageGB } = useLanguage();
  const isEditing = isOpen && isValidGuid(warehouseUuid);

  const warehouseQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'warehouse-detail', warehouseUuid],
    queryFn: async () => (await getWarehouse(warehouseUuid!)).data,
    enabled: isEditing,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const title = languageGB.warehouses.warehouse.singularLabel;

  // Loading de EDIÇÃO: shell SEM controller ainda (os `defaultValues` do
  // `useForm` são síncronos no 1º mount — gated). Footer só "Cancelar" (o
  // "Salvar" depende do form, que só nasce com o dado pronto).
  if (isOpen && isEditing && warehouseQuery.isPending) {
    return (
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        footer={
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={onClose}
          />
        }
      >
        <Box py={2}>
          <Skeleton height="40px" borderRadius="md" />
        </Box>
      </CustomDialog>
    );
  }

  return (
    <WarehouseDialogBody
      key={warehouseUuid ?? 'new'}
      isOpen={isOpen}
      title={title}
      initialData={warehouseQuery.data}
      isEditing={!!isEditing}
      warehouseUuid={warehouseUuid}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

interface WarehouseFormValues {
  initials: string;
  description: string;
  type: WarehouseTypeSlug;
  is_active: boolean;
}

interface WarehouseDialogBodyProps {
  isOpen: boolean;
  title: string;
  initialData?: WarehouseDetail;
  isEditing: boolean;
  warehouseUuid?: string;
  onClose: () => void;
  onSaved: (warehouse: WarehouseDialogSavedPayload) => void;
}

// Componente com o form (gated por `key`): renderiza o próprio CustomDialog
// para que o footer (Cancelar/Salvar) vá para o SLOT `footer` real do
// dialog — header/footer fixos, só o body rola, SEM footer-in-body sticky
// (que deixava faixa morta abaixo do footer).
function WarehouseDialogBody({
  isOpen,
  title,
  initialData,
  isEditing,
  warehouseUuid,
  onClose,
  onSaved,
}: WarehouseDialogBodyProps) {
  const { languageGB } = useLanguage();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormValues>({
    mode: 'onChange',
    defaultValues: {
      initials: initialData?.initials ?? '',
      description: initialData?.description ?? '',
      type: initialData?.type ?? 'insumos',
      is_active: initialData?.is_active ?? true,
    },
  });

  const warehouseMutation = useRequest({
    asyncFunction: tryPersistWarehouse,
    entityName: languageGB.warehouses.warehouse.singularLabel,
    queryKey: queryKey.warehouses.list,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      onSaved({ uuid: data.uuid, label: `${data.initials} — ${data.description}` });
      onClose();
    },
  });

  async function tryPersistWarehouse(data: WarehouseFormValues) {
    const payload: WarehousePayload = {
      initials: data.initials.trim(),
      description: data.description.trim(),
      type: data.type,
      is_active: data.is_active,
    };
    if (isEditing && warehouseUuid) {
      return await updateWarehouse(warehouseUuid, payload);
    }
    return await createWarehouse(payload);
  }

  async function onSubmit(data: WarehouseFormValues) {
    await warehouseMutation.mutateAsync(data);
  }

  const isSaving = isSubmitting || warehouseMutation.isPending;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          />
          <Button
            title={languageGB.defaltStrings.save}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isSaving}
            disabled={isSaving}
          />
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <Flex direction="column" gap={4}>
          <Input
            label={languageGB.warehouses.warehouse.form.fields.initials}
            isRequired
            error={errors.initials?.message}
            {...register('initials', { required: true })}
          />
          <Input
            label={languageGB.warehouses.warehouse.form.fields.description}
            isRequired
            error={errors.description?.message}
            {...register('description', { required: true })}
          />
          <Controller
            name="type"
            control={control}
            render={({ field }) => {
              const options = warehouseTypeOptions(languageGB);
              return (
                <Select
                  label={languageGB.warehouses.warehouse.form.fields.type}
                  name={field.name}
                  isRequired
                  options={options}
                  value={options.find((option) => option.value === field.value) ?? null}
                  onChange={(option) => field.onChange(option?.value ?? 'insumos')}
                />
              );
            }}
          />
        </Flex>
      </Form>
    </CustomDialog>
  );
}

export default WarehouseDialog;
