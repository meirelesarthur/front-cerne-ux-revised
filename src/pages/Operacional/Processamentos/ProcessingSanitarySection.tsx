// src/pages/Operacional/Processamentos/ProcessingSanitarySection.tsx
// -----------------------------------------------------------------------------
// Bloco "Item Sanitário" (Onda 2, TASK-FE-039-PROCFID-04) — header-level, NÃO
// por animal (`_forms.blade.php:45-72`, `sanitary-div` logo após o
// cabeçalho, ANTES do wizard de animais — mirror confirmado em
// front-plan-proc-fidelidade-sanitaria-rework.md §4.2). Repeater FLAT (sem
// wizard — DEC-139 aplica só ao array `animals[]`), molde estrutural de
// `BaixaEstoque/ItemRow.tsx`/`CreateBaixaEstoque.tsx` (bloco + botão
// "Adicionar Item"), adaptado para a cascata BIDIRECIONAL produto↔armazém
// (`ProcessingSanitaryItemRow.tsx`).
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { Control } from 'react-hook-form';

import { Button } from '@/components/Button';

import type { LanguageDate } from '@/@types/language';
import type { FinishProcessingForm, SanitaryItemForm } from '@/@types/v2/Processamentos/processing';

import { ProcessingSanitaryItemRow } from './ProcessingSanitaryItemRow';

/** Linha vazia do repeater — reaproveitada tanto pelo botão "Adicionar Item" quanto pelo seed automático ao ligar "Fazer Sanitário" (`FinishProcessing.tsx`). */
export const emptySanitaryItem: SanitaryItemForm = {
  product_uuid: null,
  warehouse_uuid: null,
  measurement_uuid: null,
  quantity: null,
  observation: null,
};

export interface ProcessingSanitarySectionProps {
  control: Control<FinishProcessingForm>;
  fields: Array<SanitaryItemForm & { id: string }>;
  append: (value: SanitaryItemForm) => void;
  remove: (index: number) => void;
  disabled: boolean;
  /** `animals.length` do formulário PAI — usado no aviso de saldo de cada linha (CV-006). */
  animalsCount: number;
  languageGB: LanguageDate;
}

export function ProcessingSanitarySection({
  control,
  fields,
  append,
  remove,
  disabled,
  animalsCount,
  languageGB,
}: ProcessingSanitarySectionProps) {
  const text = languageGB.processamentos.processing.form.fields.sanitaryItem;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight="bold" fontSize="lg">
          {text.sectionTitle}
        </Text>
        <Button
          title={text.addItem}
          variant="outline"
          type="button"
          onClick={() => append(emptySanitaryItem)}
          disabled={disabled}
        />
      </Flex>

      <Flex direction="column" gap={4}>
        {fields.map((field, index) => (
          <ProcessingSanitaryItemRow
            key={field.id}
            control={control}
            index={index}
            isDisabled={disabled}
            // Mínimo 1 linha quando `sanitary===true` (mirror `guardSanitaryItems`/Yup `.min(1)`).
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
            animalsCount={animalsCount}
            languageGB={languageGB}
          />
        ))}
      </Flex>
    </Box>
  );
}

export default ProcessingSanitarySection;
