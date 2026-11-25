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

import { ReactNode, useState } from 'react';

import { Box, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { IconButtonTable } from '@/components/IconButtonTable';
import { SimpleTable, type SimpleTableColumn, type SimpleTableRow } from '@/components/ui/SimpleTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { requestPurchaseType } from '@/constants/RequestPurchases/request-purchase-type';

import {
  ITEM_DESCRIPTION_MAX,
  ITEM_OBSERVATION_MAX,
  ITEM_SERVICE_DESCRIPTION_MAX,
  REQUIRED_ITEM_FIELDS_BY_TYPE,
} from '@/validations/schemas/RequestPurchases/request-purchase-schema';

import type { RequestPurchaseForm } from '@/@types/v2/RequestPurchases';

import {
  canRemoveItem,
  emptyItemRow,
  isDailyNifReadOnly,
  isItemRowIncomplete,
} from './itemRowGuards';
import { RequestItemProductField } from './RequestItemProductField';
import { RequestTabEmpty, RequestTabHeader } from './RequestTabParts';

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

// Ordem das colunas na tabela de itens (a mesma ordem de leitura do formulário
// antigo): produto, quantidades e valor, dados da pessoa e descrições.
const ITEM_FIELD_ORDER: ItemFieldKey[] = [
  'product_uuid',
  'quantity',
  'quantity_integer',
  'amount',
  'name',
  'nif',
  'phone',
  'daily_quantity',
  'service_description',
  'service_description_contract',
  'description_short',
  'description_short_free',
  'description',
  'observation',
];

// Descrição longa de S, A/R, F e E (o legado aceita até 800).
const ITEM_LONG_DESCRIPTION_MAX = 800;

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
  const requiredByType: string[] = selectedType
    ? (REQUIRED_ITEM_FIELDS_BY_TYPE[selectedType] ?? [])
    : [];

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

  // Uma coluna por campo visível do tipo, na ordem de leitura da linha; o
  // rótulo vai no cabeçalho (com * quando obrigatório) e a célula só tem o campo.
  const fieldColumns: Record<
    ItemFieldKey,
    { header: string; required: boolean; minW: string; render: (index: number) => ReactNode }
  > = {
    product_uuid: {
      header: itemText.fields.product,
      required: false,
      minW: '280px',
      render: (index) => (
        <RequestItemProductField
          control={control}
          index={index}
          disabled={isDisabled}
          withProductModal={PRODUCT_MODAL_TYPES.includes(selectedType ?? '')}
          hideLabel
        />
      ),
    },
    quantity: {
      header: itemText.fields.quantity,
      required: true,
      minW: '120px',
      render: (index) => (
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <NumberInput
              allowDot
              name={rowField.name}
              aria-label={itemText.fields.quantity}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              decimalPlaces={2}
              min={0}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // Serviço (S): quantidade INTEIRA, default 1 (legado: `days integer`).
    quantity_integer: {
      header: itemText.fields.quantity,
      required: true,
      minW: '110px',
      render: (index) => (
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <MaskedInput
              kind="integer"
              name={rowField.name}
              aria-label={itemText.fields.quantity}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              min={0}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // Valor em reais em TODO tipo (pedido do dono, 25/11); obrigatório só onde
    // o schema exige (A/R/C/B/F/E).
    amount: {
      header: `${itemText.fields.amount} (R$)`,
      required: requiredByType.includes('amount'),
      minW: '140px',
      render: (index) => (
        <Controller
          name={`items.${index}.amount`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <MaskedInput
              kind="currency"
              name={rowField.name}
              aria-label={itemText.fields.amount}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              min={0}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    name: {
      header: itemText.fields.name,
      required: true,
      minW: '200px',
      render: (index) => (
        <Controller
          name={`items.${index}.name`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.name}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // Diária: CPF com máscara; somente leitura na edição (FM29).
    nif: {
      header: itemText.fields.nif,
      required: true,
      minW: '160px',
      render: (index) => (
        <Controller
          name={`items.${index}.nif`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <MaskedInput
              kind="cpf"
              aria-label={itemText.fields.nif}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
              readOnly={isDailyNifReadOnly(items[index])}
            />
          )}
        />
      ),
    },
    phone: {
      header: itemText.fields.phone,
      required: true,
      minW: '160px',
      render: (index) => (
        <Controller
          name={`items.${index}.phone`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <MaskedInput
              kind="phone"
              aria-label={itemText.fields.phone}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    daily_quantity: {
      header: itemText.fields.dailyQuantity,
      required: true,
      minW: '110px',
      render: (index) => (
        <Controller
          name={`items.${index}.daily_quantity`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <MaskedInput
              kind="integer"
              name={rowField.name}
              aria-label={itemText.fields.dailyQuantity}
              value={rowField.value ?? null}
              onValueChange={(value) => rowField.onChange(value)}
              min={0}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // D: descrição do serviço (máx. 200).
    service_description: {
      header: itemText.fields.serviceDescription,
      required: true,
      minW: '260px',
      render: (index) => (
        <Controller
          name={`items.${index}.service_description`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.serviceDescription}
              name={rowField.name}
              maxLength={ITEM_SERVICE_DESCRIPTION_MAX}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // C/B: "Descrição de serviços" (A-16, obrigatória em C e B).
    service_description_contract: {
      header: itemText.fields.contractServiceDescription,
      required: true,
      minW: '300px',
      render: (index) => (
        <Controller
          name={`items.${index}.service_description`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.contractServiceDescription}
              name={rowField.name}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // P/M/U: descrição curta (máx. 60).
    description_short: {
      header: itemText.fields.description,
      required: true,
      minW: '240px',
      render: (index) => (
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.description}
              name={rowField.name}
              maxLength={ITEM_DESCRIPTION_MAX}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // F/E: descrição em texto simples.
    description_short_free: {
      header: itemText.fields.description,
      required: true,
      minW: '260px',
      render: (index) => (
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.description}
              name={rowField.name}
              maxLength={ITEM_LONG_DESCRIPTION_MAX}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // S e A/R (obrigatória) e C/B/D (aberta, opcional): descrição longa
    // (máx. 800) — em tabela, campo de uma linha.
    description: {
      header: itemText.fields.description,
      required: requiredByType.includes('description'),
      minW: '300px',
      render: (index) => (
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.description}
              name={rowField.name}
              maxLength={ITEM_LONG_DESCRIPTION_MAX}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
    // S: observação opcional (máx. 90).
    observation: {
      header: itemText.fields.observation,
      required: false,
      minW: '220px',
      render: (index) => (
        <Controller
          name={`items.${index}.observation`}
          control={control}
          render={({ field: rowField, fieldState }) => (
            <Input
              aria-label={itemText.fields.observation}
              name={rowField.name}
              maxLength={ITEM_OBSERVATION_MAX}
              value={rowField.value ?? ''}
              onChange={(event) => rowField.onChange(event.target.value)}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      ),
    },
  };

  // Todo item tem Valor (R$) e uma Descrição aberta (pedido do dono, 25/11):
  // tipos sem esses campos (P/M/U/S/D sem valor; C/B/D sem descrição) ganham
  // a coluna, opcional; a obrigatoriedade continua a do schema.
  const hasDescription = (
    ['description_short', 'description_short_free', 'description'] as ItemFieldKey[]
  ).some(isFieldVisible);
  const shownFields = ITEM_FIELD_ORDER.filter(
    (key) =>
      isFieldVisible(key) ||
      (!!selectedType && key === 'amount') ||
      (!!selectedType && key === 'description' && !hasDescription)
  );

  const columns: SimpleTableColumn[] = [
    { key: 'index', header: '#' },
    ...shownFields.map((key) => ({
      key,
      header: fieldColumns[key].required
        ? `${fieldColumns[key].header} *`
        : fieldColumns[key].header,
    })),
    { key: 'actions', header: '', align: 'right' as const },
  ];

  const rows: SimpleTableRow[] = fields.map((field, index) => ({
    key: field.id,
    cells: {
      index: (
        <Text color="fg.muted" fontWeight="medium">
          {index + 1}
        </Text>
      ),
      ...Object.fromEntries(
        shownFields.map((key) => [
          key,
          <Box key={key} minW={fieldColumns[key].minW}>
            {fieldColumns[key].render(index)}
          </Box>,
        ])
      ),
      actions: (
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
      ),
    },
  }));

  return (
    <Box pt={4}>
      <RequestTabHeader title={text.tabs.items} count={fields.length}>
        <Button
          title={itemText.addButton}
          variant="outline"
          size="sm"
          type="button"
          onClick={handleAdd}
          disabled={isDisabled || !selectedType}
        />
      </RequestTabHeader>

      {itemsArrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {itemsArrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <RequestTabEmpty>
          {selectedType || isDisabled ? itemText.emptyLabel : itemText.chooseTypeFirst}
        </RequestTabEmpty>
      ) : (
        <SimpleTable columns={columns} rows={rows} ariaLabel={text.tabs.items} />
      )}

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
