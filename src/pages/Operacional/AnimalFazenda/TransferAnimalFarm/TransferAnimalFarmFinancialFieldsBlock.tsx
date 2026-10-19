// src/pages/Operacional/AnimalFazenda/TransferAnimalFarm/TransferAnimalFarmFinancialFieldsBlock.tsx
// -----------------------------------------------------------------------------
// Bloco financeiro COMPLETO (cabeçalho `vl_total`/`fiscal_document`/
// `proprietary_uuid` + parcelas + rateio entrada/saída) da Transferência de
// Animal entre Fazendas — construído AQUI (TASK-FE-042-104) para ser
// IMPORTÁVEL por 2 telas, pensado nos 2 consumidores desde o início (mirror
// funcional LITERAL de `TransferBatchFarmFinancialFieldsBlock.tsx`, Lote/
// Fazenda, 97-Esteiras/041):
//   1. `CreateOrUpdateTransferAnimalFarm.tsx` (esta Tarefa) — `namePrefix`
//      `'financial.'`, campos embutidos em `TransferAnimalFarmForm.financial`
//      (payload atômico `generate_financial`+`financial` no MESMO `POST`).
//   2. `TransferAnimalFarmFinancial.tsx` (TASK-105, tela financeira dedicada)
//      — `namePrefix` omitido (`''`).
//
// NUNCA duplicar este JSX/regra nas 2 telas — só importar. Reusa
// `InstallmentsBlock`/`AllocationBlock` de
// `TransferAnimalFarmFinancialFields.tsx` (já `namePrefix`-aware).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayRemove,
  UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { boolean as booleanOptions } from '@/constants/options/boolean';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProprietaryOption } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type {
  CreateTransferAnimalFarmFinancialRequest,
  TransferAnimalFarmCategoryRowForm,
  TransferAnimalFarmFinancialForm,
  TransferAnimalFarmInstallmentRowForm,
} from '@/@types/v2/Operacional/AnimalFazenda/transferAnimalFarm';

import { AllocationBlock, InstallmentsBlock } from './TransferAnimalFarmFinancialFields';

interface ListProprietaryOptionsPaginatedParams extends PaginationQueryParams {
  search?: string;
}

