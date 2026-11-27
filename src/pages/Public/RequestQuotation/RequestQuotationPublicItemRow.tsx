// src/pages/Public/RequestQuotation/RequestQuotationPublicItemRow.tsx
// -----------------------------------------------------------------------------
// ITEM do formulário público do fornecedor (hash, RequestQuotation — esteira
// 97-Esteiras/035, TASK-CQ-FE-10). A lista de itens é FIXA, definida pelo
// servidor no `GET` (`PublicRequestQuotationData.items[]`): o fornecedor NUNCA
// adiciona/remove itens — só preenche `brand`/`unitary_value`/`observation`
// por linha já existente. Endereçada por `request_item_uuid` (nunca por
// posição/índice do array, fecha a fragilidade do legado — roteiro API §9.1).
//
// `quantity`/`description` são SEMPRE somente-leitura (texto, sem campo) —
// mesmo que o fornecedor adulterasse o DOM, o servidor NUNCA os lê do payload
// (lê do `RequestItem` real).
//
// `amount` (preview CV-01, `unitary_value * quantity`, 2 casas) é recalculado a
// cada mudança de `unitary_value` — nunca enviado ao servidor. O preço unitário
// usa 4 casas (legado, `money4`).
//
// REPAGINAÇÃO (só apresentação): os MESMOS campos/nomes são exibidos de dois
// jeitos — células de tabela no desktop (`getItemTableCells`, sem rótulo
// visível: o cabeçalho da tabela rotula e cada campo leva `aria-label`) e
// cartão no celular (`RequestQuotationPublicItemRow`, com rótulo). Só um dos
// dois é montado por vez (decide `RequestQuotationPublicItems`).
// -----------------------------------------------------------------------------

import type { ReactNode } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller, useWatch } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Icon } from '@/components/ui/Icon';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  PublicRequestQuotationItemRow as PublicItemData,
  PublicRequestQuotationForm,
} from '@/@types/v2/RequestQuotations';

import { formatCurrency } from './publicQuotationProgress';
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

/** Valor da linha, reativo ao preço digitado (aria-live fica no total geral). */
function LineAmount({
  control,
  index,
  strong = false,
}: {
  control: Control<PublicRequestQuotationForm>;
  index: number;
  strong?: boolean;
}) {
  const amount = useWatch({ control, name: `items.${index}.amount` });
  return (
    <Text
      as="span"
      fontSize="inherit"
      fontWeight={strong ? 'bold' : 'semibold'}
      color="cardTextPrimary"
      css={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {formatCurrency(amount ?? 0)}
    </Text>
  );
}

/** Campos editáveis do item. `labeled` = com rótulo visível (cartão do celular). */
function renderEditableFields(
  { control, errors, setValue, index, item, disabled }: RequestQuotationPublicItemRowProps,
  text: PublicFormText,
  labeled: boolean
): { brand: ReactNode; unit: ReactNode; observation: ReactNode } {
  const itemErrors = errors.items?.[index];

  function recomputeAmount(unitaryValue: number | null) {
    setValue(`items.${index}.amount`, lineAmount(unitaryValue, item.quantity), {
      shouldDirty: true,
    });
  }

  return {
    brand: (
      <Controller
        name={`items.${index}.brand`}
        control={control}
        render={({ field }) => (
          <Input
            label={labeled ? text.fields.brand : undefined}
            aria-label={`${text.fields.brand} - ${item.description}`}
            name={field.name}
            placeholder={text.placeholders.brand}
            value={field.value ?? ''}
            onChange={(event) => field.onChange(event.target.value)}
            error={itemErrors?.brand?.message as string | undefined}
            isRequired
            disabled={disabled}
          />
        )}
      />
    ),
    unit: (
      <Controller
        name={`items.${index}.unitary_value`}
        control={control}
        render={({ field }) => (
          <MoneyInput
            name={field.name}
            label={labeled ? text.fields.unitaryValue : undefined}
            aria-label={`${text.fields.unitaryValue} - ${item.description}`}
            fractionDigits={4}
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              recomputeAmount(value);
            }}
            error={itemErrors?.unitary_value?.message as string | undefined}
            isRequired
            disabled={disabled}
          />
        )}
      />
    ),
    observation: (
      <Controller
        name={`items.${index}.observation`}
        control={control}
        render={({ field }) => (
          <Input
            label={labeled ? text.fields.observation : undefined}
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

/** Células da linha para o `SimpleTable` (desktop). Chaves = colunas da tabela. */
export function getItemTableCells(
  props: RequestQuotationPublicItemRowProps,
  text: PublicFormText
): Record<string, ReactNode> {
  const fields = renderEditableFields(props, text, false);
  return {
    item: (
      <Box minW="200px">
        <Text as="span" fontSize="inherit" fontWeight="medium" color="cardTextPrimary">
          {props.item.description}
        </Text>
      </Box>
    ),
    quantity: (
      <Text as="span" fontSize="inherit" css={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(props.item.quantity)}
      </Text>
    ),
    brand: <Box minW="130px">{fields.brand}</Box>,
    unit: <Box minW="130px">{fields.unit}</Box>,
    total: <LineAmount control={props.control} index={props.index} />,
    observation: <Box minW="150px">{fields.observation}</Box>,
  };
}

/** Cartão do item (celular): título, quantidade, campos rotulados e total da linha. */
export function RequestQuotationPublicItemRow(props: RequestQuotationPublicItemRowProps) {
  const text = usePublicFormText();
  const { item, index, control } = props;
  const fields = renderEditableFields(props, text, true);

  return (
    <Box
      as="li"
      listStyleType="none"
      bg="cardBG"
      borderWidth="1px"
      borderColor="cardBorder"
      borderRadius="xl"
      boxShadow="cardShadow"
      p={4}
    >
      <Flex align="flex-start" justify="space-between" gap={3} mb={4}>
        <Box minW={0}>
          <Text fontSize="xs" color="cardTextSecondary" fontWeight="semibold" textTransform="uppercase">
            {text.itemsSection.itemNumber.replace('{n}', String(index + 1))}
          </Text>
          <Text fontSize="md" fontWeight="semibold" color="cardTextPrimary" wordBreak="break-word">
            {item.description}
          </Text>
        </Box>
        <Flex
          align="center"
          gap={1}
          flexShrink={0}
          px={2}
          py={1}
          borderRadius="md"
          bg="selectedBG"
          color="cardTextPrimary"
          fontSize="sm"
          fontWeight="medium"
        >
          <Icon name="package" size="xs" />
          <Text as="span" fontSize="inherit">
            {text.fields.quantity}: {String(item.quantity)}
          </Text>
        </Flex>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        {fields.brand}
        {fields.unit}
        <Box gridColumn={{ sm: '1 / -1' }}>{fields.observation}</Box>
      </SimpleGrid>

      <Flex
        align="center"
        justify="space-between"
        mt={4}
        pt={3}
        borderTopWidth="1px"
        borderColor="cardBorder"
        fontSize="md"
      >
        <Text as="span" fontSize="sm" color="cardTextSecondary">
          {text.fields.amount}
        </Text>
        <LineAmount control={control} index={index} strong />
      </Flex>
    </Box>
  );
}
