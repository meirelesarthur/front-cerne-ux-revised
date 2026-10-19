// src/pages/CadastrosBase/Inventario/EquipamentoFinanceiroDepreciacaoTab.tsx
// -----------------------------------------------------------------------------
// Aba "Financeiro/Depreciação" do formulário de Inventário (Equipment) —
// TASK-FE-1006. Arquivo PRÓPRIO, contribui campos ao MESMO `useForm` raiz de
// `CreateOrUpdateEquipamento.tsx` (`TASK-FE-1005`, âncora), sem criar
// `useForm` local — mesmo mecanismo de paralelismo já usado em
// `Products`/`ProdutoEstoqueFinanceiroTab.tsx`.
//
// Contrato consumido: Equipment-Frontend-Contrato.md §6 (tabela "Aba
// Financeiro/Depreciação") + Equipment-Doc-Bruta.md §7 (RN-2/RN-3/RN-4).
//
// -- RN-2 (cálculo client-side, reativo) --------------------------------------
// `vl_residual`/`vl_depreciate` são readonly (calculados) — recalculados aqui
// via `useEffect` sobre `watch('vl_acquisition'|'residual'|'depreciation_type')`
// e escritos com `setValue(..., { shouldDirty: false })`: são campos que o
// usuário NUNCA edita diretamente, então não devem marcar o form como "sujo"
// (evita falso-positivo no guard `!isEmpty(dirtyFields)` do form-pai —
// `utils/isEmpty` está INVERTIDO, `true` quando HÁ chaves).
//   `vl_residual` = `vl_acquisition * residual/100` se `depreciation_type===
//   COM_RESIDUAL(1)`, senão `0`. `vl_depreciate` = `vl_acquisition -
//   vl_residual`, sempre.
//
// -- RN-3 (congelamento pós-1ª-depreciação) -----------------------------------
// `lockedByRn3 = (equipmentData?.depreciations_count ?? 0) > 0` — TODOS os
// campos desta aba ficam `disabled`/`isReadOnly` (exceto `vl_residual`/
// `vl_depreciate`, que já são somente-leitura por natureza, calculados). Vem
// do `GET /equipments/{uuid}` (campo `depreciations_count`, presente em
// `EquipmentData` — corrigido de forma aditiva na `TASK-FE-1005`).
//
// ⚠️ Os `name=` de `depreciation`/`life_bens`/`residual`/`depreciation_type`
// são os MESMOS que o autofill RN-6 (`CreateOrUpdateEquipamento.tsx`,
// `handleFamilyAutofill`) escreve via `setValue` do form raiz — não renomear,
// senão o autofill perde o alvo.
//
// `NumberInput` do fork (`@/components/Form/NumberInput`, máscara fill-da-
// direita) SEMPRE via `Controller` (nunca `register`) — mirror
// `CreateOrUpdateFamiliaBens.tsx` (`vl_time_productive`/`depreciation`/
// `residual`/`life_bens`, mesmos campos, mesma convenção).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { FamilyEquipmentDepreciationType } from '@/constants/FamilyEquipmentDepreciationType';

import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { Option } from '@/@types/option';
import type { ProviderListItem } from '@/@types/v2/CadastrosBase/provider';
import type { EquipmentData, EquipmentForm } from '@/@types/v2/Equipments';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface EquipamentoFinanceiroDepreciacaoTabProps {
  control: Control<EquipmentForm>;
  errors: FieldErrors<EquipmentForm>;
  watch: UseFormWatch<EquipmentForm>;
  setValue: UseFormSetValue<EquipmentForm>;
  isLoading: boolean;
  canSave: boolean;
  isEditing: boolean;
  equipmentData?: EquipmentData;
}

