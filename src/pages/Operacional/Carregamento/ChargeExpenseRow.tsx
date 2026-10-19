// src/pages/Operacional/Carregamento/ChargeExpenseRow.tsx
// -----------------------------------------------------------------------------
// Linha do repeater de Despesas acessórias do Carregamento — GAP FIX (Onda 2,
// execução 045, FID-G3F). Componente PRÓPRIO por linha (mirror
// `RomaneioExpenseRow.tsx`/`ChargeItemRow.tsx`) — recebe `control`/`index`/
// `watch`/`setValue`/`errors`/`isDisabled` por prop, NÃO instancia o próprio
// `useFieldArray`.
//
// `type` chega FIXO por PROP (definido pela sub-aba do pai
// `ChargeExpensesTab.tsx` — Estornos/Insumos/Serviços, CL-48/CL-49) — o
// usuário NUNCA escolhe "Natureza" manualmente nesta linha (mirror hidden
// `expense_type[]` do legado); não existe mais Select/Controller de `type`
// aqui, apenas os condicionais que já dependiam do valor:
//   - `service_reversal_uuid` só em `receitas`/`serviços` — o ENDPOINT muda
//     conforme o `type` (`reversal-expenses` para `receitas`,
//     `service-expenses` para `serviços`).
//   - `warehouse_uuid`/`product_uuid`/`stock` só em `insumos`.
//   - `provider_uuid` (Fornecedor) só em `receitas` (aba Estornos) — FIX
//     (#1, execução 045): o legado só expõe opções reais de
//     `provider_expense_id[]` na aba Estornos (FD-36 — hidden vazio em
//     Insumos/Serviços, `components/expenses_ancilliaries.blade.php`); o
//     dono confirmou que Insumos e Serviços NÃO têm campo Fornecedor.
//
// Condicionais por `who_pay` (mirror `RomaneioExpenseRow.tsx`):
//   - `provider_uuid` (quando renderizado, aba Estornos) `isDisabled`
//     quando `who_pay !== 'fornecedor'`.
//   - `apropriation` forçado a `'N'` e `isDisabled` quando
//     `who_pay === 'rateio'` — `setValue` no PRÓPRIO `onChange` de `who_pay`.
//
// `provider_uuid` — mirror do PRÓPRIO precedente deste módulo
// (`ChargeItemRow.tsx`, FD-16: `Provider::person() type=1`, Fornecedor) via
// `SelectAsyncPaginate` direto — NÃO o catálogo `Select`+`useQuery` pré-
// carregado de `Romaneios` (`useTransferProviderCatalogOptions`): Carregamentos
// não tem gate cruzado de permissão nesse satélite (nota técnica 3 do plano,
// aba inteira já gateada por `charge_edit`/`charge_view`), então repetir o
// padrão local já consolidado é mais simples e não introduz um mecanismo de
// cache novo só para este campo.
//
// Cascata de Produto na aba Insumos (IG-09/IG-10, GAP real fechado nesta
// execução) — mirror EXATO `ChargeItemRow.tsx` (nota técnica 1 do plano):
// `product_uuid` passa a usar `listStockAvailability({warehouse_uuid})` em
// vez do catálogo genérico `listProductOptions`. DIFERENTE de
// `ChargeItemRow` (onde o Armazém é opcional e o Produto nunca desabilita):
// aqui o Produto fica `isDisabled` até o usuário escolher o Armazém — trocar
// o Armazém LIMPA o Produto (e o hint `stock`) da MESMA linha.
//
// `stock` (FD-32, "Estoque", aba Insumos, readonly) — hint CLIENT-ONLY
// (mesmo racional de `total_amount`/`qtd_stock` em `ChargeItemRow.tsx`),
// preenchido de `StockAvailabilityItem.quantity` no `onChange` do Produto;
// NUNCA vai ao payload (`buildChargeExpensePayload` não o lê).
//
// Autofill de `vl_unit` na aba Insumos (Decisão do dono #02, default (i)) —
// ao selecionar Produto, `getProduct(uuid)` fire-and-forget autopreenche
// `vl_unit` com `las_price` quando vier; o usuário pode sobrescrever depois
// (nenhum lock no campo).
//
// `use_kg` (hint "usa quantidade em kg") — `ChargeExpenseForm` (fundação,
// TASK-FE-CG-01) NÃO declara este campo (ausente do shape compartilhado com
// as Tarefas irmãs); em vez de estender o tipo raiz do `useForm` só para um
// hint 100% client-only, ele vive em `useState` LOCAL desta linha (nunca no
// payload de qualquer forma) — mesma informação exibida, sem tocar o
// contrato de formulário já fechado por `TASK-FE-CG-01`.
//
// `value` (hint) NÃO é campo de fato do form — `quantity * vl_unit`
// computado ao vivo, mesmo racional de `total_amount` em `ChargeItemRow.tsx`.
// -----------------------------------------------------------------------------

