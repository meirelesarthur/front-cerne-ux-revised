// src/pages/Operacional/Carregamento/ChargeExpensesTab.tsx
// -----------------------------------------------------------------------------
// Aba "Despesas acessórias" do Carregamento — GAP FIX (Onda 2, execução 045,
// FID-G3F). Estrutura REAL do legado (`carregamentos-legacy-contract.yaml`
// CL-48/CL-49/CL-50, FD-32..43): 1 ÚNICA tabela `charge_expense_ancillaries`
// (mesmo Model `App\ChargeExpenseAncillary`) renderizada em 3 SUB-ABAS
// Bootstrap (Estornos/Insumos/Serviços —
// `components/expenses_ancilliaries.blade.php:23-35`), diferenciadas só pela
// coluna `type` — NÃO 3 tabelas/entidades separadas.
//
// Decisão do dono #01 (aplicada) — a aba visível "Estornos" grava o valor
// LITERAL `'receitas'` na coluna `type` (CL-49, `POSSIVEL_LEGACY_DEFECT` do
// legado, PRESERVADO por fidelidade e por ser o dado já existente em
// produção): rótulo de UI × valor persistido DIVERGEM só nesta aba —
// `chargeExpenseTypeOptions` já mapeia `receitas → 'Estornos'`.
//
// `useFieldArray({control, name:'expenses'})` continua INSTANCIADO NESTE
// COMPONENTE como POOL ÚNICO (mirror CL-50 — um só array de índice; as 3
// abas são SÓ um filtro de EXIBIÇÃO por cima do mesmo pool, exatamente como
// o legado renderiza as 3 `<tr>` no MESMO DOM e some por CSS de tab). Cada
// `Tabs.Content` filtra as linhas do PRÓPRIO `type`, mas repassa o ÍNDICE
// ORIGINAL do array completo para `ChargeExpenseRow` — `control`/`remove`/
// `errors` continuam corretos, nunca reindexado por aba.
//
// Botão "Adicionar" de CADA aba cria a linha já com `type` FIXO
// (`createEmptyChargeExpense(languageGB, fixedType)`, mirror hidden
// `expense_type[]`, CL-49) — não existe mais Select de "Natureza": o usuário
// NUNCA escolhe a natureza manualmente (`ChargeExpenseRow.tsx` recebe `type`
// por PROP, fixo pela aba que o renderiza).
//
// Diferenças DELIBERADAS em relação ao repeater de Itens (mirror
// `RomaneioExpensesTab.tsx`, contrato):
//   - Repeater inicia VAZIO ao criar (`defaultValues.expenses = []`), IG-06/
//     07 NÃO se aplicam aqui — `expenses: []` é estado válido (D6).
//   - SEM bloqueio de "remover última linha" — `[]` remove TODAS (D6).
//   - SEM bloqueio de "adicionar com linha incompleta" — a validação de
//     campo obrigatório é responsabilidade do Yup + 422 do servidor no
//     submit (mesmo racional de `RomaneioExpensesTab`).
//   - Totalizador por aba (CV-08, "category-total") é puramente informativo
//     no legado (não persistido) e está FORA do escopo desta correção
//     estrutural — não implementado aqui (lacuna declarada, não fabricada).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, Tabs, Text } from '@chakra-ui/react';
import { useFieldArray } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { useLanguage } from '@/hooks/useLanguage';

import type { ChargeExpenseType, ChargeForm } from '@/@types/v2/Carregamentos';

import { ChargeExpenseRow } from './ChargeExpenseRow';
import { createEmptyChargeExpense } from './useCarregamentos';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ChargeExpensesTabProps {
  control: Control<ChargeForm>;
  errors: FieldErrors<ChargeForm>;
  watch: UseFormWatch<ChargeForm>;
  setValue: UseFormSetValue<ChargeForm>;
  isDisabled: boolean;
}

// Ordem das 3 sub-abas — mirror literal da ordem Bootstrap do legado
// (pane1='Estornos', pane2='Insumos', pane3='Servicos').
const EXPENSE_TABS: ChargeExpenseType[] = ['receitas', 'insumos', 'serviços'];

export function ChargeExpensesTab({
  control,
  errors,
  watch,
  setValue,
  isDisabled,
}: ChargeExpensesTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.carregamentos.charge.form.expenseRow;
  const typeLabels = languageGB.carregamentos.charge.expenseTypeOptions;

  const { fields, append, remove } = useFieldArray({ control, name: 'expenses' });

  // Watch do array INTEIRO — o filtro por `type` (abaixo) precisa reagir
  // imediatamente a uma linha recém-criada (o `type` já vem pronto no
  // `append`, mas só o watch garante o re-render síncrono da aba certa).
  const expensesValues = watch('expenses') ?? [];

  const [activeTab, setActiveTab] = useState<ChargeExpenseType>('receitas');

  const tabLabel: Record<ChargeExpenseType, string> = {
    receitas: typeLabels.reversal,
    insumos: typeLabels.supplies,
    serviços: typeLabels.services,
  };

  function handleAdd(fixedType: ChargeExpenseType) {
    append(createEmptyChargeExpense(languageGB, fixedType));
  }

  function rowsForType(type: ChargeExpenseType) {
    return fields
      .map((field, index) => ({ field, index }))
      .filter(({ index }) => expensesValues[index]?.type?.value === type);
  }

  return (
    <Box pt={4}>
      {/* @ts-ignore - custom variant, mirror `CreateOrUpdateCharge.tsx` */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(details: { value: string }) =>
          setActiveTab(details.value as ChargeExpenseType)
        }
        variant={'secondary' as any}
      >
        {/* @ts-ignore */}
        <Tabs.List>
          {EXPENSE_TABS.map((type) => (
            // @ts-ignore
            <Tabs.Trigger key={type} value={type}>
              {tabLabel[type]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {EXPENSE_TABS.map((type) => {
          const rows = rowsForType(type);

          return (
            // @ts-ignore
            <Tabs.Content key={type} value={type}>
              <Box pt={4}>
                {rows.length === 0 ? (
                  <Flex align="flex-start" py={10}>
                    <Text fontSize="sm" color="fg.muted">
                      {text.emptyState}
                    </Text>
                  </Flex>
                ) : (
                  <Flex direction="column" gap={4} mb={4}>
                    {rows.map(({ field, index }) => (
                      <ChargeExpenseRow
                        key={field.id}
                        index={index}
                        type={type}
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
                  onClick={() => handleAdd(type)}
                  disabled={isDisabled}
                />
              </Box>
            </Tabs.Content>
          );
        })}
      </Tabs.Root>
    </Box>
  );
}
