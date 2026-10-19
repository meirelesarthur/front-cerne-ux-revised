// src/pages/Operacional/Romaneios/RomaneioExpensesTab.tsx
// -----------------------------------------------------------------------------
// Aba "Despesas acessórias" do Romaneio (TASK-TRF-FE-04, contrato de tela
// §5.6) — sai de STUB para implementação real:
// `useFieldArray({control, name:'expenses'})` + repeater
// (`RomaneioExpenseRow.tsx`). Molde estrutural: `RomaneioItemsTab.tsx`
// (TASK-TRF-FE-03) — mesmo racional de `fields.map`/`key={field.id}`.
//
// Diferenças DELIBERADAS em relação ao repeater de Itens (contrato §5.6,
// armadilha #1/#13):
//   - Repeater inicia VAZIO ao criar (`defaultValues.expenses = []` em
//     `CreateOrUpdateRomaneio.tsx`), diferente de Itens (1 linha).
//   - SEM bloqueio de "remover última linha" — `expenses` é `[]` remove
//     TODAS (D6), o inverso da regra de Equipes. `EmptyState` compacto
//     quando `fields.length === 0` (contrato §5.6/estados de UI).
//   - SEM bloqueio de "adicionar com linha incompleta" — nenhuma regra
//     equivalente existe no contrato para despesas (só para itens); a
//     validação de campo obrigatório (`type`/`quantity`/`vl_unit`/`who_pay`/
//     `apropriation`) é responsabilidade do Yup + 422 do servidor no submit.
//
// O GATE da aba inteira (`canAny(['service_view','reversal_view'])`,
// contrato §"Tela/Rota") é decisão do PAI (`CreateOrUpdateRomaneio.tsx`,
// que decide se renderiza o `Tabs.Trigger`/`Tabs.Content` "2") — este
// componente não conhece permissão, só repete a linha.
// -----------------------------------------------------------------------------

import { Box, Flex, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { TransferForm } from '@/@types/v2/Transfers';

import { RomaneioExpenseRow } from './RomaneioExpenseRow';
import { createEmptyTransferExpense } from './useRomaneios';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface RomaneioExpensesTabProps {
  control: Control<TransferForm>;
  errors: FieldErrors<TransferForm>;
  watch: UseFormWatch<TransferForm>;
  setValue: UseFormSetValue<TransferForm>;
  isDisabled: boolean;
}

export function RomaneioExpensesTab({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
}: RomaneioExpensesTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.transfers.transfer.form.expenseRow;

  const { fields, append, remove } = useFieldArray({ control, name: 'expenses' });

  function handleAdd() {
    append(createEmptyTransferExpense(languageGB));
  }

  return (
    <Box pt={4}>
      {fields.length === 0 ? (
        <Flex align="flex-start" py={10}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyState}
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <RomaneioExpenseRow
              key={field.id}
              index={index}
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabled}
              onRemove={() => remove(index)}
            />
          ))}
        </Flex>
      )}

      <Button
        title={text.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={isDisabled}
      />
    </Box>
  );
}
