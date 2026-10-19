// src/pages/Administrativo/Solicitacao/RequestItemRow.tsx
// -----------------------------------------------------------------------------
// Seção "Itens" do formulário único de Solicitação de Compras (RequestPurchase —
// Administrativo/Suprimentos). Dona do `useFieldArray` de `items`, do botão
// "Adicionar item", do estado vazio e do botão remover por linha.
//
// Execução 081 / T-081-FE-05 — campos por tipo IGUAIS ao legado
// (LEGADO-SUPRIMENTOS-03, FM20..FM38):
//   P/M/U  produto OPCIONAL (+/lápis abre o `ProductFormModal`), quantidade,
//          descrição (máx. 60);
//   S      quantidade INTEIRA (default 1), descrição, observação (máx. 90);
//   A/R    descrição e valor;
//   D      nome, CPF (máscara; somente leitura em linha já gravada), telefone
//          (máscara), quantidade de diárias e descrição do serviço (máx. 200);
//   C/B    "Descrição de serviços" e valor (obrigatória em C e B, A-16);
//   F/E    select de produto opcional, descrição e valor.
// Guardas (itemRowGuards.ts): "Adicionar item" bloqueado com a última linha
// incompleta, remover pede confirmação e o último item não sai (PR-I14/I15).
//
// A matriz de obrigatórios é a do schema (`REQUIRED_ITEM_FIELDS_BY_TYPE`); a de
// campos VISÍVEIS fica aqui, espelhando o `handleType` do legado.
// -----------------------------------------------------------------------------

import { ElementType, useState } from 'react';

import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import {
  ITEM_DESCRIPTION_MAX,
  ITEM_OBSERVATION_MAX,
  ITEM_SERVICE_DESCRIPTION_MAX,
} from '@/validations/schemas/RequestPurchases/request-purchase-schema';

import type { RequestPurchaseForm } from '@/@types/v2/RequestPurchases';

import {
  canRemoveItem,
  emptyItemRow,
  isDailyNifReadOnly,
  isItemRowIncomplete,
} from './itemRowGuards';
import { RequestItemProductField } from './RequestItemProductField';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface RequestItemRowProps {
  control: Control<RequestPurchaseForm>;
  errors: FieldErrors<RequestPurchaseForm>;
  watch: UseFormWatch<RequestPurchaseForm>;
  isLoading: boolean;
  canSave: boolean;
}

type ItemFieldKey =
  | 'product_uuid'
  | 'quantity'
  | 'quantity_integer'
  | 'amount'
  | 'name'
  | 'nif'
  | 'phone'
  | 'description'
  | 'description_short'
  | 'description_short_free'
  | 'observation'
  | 'service_description'
  | 'service_description_contract'
  | 'daily_quantity';

// Campos visíveis por tipo (espelha `handleType` do legado, `_forms.blade.php`).
const VISIBLE_ITEM_FIELDS_BY_TYPE: Record<string, ItemFieldKey[]> = {
  [requestPurchaseType.produto]: ['product_uuid', 'quantity', 'description_short'], // P
  [requestPurchaseType.manutencao]: ['product_uuid', 'quantity', 'description_short'], // M
  [requestPurchaseType.emergencial]: ['product_uuid', 'quantity', 'description_short'], // U
  [requestPurchaseType.servico]: ['quantity_integer', 'description', 'observation'], // S
  [requestPurchaseType.adiantamento]: ['amount', 'description'], // A
  [requestPurchaseType.reembolso]: ['amount', 'description'], // R
  [requestPurchaseType.empreitada]: ['service_description_contract', 'amount'], // C
  [requestPurchaseType.despesaFixa]: ['service_description_contract', 'amount'], // B
  [requestPurchaseType.compraEfetuada]: ['product_uuid', 'amount', 'description_short_free'], // F
  [requestPurchaseType.frete]: ['product_uuid', 'amount', 'description_short_free'], // E
  [requestPurchaseType.diaria]: ['name', 'nif', 'phone', 'daily_quantity', 'service_description'], // D
};

