// src/pages/Operacional/Romaneios/RomaneioExpenseRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Despesas acessórias do Romaneio (TASK-TRF-FE-04,
// contrato de tela §5.6). Componente PRÓPRIO por linha (mesmo racional de
// `RomaneioItemRow.tsx`/`InvoiceItemRow`) — recebe `control`/`index`/`watch`/
// `setValue`/`errors`/`isDisabled` por prop, NÃO instancia o próprio
// `useFieldArray`.
//
// Condicionais por `type` (armadilha #9/#10, contrato §5.6):
//   - `service_reversal_uuid` só em `receitas`/`serviços` — o ENDPOINT muda
//     conforme o `type` (`/reversal-expenses` gate `reversal_view` ou
//     `/service-expenses` gate `service_view`).
//   - `warehouse_uuid`/`product_uuid` só em `insumos`.
// Trocar a natureza LIMPA os 3 campos condicionais + `vl_unit`/`use_kg`
// (evita carregar contexto de uma seleção que não existe mais para o tipo
// novo — nenhum deles é validado como obrigatório no servidor, mas manter um
// `service_reversal_uuid` de "Estornos" com `type` trocado para "Insumos"
// seria dado morto na tela, sem utilidade e sem review possível).
//
// Condicionais por `who_pay` (armadilha #6/#7, condicional legada literal):
//   - `provider_uuid` `isDisabled` quando `who_pay !== 'fornecedor'`.
//   - `apropriation` forçado a `'N'` e `isDisabled` quando
//     `who_pay === 'rateio'` — o `setValue` ocorre no PRÓPRIO `onChange` de
//     `who_pay` (nunca um `useEffect` solto, mesmo racional do `fillForm`).
//
// Auto-preenchimento PARCIAL (armadilha #12, `GAP-TRF-FE-08`) — ao escolher
// um estorno/serviço, semeia SÓ `vl_unit` (`option.value`, já number puro
// vindo do service) e guarda `use_kg` (client-only) para o hint; SEM somar
// pesos secundários de item (não persistido nesta Onda).
//
// `provider_uuid` (DD-078-04) — o Resource devolve `{uuid, name}`; o
// catálogo `providers/options` (mesmo hook `useTransferProviderCatalogOptions`
// da aba Cabeçalho, cache compartilhado — ZERO requests extras) só refina o
// rótulo por match de uuid, nunca 1 request por linha.
//
// `value` (linha 8 do contrato) NÃO é campo do form — hint puro
// `quantity * vl_unit`, mesmo racional de `discard_percentage` em
// `RomaneioItemRow.tsx` (armadilha #5).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import {
  apropriationOptions,
  expensePayerOptions,
  expenseTypeOptions,
} from '@/constants/transfers/options';

import { listReversalExpenses } from '@/services/v2/BaseRegistrations/reversalExpenses-service';
import { listServiceExpenses } from '@/services/v2/BaseRegistrations/serviceExpense-service';
import { listProductOptions } from '@/services/v2/Products/product-service';

