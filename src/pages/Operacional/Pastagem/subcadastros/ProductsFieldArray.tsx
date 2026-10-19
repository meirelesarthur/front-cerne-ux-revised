// src/pages/Operacional/Pastagem/subcadastros/ProductsFieldArray.tsx
// -----------------------------------------------------------------------------
// Aba "Produtos/Insumos" — TASK-PAST-FE-05. `useFieldArray` de `inputs`.
// Cascata armazém→estoque→um: o armazém é campo ÚNICO da PRÓPRIA aba
// (`inputs_warehouse_uuid`) — cada linha só escolhe o Estoque.
//
// TASK-PAST-FIX-FE-03b (fidelidade de layout ao legado, decisão do dono) —
// "Armazém de Insumos" RELOCADO do cabeçalho (`HeaderFieldsPastagem.tsx`)
// para o TOPO desta aba, mirror exato do legado (`_product.blade.php`:
// `Form::select('inputs_warehouse_id', ...)` no topo da própria aba,
// `readonly` quando `isset($item)`). Mesmo nome de campo RHF
// (`inputs_warehouse_uuid`, mesmo `control` raiz) — só o componente que
// renderiza o Controller mudou. Readonly em modo EDIÇÃO (`isEditing`,
// mirror `isset($item)` do legado — não inventa condição nova); em
// criação, `SelectAsyncPaginate` normal.
//
// ⚠️ DECISÃO DE SHAPE (achado desta Tarefa, não é Gap — resolvido dentro do
// mandato do Executor): `PastureRequest::rules()` exige
// `inputs.*.stock_uuid` como `required|exists:stocks,uuid` — o uuid do
// PRÓPRIO `Stock`, não do Produto. `GET /stocks/available`
// (`listStockAvailability`, usado por `Appropriations/tabs/
// AppropriationStockTab.tsx`) só expõe `product.uuid`/`warehouse_uuid`
// (sem `uuid` do Stock) — não serve para preencher este campo. Por isso
// esta tela usa `listStocks` (`GET /stocks`, Saldo de Estoque, JÁ expõe
// `uuid` do Stock + `product`/`warehouse` aninhados), filtrado por
// `warehouse_uuid`. Trade-off aceito: perde o filtro `allow_pointing` (só
// existe em `/stocks/available`) — filtro cosmético, não impede o
// funcionamento; documentado para o Tester/Arquiteto avaliar se algum
// filtro adicional é necessário.
//
// Readonly em edição (CLM-64): linha já persistida trava
// `stock_uuid`/`measurement_uuid`.
//
// Aviso de estoque insuficiente — NÃO bloqueia o submit (mirror
// `AppropriationStockTab.tsx`/`StockQuantityExceedsWarningDialog.tsx`,
// versão inline mais simples: texto de alerta, sem modal de confirmação
// dedicado nesta Tarefa).
//
// `total_quantity` — calculado ao vivo como `quantity × quantity_unitary`
// (assunção documentada: o DTO real não define a fórmula exata; nomes de
// campo mirror `AppropriationStockItemPayload`, onde `total_quantity` é
// sempre derivado, nunca campo RHF independente). Enviado no payload
// (`PastureInputPayload.total_quantity`), recomputado no submit do form
// pai — nunca lido stale de um campo RHF.
// -----------------------------------------------------------------------------

import type { ElementType } from 'react';

import { Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { listMeasurementOptions } from '@/services/v2/Measurements/measurement-service';
import { listStocks } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { MeasurementOption } from '@/@types/v2/Measurements';
import type { PastureForm } from '@/@types/v2/Pastures';
import type { StockListItem } from '@/@types/v2/Stocks';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface ProductsFieldArrayProps {
  control: Control<PastureForm>;
  errors: FieldErrors<PastureForm>;
  watch: UseFormWatch<PastureForm>;
  isLoading: boolean;
  canSave: boolean;
  /** TASK-PAST-FIX-FE-03b — modo edição (mirror `isset($item)` do legado):
   *  trava "Armazém de Insumos" como `InputReadOnly`. */
  isEditing: boolean;
}

export function ProductsFieldArray({
  control,
  watch,
  isLoading,
  canSave,
  isEditing,
}: ProductsFieldArrayProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.pastures.pasture.form;
  const inputsText = text.inputs;

  const { fields, append, remove } = useFieldArray({ control, name: 'inputs' });
  const isDisabled = !canSave || isLoading;

  // TASK-PAST-FIX-FE-03b — "Armazém de Insumos" agora é renderizado por
  // ESTE componente (relocado do cabeçalho); lido via `watch` (já prop
  // desta aba) para escopar a busca de Estoque e gatear o Select de
  // Produto — mesmo racional de antes, só a origem do dado mudou de "prop
  // vindo do pai" para "watch local".
  const inputsWarehouseUuid = watch('inputs_warehouse_uuid')?.value;

  function listInputsWarehouseOptions(params: {
    search?: string;
    page?: number;
    per_page?: number;
  }) {
    return listWarehouseOptions({ ...params, type: 'insumos' });
  }

  function handleAdd() {
    append({
      stock_uuid: null,
      measurement_uuid: null,
      quantity: null,
      quantity_unitary: null,
      total_quantity: null,
    });
  }

  function listStockForWarehouse(params: { search?: string; page?: number; per_page?: number }) {
    return listStocks({ ...params, warehouse_uuid: inputsWarehouseUuid });
  }

  return (
    <Box pt={4}>
      {/* "Armazém de Insumos" — TASK-PAST-FIX-FE-03b, campo ÚNICO de
          cabeçalho DE ABA (mirror `warehouse_production_uuid` em
          `AppropriationProductionTab.tsx`), NÃO item de `inputs[]`; fora do
          `useFieldArray`. Readonly em edição (`isEditing`, mirror
          `isset($item)` do legado). */}
      <SimpleGrid columns={columnsForm.default} gap={4} mb={5}>
        <Controller
          name="inputs_warehouse_uuid"
          control={control}
          render={({ field }) =>
            isEditing ? (
              <InputReadOnly
                label={text.fields.inputsWarehouse}
                value={field.value?.label ?? '—'}
              />
            ) : (
              <SelectAsyncPaginate
                name={field.name}
                label={text.fields.inputsWarehouse}
                placeholder={text.placeholders.inputsWarehouse}
                service={listInputsWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: item.description,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )
          }
        />
      </SimpleGrid>

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyRow}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const isExistingRow = !!watch(`inputs.${index}.uuid`);
            const stockOption = watch(`inputs.${index}.stock_uuid`);
            const quantity = Number(watch(`inputs.${index}.quantity`)) || 0;
            const availableQuantity = stockOption?.quantity;
            const isInsufficient = availableQuantity !== undefined && quantity > availableQuantity;

            return (
              <Box
                key={field.id}
                p={4}
                border="1px solid"
                borderColor="border.subtle"
                borderRadius="lg"
              >
                {isExistingRow && (
                  <Text fontSize="xs" color="fg.muted" mb={2}>
                    {inputsText.readonlyHint}
                  </Text>
                )}
                <SimpleGrid columns={columnsForm.default} gap={4}>
                  <Controller
                    name={`inputs.${index}.stock_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      isExistingRow ? (
                        <InputReadOnly
                          label={inputsText.fields.stock}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={inputsText.fields.stock}
                          placeholder={inputsText.placeholders.stock}
                          service={listStockForWarehouse}
                          mapOptions={(item: StockListItem) => ({
                            label: `${item.product.description} (${item.info})`,
                            value: item.uuid,
                            quantity: item.quantity,
                            product: { label: item.product.description, value: item.product.uuid },
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={rowField.value ?? undefined}
                          onChange={(option: any) => rowField.onChange(option ?? null)}
                          isRequired
                          isDisabled={isDisabled || !inputsWarehouseUuid}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )
                    }
                  />

                  <Controller
                    name={`inputs.${index}.measurement_uuid`}
                    control={control}
                    render={({ field: rowField }) =>
                      isExistingRow ? (
                        <InputReadOnly
                          label={inputsText.fields.measurement}
                          value={rowField.value?.label ?? '—'}
                        />
                      ) : (
                        <SelectAsyncPaginate
                          name={rowField.name}
                          label={inputsText.fields.measurement}
                          placeholder={inputsText.placeholders.measurement}
                          service={listMeasurementOptions}
                          mapOptions={(item: MeasurementOption) => ({
                            label: item.description,
                            value: item.uuid,
                          })}
                          findParams={(search: string | { search: string }) => ({
                            search: typeof search === 'string' ? search : search.search,
                          })}
                          value={rowField.value ?? undefined}
                          onChange={(option: any) => rowField.onChange(option ?? null)}
                          isDisabled={isDisabled}
                          menuPortalTarget={document.body}
                          menuPosition="fixed"
                        />
                      )
                    }
                  />

                  <Controller
                    name={`inputs.${index}.quantity`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={inputsText.fields.quantity}
                        allowDot
                        decimalPlaces={2}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        disabled={isDisabled}
                      />
                    )}
                  />

                  <Controller
                    name={`inputs.${index}.quantity_unitary`}
                    control={control}
                    render={({ field: rowField }) => (
                      <NumberInput
                        name={rowField.name}
                        label={inputsText.fields.quantityUnitary}
                        allowDot
                        decimalPlaces={2}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        disabled={isDisabled}
                      />
                    )}
                  />

                  <InputReadOnly
                    label={inputsText.fields.totalQuantity}
                    value={(
                      quantity * (Number(watch(`inputs.${index}.quantity_unitary`)) || 0)
                    ).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  />
                </SimpleGrid>

                {isInsufficient && (
                  <Text fontSize="xs" color="fg.error" mt={2}>
                    {inputsText.stockWarningInsufficient}
                  </Text>
                )}

                <Flex justify="flex-end" mt={3}>
                  <IconButtonTable
                    aria-label={text.removeItem}
                    mensegerTooltip={text.removeItem}
                    size="sm"
                    color="red.500"
                    variant="ghost"
                    disabled={isDisabled}
                    onClick={() => remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              </Box>
            );
          })}
        </Flex>
      )}

      <Button
        title={text.addItem}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
