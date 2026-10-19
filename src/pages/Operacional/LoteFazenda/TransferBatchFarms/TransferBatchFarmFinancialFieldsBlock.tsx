// src/pages/Operacional/LoteFazenda/TransferBatchFarms/TransferBatchFarmFinancialFieldsBlock.tsx
// -----------------------------------------------------------------------------
// Bloco financeiro COMPLETO (cabeçalho `vl_total`/`fiscal_document`/
// `proprietary_uuid` + parcelas + rateio entrada/saída) da Transferência de
// Lote entre Fazendas — extraído de `TransferBatchFarmFinancial.tsx` (SCR-FIN,
// TASK-FE-041-LF-02) para ser IMPORTÁVEL por 2 telas (TASK-FE-041-LF-06,
// 97-Esteiras/041, plano §6.5 item 3):
//   1. `TransferBatchFarmFinancial.tsx` (SCR-FIN standalone) — `namePrefix`
//      omitido (`''`), comportamento 100% IDÊNTICO ao anterior à extração.
//   2. `CreateOrUpdateTransferBatchFarm.tsx` (SCR-CREATE) — `namePrefix`
//      `'financial.'`, campos embutidos em `TransferBatchFarmForm.financial`
//      (payload atômico `generate_financial`+`financial` no MESMO `POST`,
//      TASK-BE-041-LF-06/commit `2d8bc411`).
//
// NUNCA duplicar este JSX/regra nas 2 telas — só importar. Reusa
// `InstallmentsBlock`/`AllocationBlock` de `TransferBatchFarmFinancialFields.tsx`
// (já `namePrefix`-aware, mesma Tarefa).
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
  CreateTransferBatchFarmFinancialRequest,
  TransferBatchFarmCategoryRowForm,
  TransferBatchFarmFinancialForm,
  TransferBatchFarmInstallmentRowForm,
} from '@/@types/v2/LoteFazenda/transferBatchFarm';

import { AllocationBlock, InstallmentsBlock } from './TransferBatchFarmFinancialFields';

interface ListProprietaryOptionsPaginatedParams extends PaginationQueryParams {
  search?: string;
}

async function listProprietaryOptionsPaginated(params: ListProprietaryOptionsPaginatedParams) {
  // Item 3 (reprovação AD F-022) — escopa o Proprietário pela fazenda ATIVA
  // (`scope: 'farm'`, já suportado end-to-end pela API); sem isso o default
  // `scope='tenant'` lista proprietários de todo o tenant.
  const items = await listProprietaryOptions(params.search, 'farm');
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

// Mapeamento de payload de rede (`CreateTransferBatchFarmFinancialRequest`) —
// extraído de `TransferBatchFarmFinancial.tsx::trySaveFinancial` (linhas
// 149-168 antes desta Tarefa), reusado por AMBAS as telas (SCR-FIN standalone
// via `saveTransferBatchFarmFinancial` E o `create` embutido via
// `createTransferBatchFarm`, item `financial` do payload atômico).
export function mapTransferBatchFarmFinancialPayload(
  data: TransferBatchFarmFinancialForm
): CreateTransferBatchFarmFinancialRequest {
  return {
    vl_total: Number(data.vl_total) || 0,
    fiscal_document: data.fiscal_document?.value ?? false,
    proprietary_uuid: data.proprietary_uuid?.value ?? undefined,
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
  replace: (rows: TransferBatchFarmInstallmentRowForm[]) => void;
}

interface CategoriesArrayLike {
  fields: FieldArrayWithId<any, string, 'id'>[];
  append: (row: TransferBatchFarmCategoryRowForm) => void;
  remove: UseFieldArrayRemove;
}

export interface TransferBatchFarmFinancialFieldsBlockProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  languageGB: LanguageDate;
  isDisabled: boolean;
  setValue: UseFormSetValue<any>;
  /** '' (default) = paths TOP-LEVEL de `SCR-FIN`; 'financial.' = uso aninhado no `create` (TASK-FE-041-LF-06). */
  namePrefix?: string;
  installmentsArray: InstallmentsArrayLike;
  incomeArray: CategoriesArrayLike;
  expenseArray: CategoriesArrayLike;
}

/**
 * Bloco financeiro completo — cabeçalho (`vl_total`/`fiscal_document`/
 * `proprietary_uuid`) + parcelas + rateio duplo (entrada/saída). Fiel ao
 * `SCR-FIN` original, com paths `namePrefix`-aware (TASK-FE-041-LF-06).
 * @param {TransferBatchFarmFinancialFieldsBlockProps} props - Props do bloco (control/errors/arrays/namePrefix).
 * @return {JSX.Element} Cabeçalho financeiro + parcelas + rateio duplo.
 */
export function TransferBatchFarmFinancialFieldsBlock({
  control,
  errors,
  languageGB,
  isDisabled,
  setValue,
  namePrefix = '',
  installmentsArray,
  incomeArray,
  expenseArray,
}: TransferBatchFarmFinancialFieldsBlockProps) {
  const financialText = languageGB.loteFazenda.transferBatchFarm.form.fields.financial;
  const vlTotal = Number(useWatch({ control, name: `${namePrefix}vl_total` as any })) || 0;

  // Item 4 (reprovação AD F-022) — "Possui entrada?" front-only, repassado ao
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
                // Item 8 (reprovação AD F-022) — ordem Não-primeiro, variante
                // ADITIVA (nunca inverter o catálogo global `options()`).
                // Item 6 mantém o default "Sim" (independente da ordem).
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

          {/* Item 4 (reprovação AD F-022) — bloco "Possui entrada?" restaurado,
              mirror `transfer_form.blade.php:550-559`. Front-only: nunca vai a
              `mapTransferBatchFarmFinancialPayload`. */}
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
