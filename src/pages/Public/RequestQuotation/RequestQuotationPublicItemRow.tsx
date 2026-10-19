// src/pages/Public/RequestQuotation/RequestQuotationPublicItemRow.tsx
// -----------------------------------------------------------------------------
// Linha de ITEM do formulário público do fornecedor (hash, RequestQuotation —
// esteira 97-Esteiras/035, TASK-CQ-FE-10). Mirror ESTRUTURAL de
// `RequestItemRow.tsx` (Administrativo/Solicitacao) — SEM `useFieldArray`
// (diferente do original): a lista de itens é FIXA, definida pelo servidor no
// `GET` (`PublicRequestQuotationData.items[]`), o fornecedor NUNCA
// adiciona/remove itens — só preenche `brand`/`unitary_value`/`observation`
// por linha já existente. Endereçada por `request_item_uuid` (nunca por
// posição/índice do array, fecha a fragilidade do legado — roteiro API §9.1).
//
// `quantity`/`description` são SEMPRE somente-leitura (`InputReadOnly`) —
// mirror "campo readonly confiável" (roteiro API §9.1): mesmo que o
// fornecedor adulterasse esses campos no DOM, o servidor NUNCA os lê do
// payload (lê do `RequestItem` real).
//
// `amount` (preview CV-01, `unitary_value * quantity`, 2 casas) é recalculado a
// cada mudança de `unitary_value` — nunca enviado ao servidor, que recalcula
// com o `quantity` real (roteiro frontend §5.1/CV-01). O preço unitário usa
// 4 casas e é o primeiro campo focado ao abrir (legado, `money4` + focus).
// -----------------------------------------------------------------------------

import { Box, Flex } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import type {
  PublicRequestQuotationItemRow as PublicItemData,
  PublicRequestQuotationForm,
} from '@/@types/v2/RequestQuotations';

import { lineAmount } from './publicQuotationTotals';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface RequestQuotationPublicItemRowProps {
  control: Control<PublicRequestQuotationForm>;
  errors: FieldErrors<PublicRequestQuotationForm>;
  setValue: UseFormSetValue<PublicRequestQuotationForm>;
  index: number;
  item: PublicItemData;
  /** Rótulo da coluna de itens: "Produto" (tipo P) ou "Serviços". */
  itemLabel: string;
  disabled: boolean;
}

export function RequestQuotationPublicItemRow({
  control,
  errors,
  setValue,
  index,
  item,
  itemLabel,
  disabled,
}: RequestQuotationPublicItemRowProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.requestQuotations.requestQuotation.publicForm;

  function recomputeAmount(unitaryValue: number | null) {
    setValue(`items.${index}.amount`, lineAmount(unitaryValue, item.quantity), {
      shouldDirty: true,
    });
  }

  const itemErrors = errors.items?.[index];

  return (
    <Box
      pb={4}
      mb={4}
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ border: 'none', mb: 0, pb: 0 }}
    >
      <Flex gap={3} wrap="wrap" align="flex-start">
        <Box flex="2" minW="220px">
          <InputReadOnly label={itemLabel} value={item.description} />
        </Box>

        <Box w={{ base: 'full', sm: '120px' }}>
          <InputReadOnly label={text.fields.quantity} value={String(item.quantity)} />
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Controller
            name={`items.${index}.brand`}
            control={control}
            render={({ field }) => (
              <Input
                label={text.fields.brand}
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
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Controller
            name={`items.${index}.unitary_value`}
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                label={text.fields.unitaryValue}
                fractionDigits={4}
                autoFocus={index === 0}
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
        </Box>

        <Box w={{ base: 'full', sm: '160px' }}>
          <Controller
            name={`items.${index}.amount`}
            control={control}
            render={({ field }) => (
              <MoneyInput
                name={field.name}
                label={text.fields.amount}
                value={field.value}
                readOnly
                disabled
              />
            )}
          />
        </Box>

        <Box flex="2" minW="220px">
          <Controller
            name={`items.${index}.observation`}
            control={control}
            render={({ field }) => (
              <Textarea
                label={text.fields.observation}
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
        </Box>
      </Flex>
    </Box>
  );
}
