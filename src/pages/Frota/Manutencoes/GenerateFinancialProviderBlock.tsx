// src/pages/Frota/Manutencoes/GenerateFinancialProviderBlock.tsx
// -----------------------------------------------------------------------------
// 1 bloco por fornecedor — Tarefa 45 (mirror `MaintenanceItemRow.tsx`/
// `StockItemRow`, componente PRÓPRIO por bloco). Campos mirror
// `GenerateMaintenanceFinancialProviderData` do backend: `number`
// (número do título, texto), `type_title_uuid` (catálogo já existente de
// Contas a Pagar), `proprietary_uuid` (idem), `fiscal_document` (checkbox),
// `total` (referência do rateio, pré-preenchido pela soma de
// `total_amount` dos itens daquele fornecedor — melhoria opcional aplicada,
// permanece editável).
//
// `provider_uuid` é FIXO (vem da Manutenção) — exibido como
// `InputReadOnly`, nunca um Select editável (DoD explícito da Tarefa).
// -----------------------------------------------------------------------------

import { Box, Checkbox, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listTypeTitleOptions } from '@/services/v2/BaseRegistrations/typeTitles-service';
import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { TypeTitleOptionItem } from '@/@types/v2/BaseRegistrations/typeTitles';
import type { ProprietaryListItem } from '@/@types/v2/CadastrosBase/proprietary';
import type { GenerateFinancialForm } from '@/@types/v2/Maintenances';

import { GenerateFinancialApportionmentFieldArray } from './GenerateFinancialApportionmentFieldArray';
import { GenerateFinancialInstallmentsFieldArray } from './GenerateFinancialInstallmentsFieldArray';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface GenerateFinancialProviderBlockProps {
  index: number;
  control: Control<GenerateFinancialForm>;
  errors: FieldErrors<GenerateFinancialForm>;
  watch: UseFormWatch<GenerateFinancialForm>;
  setValue: UseFormSetValue<GenerateFinancialForm>;
  installmentsError?: string | null;
  isDisabled: boolean;
}

export function GenerateFinancialProviderBlock({
  index,
  control,
  errors,
  watch,
  setValue,
  installmentsError,
  isDisabled,
}: GenerateFinancialProviderBlockProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.maintenances.maintenance.generateFinancial.providerBlock;

  const providerLabel = watch(`providers.${index}.provider_label`);
  const rowErrors = errors.providers?.[index];

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <Text fontSize="md" fontWeight="semibold" color="fg.default" mb={4}>
        {providerLabel}
      </Text>

      <SimpleGrid columns={columnsForm.default} gap={4} mb={4}>
        <InputReadOnly label={text.fields.provider} value={providerLabel ?? '—'} />

        <Controller
          name={`providers.${index}.number`}
          control={control}
          render={({ field }) => (
            <Input
              name={field.name}
              label={text.fields.number}
              placeholder={text.placeholders.number}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              error={rowErrors?.number?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`providers.${index}.type_title_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.typeTitle}
              placeholder={text.placeholders.typeTitle}
              service={listTypeTitleOptions}
              mapOptions={(item: TypeTitleOptionItem) => ({
                label: item.description,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
                is_enabled: 'true' as const,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`providers.${index}.proprietary_uuid`}
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.fields.proprietary}
              placeholder={text.placeholders.proprietary}
              service={listProprietaries}
              mapOptions={(item: ProprietaryListItem) => ({ label: item.name, value: item.uuid })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value ?? undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name={`providers.${index}.total`}
          control={control}
          render={({ field }) => (
            <MoneyInput
              name={field.name}
              label={text.fields.total}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`providers.${index}.fiscal_document`}
          control={control}
          render={({ field }) => (
            <Checkbox.Root
              checked={!!field.value}
              onCheckedChange={({ checked }: { checked: boolean }) => field.onChange(checked)}
              disabled={isDisabled}
              mt={6}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{text.fields.fiscalDocument}</Checkbox.Label>
            </Checkbox.Root>
          )}
        />

        <Controller
          name={`providers.${index}.note`}
          control={control}
          render={({ field }) => (
            <Textarea
              name={field.name}
              label={text.fields.note}
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={isDisabled}
            />
          )}
        />
      </SimpleGrid>

      <GenerateFinancialApportionmentFieldArray
        providerIndex={index}
        control={control}
        watch={watch}
        isDisabled={isDisabled}
      />

      <GenerateFinancialInstallmentsFieldArray
        providerIndex={index}
        control={control}
        watch={watch}
        setValue={setValue}
        error={installmentsError}
        isDisabled={isDisabled}
      />
    </Box>
  );
}
