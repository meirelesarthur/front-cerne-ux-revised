// src/pages/Financeiro/ContasAPagar/appropriation/ExpenseLivestockBlock.tsx
// -----------------------------------------------------------------------------
// UT-000795 — bloco "Apropriação — Pecuária" do Cabeçalho de Contas a Pagar
// (Direta + Tipo=Pecuária). 6 campos na ordem do legado: Área, Módulo, Lote,
// Animal, Operação (obrigatória), Atividade (obrigatória).
//
// Padrão visual = bloco "Agricultura" desta mesma tela (`Box mt=6 p=4
// bg="bg.muted"` + `SimpleGrid`), tokens do tema (light/dark). O DS `cerne`
// não tem página de Contas a Pagar nem de Apropriação Direta (UX-GAP
// declarado, ver FEAT/Referência UX) — nenhum layout inventado.
//
// Hidratação: valores entram como option única `{label,value}` (nenhuma
// requisição no load); as listas só carregam ao abrir o Select. Limpezas só
// nos handlers de `onChange` (ver `useExpenseLivestockCascades`).
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormClearErrors,
  type UseFormGetValues,
  type UseFormSetValue,
} from 'react-hook-form';

import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listAreaOptionsForExpense } from '@/services/v2/BaseRegistrations/areas-service';
import { listGrazingOptions } from '@/services/v2/BaseRegistrations/grazings-service';
import {
  listExpenseActivityOptions,
  listExpenseOperationOptions,
} from '@/services/v2/Financeiro/Expenses/expense-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { AreaOption } from '@/@types/v2/BaseRegistrations/areas';
import type { GrazingOption } from '@/@types/v2/BaseRegistrations/grazings';
import type { BatchOption } from '@/@types/v2/Batches';
import type {
  ExpenseAppropriationLivestockDetail,
  ExpenseForm,
} from '@/@types/v2/Financeiro/expense';
import type {
  ServiceOrderActivityOption,
  ServiceOrderOperationOption,
} from '@/@types/v2/ServiceOrders';

import { AppropriationDetailSummary } from './AppropriationDetailSummary';
import { LIVESTOCK_ANIMAL_PAGE_SIZE } from './expenseAppropriationServices';
import { useExpenseLivestockCascades } from './useExpenseLivestockCascades';

interface ExpenseLivestockBlockProps {
  control: Control<ExpenseForm>;
  errors: FieldErrors<ExpenseForm>;
  setValue: UseFormSetValue<ExpenseForm>;
  getValues: UseFormGetValues<ExpenseForm>;
  clearErrors: UseFormClearErrors<ExpenseForm>;
  isEditing: boolean;
  /** `!canSave || isLoading` — também verdadeiro na rota de visualização. */
  isDisabled: boolean;
  /** `appropriation_detail.livestock` do título carregado (edição/visualização). */
  detail?: ExpenseAppropriationLivestockDetail | null;
}

// Lookups FLAT (sem paginação na API): `pageSize` alto evita `hasMore` falso
// quando o total coincide com o tamanho de página padrão do Select.
type SearchPageParams = PaginationQueryParams & { search?: string };

const FLAT_LOOKUP_PAGE_SIZE = 10000;

const searchParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

