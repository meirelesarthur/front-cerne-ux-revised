// src/pages/Operacional/PesagemRodoviaria/dialogs/EquipmentDialog.tsx
// -----------------------------------------------------------------------------
// Diálogo de sub-cadastro Equipamento/Veículo (FE-DLG-EQUIPMENT,
// TASK-MWG-FE-10) — 10 campos (`description`/`family_equipment_id`/
// `equipment_type`/`year_mod`/`brand`/`plate`/`uf`/`color`/`model`, plugado
// no select `equipment_uuid` de `CreateOrUpdateModuleWeighing.tsx`.
//
// `Equipment` (Inventário/Bens-Ativos, execução 026) é uma entidade MAIOR
// (57 colunas físicas — financeiro/depreciação/fiscal-veículo/rateio/
// anexos) — este diálogo expõe SÓ o subconjunto relevante ao contexto de
// veículo de pesagem; os demais campos obrigatórios do `EquipmentPayload`
// (valores financeiros/depreciação) recebem DEFAULTS neutros (mirror
// `hideIsEnabled` de `ClientFormModal` — omitir campo fora de contexto sem
// mudar o contrato de API), documentados abaixo.
//
// GATED-MOUNT (mesmo padrão de `WarehouseDialog.tsx`/`ProviderFormModal.tsx`)
// — quem tem o controller (`EquipmentDialogBody`) é quem renderiza o próprio
// `CustomDialog` com `footer={...}` — footer no SLOT real, header/footer
// fixos, só o body rola, SEM sticky/margem-negativa (que geravam faixa
// morta abaixo do footer).
// -----------------------------------------------------------------------------

import { useMemo } from 'react';

import { Box, Heading, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';
import { formatPlateIfValid } from '@/utils/masks/plate';

import { ufOptions } from '@/constants/BaseRegistrations/options/uf-options';
import {
  type EquipmentOwnerTp,
  equipmentBodyTypeOptions,
  equipmentOwnerTpOptions,
  equipmentVehicleTypeOptions,
  equipmentWheelTypeOptions,
} from '@/constants/cadastrosBase/equipment/equipment-fiscal-catalogs';
import { queryKey } from '@/constants/query-key';

import { equipmentDialogSchemaResolver } from '@/validations/schemas/ModuleWeighing/equipment-dialog-schema';

import { listFamilyEquipmentOptions } from '@/services/v2/BaseRegistrations/familyEquipment-service';
import {
  createEquipment,
  getEquipment,
  updateEquipment,
} from '@/services/v2/Equipments/equipment-service';

import type { Option } from '@/@types/option';
import type { FamilyEquipmentOption } from '@/@types/v2/BaseRegistrations/familyEquipment';
import type { EquipmentData, EquipmentPayload } from '@/@types/v2/Equipments';

export interface EquipmentDialogSavedPayload {
  uuid: string;
  label: string;
}

export interface EquipmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** uuid do Equipamento/Veículo para EDITAR; `undefined`/vazio = modo CRIAR. */
  equipmentUuid?: string;
  onSaved: (equipment: EquipmentDialogSavedPayload) => void;
}

