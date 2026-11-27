// src/pages/Public/RequestQuotation/RequestQuotationPublicItemRow.tsx
// -----------------------------------------------------------------------------
// ITEM do formulário público do fornecedor (hash, RequestQuotation — esteira
// 97-Esteiras/035, TASK-CQ-FE-10). A lista de itens é FIXA, definida pelo
// servidor no `GET` (`PublicRequestQuotationData.items[]`): o fornecedor NUNCA
// adiciona/remove itens — só preenche quantidade ofertada, `brand`,
// `unitary_value` e `observation` por linha já existente. Endereçada por
// `request_item_uuid` (nunca por posição/índice do array, fecha a fragilidade do
// legado — roteiro API §9.1).
//
// `description` e a quantidade PEDIDA são SEMPRE somente-leitura (texto).
// QUANTIDADE OFERTADA (27/11/2026): o fornecedor nem sempre tem o total pedido;
// a coluna vem preenchida com a quantidade da solicitação e ele pode alterar
// (`items.N.quantity` do formulário). O valor da linha = preço unitário (até 4
// casas) x quantidade OFERTADA, em 2 casas — calculado na tela e nunca enviado
// como valor (o servidor recalcula).
//
// SEM ESTOQUE (27/11/2026): o fornecedor pode marcar o item "Sem estoque" (ou
// zerar a quantidade ofertada e sair do campo). Isso NÃO impede a cotação do
// resto: o item segue na devolução como `available: false` (quantidade 0), com
// preço e marca dispensados, e o comprador vê "Sem estoque" no mapa de cotações.
// Desmarcar volta a quantidade pedida.
//
// REPAGINAÇÃO (só apresentação): cada item é uma LINHA de tabela com edição na
// própria linha (`getItemTableCells`, usada por `RequestQuotationPublicItems`):
// sem rótulo visível por campo — o cabeçalho da tabela rotula e cada campo leva
// `aria-label`.
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Box, Flex, Text } from '@chakra-ui/react';
import { Controller, useWatch } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusTag } from '@/components/ui/StatusTag';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  PublicRequestQuotationItemRow as PublicItemData,
  PublicRequestQuotationForm,
} from '@/@types/v2/RequestQuotations';

import { formatCurrency, isPartialOffer } from './publicQuotationProgress';
import { lineAmount } from './publicQuotationTotals';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface RequestQuotationPublicItemRowProps {
  control: Control<PublicRequestQuotationForm>;
  errors: FieldErrors<PublicRequestQuotationForm>;
  setValue: UseFormSetValue<PublicRequestQuotationForm>;
  index: number;
  item: PublicItemData;
  disabled: boolean;
}

type PublicFormText = ReturnType<typeof usePublicFormText>;

function usePublicFormText() {
  const { languageGB } = useLanguage();
  return languageGB.requestQuotations.requestQuotation.publicForm;
}

/** Entrega ao filho se o item está sem estoque (reativo), para desabilitar os campos da linha. */
function Availability({
  control,
  index,
  children,
}: {
  control: Control<PublicRequestQuotationForm>;
  index: number;
  children: (unavailable: boolean) => ReactNode;
}) {
  const available = useWatch({ control, name: `items.${index}.available` });
  return <>{children(available === false)}</>;
}

