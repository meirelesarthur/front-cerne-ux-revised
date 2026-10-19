// src/pages/Operacional/DiscountTable/DiscountRuleRow.tsx
// -----------------------------------------------------------------------------
// Linha de Regra de Desconto (SURF-RULES-GRID, contrato de tela §4.3) do
// formulário de Tabela de Desconto (DiscountTable — Operacional/Agricultura,
// F-032, TASK-DT-FE-03). Mirror `FeedingPhaseItemRow.tsx`
// (`useController` por campo, SEM handler global por seletor de classe).
//
// 3 campos percentuais na ORDEM exata: Limite Inicial (%), Limite Final (%),
// Desconto (%) — todos `PercentInput` (`maxValue=100`, SF-OVERFLOW).
//
// `control`/`name` são propositalmente `any`/dinâmicos — o path
// (`products.${productIndex}.rules.${type}.${rowIndex}.<campo>`) tem 2
// segmentos verdadeiramente dinâmicos (índice do produto + tipo de regra),
// fora do alcance de tipagem estática do `FieldArrayPath` do RHF. Cast
// pragmático — mesmo racional de `DietIngredientsEditor::genericControl`/
// `FeedingPhaseItemsEditor::arrayError`, aplicado aqui no limite exato onde
// o path deixa de ser estático.
// -----------------------------------------------------------------------------

import { Box, Flex, Icon } from '@chakra-ui/react';
import { Control, useController } from 'react-hook-form';
import { FiTrash2 } from 'react-icons/fi';

import { PercentInput } from '@/components/Form/PercentInput';
import { IconButtonTable } from '@/components/IconButtonTable';

import type { LanguageDate } from '@/@types/language';
import type { DiscountRuleType } from '@/@types/v2/DiscountTables';

export interface DiscountRuleRowProps {
  control: Control<any>;
  productIndex: number;
  type: DiscountRuleType;
  rowIndex: number;
  remove: (index: number) => void;
  languageGB: LanguageDate;
  disabled?: boolean;
}

function toPercentValue(raw: number | string | null | undefined): number | null {
  if (raw === '' || raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

export function DiscountRuleRow({
  control,
  productIndex,
  type,
  rowIndex,
  remove,
  languageGB,
  disabled = false,
}: DiscountRuleRowProps) {
  const text = languageGB.discountTables.discountTable.form.rules;
  const basePath = `products.${productIndex}.rules.${type}.${rowIndex}`;

  const { field: initialField, fieldState: initialFieldState } = useController({
    control,
    name: `${basePath}.initial_limit_percent` as any,
  });
  const { field: finalField, fieldState: finalFieldState } = useController({
    control,
    name: `${basePath}.final_limit_percent` as any,
  });
  const { field: discountField, fieldState: discountFieldState } = useController({
    control,
    name: `${basePath}.discount_percent` as any,
  });

  return (
    <Flex gap={3} align="flex-start" wrap="wrap">
      <Box flex="1" minW="160px">
        <PercentInput
          name={initialField.name}
          label={text.initialLimitPercent}
          value={toPercentValue(initialField.value)}
          onValueChange={(value) => initialField.onChange(value)}
          maxValue={100}
          isRequired
          disabled={disabled}
          error={initialFieldState.error?.message as string | undefined}
        />
      </Box>

      <Box flex="1" minW="160px">
        <PercentInput
          name={finalField.name}
          label={text.finalLimitPercent}
          value={toPercentValue(finalField.value)}
          onValueChange={(value) => finalField.onChange(value)}
          maxValue={100}
          isRequired
          disabled={disabled}
          error={finalFieldState.error?.message as string | undefined}
        />
      </Box>

      <Box flex="1" minW="160px">
        <PercentInput
          name={discountField.name}
          label={text.discountPercent}
          value={toPercentValue(discountField.value)}
          onValueChange={(value) => discountField.onChange(value)}
          maxValue={100}
          isRequired
          disabled={disabled}
          error={discountFieldState.error?.message as string | undefined}
        />
      </Box>

      <Flex direction="column" gap="1.5">
        <Flex alignItems="center" fontSize="14px" visibility="hidden">
          {text.removeRule}
        </Flex>
        <IconButtonTable
          aria-label={text.removeRule}
          mensegerTooltip={text.removeRule}
          size="sm"
          color="red.500"
          variant="ghost"
          disabled={disabled}
          onClick={() => remove(rowIndex)}
        >
          <Icon as={FiTrash2} />
        </IconButtonTable>
      </Flex>
    </Flex>
  );
}
