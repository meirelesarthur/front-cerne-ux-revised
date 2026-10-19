// src/pages/Financeiro/Contrato/ContractItemRow.tsx
// -----------------------------------------------------------------------------
// Bloco de UI "Itens do Contrato" do formulário único de Gestão de Contratos
// (Contract — Financeiro, esteira 97-Esteiras/023, TASK-CTR-FE-06). Dona do
// `useFieldArray` (name: `items`), botão "Adicionar Item", estado vazio,
// botão remover por linha. `TASK-CTR-FE-08` (formulário único, ainda não
// construído) CONSOME este componente — não reimplementa o array.
//
// Mirror estrutural de `RequestItemRow.tsx`
// (`src/pages/Administrativo/Solicitacao/RequestItemRow.tsx`, TASK-RP-FE-07),
// PODADO: Contract não tem enum de `type` (Riscos + solução da Tarefa) — não
// existe matriz `VISIBLE_ITEM_FIELDS_BY_TYPE`, nenhum `watch` de cabeçalho
// condicionando campos. Sempre os mesmos 3 campos por linha: `warehouse_uuid`
// / `product_uuid` / `quantity`.
//
// -- Selects de Armazém/Produto -----------------------------------------
// `warehouse_uuid`/`product_uuid` já são `Option<string> | null` no shape do
// FORM (`ItemContractFormRow`, `@/@types/v2/Contracts`, TASK-CTR-FE-01,
// congelado) — mesmo racional já usado por `product_uuid` em
// `RequestItemRow`: não precisa de cache externo de label, o próprio campo do
// RHF já guarda `{label, value}`. A hidratação do valor em modo edição (a
// partir de `ContractData.items[].warehouse`/`.product`) é responsabilidade
// do `fillForm` de `TASK-CTR-FE-08` (fora de escopo aqui).
//
// Consome `listWarehouseOptions` (`@/services/v2/Warehouses/warehouse-service`)
// e `listProductOptions` (`@/services/v2/Products/product-service`) — ambos
// endpoints `/warehouses/options` e `/products/options` CONFIRMADOS reais
// (`Contract-FrontEnd-contrato.md` §3, TASK-CTR-FE-05).
//
// A validação de `items.min(1)` é do schema (`contract-schema.ts`,
// TASK-CTR-FE-04) — este componente NÃO bloqueia o `remove()` do último item,
// só reforça visualmente com a mensagem de estado vazio quando
// `fields.length === 0` (mirror exato de `RequestItemRow`/
// `EquipamentoRateioCentroCustoTab`).
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import { useLanguage } from '@/hooks/useLanguage';

import { categoryProductType } from '@/constants/CategoryProducts/category-product-type';

import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { ContractForm } from '@/@types/v2/Contracts';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import type { Control, FieldErrors } from 'react-hook-form';

export interface ContractItemRowProps {
  control: Control<ContractForm>;
  errors: FieldErrors<ContractForm>;
  isLoading: boolean;
  canSave: boolean;
}

function emptyItemRow() {
  return {
    item_uuid: null,
    warehouse_uuid: null,
    product_uuid: null,
    quantity: null,
  };
}

export function ContractItemRow({ control, errors, isLoading, canSave }: ContractItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.contracts.contract.form;
  const itemText = text.itemsSection;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isDisabled = !canSave || isLoading;

  function handleAdd() {
    append(emptyItemRow());
  }

  // Erro de nível de ARRAY (`itemsMinOne`) — mesma leitura de
  // `itemsArrayError` em `RequestItemRow`.
  const itemsArrayError = errors.items?.message as string | undefined;

  return (
    <Box pt={4}>
      <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
          <Text fontSize="sm" fontWeight="semibold">
            {itemText.title}
          </Text>
          <Button
            title={itemText.addButton}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            type="button"
            onClick={handleAdd}
            disabled={isDisabled}
          />
        </Flex>

        {itemsArrayError && (
          <Text fontSize="xs" color="fg.error" mb={4}>
            {itemsArrayError}
          </Text>
        )}

        {fields.length === 0 ? (
          <Box py={2}>
            <Text fontSize="sm" color="fg.muted">
              {itemText.emptyState}
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={4}>
            {fields.map((field, index) => (
              <Flex
                key={field.id}
                gap={3}
                align="flex-end"
                wrap="wrap"
                pb={4}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                <Box flex="2" minW="260px">
                  <Controller
                    name={`items.${index}.warehouse_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={itemText.fields.warehouse}
                        service={listWarehouseOptions}
                        mapOptions={(item: WarehouseOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />
                </Box>

                <Box flex="2" minW="260px">
                  <Controller
                    name={`items.${index}.product_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={itemText.fields.product}
                        service={listProductOptions}
                        mapOptions={(item: ProductOptionItem) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        // Só o CONTRATO restringe a Insumos — RequestItemRow
                        // (RequestPurchase) não envia `category_type`
                        // (paridade legado, todas as categorias).
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          category_type: categoryProductType.input,
                        })}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '160px' }}>
                  <Controller
                    name={`items.${index}.quantity`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <NumberInput
                        name={rowField.name}
                        label={itemText.fields.quantity}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        allowDot
                        decimalPlaces={2}
                        min={0.01}
                        error={fieldState.error?.message}
                        isRequired
                        disabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <IconButtonTable
                  aria-label={itemText.removeButton}
                  mensegerTooltip={itemText.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  type="button"
                  disabled={isDisabled}
                  onClick={() => remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>
    </Box>
  );
}