// P/M/U têm botão de cadastro de produto; F/E só o select.
const PRODUCT_MODAL_TYPES: string[] = [
  requestPurchaseType.produto,
  requestPurchaseType.manutencao,
  requestPurchaseType.emergencial,
];

export function RequestItemRow({
  control,
  errors,
  watch,
  isLoading,
  canSave,
}: RequestItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchases.requestPurchase.form;
  const itemText = text.itemsSection;
  const guardText = text.guards;

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const isDisabled = !canSave || isLoading;

  const selectedType = watch('type')?.value ?? null;
  const visibleFields: ItemFieldKey[] = selectedType
    ? (VISIBLE_ITEM_FIELDS_BY_TYPE[selectedType] ?? [])
    : [];
  const items = watch('items') ?? [];

  const [indexToRemove, setIndexToRemove] = useState<number | null>(null);

  function isFieldVisible(field: ItemFieldKey): boolean {
    return visibleFields.includes(field);
  }

  // PR-I14 — bloqueia "Adicionar item" com a última linha incompleta.
  function handleAdd() {
    const last = items[items.length - 1];
    if (items.length > 0 && isItemRowIncomplete(selectedType, last)) {
      toaster.warning({
        title: guardText.addBlockedTitle,
        description: guardText.addBlockedDescription,
      });
      return;
    }
    append(emptyItemRow(selectedType));
  }

  // PR-I15 — remover confirma; o último item não sai.
  function handleRemoveRequest(index: number) {
    if (!canRemoveItem(fields.length)) {
      toaster.warning({
        title: guardText.lastItemTitle,
        description: guardText.lastItemDescription,
      });
      return;
    }
    setIndexToRemove(index);
  }

  function handleRemoveConfirm() {
    if (indexToRemove !== null) remove(indexToRemove);
    setIndexToRemove(null);
  }

  // Erro de nível de ARRAY (`items-required-fields-by-type`/`itemsMinOne`).
  const itemsArrayError = errors.items?.message as string | undefined;

  return (
    <Box pt={4}>
      <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
          <Text fontSize="sm" fontWeight="semibold">
            {text.tabs.items}
          </Text>
          <Button
            title={itemText.addButton}
            icon={FiPlus as ElementType}
            variant="outline"
            size="sm"
            type="button"
            onClick={handleAdd}
            disabled={isDisabled || !selectedType}
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
              {itemText.emptyLabel}
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap={4}>
            {fields.map((field, index) => (
              <Flex
                key={field.id}
                gap={3}
                align="flex-start"
                wrap="wrap"
                pb={4}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                {isFieldVisible('product_uuid') && (
                  <Box flex="2" minW="260px">
                    <RequestItemProductField
                      control={control}
                      index={index}
                      disabled={isDisabled}
                      withProductModal={PRODUCT_MODAL_TYPES.includes(selectedType ?? '')}
                    />
                  </Box>
                )}

                {isFieldVisible('quantity') && (
                  <Box w={{ base: 'full', sm: '160px' }}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <NumberInput
                          allowDot
                          name={rowField.name}
                          label={itemText.fields.quantity}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          decimalPlaces={2}
                          min={0}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* Serviço (S): quantidade INTEIRA, default 1 (legado: `days integer`). */}
                {isFieldVisible('quantity_integer') && (
                  <Box w={{ base: 'full', sm: '160px' }}>
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <MaskedInput
                          kind="integer"
                          name={rowField.name}
                          label={itemText.fields.quantity}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          min={0}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {isFieldVisible('amount') && (
                  <Box w={{ base: 'full', sm: '180px' }}>
                    <Controller
                      name={`items.${index}.amount`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <NumberInput
                          allowDot
                          name={rowField.name}
                          label={itemText.fields.amount}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          decimalPlaces={2}
                          min={0}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {isFieldVisible('name') && (
                  <Box flex="1" minW="220px">
                    <Controller
                      name={`items.${index}.name`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Input
                          label={itemText.fields.name}
                          name={rowField.name}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* Diária: CPF com máscara; somente leitura na edição (FM29). */}
                {isFieldVisible('nif') && (
                  <Box w={{ base: 'full', sm: '180px' }}>
                    <Controller
                      name={`items.${index}.nif`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <MaskedInput
                          kind="cpf"
                          label={itemText.fields.nif}
                          name={rowField.name}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                          readOnly={isDailyNifReadOnly(items[index])}
                        />
                      )}
                    />
                  </Box>
                )}

                {isFieldVisible('phone') && (
                  <Box w={{ base: 'full', sm: '180px' }}>
                    <Controller
                      name={`items.${index}.phone`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <MaskedInput
                          kind="phone"
                          label={itemText.fields.phone}
                          name={rowField.name}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {isFieldVisible('daily_quantity') && (
                  <Box w={{ base: 'full', sm: '160px' }}>
                    <Controller
                      name={`items.${index}.daily_quantity`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <MaskedInput
                          kind="integer"
                          name={rowField.name}
                          label={itemText.fields.dailyQuantity}
                          value={rowField.value ?? null}
                          onValueChange={(value) => rowField.onChange(value)}
                          min={0}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* D: descrição do serviço (máx. 200). */}
                {isFieldVisible('service_description') && (
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`items.${index}.service_description`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Input
                          label={itemText.fields.serviceDescription}
                          name={rowField.name}
                          maxLength={ITEM_SERVICE_DESCRIPTION_MAX}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* C/B: "Descrição de serviços" (A-16, obrigatória em C e B). */}
                {isFieldVisible('service_description_contract') && (
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`items.${index}.service_description`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Input
                          label={itemText.fields.contractServiceDescription}
                          name={rowField.name}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* P/M/U: descrição curta (máx. 60). */}
                {isFieldVisible('description_short') && (
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`items.${index}.description`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Input
                          label={itemText.fields.description}
                          name={rowField.name}
                          maxLength={ITEM_DESCRIPTION_MAX}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* F/E: descrição em texto simples. */}
                {isFieldVisible('description_short_free') && (
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`items.${index}.description`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Input
                          label={itemText.fields.description}
                          name={rowField.name}
                          maxLength={800}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* S e A/R: descrição em área de texto. */}
                {isFieldVisible('description') && (
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`items.${index}.description`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Textarea
                          label={itemText.fields.description}
                          name={rowField.name}
                          maxLength={800}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          isRequired
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                {/* S: observação opcional (máx. 90). */}
                {isFieldVisible('observation') && (
                  <Box flex="2" minW="260px">
                    <Controller
                      name={`items.${index}.observation`}
                      control={control}
                      render={({ field: rowField, fieldState }) => (
                        <Input
                          label={itemText.fields.observation}
                          name={rowField.name}
                          maxLength={ITEM_OBSERVATION_MAX}
                          value={rowField.value ?? ''}
                          onChange={(event) => rowField.onChange(event.target.value)}
                          error={fieldState.error?.message}
                          disabled={isDisabled}
                        />
                      )}
                    />
                  </Box>
                )}

                <IconButtonTable
                  aria-label={itemText.removeButton}
                  mensegerTooltip={itemText.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleRemoveRequest(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            ))}
          </Flex>
        )}
      </Box>

      <DeleteConfirmDialog
        isOpen={indexToRemove !== null}
        onClose={() => setIndexToRemove(null)}
        onConfirm={handleRemoveConfirm}
        title={guardText.removeConfirmTitle}
        description={guardText.removeConfirmDescription}
        confirmButtonText={guardText.removeConfirm}
        cancelButtonText={guardText.removeCancel}
        warningText=""
        hideQuestionMark
        tone="warning"
      />
    </Box>
  );
}
