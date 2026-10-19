// src/pages/Administrativo/Adiantamento/FinancialBlock.tsx
// -----------------------------------------------------------------------------
// Painel "Gerar Financeiro" (`has_financial` + `financial.*`) do formulário
// de Adiantamento Salarial — TASK-FE-FINANCEIRO-adiant (97-Esteiras/034,
// D2-REV). Master toggle (static `Select` sim/não, FID-G3F §7.4) + (quando
// ligado) header financeiro (mirror `Financeiro/ContasAPagar/
// CreateOrUpdateExpense.tsx`) + `<FinancialInstallmentsFieldArray/>` +
// `<FinancialApportionmentFieldArray/>`.
//
// Mesma casca visual dos demais painéis de
// `CreateOrUpdateAdiantamento.tsx` (`Box bg="bg.muted" border ...
// borderRadius="lg"`) — Passo UX / UX-GAP seguir-pelo-padrão (FID-G3F §1).
//
// GAP-ADV-02 (CONFIRMADO no código real, `AdvanceResource::toArray()`,
// 2026-08-16) — o header financeiro (type_uuid/provider/proprietary/
// number/note/fiscal_document) É reidratado no EDIT (a `AdvanceResource`
// ecoa esse bloco); as 3 "picked options" do header (`financialTypeOption`/
// `financialProviderOption`/`financialProprietaryOption`) chegam já
// populadas de `CreateOrUpdateAdiantamento.tsx` quando aplicável. SÓ
// `has_input`/`input_date`/`input_value` ficam neutros no EDIT (nunca
// persistidos — write-only, gerador da criação; ver
// `advance-financial-hydrate.ts`) — sem aviso, isso NUNCA foi um gap.
// -----------------------------------------------------------------------------

import type { Dispatch, SetStateAction } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listProviders } from '@/services/v2/CadastrosBase/Provider/provider-service';

import type { Option } from '@/@types/option';
import type { AdvanceForm } from '@/@types/v2/Advances';
import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';

import { FinancialApportionmentFieldArray } from './FinancialApportionmentFieldArray';
import { FinancialInstallmentsFieldArray } from './FinancialInstallmentsFieldArray';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface FinancialBlockProps {
  control: Control<AdvanceForm>;
  errors: FieldErrors<AdvanceForm>;
  watch: UseFormWatch<AdvanceForm>;
  setValue: UseFormSetValue<AdvanceForm>;
  isLoading: boolean;
  canSave: boolean;
  financialTypeOption: Option | null;
  setFinancialTypeOption: Dispatch<SetStateAction<Option | null>>;
  financialProviderOption: Option | null;
  setFinancialProviderOption: Dispatch<SetStateAction<Option | null>>;
  financialProprietaryOption: Option | null;
  setFinancialProprietaryOption: Dispatch<SetStateAction<Option | null>>;
  pickedCategoryOptions: Record<string, Option>;
  setPickedCategoryOptions: Dispatch<SetStateAction<Record<string, Option>>>;
  pickedCenterOptions: Record<string, Option>;
  setPickedCenterOptions: Dispatch<SetStateAction<Record<string, Option>>>;
}

const getYesNoOptions = (languageGB: ReturnType<typeof useLanguage>['languageGB']) => [
  { label: languageGB.defaltStrings.yes, value: true },
  { label: languageGB.defaltStrings.no, value: false },
];

const getYesNoStringOptions = (languageGB: ReturnType<typeof useLanguage>['languageGB']) => [
  { label: languageGB.defaltStrings.yes, value: '1' as const },
  { label: languageGB.defaltStrings.no, value: '0' as const },
];