export function EquipmentDialog({ isOpen, onClose, equipmentUuid, onSaved }: EquipmentDialogProps) {
  const { languageGB } = useLanguage();
  const isEditing = isOpen && isValidGuid(equipmentUuid);

  const equipmentQuery = useQuery({
    queryKey: [queryKey.equipments.equipment, 'weighing-dialog-detail', equipmentUuid],
    queryFn: async () => (await getEquipment(equipmentUuid!)).data,
    enabled: isEditing,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const title = languageGB.equipments.equipment.singularLabel;

  // Loading de EDIÇÃO: shell SEM controller ainda (os `defaultValues` do
  // `useForm` são síncronos no 1º mount — gated). Footer só "Cancelar" (o
  // "Salvar" depende do form, que só nasce com o dado pronto).
  if (isOpen && isEditing && equipmentQuery.isPending) {
    return (
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="lg"
        footer={
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
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
    <EquipmentDialogBody
      key={equipmentUuid ?? 'new'}
      isOpen={isOpen}
      title={title}
      initialData={equipmentQuery.data}
      isEditing={!!isEditing}
      equipmentUuid={equipmentUuid}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function mapEquipmentDataToPayload(data: EquipmentData): EquipmentPayload {
  return {
    family_equipment_uuid: data.family.uuid,
    description: data.description,
    specification: data.specification,
    model: data.model,
    patrimony: data.patrimony,
    product_uuid: data.product?.uuid ?? null,
    vl_time_productive: Number(data.vl_time_productive ?? 0),
    vl_time_unproductive: Number(data.vl_time_unproductive ?? 0),
    provider_uuid: data.provider?.uuid ?? null,
    dt_acquisition: data.dt_acquisition,
    vl_acquisition: Number(data.vl_acquisition ?? 0),
    status: Number(data.status),
    hour_meter: data.hour_meter,
    year_mod: data.year_mod ?? '',
    has_depreciation: !!data.has_depreciation,
    life_bens: data.life_bens,
    depreciation_type: data.depreciation_type,
    residual: data.residual,
    vl_residual: Number(data.vl_residual ?? 0),
    vl_depreciate: Number(data.vl_depreciate ?? 0),
    depreciation: data.depreciation,
    use_fiscal: !!data.use_fiscal,
    chassi: data.chassi,
    renavam: data.renavam,
    serie: data.serie,
    plate: data.plate,
    color: data.color,
    uf: data.uf,
    brand: data.brand,
    rntrc: data.rntrc,
    type: data.type,
    body_type: data.body_type,
    wheel_type: data.wheel_type,
    tara: data.tara,
    capacity: data.capacity,
    owner_type: data.owner_type,
    owner_document: data.owner_document,
    owner_name: data.owner_name,
    owner_ie: data.owner_ie,
    owner_uf: data.owner_uf,
    owner_tp: data.owner_tp,
    equipment_type: data.equipment_type ?? 'P',
    features: data.features ?? [],
    cost_centers: (data.cost_centers ?? []).map((row) => ({
      cost_center_uuid: row.uuid,
      percentage: Number(row.percentage ?? 0),
    })),
    attachments: (data.attachments ?? []).map((row) => ({
      uuid: row.uuid,
      name: row.name,
      file: null,
    })),
  };
}

interface EquipmentFormValues {
  familyEquipment: Option<string> | null;
  description: string;
  equipmentType: Option<string> | null;
  yearMod: string | null;
  brand: string | null;
  plate: string | null;
  uf: Option<string> | null;
  color: string | null;
  model: string | null;
  useFiscal: boolean;
  bodyType: string | null;
  wheelType: string | null;
  tara: number | null;
  capacity: number | null;
  ownerType: 'f' | 'j' | null;
  ownerDocument: string | null;
  ownerName: string | null;
  ownerIe: string | null;
  ownerUf: string | null;
  ownerTp: EquipmentOwnerTp | null;
}

interface EquipmentDialogBodyProps {
  isOpen: boolean;
  title: string;
  initialData?: EquipmentData;
  isEditing: boolean;
  equipmentUuid?: string;
  onClose: () => void;
  onSaved: (equipment: EquipmentDialogSavedPayload) => void;
}

// Componente com o form (gated por `key`): renderiza o próprio CustomDialog
// para que o footer (Cancelar/Salvar) vá para o SLOT `footer` real do
// dialog — header/footer fixos, só o body rola, SEM footer-in-body sticky
// (que deixava faixa morta abaixo do footer).
function EquipmentDialogBody({
  isOpen,
  title,
  initialData,
  isEditing,
  equipmentUuid,
  onClose,
  onSaved,
}: EquipmentDialogBodyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipments.equipment.form.fields;

  const vehicleTypeOptions = useMemo(
    () => equipmentVehicleTypeOptions.options(languageGB) as Option<string>[],
    [languageGB]
  );

  const bodyTypeOptions = useMemo(() => equipmentBodyTypeOptions.options(languageGB), [languageGB]);
  const wheelTypeOptions = useMemo(
    () => equipmentWheelTypeOptions.options(languageGB),
    [languageGB]
  );
  const ownerTpOptions = useMemo(() => equipmentOwnerTpOptions.options(languageGB), [languageGB]);
  const useFiscalOptions: Option<boolean>[] = [
    { value: true, label: text.useFiscalYes },
    { value: false, label: text.useFiscalNo },
  ];
  const ownerTypeOptions: Option<'f' | 'j'>[] = [
    { value: 'f', label: text.ownerTypePhysical },
    { value: 'j', label: text.ownerTypeLegal },
  ];

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormValues>({
    mode: 'onChange',
    resolver: equipmentDialogSchemaResolver(languageGB),
    defaultValues: {
      familyEquipment: initialData?.family
        ? { value: initialData.family.uuid, label: initialData.family.description }
        : null,
      description: initialData?.description ?? '',
      equipmentType: initialData?.type
        ? (vehicleTypeOptions.find((option) => option.value === initialData.type) ?? {
            value: initialData.type,
            label: initialData.type,
          })
        : null,
      yearMod: initialData?.year_mod ?? null,
      brand: initialData?.brand ?? null,
      // UT-000787: placa válida sem hífen vira ABC-1234; legado fora do padrão intacto.
      plate: initialData?.plate ? formatPlateIfValid(initialData.plate) : null,
      uf: initialData?.uf
        ? (ufOptions.find((option) => option.value === initialData.uf) ?? {
            value: initialData.uf,
            label: initialData.uf,
          })
        : null,
      color: initialData?.color ?? null,
      model: initialData?.model ?? null,
      useFiscal: initialData ? !!initialData.use_fiscal : true,
      bodyType: initialData?.body_type ?? null,
      wheelType: initialData?.wheel_type ?? null,
      tara: initialData?.tara ?? null,
      capacity: initialData?.capacity ?? null,
      ownerType: initialData?.owner_type ?? null,
      ownerDocument: initialData?.owner_document ?? null,
      ownerName: initialData?.owner_name ?? null,
      ownerIe: initialData?.owner_ie ?? null,
      ownerUf: initialData?.owner_uf ?? null,
      ownerTp: initialData?.owner_tp ?? null,
    },
  });

  const useFiscalValue = useWatch({ control, name: 'useFiscal' });

  const equipmentMutation = useRequest({
    asyncFunction: tryPersistEquipment,
    entityName: languageGB.equipments.equipment.singularLabel,
    queryKey: queryKey.equipments.equipmentsList,
    queryKey2: queryKey.equipments.equipment,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      onSaved({ uuid: data.uuid, label: `${data.code} — ${data.description}` });
      onClose();
    },
  });

  async function tryPersistEquipment(data: EquipmentFormValues) {
    const modalFields = {
      family_equipment_uuid: data.familyEquipment?.value ?? '',
      description: data.description.trim(),
      model: data.model?.trim() || null,
      year_mod: data.yearMod?.trim() ?? '',
      plate: data.plate?.trim() || null,
      color: data.color?.trim() || null,
      uf: data.uf?.value ?? null,
      brand: data.brand?.trim() || null,
      type: data.equipmentType?.value ?? null,
      use_fiscal: data.useFiscal,
      body_type: data.useFiscal ? data.bodyType : null,
      wheel_type: data.useFiscal ? data.wheelType : null,
      tara: data.useFiscal ? data.tara : null,
      capacity: data.useFiscal ? data.capacity : null,
      owner_type: data.useFiscal ? data.ownerType : null,
      owner_document: data.useFiscal ? data.ownerDocument?.trim() || null : null,
      owner_name: data.useFiscal ? data.ownerName?.trim() || null : null,
      owner_ie: data.useFiscal ? data.ownerIe?.trim() || null : null,
      owner_uf: data.useFiscal ? data.ownerUf : null,
      owner_tp: data.useFiscal ? data.ownerTp : null,
    };

    const payload: EquipmentPayload =
      isEditing && initialData
        ? { ...mapEquipmentDataToPayload(initialData), ...modalFields }
        : {
            ...modalFields,
            vl_time_productive: 0,
            vl_time_unproductive: 0,
            vl_acquisition: 0,
            status: 1,
            has_depreciation: false,
            depreciation_type: 0,
            vl_residual: 0,
            vl_depreciate: 0,
            equipment_type: 'P',
            features: [],
            cost_centers: [],
            attachments: [],
          };

    if (isEditing && equipmentUuid) {
      return await updateEquipment(equipmentUuid, payload);
    }
    return await createEquipment(payload);
  }

  async function onSubmit(data: EquipmentFormValues) {
    await equipmentMutation.mutateAsync(data);
  }

  const isSaving = isSubmitting || equipmentMutation.isPending;

  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
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
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Controller
            name="familyEquipment"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.family}
                isRequired
                disablePortal
                service={listFamilyEquipmentOptions}
                mapOptions={(item: FamilyEquipmentOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={errors.familyEquipment?.message}
              />
            )}
          />
          <Input
            label={text.description}
            isRequired
            error={errors.description?.message}
            {...register('description')}
          />
          <Input label={text.model} error={errors.model?.message} {...register('model')} />
          <Controller
            name="equipmentType"
            control={control}
            render={({ field }) => (
              <Select
                label={text.type}
                name={field.name}
                isRequired={!!useFiscalValue}
                disablePortal
                options={vehicleTypeOptions}
                value={field.value}
                onChange={(option) => field.onChange(option ?? null)}
                error={errors.equipmentType?.message}
              />
            )}
          />
          <Input
            label={text.yearMod}
            isRequired
            error={errors.yearMod?.message}
            {...register('yearMod')}
          />
          <Input label={text.brand} {...register('brand')} />
          {/* UT-000787 (D4): máscara/validação de placa só com "Usa Dados Fiscais". */}
          {useFiscalValue ? (
            <Controller
              name="plate"
              control={control}
              render={({ field, fieldState }) => (
                <MaskedInput
                  kind="plate"
                  label={text.plate}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
          ) : (
            <Input
              label={text.plate}
              maxLength={10}
              error={errors.plate?.message}
              {...register('plate')}
            />
          )}
          <Controller
            name="uf"
            control={control}
            render={({ field }) => (
              <Select
                label={text.uf}
                name={field.name}
                disablePortal
                options={ufOptions}
                value={field.value}
                onChange={(option) => field.onChange(option ?? null)}
                error={errors.uf?.message}
              />
            )}
          />
          <Input label={text.color} error={errors.color?.message} {...register('color')} />
        </SimpleGrid>

        <Box borderTopWidth="1px" borderColor="border.default" mt={6} pt={4}>
          <Heading size="sm" fontWeight="600" mb={4}>
            {languageGB.equipments.equipment.form.tabs.fiscalVehicle}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Controller
              name="useFiscal"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.useFiscal}
                  name={name}
                  disablePortal
                  noClearable
                  value={useFiscalOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option<boolean> | null) => {
                    const next = !!opt?.value;
                    onChange(next);
                    if (!next) {
                      (
                        [
                          'bodyType',
                          'wheelType',
                          'tara',
                          'capacity',
                          'ownerType',
                          'ownerDocument',
                          'ownerName',
                          'ownerIe',
                          'ownerUf',
                          'ownerTp',
                        ] as const
                      ).forEach((field) => setValue(field, null, { shouldDirty: true }));
                    }
                  }}
                  options={useFiscalOptions}
                />
              )}
            />
          </SimpleGrid>
          {useFiscalValue && (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
              <Controller
                name="bodyType"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.bodyType}
                    name={name}
                    isRequired
                    disablePortal
                    options={bodyTypeOptions}
                    value={bodyTypeOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    error={errors.bodyType?.message}
                  />
                )}
              />
              <Controller
                name="wheelType"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.wheelType}
                    name={name}
                    isRequired
                    disablePortal
                    options={wheelTypeOptions}
                    value={wheelTypeOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    error={errors.wheelType?.message}
                  />
                )}
              />
              <Controller
                name="tara"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={text.tara}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    min={0}
                    allowDot
                    decimalPlaces={2}
                    isRequired
                    error={errors.tara?.message}
                  />
                )}
              />
              <Controller
                name="capacity"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={text.capacity}
                    value={field.value ?? null}
                    onValueChange={(value) => field.onChange(value)}
                    min={0}
                    allowDot
                    decimalPlaces={2}
                    isRequired
                    error={errors.capacity?.message}
                  />
                )}
              />
              <Controller
                name="ownerType"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.ownerType}
                    name={name}
                    isRequired
                    disablePortal
                    options={ownerTypeOptions}
                    value={ownerTypeOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<'f' | 'j'> | null) => onChange(opt?.value ?? null)}
                    error={errors.ownerType?.message}
                  />
                )}
              />
              <Controller
                name="ownerDocument"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    kind="cpfCnpj"
                    label={text.ownerDocument}
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    isRequired
                    error={errors.ownerDocument?.message}
                  />
                )}
              />
              <Controller
                name="ownerName"
                control={control}
                render={({ field }) => (
                  <Input
                    label={text.ownerName}
                    name={field.name}
                    maxLength={100}
                    isRequired
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.ownerName?.message}
                  />
                )}
              />
              <Controller
                name="ownerIe"
                control={control}
                render={({ field }) => (
                  <Input
                    label={text.ownerIe}
                    name={field.name}
                    maxLength={12}
                    isRequired
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.ownerIe?.message}
                  />
                )}
              />
              <Controller
                name="ownerUf"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.ownerUf}
                    name={name}
                    isRequired
                    disablePortal
                    options={ufOptions}
                    value={ufOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<string> | null) => onChange(opt?.value ?? null)}
                    error={errors.ownerUf?.message}
                  />
                )}
              />
              <Controller
                name="ownerTp"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.ownerTp}
                    name={name}
                    isRequired
                    disablePortal
                    options={ownerTpOptions}
                    value={ownerTpOptions.find((option) => option.value === value) ?? null}
                    onChange={(opt: Option<EquipmentOwnerTp> | null) =>
                      onChange(opt?.value ?? null)
                    }
                    error={errors.ownerTp?.message}
                  />
                )}
              />
            </SimpleGrid>
          )}
        </Box>
      </Form>
    </CustomDialog>
  );
}

export default EquipmentDialog;