export function ExpenseLivestockBlock({
  control,
  errors,
  setValue,
  getValues,
  clearErrors,
  isEditing,
  isDisabled,
  detail,
}: ExpenseLivestockBlockProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.financial.expense.form;

  const [areaValue, grazingValue, batchValue, animalValue, operationValue] = useWatch({
    control,
    name: [
      'aprop_pec_area_uuid',
      'aprop_pec_grazing_uuid',
      'aprop_pec_batch_uuid',
      'aprop_pec_animal_uuid',
      'aprop_pec_operation_uuid',
    ],
  });

  const cascades = useExpenseLivestockCascades({ setValue, getValues, clearErrors });

  const areaUuid = areaValue?.value;
  const grazingUuid = grazingValue?.value;
  const batchUuid = batchValue?.value;
  const operationUuid = operationValue?.value;

  // Lote/Animal ficam desabilitados sem pai E sem valor hidratado (em edição o
  // valor gravado deve aparecer mesmo sem o pai carregado).
  const isBatchDisabled = isDisabled || (!areaUuid && !grazingUuid && !batchValue);
  const isAnimalDisabled = isDisabled || (!batchUuid && !animalValue);
  // Atividade: em criação só após a Operação; em edição nunca desabilitar.
  const isActivityDisabled = isDisabled || (!isEditing && !operationUuid);

  return (
    <Box mt={6} p={4} bg="bg.muted" borderRadius="lg" data-testid="expense-livestock-block">
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {formText.sections.livestock}
      </Text>

      {detail && (
        <AppropriationDetailSummary
          code={detail.code}
          status={detail.status}
          date={detail.date}
          amount={detail.amount}
        />
      )}

      <SimpleGrid columns={columnsForm.fourColumns} gap={4}>
        <Controller
          name="aprop_pec_area_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.livestockArea}
              placeholder={formText.placeholders.livestockArea}
              error={errors.aprop_pec_area_uuid?.message as string | undefined}
              service={(params: SearchPageParams) =>
                listAreaOptionsForExpense({ search: params.search, withoutGrazing: !isEditing })
              }
              pageSize={FLAT_LOOKUP_PAGE_SIZE}
              mapOptions={(item: AreaOption) => ({ label: item.description, value: item.uuid })}
              findParams={searchParams}
              cacheUniqs={[isEditing]}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                cascades.handleAreaChange(!!option);
              }}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="aprop_pec_grazing_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.livestockGrazing}
              placeholder={formText.placeholders.livestockGrazing}
              error={errors.aprop_pec_grazing_uuid?.message as string | undefined}
              service={(params: SearchPageParams) => listGrazingOptions({ search: params.search })}
              pageSize={FLAT_LOOKUP_PAGE_SIZE}
              mapOptions={(item: GrazingOption) => ({ label: item.description, value: item.uuid })}
              findParams={searchParams}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                cascades.handleGrazingChange(!!option);
              }}
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="aprop_pec_batch_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.livestockBatch}
              placeholder={formText.placeholders.livestockBatch}
              error={errors.aprop_pec_batch_uuid?.message as string | undefined}
              service={cascades.listBatchOptions}
              pageSize={FLAT_LOOKUP_PAGE_SIZE}
              mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
              findParams={searchParams}
              cacheUniqs={[areaUuid, grazingUuid]}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                cascades.handleBatchChange();
              }}
              isDisabled={isBatchDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="aprop_pec_animal_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.livestockAnimal}
              placeholder={formText.placeholders.livestockAnimal}
              error={errors.aprop_pec_animal_uuid?.message as string | undefined}
              service={cascades.listAnimalOptions}
              pageSize={LIVESTOCK_ANIMAL_PAGE_SIZE}
              mapOptions={(item: AnimalOptionListItem) => ({
                label: item.label,
                value: item.uuid,
              })}
              findParams={searchParams}
              cacheUniqs={[batchUuid]}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                clearErrors('aprop_pec_animal_uuid');
              }}
              isDisabled={isAnimalDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="aprop_pec_operation_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.livestockOperation}
              placeholder={formText.placeholders.livestockOperation}
              error={errors.aprop_pec_operation_uuid?.message as string | undefined}
              service={listExpenseOperationOptions}
              mapOptions={(item: ServiceOrderOperationOption) => ({
                label: item.name,
                value: item.uuid,
              })}
              findParams={searchParams}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                cascades.handleOperationChange();
              }}
              isRequired
              isDisabled={isDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Controller
          name="aprop_pec_activity_uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={formText.fields.livestockActivity}
              placeholder={formText.placeholders.livestockActivity}
              error={errors.aprop_pec_activity_uuid?.message as string | undefined}
              service={listExpenseActivityOptions}
              mapOptions={(item: ServiceOrderActivityOption) => ({
                label: item.name,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                ...searchParams(search),
                operation_uuid: operationUuid,
              })}
              cacheUniqs={[operationUuid]}
              value={field.value ?? null}
              onChange={(option: any) => {
                field.onChange(option ?? null);
                clearErrors('aprop_pec_activity_uuid');
              }}
              isRequired
              isDisabled={isActivityDisabled}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />
      </SimpleGrid>
    </Box>
  );
}