async function listProprietaryOptionsPaginated(params: ListProprietaryOptionsPaginatedParams) {
  const items = await listProprietaryOptions(params.search);
  return {
    success: true,
    message: '',
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

function mapProprietaryOption(item: ProprietaryOption): Option<string> {
  return { label: item.label, value: item.uuid };
}

// Mapeamento de payload de rede (`CreateTransferAnimalFarmFinancialRequest`)
// — reusado por AMBAS as telas (financeira dedicada via
// `saveTransferAnimalFarmFinancial` E o `create` embutido via
// `createTransferAnimalFarm`, item `financial` do payload atômico).
export function mapTransferAnimalFarmFinancialPayload(
  data: TransferAnimalFarmFinancialForm
): CreateTransferAnimalFarmFinancialRequest {
  return {
    vl_total: Number(data.vl_total) || 0,
    fiscal_document: data.fiscal_document?.value ?? false,
    proprietary_uuid: data.proprietary_uuid?.value ?? undefined,
    // DIV-08 (063-est03-9-reprovacoes) — diferente da irmã Lote/Fazenda
    // (front-only lá), AQUI os 3 campos VÃO ao payload — a API paralela
    // (TASK-API-063-03) valida e persiste `has_input`/`input_date`/`input_value`.
    has_input: data.has_input?.value ?? false,
    input_date: data.has_input?.value === true ? (data.input_date as string) : undefined,
    input_value: data.has_input?.value === true ? Number(data.input_value) || 0 : undefined,
    installments: data.installments.map((row) => ({
      due_date: row.due_date as string,
      value: Number(row.value) || 0,
    })),
    income_categories: data.income_categories.map((row) => ({
      category_uuid: row.category_uuid!.value,
      center_uuid: row.center_uuid!.value,
      value: Number(row.value) || 0,
    })),
    expense_categories: data.expense_categories.map((row) => ({
      category_uuid: row.category_uuid!.value,
      center_uuid: row.center_uuid!.value,
      value: Number(row.value) || 0,
    })),
  };
}

interface InstallmentsArrayLike {
  fields: { id: string }[];
  replace: (rows: TransferAnimalFarmInstallmentRowForm[]) => void;
}

interface CategoriesArrayLike {
  fields: FieldArrayWithId<any, string, 'id'>[];
  append: (row: TransferAnimalFarmCategoryRowForm) => void;
  remove: UseFieldArrayRemove;
}

export interface TransferAnimalFarmFinancialFieldsBlockProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  languageGB: LanguageDate;
  isDisabled: boolean;
  setValue: UseFormSetValue<any>;
  /** '' (default) = paths TOP-LEVEL da tela financeira dedicada; 'financial.' = uso aninhado no `create` (TASK-104). */
  namePrefix?: string;
  installmentsArray: InstallmentsArrayLike;
  incomeArray: CategoriesArrayLike;
  expenseArray: CategoriesArrayLike;
}

/**
 * Bloco financeiro completo — cabeçalho (`vl_total`/`fiscal_document`/
 * `proprietary_uuid`) + parcelas + rateio duplo (entrada/saída). Paths
 * `namePrefix`-aware para reuso pelos 2 consumidores (`create` embutido e
 * tela financeira dedicada).
 * @param {TransferAnimalFarmFinancialFieldsBlockProps} props - Props do bloco (control/errors/arrays/namePrefix).
 * @return {JSX.Element} Cabeçalho financeiro + parcelas + rateio duplo.
 */
export function TransferAnimalFarmFinancialFieldsBlock({
  control,
  errors,
  languageGB,
  isDisabled,
  setValue,
  namePrefix = '',
  installmentsArray,
  incomeArray,
  expenseArray,
}: TransferAnimalFarmFinancialFieldsBlockProps) {
  const financialText = languageGB.animalFazenda.transferAnimalFarm.form.fields.financial;
  const vlTotal = Number(useWatch({ control, name: `${namePrefix}vl_total` as any })) || 0;

  // DIV-08 (063-est03-9-reprovacoes) — "Possui entrada?" repassado ao
  // `InstallmentsBlock` para o cálculo de parcelas (`vl_total - entrada`),
  // MESMO padrão de `vlTotal` (mirror `calcInstallments()` legado).
  const hasInputOption = useWatch({ control, name: `${namePrefix}has_input` as any }) as
    { value?: boolean } | null | undefined;
  const hasInput = hasInputOption?.value === true;
  const inputValue = Number(useWatch({ control, name: `${namePrefix}input_value` as any })) || 0;

  return (
    <>
      <Box
        bg="bg.muted"
        border="1px solid"
        borderColor="border.subtle"
        borderRadius="lg"
        p={4}
        mb={6}
      >
        <Text fontSize="sm" fontWeight="semibold" mb={4}>
          {financialText.sectionTitle}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <Controller
            name={`${namePrefix}vl_total` as any}
            control={control}
            render={({ field, fieldState }) => (
              <MoneyInput
                name={field.name}
                label={financialText.vlTotal}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={fieldState.error?.message}
                isRequired
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name={`${namePrefix}fiscal_document` as any}
            control={control}
            render={({ field, fieldState }) => (
              <Select
                name={field.name}
                label={financialText.fiscalDocument}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                // DIV-04 (063-est03-9-reprovacoes) — ordem Não-primeiro,
                // variante ADITIVA (nunca inverter o catálogo global `options()`).
                options={booleanOptions.optionsReversed(languageGB)}
                error={fieldState.error?.message}
                isRequired
                isDisabled={isDisabled}
              />
            )}
          />

          <Controller
            name={`${namePrefix}proprietary_uuid` as any}
            control={control}
            render={({ field, fieldState }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={financialText.proprietary}
                service={listProprietaryOptionsPaginated}
                mapOptions={mapProprietaryOption}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={fieldState.error?.message}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          {/* DIV-08 (063-est03-9-reprovacoes) — bloco "Possui entrada?"
              restaurado, mirror `CreateOrUpdateTransferBatchFarm.tsx`/
              `transfer_form.blade.php:17-27`. */}
          <Controller
            name={`${namePrefix}has_input` as any}
            control={control}
            render={({ field, fieldState }) => (
              <Select
                name={field.name}
                label={financialText.hasInput}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                options={booleanOptions.options(languageGB)}
                error={fieldState.error?.message}
                isDisabled={isDisabled}
              />
            )}
          />

          <Controller
            name={`${namePrefix}input_date` as any}
            control={control}
            render={({ field, fieldState }) => (
              <DateInput
                label={financialText.inputDate}
                value={field.value ?? null}
                onChange={field.onChange}
                error={fieldState.error?.message}
                isRequired={hasInput}
                disabled={isDisabled}
              />
            )}
          />

          <Controller
            name={`${namePrefix}input_value` as any}
            control={control}
            render={({ field, fieldState }) => (
              <MoneyInput
                name={field.name}
                label={financialText.inputValue}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={fieldState.error?.message}
                isRequired={hasInput}
                disabled={isDisabled}
              />
            )}
          />
        </SimpleGrid>
      </Box>

      <Box mb={6}>
        <InstallmentsBlock
          control={control}
          fields={installmentsArray.fields}
          replace={installmentsArray.replace}
          vlTotal={vlTotal}
          hasInput={hasInput}
          inputValue={inputValue}
          errors={errors}
          languageGB={languageGB}
          disabled={isDisabled}
          namePrefix={namePrefix}
        />
      </Box>

      <Box mb={6}>
        <AllocationBlock
          sectionTitle={financialText.incomeSectionTitle}
          control={control}
          name={`${namePrefix}income_categories`}
          fields={incomeArray.fields}
          append={incomeArray.append}
          remove={incomeArray.remove}
          setValue={setValue}
          vlTotal={vlTotal}
          kind="income"
          errors={errors}
          languageGB={languageGB}
          disabled={isDisabled}
        />
      </Box>

      <Box mb={6}>
        <AllocationBlock
          sectionTitle={financialText.expenseSectionTitle}
          control={control}
          name={`${namePrefix}expense_categories`}
          fields={expenseArray.fields}
          append={expenseArray.append}
          remove={expenseArray.remove}
          setValue={setValue}
          vlTotal={vlTotal}
          kind="expense"
          errors={errors}
          languageGB={languageGB}
          disabled={isDisabled}
        />
      </Box>
    </>
  );
}