export function EquipamentoFinanceiroDepreciacaoTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  equipmentData,
}: EquipamentoFinanceiroDepreciacaoTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.equipments.equipment;
  const formText = text.form;

  // RN-3 — congelamento pós-1ª-depreciação. Vem do `GET` de detalhe
  // (`equipmentData`); em criação (`equipmentData` ainda undefined) nunca
  // está travado.
  const lockedByRn3 = (equipmentData?.depreciations_count ?? 0) > 0;
  const isDisabled = !canSave || isLoading || lockedByRn3;
  const frozenHint = lockedByRn3 ? formText.hints.frozenByDepreciation : undefined;

  const watchedHasDepreciation = watch('has_depreciation');
  const watchedDepreciationType = watch('depreciation_type');
  const watchedVlAcquisition = watch('vl_acquisition');
  const watchedResidual = watch('residual');

  // RN-2 — cálculo client-side reativo (nunca digitado pelo usuário,
  // `shouldDirty: false` evita falso-positivo no guard `isEmpty(dirtyFields)`
  // do form-pai).
  useEffect(() => {
    const vlAcquisition = Number(watchedVlAcquisition ?? 0);
    const residualPercent = Number(watchedResidual ?? 0);
    const isComResidual = watchedDepreciationType === FamilyEquipmentDepreciationType.COM_RESIDUAL;

    const vlResidual = isComResidual
      ? Number(((vlAcquisition * residualPercent) / 100).toFixed(2))
      : 0;
    const vlDepreciate = Number((vlAcquisition - vlResidual).toFixed(2));

    setValue('vl_residual', vlResidual, { shouldDirty: false });
    setValue('vl_depreciate', vlDepreciate, { shouldDirty: false });
  }, [watchedVlAcquisition, watchedResidual, watchedDepreciationType, setValue]);

  const hasDepreciationOptions: Option<boolean>[] = [
    { value: true, label: formText.fields.hasDepreciationYes },
    { value: false, label: formText.fields.hasDepreciationNo },
  ];

  const depreciationTypeOptions: Option<number>[] = [
    {
      value: FamilyEquipmentDepreciationType.SEM_RESIDUAL,
      label: formText.fields.depreciationTypeWithoutResidual,
    },
    {
      value: FamilyEquipmentDepreciationType.COM_RESIDUAL,
      label: formText.fields.depreciationTypeWithResidual,
    },
  ];

  const isComResidual = watchedDepreciationType === FamilyEquipmentDepreciationType.COM_RESIDUAL;

  return (
    <Box pt={4}>
      <SimpleGrid columns={columnsForm.default} gap={6}>
        <Controller
          name="vl_time_productive"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.vlTimeProductive}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              allowDot
              decimalPlaces={2}
              error={fieldState.error?.message}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="provider_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.provider}
              placeholder={formText.placeholders.provider}
              tooltip={frozenHint}
              service={listProviders}
              mapOptions={(item: ProviderListItem) => ({ label: item.name, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Box>
          <Box mb={1} fontSize="sm" fontWeight="medium">
            {formText.fields.dtAcquisition}
            {watchedHasDepreciation && (
              <Box as="span" color="fg.error">
                {' '}
                *
              </Box>
            )}
          </Box>
          <Controller
            name="dt_acquisition"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
            )}
          />
          {errors.dt_acquisition?.message && (
            <Box color="fg.error" fontSize="xs" mt={1}>
              {errors.dt_acquisition.message as string}
            </Box>
          )}
          {frozenHint && !errors.dt_acquisition?.message && (
            <Box color="fg.muted" fontSize="xs" mt={1}>
              {frozenHint}
            </Box>
          )}
        </Box>

        <Controller
          name="vl_acquisition"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.vlAcquisition}
              tooltip={frozenHint}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              allowDot
              decimalPlaces={2}
              error={fieldState.error?.message}
              isRequired
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
        <Controller
          name="hour_meter"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.hourMeter}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              decimalPlaces={0}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name="year_mod"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              label={formText.fields.yearMod}
              name={field.name}
              maxLength={10}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              error={fieldState.error?.message}
              isRequired
              loading={isLoading}
              disabled={!canSave || lockedByRn3}
            />
          )}
        />

        <Controller
          name="has_depreciation"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.hasDepreciation}
              name={name}
              tooltip={frozenHint}
              value={hasDepreciationOptions.find((option) => option.value === value) ?? null}
              onChange={(opt: Option<boolean> | null) => onChange(!!opt?.value)}
              options={hasDepreciationOptions}
              error={errors.has_depreciation?.message as string | undefined}
              isRequired
              noClearable
              isDisabled={isDisabled}
              loading={isLoading}
            />
          )}
        />

        <Controller
          name="life_bens"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.lifeBens}
              tooltip={frozenHint}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              min={1}
              decimalPlaces={0}
              error={fieldState.error?.message}
              isRequired={!!watchedHasDepreciation}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
        <Controller
          name="depreciation_type"
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={formText.fields.depreciationType}
              name={name}
              tooltip={frozenHint}
              value={depreciationTypeOptions.find((option) => option.value === value) ?? null}
              onChange={(opt: Option<number> | null) =>
                onChange(opt?.value ?? FamilyEquipmentDepreciationType.SEM_RESIDUAL)
              }
              options={depreciationTypeOptions}
              error={errors.depreciation_type?.message as string | undefined}
              isRequired
              noClearable
              isDisabled={isDisabled}
              loading={isLoading}
            />
          )}
        />

        <Controller
          name="residual"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.residual}
              tooltip={frozenHint}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              max={100}
              allowDot
              decimalPlaces={2}
              error={fieldState.error?.message}
              isRequired={isComResidual}
              disabled={isDisabled}
            />
          )}
        />

        {/* Calculados 100% client-side (RN-2) — sempre readonly,
            independente de `canSave`/RN-3 (não há estado "editável" para
            estes 2 campos). */}
        <Controller
          name="vl_residual"
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.vlResidual}
              value={field.value ?? 0}
              onValueChange={() => {}}
              allowDot
              decimalPlaces={2}
              disabled
              readOnly
            />
          )}
        />

        <Controller
          name="vl_depreciate"
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.vlDepreciate}
              value={field.value ?? 0}
              onValueChange={() => {}}
              allowDot
              decimalPlaces={2}
              disabled
              readOnly
            />
          )}
        />
      </SimpleGrid>

      <SimpleGrid columns={columnsForm.default} gap={6} mt={6}>
        <Controller
          name="depreciation"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              name={field.name}
              label={formText.fields.depreciation}
              tooltip={frozenHint}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              min={0}
              max={100}
              allowDot
              decimalPlaces={2}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>
    </Box>
  );
}
