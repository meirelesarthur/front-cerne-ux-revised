// src/pages/Frota/Transferencias/CreateTransferencia.tsx
// -----------------------------------------------------------------------------
// Tela de CRIAÇÃO de Transferência de Máquinas — `/frota/transferencias/novo`
// (TASK-ETR-FE-03). Um único `useForm` raiz com dois `useFieldArray`
// (`equipment_uuids`, `attachments`), submetido em UM POST multipart —
// `SE-01`/`API-ACT-01` definem o `store` como transação única, sem endpoint
// de filho (fid-g3f §3.11: SEM abas, SEM store Zustand de itens temporários).
//
// Cabeçalho (`FD-01..FD-05`): `code` é `readOnly` (NUNCA `disabled`) mas VAI
// no payload (OD-003 — client-controlled, sem recomputação/unicidade);
// responsável e fazenda de origem são exibição pura (`InputReadOnly`, NÃO
// enviados); `farm_out` é obrigatório e vai como `farm_out_uuid`.
//
// Máquinas: 1 linha inicial (`equipment_uuids` `required|min:1`), duplicata
// PERMITIDA (`DEC-FE-ETR-02`). Anexos: 0 linhas iniciais, linhas sem `file`
// descartadas ANTES do FormData (`DEC-FE-ETR-03`, fid-g3f §3.3 — evita 422).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, Skeleton, SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useMyFarms } from '@/hooks/useMyFarms';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createEquipmentTransfer } from '@/services/v2/EquipmentTransfers/equipment-transfer-service';
import type { CreateEquipmentTransferPayload } from '@/services/v2/EquipmentTransfers/equipment-transfer-service';

import type { EquipmentTransferForm, EquipmentTransferRef } from '@/@types/v2/EquipmentTransfers';

import { TransferAttachmentsFieldArray } from './TransferAttachmentsFieldArray';
import { TransferEquipmentsFieldArray } from './TransferEquipmentsFieldArray';
import { useDestinationFarms, useNextEquipmentTransferCode } from './useTransferencias';

const TRANSFERENCIAS_LIST_ROUTE = '/frota/transferencias';

function mapDestinationFarmOption(farm: EquipmentTransferRef) {
  return { label: farm.description, value: farm.uuid };
}

function todayIsoDate(): string {
  return todayLocalIso();
}

export default function CreateTransferencia() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { activeFarmUuid, user: authUser } = useAuth();

  const text = languageGB.equipmentTransfers.equipmentTransfer;
  const formText = text.form;

  const canSave = can('equipment-transfer_create');

  // FD-02/FD-04 — "responsável"/"fazenda de origem" são exibição pura
  // (servidor usa `auth()`/`currentFarm`, CL-10) — NUNCA enviados.
  const { data: myFarms = [] } = useMyFarms();
  const originFarmDescription = useMemo(
    () => myFarms.find((farm) => farm.uuid === activeFarmUuid)?.description ?? '—',
    [myFarms, activeFarmUuid]
  );

  // FE-11/DEC-FE-ETR-01 — lookups do cabeçalho, consumidos UMA VEZ ao montar.
  const nextCodeQuery = useNextEquipmentTransferCode();
  const destinationFarmsQuery = useDestinationFarms();
  const destinationFarmOptions = useMemo(
    () => (destinationFarmsQuery.data ?? []).map(mapDestinationFarmOption),
    [destinationFarmsQuery.data]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<EquipmentTransferForm>({
    mode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      farm_out: null,
      equipment_uuids: [{ equipment_uuid: null }],
      attachments: [],
    },
  });

  // OD-003 — `code` fica no estado do form (readOnly, não disabled) e VAI no
  // payload; preenchido UMA VEZ quando o lookup resolve, nunca recalculado.
  useEffect(() => {
    if (nextCodeQuery.data) {
      setValue('code', nextCodeQuery.data);
    }
  }, [nextCodeQuery.data, setValue]);

  const [itemsError, setItemsError] = useState<string | null>(null);
  const watchedEquipments = watch('equipment_uuids');
  useEffect(() => {
    if (itemsError && (watchedEquipments ?? []).some((row) => row.equipment_uuid)) {
      setItemsError(null);
    }
  }, [itemsError, watchedEquipments]);

  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const createMutation = useRequest({
    asyncFunction: tryPersistEquipmentTransfer,
    entityName: text.singularLabel,
    queryKey: queryKey.equipmentTransfers.equipmentTransfers,
    queryKey2: queryKey.equipmentTransfers.equipmentTransfer,
    typesRequest: 'create',
    actionSuccess: () => navigate(TRANSFERENCIAS_LIST_ROUTE),
  });

  async function tryPersistEquipmentTransfer(data: EquipmentTransferForm) {
    const payload: CreateEquipmentTransferPayload = {
      code: data.code,
      farm_out_uuid: data.farm_out!.value,
      date: data.date,
      equipment_uuids: data.equipment_uuids
        .map((row) => row.equipment_uuid?.value)
        .filter((value): value is string => !!value),
      // Descarte de linhas sem `file` — cinto e suspensório (o service já
      // descarta de novo antes do FormData, fid-g3f §3.3).
      attachments: data.attachments.filter((attachment) => !!attachment.file),
    };
    return createEquipmentTransfer(payload);
  }

  async function onSubmit(data: EquipmentTransferForm) {
    const hasEquipment = data.equipment_uuids.some((row) => row.equipment_uuid);
    if (!hasEquipment) {
      setItemsError(formText.equipments.minOneRequired);
      return;
    }
    await createMutation.mutateAsync(data);
  }

  const isLoadingHeader = checkLoadingStatus([nextCodeQuery, destinationFarmsQuery]);
  const isSaving = isSubmitting || createMutation.isPending;

  return (
    <>
      <FormContainer
        title={formText.createTitle}
        subtitle={formText.createSubtitle}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="outline"
              type="button"
              onClick={() => guardedNavigate(TRANSFERENCIAS_LIST_ROUTE)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create
                dirtyFields={dirtyFields}
                type="button"
                onClick={handleSubmit(onSubmit)}
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving}
              />
            )}
          </>
        }
      >
        <Form id="equipment-transfer-form" noPadding onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Skeleton loading={isLoadingHeader}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input
                    label={formText.fields.code}
                    value={field.value}
                    readOnly
                    onChange={() => undefined}
                  />
                )}
              />
            </Skeleton>

            <InputReadOnly label={formText.fields.responsible} value={authUser?.username ?? '—'} />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Input
                  label={formText.fields.date}
                  value={field.value}
                  readOnly
                  onChange={() => undefined}
                />
              )}
            />

            <InputReadOnly label={formText.fields.farmOrigin} value={originFarmDescription} />

            <Skeleton loading={isLoadingHeader}>
              <Controller
                name="farm_out"
                control={control}
                render={({ field }) => (
                  <Field
                    label={formText.fields.farmDestination}
                    isRequired
                    errorText={errors.farm_out?.message as string | undefined}
                  >
                    <SelectCombobox
                      value={field.value}
                      onChange={field.onChange}
                      options={destinationFarmOptions}
                      isRequired
                      disabled={!canSave || isSaving}
                    />
                  </Field>
                )}
              />
            </Skeleton>
          </SimpleGrid>

          <Box mt={2}>
            <TransferEquipmentsFieldArray
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={!canSave || isSaving}
              itemsError={itemsError}
            />
          </Box>

          <Box mt={2}>
            <TransferAttachmentsFieldArray
              control={control}
              errors={errors}
              isDisabled={!canSave || isSaving}
            />
          </Box>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