/** Valor da linha = preço unitário x quantidade OFERTADA, reativo (aria-live fica no total geral). */
function LineAmount({ control, index }: { control: Control<PublicRequestQuotationForm>; index: number }) {
  const unit = useWatch({ control, name: `items.${index}.unitary_value` });
  const quantity = useWatch({ control, name: `items.${index}.quantity` });
  return (
    <Text
      as="span"
      fontSize="inherit"
      fontWeight="semibold"
      color="cardTextPrimary"
      css={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {formatCurrency(lineAmount(unit, quantity ?? 0))}
    </Text>
  );
}

/** Marca "Parcial" quando o fornecedor oferta menos do que o pedido (e tem estoque). */
function PartialTag({
  control,
  index,
  requested,
  label,
}: {
  control: Control<PublicRequestQuotationForm>;
  index: number;
  requested: number;
  label: string;
}) {
  const offered = useWatch({ control, name: `items.${index}.quantity` });
  const available = useWatch({ control, name: `items.${index}.available` });
  if (available === false || !isPartialOffer(offered, requested)) return null;
  return <StatusTag size="sm" label={label} color="orange.600" />;
}

/** Campos editáveis do item (sem rótulo visível: o cabeçalho da tabela rotula). */
function renderEditableFields(
  { control, errors, setValue, index, item, disabled }: RequestQuotationPublicItemRowProps,
  text: PublicFormText
): {
  quantity: ReactNode;
  unavailable: ReactNode;
  brand: ReactNode;
  unit: ReactNode;
  observation: ReactNode;
} {
  const itemErrors = errors.items?.[index];
  // Quantidade inteira: digitar "30" dá 30. Só admite casas quando o pedido já é fracionado.
  const fractional = !Number.isInteger(item.quantity);

  function markUnavailable() {
    setValue(`items.${index}.available`, false, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${index}.quantity`, 0, { shouldDirty: true });
    setValue(`items.${index}.unitary_value`, null, { shouldDirty: true });
  }

  function markAvailable() {
    setValue(`items.${index}.available`, true, { shouldDirty: true, shouldValidate: true });
    setValue(`items.${index}.quantity`, item.quantity, { shouldDirty: true });
  }

  return {
    quantity: (
      <Box>
        <Availability control={control} index={index}>
          {(unavailable) => (
            <Controller
              name={`items.${index}.quantity`}
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  aria-label={`${text.fields.offeredQuantity} - ${item.description}`}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? 0)}
                  // Zerar e sair do campo = não tenho este item (marca "sem estoque").
                  onBlur={() => {
                    if (!unavailable && (field.value ?? 0) === 0) markUnavailable();
                  }}
                  min={0}
                  allowDot={fractional}
                  decimalPlaces={fractional ? 3 : 0}
                  error={itemErrors?.quantity?.message as string | undefined}
                  isRequired
                  disabled={disabled || unavailable}
                />
              )}
            />
          )}
        </Availability>
        <Box mt="4px">
          <PartialTag
            control={control}
            index={index}
            requested={item.quantity}
            label={text.itemsSection.partialOffer}
          />
        </Box>
      </Box>
    ),
    unavailable: (
      <Controller
        name={`items.${index}.available`}
        control={control}
        render={({ field }) => (
          <Flex align="center">
            <Checkbox
              checked={field.value === false}
              onCheckedChange={(details: { checked: boolean | 'indeterminate' }) =>
                details.checked === true ? markUnavailable() : markAvailable()
              }
              aria-label={`${text.fields.unavailable} - ${item.description}`}
              disabled={disabled}
            />
          </Flex>
        )}
      />
    ),
    brand: (
      <Availability control={control} index={index}>
        {(unavailable) => (
          <Controller
            name={`items.${index}.brand`}
            control={control}
            render={({ field }) => (
              <Input
                aria-label={`${text.fields.brand} - ${item.description}`}
                name={field.name}
                placeholder={unavailable ? '—' : text.placeholders.brand}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                error={itemErrors?.brand?.message as string | undefined}
                isRequired={!unavailable}
                disabled={disabled || unavailable}
              />
            )}
          />
        )}
      </Availability>
    ),
    unit: (
      <Availability control={control} index={index}>
        {(unavailable) => (
          <Controller
            name={`items.${index}.unitary_value`}
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                aria-label={`${text.fields.unitaryValue} - ${item.description}`}
                fractionDigits={4}
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                error={itemErrors?.unitary_value?.message as string | undefined}
                isRequired={!unavailable}
                disabled={disabled || unavailable}
              />
            )}
          />
        )}
      </Availability>
    ),
    observation: (
      <Controller
        name={`items.${index}.observation`}
        control={control}
        render={({ field }) => (
          <Input
            aria-label={`${text.fields.observation} - ${item.description}`}
            name={field.name}
            placeholder={text.placeholders.observation}
            maxLength={60}
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
            error={itemErrors?.observation?.message as string | undefined}
            disabled={disabled}
          />
        )}
      />
    ),
  };
}

/** Células da linha para o `SimpleTable`. Chaves = colunas da tabela. */
export function getItemTableCells(
  props: RequestQuotationPublicItemRowProps,
  text: PublicFormText
): Record<string, ReactNode> {
  const fields = renderEditableFields(props, text);
  return {
    index: (
      <Text as="span" fontSize="inherit" color="cardTextSecondary" fontWeight="semibold">
        {props.index + 1}
      </Text>
    ),
    item: (
      <Box minW="160px">
        <Text as="span" fontSize="inherit" fontWeight="medium" color="cardTextPrimary">
          {props.item.description}
        </Text>
      </Box>
    ),
    requested: (
      <Text as="span" fontSize="inherit" css={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(props.item.quantity)}
      </Text>
    ),
    quantity: <Box minW="90px">{fields.quantity}</Box>,
    unavailable: <Box>{fields.unavailable}</Box>,
    brand: <Box minW="110px">{fields.brand}</Box>,
    unit: <Box minW="115px">{fields.unit}</Box>,
    total: <LineAmount control={props.control} index={props.index} />,
    observation: <Box minW="130px">{fields.observation}</Box>,
  };
}