import { useCallback, useState } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import {
  chargeApropriationOptions,
  chargeExpensePayerOptions,
} from '@/constants/carregamentos/charge/options';
import { columnsForm } from '@/constants/coluns-form';

import { listReversalExpenses } from '@/services/v2/BaseRegistrations/reversalExpenses-service';
import { listServiceExpenses } from '@/services/v2/BaseRegistrations/serviceExpense-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { getProduct } from '@/services/v2/Products/product-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';

import type { Option } from '@/@types/option';
import type { ReversalExpenseListItem } from '@/@types/v2/BaseRegistrations/reversalExpenses';
import type { ServiceExpenseListItem } from '@/@types/v2/BaseRegistrations/serviceExpense';
import type {
  ChargeApropriation,
  ChargeExpensePayer,
  ChargeExpenseType,
  ChargeForm,
} from '@/@types/v2/Carregamentos';
import type { StockAvailabilityItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { useChargeExpenseWarehouseOptions } from './useCarregamentos';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ChargeExpenseRowProps {
  index: number;
  /** Natureza FIXA da linha (definida pela sub-aba do pai) — nunca editável
   *  aqui, ver cabeçalho do arquivo. */
  type: ChargeExpenseType;
  control: Control<ChargeForm>;
  errors: FieldErrors<ChargeForm>;
  watch: UseFormWatch<ChargeForm>;
  setValue: UseFormSetValue<ChargeForm>;
  isDisabled: boolean;
  onRemove: () => void;
}

// Shape normalizado do Produto na cascata da aba Insumos (IG-09/IG-10) —
// mirror `ChargeItemProductOption` de `ChargeItemRow.tsx`, sem o campo
// `measurement` (não exibido nesta linha).
interface ChargeExpenseProductOption {
  uuid: string;
  description: string;
  quantity: number;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mesmo racional de `ensureCurrentOption` em `ChargeItemRow.tsx`.
function ensureCurrentOption<T>(
  current: Option<T> | null | undefined,
  options: Option<T>[]
): Option<T>[] {
  if (!current) return options;
  if (options.some((option) => option.value === current.value)) return options;
  return [current, ...options];
}

export function ChargeExpenseRow({
  index,
  type,
  control,
  errors,
  watch,
  setValue,
  isDisabled,
  onRemove,
}: ChargeExpenseRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.carregamentos.charge.form.fields.expense;
  const rowText = languageGB.carregamentos.charge.form.expenseRow;

  const rowErrors = errors.expenses?.[index];

  const whoPayOptions = chargeExpensePayerOptions.options(languageGB);
  const apropriationSelectOptions = chargeApropriationOptions.options(languageGB);

  const isExistingExpense = !!watch(`expenses.${index}.expense_uuid`);

  // `type` é FIXO (prop, ver cabeçalho) — os 3 condicionais abaixo nunca
  // mudam depois que a linha é criada.
  const isReversalOrService = type === 'receitas' || type === 'serviços';
  const isSupplies = type === 'insumos';
  const isReversalType = type === 'receitas';

  const currentWhoPay = watch(`expenses.${index}.who_pay`);
  const isRateio = currentWhoPay?.value === 'rateio';
  const isProviderDisabled = isDisabled || currentWhoPay?.value !== 'fornecedor';

  const quantity = Number(watch(`expenses.${index}.quantity`)) || 0;
  const vlUnit = Number(watch(`expenses.${index}.vl_unit`)) || 0;
  const valuePreview = round(quantity * vlUnit, 2);

  // Hint client-only (nunca no form/payload — ver cabeçalho do arquivo).
  const [useKgHint, setUseKgHint] = useState(false);

  const currentServiceReversal = watch(`expenses.${index}.service_reversal_uuid`);
  const showUnknownServiceReversalHint =
    isExistingExpense && isReversalOrService && !currentServiceReversal;

  function handleWhoPayChange(option: Option<ChargeExpensePayer> | null) {
    setValue(`expenses.${index}.who_pay`, option ?? null, { shouldValidate: true });
    // `apropriation` forçado a `'N'` quando `who_pay==='rateio'` — `setValue`
    // AQUI (no evento), nunca num `useEffect` solto.
    if (option?.value === 'rateio') {
      setValue(
        `expenses.${index}.apropriation`,
        {
          label: chargeApropriationOptions.getLabel('N', languageGB),
          value: 'N' as ChargeApropriation,
        },
        { shouldValidate: true }
      );
    }
  }

  // ---- Cascata Armazém → Produto (aba Insumos, IG-09/IG-10) ----------------
  const warehouseQuery = useChargeExpenseWarehouseOptions();
  const warehouseCatalogOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    (item: WarehouseOption) => ({
      label: `${item.initials} — ${item.description}`,
      value: item.uuid,
    })
  );
  const currentWarehouse = watch(`expenses.${index}.warehouse_uuid`);
  const warehouseOptions = ensureCurrentOption(currentWarehouse, warehouseCatalogOptions);
  const showUnknownWarehouseHint = isExistingExpense && isSupplies && !currentWarehouse;

  // Produto FICA desabilitado até o Armazém ser escolhido (diferente de
  // `ChargeItemRow.tsx`, onde o Armazém é opcional) — sem Armazém não há
  // saldo a listar (`GET /stocks/available` exige `warehouse_uuid`).
  const isProductDisabled = isDisabled || !currentWarehouse?.value;

  const listExpenseProducts = useCallback(
    async (params: { search?: string; page?: number; per_page?: number }) => {
      if (!currentWarehouse?.value) {
        return {
          success: true,
          message: '',
          data: {
            items: [] as ChargeExpenseProductOption[],
            pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
          },
        };
      }

      const response = await listStockAvailability({
        ...params,
        warehouse_uuid: currentWarehouse.value,
      });

      return {
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(
            (item: StockAvailabilityItem): ChargeExpenseProductOption => ({
              uuid: item.product.uuid,
              description: item.product.description,
              // FD-32 ("Estoque") — saldo real NESTE armazém.
              quantity: item.quantity,
            })
          ),
        },
      };
    },
    [currentWarehouse?.value]
  );

  const stockHint = watch(`expenses.${index}.stock`);

  // ---- Remoção com confirmação — SEM restrição de "última linha" (`[]`
  // remove TODAS, D6). --------------------------------------------------------
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  return (
    <Box p={4} border="1px solid" borderColor="border.subtle" borderRadius="lg">
      <SimpleGrid columns={columnsForm.default} gap={4}>
        {isReversalOrService && (
          <Box>
            <Controller
              name={`expenses.${index}.service_reversal_uuid`}
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={isReversalType ? text.reversal : text.service}
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
                    // Só `vl_unit` é semeado; quantidade permanece manual
                    // (hint local via `useKgHint`).
                    setValue(
                      `expenses.${index}.vl_unit`,
                      typeof option?.priceValue === 'number' ? round(option.priceValue, 4) : null
                    );
                    setUseKgHint(!!option?.useKg);
                  }}
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
            {showUnknownServiceReversalHint && (
              <Text fontSize="xs" color="fg.muted" mt={1}>
                {rowText.unknownFieldHint}
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
                  label={text.warehouse}
                  name={name}
                  value={value}
                  onChange={(option) => {
                    onChange(option ?? null);
                    // Trocar o Armazém da linha LIMPA o Produto + o hint de
                    // Estoque da MESMA linha (fonte de dados mudou, IG-09).
                    setValue(`expenses.${index}.product_uuid`, null);
                    setValue(`expenses.${index}.stock`, null);
                  }}
                  options={warehouseOptions}
                  loading={warehouseQuery.isLoading}
                  isDisabled={isDisabled}
                />
              )}
            />
            {showUnknownWarehouseHint && (
              <Text fontSize="xs" color="fg.muted" mt={1}>
                {rowText.unknownFieldHint}
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
                label={text.product}
                service={listExpenseProducts}
                mapOptions={(item: ChargeExpenseProductOption) => ({
                  label: item.description,
                  value: item.uuid,
                  // FD-32 (IG-10) — embutido na option para "Estoque" sem
                  // request extra por linha, mirror `ChargeItemRow.tsx`.
                  quantity: item.quantity,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                cacheUniqs={[currentWarehouse?.value]}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  // IG-10 — "Estoque" (FD-32) vem embutido na option.
                  setValue(`expenses.${index}.stock`, option?.quantity ?? null);
                  // Decisão do dono #02 (default i) — autopreenche `vl_unit`
                  // com `las_price` do Produto, fire-and-forget; usuário
                  // pode sobrescrever depois (sem lock no campo).
                  if (option?.value) {
                    void getProduct(option.value).then((response) => {
                      const lasPrice = response.data.las_price;
                      if (typeof lasPrice === 'number') {
                        setValue(`expenses.${index}.vl_unit`, round(lasPrice, 4));
                      }
                    });
                  }
                }}
                isDisabled={isProductDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        )}

        {isSupplies && (
          <InputReadOnly
            label={text.stock}
            value={stockHint != null ? stockHint.toLocaleString('pt-BR') : '—'}
          />
        )}

        {/* FIX (#1, execução 045) — Fornecedor é campo EXCLUSIVO da aba
            Estornos (`type==='receitas'`), fiel ao legado (FD-36,
            `provider_expense_id[]` só tem opções reais na aba Estornos —
            hidden vazio em Insumos/Serviços, `components/expenses_
            ancilliaries.blade.php`). Antes deste fix o campo renderizava
            SEMPRE nas 3 abas; agora só existe onde o legado de fato o
            expõe. */}
        {isReversalType && (
          <Controller
            name={`expenses.${index}.provider_uuid`}
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.provider}
                service={listProviderOptions}
                mapOptions={(item: ProviderOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  // Mirror `ChargeItemRow.tsx` FD-16 — `Provider::person()
                  // type=1` (Fornecedor).
                  type: 1,
                })}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isProviderDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        )}

        <Box>
          <Controller
            name={`expenses.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <NumberInput
                name={field.name}
                label={text.quantity}
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
              {rowText.useKgHint}
            </Text>
          )}
        </Box>

        <Controller
          name={`expenses.${index}.vl_unit`}
          control={control}
          render={({ field }) => (
            <NumberInput
              name={field.name}
              label={text.vlUnit}
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

        <InputReadOnly label={text.value} value={formatCurrencyBRL(valuePreview)} />

        <Controller
          name={`expenses.${index}.who_pay`}
          control={control}
          render={({ field: { name, value } }) => (
            <Select
              label={text.whoPay}
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
              label={text.apropriation}
              name={name}
              value={
                isRateio
                  ? {
                      label: chargeApropriationOptions.getLabel('N', languageGB),
                      value: 'N' as ChargeApropriation,
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
          aria-label={rowText.removeButton}
          mensegerTooltip={rowText.removeButton}
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
        title={rowText.removeConfirm.title}
        description={rowText.removeConfirm.message}
        warningText=""
        hideQuestionMark
        colorPalette="red"
      />
    </Box>
  );
}