import type { Option } from '@/@types/option';
import type { ReversalExpenseListItem } from '@/@types/v2/BaseRegistrations/reversalExpenses';
import type { ServiceExpenseListItem } from '@/@types/v2/BaseRegistrations/serviceExpense';
import type { ProductOption } from '@/@types/v2/Products';
import type { Apropriation, ExpensePayer, ExpenseType, TransferForm } from '@/@types/v2/Transfers';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { useTransferItemWarehouseOptions, useTransferProviderCatalogOptions } from './useRomaneios';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface RomaneioExpenseRowProps {
  index: number;
  control: Control<TransferForm>;
  errors: FieldErrors<TransferForm>;
  watch: UseFormWatch<TransferForm>;
  setValue: UseFormSetValue<TransferForm>;
  isDisabled: boolean;
  onRemove: () => void;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mesmo racional de `ensureCurrentOption` em `RomaneioItemRow.tsx`/
// `CreateOrUpdateRomaneio.tsx` — mantém a opção CORRENTE visível mesmo antes
// do catálogo carregar.
function ensureCurrentOption<T>(
  current: Option<T> | null | undefined,
  options: Option<T>[]
): Option<T>[] {
  if (!current) return options;
  if (options.some((option) => option.value === current.value)) return options;
  return [current, ...options];
}

export function RomaneioExpenseRow({
  index,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  onRemove,
}: RomaneioExpenseRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.transfers.transfer.form.expenseRow;

  const rowErrors = errors.expenses?.[index];

  const isExistingExpense = !!watch(`expenses.${index}.expense_uuid`);

  const typeOptions = expenseTypeOptions.options(languageGB);
  const whoPayOptions = expensePayerOptions.options(languageGB);
  const apropriationSelectOptions = apropriationOptions.options(languageGB);

  const currentType = watch(`expenses.${index}.type`);
  const isReversalOrService =
    currentType?.value === 'receitas' || currentType?.value === 'serviços';
  const isSupplies = currentType?.value === 'insumos';

  const currentWhoPay = watch(`expenses.${index}.who_pay`);
  const isRateio = currentWhoPay?.value === 'rateio';
  const isProviderDisabled = isDisabled || currentWhoPay?.value !== 'fornecedor';

  const quantity = Number(watch(`expenses.${index}.quantity`)) || 0;
  const vlUnit = Number(watch(`expenses.${index}.vl_unit`)) || 0;
  const valuePreview = round(quantity * vlUnit, 2);

  const useKgHint = !!watch(`expenses.${index}.use_kg`);

  // ---- Satélite paginado — estorno/serviço, endpoint conforme `type` ------
  const isReversalType = currentType?.value === 'receitas';
  const currentServiceReversal = watch(`expenses.${index}.service_reversal_uuid`);
  const showUnknownServiceReversalHint =
    isExistingExpense && isReversalOrService && !currentServiceReversal;

  function handleTypeChange(option: Option<ExpenseType> | null) {
    setValue(`expenses.${index}.type`, option ?? null, { shouldValidate: true });
    // Armadilha de UX — a natureza trocou, os campos condicionais da natureza
    // ANTERIOR deixam de fazer sentido (nenhum é `required` no servidor, mas
    // manter dado morto na tela não ajuda o usuário nem o Tester).
    setValue(`expenses.${index}.service_reversal_uuid`, null);
    setValue(`expenses.${index}.warehouse_uuid`, null);
    setValue(`expenses.${index}.product_uuid`, null);
    setValue(`expenses.${index}.vl_unit`, null);
    setValue(`expenses.${index}.use_kg`, null);
  }

  function handleWhoPayChange(option: Option<ExpensePayer> | null) {
    setValue(`expenses.${index}.who_pay`, option ?? null, { shouldValidate: true });
    // Armadilha #7 — `apropriation` forçado a `'N'` quando `who_pay==='rateio'`
    // (condicional legada literal). O `setValue` acontece AQUI (no evento),
    // nunca num `useEffect` solto.
    if (option?.value === 'rateio') {
      setValue(
        `expenses.${index}.apropriation`,
        { label: apropriationOptions.getLabel('N', languageGB), value: 'N' as Apropriation },
        { shouldValidate: true }
      );
    }
  }

  // ---- Satélites planos (armadilha #1 — Select + useQuery, reusados dos
  // MESMOS hooks/catálogos da aba Cabeçalho/Itens, zero requests extra) -----
  const warehouseQuery = useTransferItemWarehouseOptions('insumos');
  const warehouseCatalogOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    (item: WarehouseOption) => ({
      label: `${item.initials} — ${item.description}`,
      value: item.uuid,
    })
  );
  const currentWarehouse = watch(`expenses.${index}.warehouse_uuid`);
  const warehouseOptions = ensureCurrentOption(currentWarehouse, warehouseCatalogOptions);
  const showUnknownWarehouseHint = isExistingExpense && isSupplies && !currentWarehouse;

  // `providers/options` — mesmo catálogo/gate de `seller_uuid`/
  // `transporter_uuid` (GAP-TRF-FE-14/GAP-TRF-FE-03). Resolve o RÓTULO real
  // do `provider_uuid` hidratado só-com-uuid por MATCH, sem request extra.
  const providerCatalogQuery = useTransferProviderCatalogOptions({ enabled: !isDisabled });
  const providerCatalogForbidden =
    isAxiosError(providerCatalogQuery.error) && providerCatalogQuery.error.response?.status === 403;
  const providerCatalogOptions: Option<string>[] = (
    providerCatalogQuery.data?.data.items ?? []
  ).map((item) => ({ label: item.label, value: item.uuid }));
  const currentProvider = watch(`expenses.${index}.provider_uuid`);
  const resolvedProvider = currentProvider
    ? (providerCatalogOptions.find((option) => option.value === currentProvider.value) ??
      currentProvider)
    : null;
  const providerOptions = ensureCurrentOption(resolvedProvider, providerCatalogOptions);

  // ---- Remoção com confirmação (contrato §2.5) — SEM restrição de "última
  // linha": `expenses` pode ficar vazio (`[]` é o mecanismo aprovado de
  // remover todas, D6/armadilha #1). ---------------------------------------
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        <Controller
          name={`expenses.${index}.type`}
          control={control}
          render={({ field: { name, value } }) => (
            <Select
              label={text.fields.type}
              placeholder={text.placeholders.type}
              name={name}
              value={value}
              onChange={handleTypeChange}
              options={typeOptions}
              // `type` colide com a chave especial de `RegisterOptions`/
              // `FieldError` do RHF dentro de um array — mesmo defeito de
              // tipagem resolvido em `TeamMemberRow.tsx:118`, mesmo cast.
              error={(errors.expenses as any)?.[index]?.type?.message as string | undefined}
              isRequired
              isDisabled={isDisabled}
            />
          )}
        />

        {isReversalOrService && (
          <Box>
            <Controller
              name={`expenses.${index}.service_reversal_uuid`}
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={isReversalType ? text.fields.reversal : text.fields.service}
                  placeholder={
                    isReversalType ? text.placeholders.reversal : text.placeholders.service
                  }
                  service={isReversalType ? listReversalExpenses : listServiceExpenses}
                  mapOptions={(item: ReversalExpenseListItem | ServiceExpenseListItem) => ({
                    label: item.description,
                    value: item.uuid,
                    priceValue: Number(item.value),
                    useKg: item.use_kg,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ? { label: option.label, value: option.value } : null);
                    // Armadilha #12 — SÓ `vl_unit` é semeado; quantidade
                    // permanece manual (hint via `use_kg`).
                    setValue(
                      `expenses.${index}.vl_unit`,
                      typeof option?.priceValue === 'number' ? round(option.priceValue, 4) : null
                    );
                    setValue(`expenses.${index}.use_kg`, option?.useKg ?? null);
                  }}
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
            {showUnknownServiceReversalHint && (
              <Text fontSize="xs" color="fg.muted" mt={1}>
                {text.unknownFieldHint}
              </Text>
            )}
          </Box>
        )}

        {isSupplies && (
          <Box>
            <Controller
              name={`expenses.${index}.warehouse_uuid`}
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.warehouse}
                  placeholder={text.placeholders.warehouse}
                  name={name}
                  value={value}
                  onChange={(option) => onChange(option ?? null)}
                  options={warehouseOptions}
                  loading={warehouseQuery.isLoading}
                  isDisabled={isDisabled}
                />
              )}
            />
            {showUnknownWarehouseHint && (
              <Text fontSize="xs" color="fg.muted" mt={1}>
                {text.unknownFieldHint}
              </Text>
            )}
          </Box>
        )}

        {isSupplies && (
          <Controller
            name={`expenses.${index}.product_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.product}
                placeholder={text.placeholders.product}
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: item.code ? `${item.code} — ${item.description}` : item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        )}

        <Controller
          name={`expenses.${index}.provider_uuid`}
          control={control}
          render={({ field: { name, onChange } }) => (
            <Select
              label={text.fields.provider}
              placeholder={text.placeholders.provider}
              name={name}
              value={resolvedProvider}
              onChange={onChange}
              options={providerOptions}
              loading={!isProviderDisabled && providerCatalogQuery.isLoading}
              isDisabled={isProviderDisabled}
              helperText={providerCatalogForbidden ? text.providerForbiddenHint : undefined}
            />
          )}
        />

        <Box>
          <Controller
            name={`expenses.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.fields.quantity}
                allowDot
                decimalPlaces={2}
                value={field.value ?? null}
                onValueChange={(value) => field.onChange(value)}
                error={rowErrors?.quantity?.message as string | undefined}
                isRequired
                disabled={isDisabled}
              />
            )}
          />
          {useKgHint && (
            <Text fontSize="xs" color="fg.muted" mt={1}>
              {text.useKgHint}
            </Text>
          )}
        </Box>

        <Controller
          name={`expenses.${index}.vl_unit`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.fields.vlUnit}
              allowDot
              decimalPlaces={4}
              value={field.value ?? null}
              onValueChange={(value) => field.onChange(value)}
              error={rowErrors?.vl_unit?.message as string | undefined}
              isRequired
              disabled={isDisabled}
            />
          )}
        />

        <InputReadOnly label={text.fields.value} value={formatCurrencyBRL(valuePreview)} />

        <Controller
          name={`expenses.${index}.who_pay`}
          control={control}
          render={({ field: { name, value } }) => (
            <Select
              label={text.fields.whoPay}
              placeholder={text.placeholders.whoPay}
              name={name}
              value={value}
              onChange={handleWhoPayChange}
              options={whoPayOptions}
              error={rowErrors?.who_pay?.message as string | undefined}
              isRequired
              isDisabled={isDisabled}
            />
          )}
        />

        <Controller
          name={`expenses.${index}.apropriation`}
          control={control}
          render={({ field: { name, value, onChange } }) => (
            <Select
              label={text.fields.apropriation}
              placeholder={text.placeholders.apropriation}
              name={name}
              value={
                isRateio
                  ? {
                      label: apropriationOptions.getLabel('N', languageGB),
                      value: 'N' as Apropriation,
                    }
                  : value
              }
              onChange={(option) => !isRateio && onChange(option ?? null)}
              options={apropriationSelectOptions}
              error={rowErrors?.apropriation?.message as string | undefined}
              isRequired
              isDisabled={isDisabled || isRateio}
            />
          )}
        />
      </SimpleGrid>

      <Flex justify="flex-end" mt={3}>
        <IconButtonTable
          aria-label={text.removeButton}
          mensegerTooltip={text.removeButton}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={isDisabled}
          onClick={() => setConfirmRemoveOpen(true)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>

      <DeleteConfirmDialog
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={() => {
          setConfirmRemoveOpen(false);
          onRemove();
        }}
        title={text.removeConfirm.title}
        description={text.removeConfirm.message}
        warningText=""
        hideQuestionMark
        colorPalette="red"
      />
    </Box>
  );
}