export function FinancialBlock({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  financialTypeOption,
  setFinancialTypeOption,
  financialProviderOption,
  setFinancialProviderOption,
  financialProprietaryOption,
  setFinancialProprietaryOption,
  pickedCategoryOptions,
  setPickedCategoryOptions,
  pickedCenterOptions,
  setPickedCenterOptions,
}: FinancialBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.advances.advance.form;

  const isDisabled = !canSave || isLoading;
  const hasFinancial = !!watch('has_financial');
  const hasInput = !!watch('financial.has_input');

  return (
    <Box
      mt={6}
      bg="bg.muted"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="lg"
      p={4}
    >
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {text.sections.financial}
      </Text>

      <Box maxW={{ base: 'full', md: '260px' }} mb={hasFinancial ? 6 : 0}>
        <Controller
          name="has_financial"
          control={control}
          render={({ field }) => (
            <Select
              label={text.fields.hasFinancial}
              name={field.name}
              options={getYesNoOptions(languageGB)}
              value={
                getYesNoOptions(languageGB).find((option) => option.value === field.value) ?? null
              }
              onChange={(option: Option<boolean> | null) => field.onChange(!!option?.value)}
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />
      </Box>

      {hasFinancial && (
        <>
          {/* ---- Header financeiro (mirror CreateOrUpdateExpense) — no EDIT
              reidrata completo (GAP-ADV-02), sem aviso de bloqueio. ---- */}
          <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
            <Controller
              name="financial.type_uuid"
              control={control}
              render={({ field, fieldState }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.financialType}
                  service={listTypeTitleOptions}
                  mapOptions={(item: TypeTitleOptionItem) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true' as const,
                  })}
                  value={financialTypeOption ?? undefined}
                  onChange={(option: any) => {
                    setFinancialTypeOption(option ?? null);
                    field.onChange(option?.value ?? '');
                  }}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="financial.provider_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.provider}
                  service={listProviders}
                  mapOptions={(item: { uuid: string; name: string }) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={financialProviderOption ?? undefined}
                  onChange={(option: any) => {
                    setFinancialProviderOption(option ?? null);
                    field.onChange(option?.value ?? null);
                  }}
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="financial.proprietary_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.proprietary}
                  service={listProprietaries}
                  mapOptions={(item: { uuid: string; name: string }) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={financialProprietaryOption ?? undefined}
                  onChange={(option: any) => {
                    setFinancialProprietaryOption(option ?? null);
                    field.onChange(option?.value ?? null);
                  }}
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="financial.number"
              control={control}
              render={({ field, fieldState }) => (
                <Input
                  label={text.fields.number}
                  maxLength={15}
                  {...field}
                  value={field.value ?? ''}
                  error={fieldState.error?.message}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="financial.fiscal_document"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label={text.fields.fiscalDocument}
                  name={field.name}
                  options={getYesNoStringOptions(languageGB)}
                  value={
                    getYesNoStringOptions(languageGB).find(
                      (option) => option.value === field.value
                    ) ?? null
                  }
                  onChange={(option: Option<'0' | '1'> | null) =>
                    field.onChange(option?.value ?? '1')
                  }
                  error={fieldState.error?.message}
                  isRequired
                  noClearable
                  isDisabled={isDisabled}
                />
              )}
            />

            <Controller
              name="financial.has_input"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.hasInput}
                  name={field.name}
                  options={getYesNoOptions(languageGB)}
                  value={
                    getYesNoOptions(languageGB).find((option) => option.value === field.value) ??
                    null
                  }
                  onChange={(option: Option<boolean> | null) => field.onChange(!!option?.value)}
                  noClearable
                  isDisabled={isDisabled}
                />
              )}
            />

            {hasInput && (
              <>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    {text.fields.inputDate}
                  </Text>
                  <Controller
                    name="financial.input_date"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
                    )}
                  />
                </Box>

                <Controller
                  name="financial.input_value"
                  control={control}
                  render={({ field, fieldState }) => (
                    <MoneyInput
                      name={field.name}
                      label={text.fields.inputValue}
                      value={field.value ?? null}
                      onValueChange={(value) => field.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </>
            )}
          </SimpleGrid>

          <Box mb={6}>
            <Controller
              name="financial.note"
              control={control}
              render={({ field, fieldState }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  label={text.fields.note}
                  maxLength={1000}
                  error={fieldState.error?.message}
                  disabled={isDisabled}
                />
              )}
            />
          </Box>

          {/* ---- Sub-card "Parcelas Financeiras" ---- */}
          <Box
            bg="bg.panel"
            border="1px solid"
            borderColor="border.subtle"
            borderRadius="lg"
            p={4}
            mb={6}
          >
            <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={4}>
              {text.sections.financialInstallments}
            </Text>
            <FinancialInstallmentsFieldArray
              control={control}
              errors={errors}
              watch={watch}
              isLoading={isLoading}
              canSave={canSave}
            />
          </Box>

          {/* ---- Sub-card "Rateio por Categoria" ---- */}
          <Box bg="bg.panel" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
            <Text fontSize="sm" fontWeight="semibold" color="fg.muted" mb={4}>
              {text.sections.apportionment}
            </Text>
            <FinancialApportionmentFieldArray
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={isLoading}
              canSave={canSave}
              pickedCategoryOptions={pickedCategoryOptions}
              setPickedCategoryOptions={setPickedCategoryOptions}
              pickedCenterOptions={pickedCenterOptions}
              setPickedCenterOptions={setPickedCenterOptions}
            />
          </Box>
        </>
      )}
    </Box>
  );
}
