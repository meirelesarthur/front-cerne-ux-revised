// src/pages/Fiscal/AccountingEntry/AccountingEntryItemsEditor.tsx
// -----------------------------------------------------------------------------
// Componente NOVO da linha dinâmica D/C (`items[]`) de Partida Dobrada
// (AccountingEntry — domínio Fiscal, F-128, esteira 97-Esteiras/068,
// TASK-PD-FE-07). Decisão do dono (Leitura do dev da Tarefa, item 1): NÃO
// reaproveita `MovementAllocationEditor` por import direto — aquele é rateio
// LIVRE contra um `headerValue` EXTERNO (percentual, N linhas até bater um
// valor de cabeçalho já conhecido); Partida Dobrada só tem 2 papéis fixos
// (Débito/Crédito), sem `headerValue` externo (o "total" É o resultado da
// soma, não um alvo pré-existente), e a regra de sucesso é "as DUAS somas
// serem iguais entre si". Construído copiando o ESTILO (`Box` com borda,
// `Badge`, `Alert`, `IconButtonTable`, `SelectAsyncPaginate`+`MoneyInput` por
// linha) de `MovementAllocationEditor.tsx`, NÃO a lógica de cálculo.
//
// `useFieldArray({ name: 'items' })` vive no PAI (`CreateOrUpdateAccountingEntry`)
// — este componente só recebe `fields/append/remove` via props (mirror da
// mesma decisão estrutural de `MovementAllocationEditor`/`ApportionmentsSection`).
//
// Balanceamento (contrato-tela §5, mesmo cálculo/tolerância de
// `accounting-entry-schema.ts`, TASK-PD-FE-04): `totalDebit`/`totalCredit`
// somam `items[].value` por `condition`; `isBalanced` usa a MESMA tolerância
// (arredondamento a 2 casas ANTES de comparar, `<= 0.01`) — nunca uma
// tolerância "aproximada" divergente do schema. Cores dos badges reaproveitam
// o dicionário JÁ EXISTENTE `accountingEntryItemConditionColor` (Lei 10 — zero
// cor hardcoded fora dos tokens/dicionários do módulo).
//
// SEM autofill de `condition` ao trocar `plan_account_uuid` (decisão já
// registrada, FID-G3F linha ITX-01 — `PlanAccount.condition`, natureza da
// conta, é semanticamente distinto de `EntryItem.condition`, papel D/C da
// linha). SEM opção `condition=3` "Ambos" (dead path, CLM-15) — o Select da
// linha só tem as 2 opções de `accountingEntryItemConditionOptions`.
//
// Erro de nível de ARRAY (422 real agregado na chave `items` — "falta 1
// débito"/"falta 1 crédito"/"soma diverge" — E o `.min(1)`/`.test()` do Yup
// client) — `errors.items?.message`, mirror `arrayError` de
// `MovementAllocationEditor`, renderizado como `Alert status="error"` DE
// SEÇÃO, além do mapeamento por índice já feito pelos `Controller` de cada
// campo de linha.
// -----------------------------------------------------------------------------

import { ElementType } from 'react';

import { Alert, Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Control, Controller, FieldArrayWithId, FieldErrors, useWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';

import {
  accountingEntryItemCondition,
  accountingEntryItemConditionColor,
  accountingEntryItemConditionOptions,
} from '@/constants/Fiscal/accountingEntry';

import { listPlanAccountOptions } from '@/services/v2/PlanAccounts/plan-account-service';

import type { LanguageDate } from '@/@types/language';
import type { PaginationQueryParams } from '@/@types/pagination';
import type {
  AccountingEntryForm,
  AccountingEntryItemForm,
} from '@/@types/v2/Fiscal/accountingEntry';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

import type { UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form';

// Lookup de conta contábil — REUSO 100% de `listPlanAccountOptions` (zero
// service novo, contrato-tela §2). Fixa `class=2` (Analítica) + `is_enabled=
// 'true'` (contrato-tela §4) — função módulo-level (sem closure) para manter
// identidade estável entre renders, sem precisar de `useCallback`.
function listAnalyticalPlanAccountOptions(params: PaginationQueryParams) {
  return listPlanAccountOptions({ ...params, class: 2, is_enabled: 'true' });
}

export interface AccountingEntryItemsEditorProps {
  /** `control` do `useForm<AccountingEntryForm>` do formulário PAI. */
  control: Control<AccountingEntryForm>;
  /** `fields` do `useFieldArray({ control, name: 'items' })` do PAI. */
  fields: FieldArrayWithId<AccountingEntryForm, 'items', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<AccountingEntryForm, 'items'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<AccountingEntryForm>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI — opcional, default habilitado (TASK-PD-FE-08 passa `true` no modo visualizar). */
  disabled?: boolean;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AccountingEntryItemsEditor({
  control,
  fields,
  append,
  remove,
  errors,
  languageGB,
  disabled = false,
}: AccountingEntryItemsEditorProps) {
  const text = languageGB.accountingEntries.accountingEntry.form.items;
  const conditionOptions = accountingEntryItemConditionOptions.options(languageGB);

  // Erro de nível de ARRAY — `.message` próprio de `errors.items` (Yup
  // `.min(1)`/`.test()` client OU 422 real do servidor mapeado pelo pai via
  // `setError('items', ...)`, contrato-tela §2 "422 (balanceamento/itens)").
  // Cast pragmático — mesmo racional já documentado em `MovementAllocationEditor`/
  // `CreateSaldoInicial.tsx` para o mesmo cenário (`Merge<FieldError, [...]>`).
  const arrayError = (errors as any)?.items?.message as string | undefined;

  // Balanceamento — MESMO cálculo/tolerância de `accounting-entry-schema.ts`
  // (TASK-PD-FE-04): arredonda a 2 casas ANTES de comparar, tolerância 0.01.
  const watchedItems = useWatch({ control, name: 'items' }) ?? [];
  const totalDebit = watchedItems.reduce(
    (sum, item) =>
      item?.condition?.value === accountingEntryItemCondition.debit
        ? sum + (Number(item?.value) || 0)
        : sum,
    0
  );
  const totalCredit = watchedItems.reduce(
    (sum, item) =>
      item?.condition?.value === accountingEntryItemCondition.credit
        ? sum + (Number(item?.value) || 0)
        : sum,
    0
  );
  const isBalanced = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100 <= 0.01;

  function handleAdd() {
    const newItem: AccountingEntryItemForm = {
      plan_account_uuid: null,
      condition: null,
      value: null,
    };
    append(newItem);
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {text.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {text.sectionHint}
          </Text>
        </Box>

        <Flex align="center" gap={2} wrap="wrap">
          <Text fontSize="sm" color="fg.muted">
            {text.totalDebitLabel}:
          </Text>
          <Badge
            colorPalette={accountingEntryItemConditionColor[accountingEntryItemCondition.debit]}
            variant="subtle"
          >
            {formatCurrencyBRL(totalDebit)}
          </Badge>
          <Text fontSize="sm" color="fg.muted">
            {text.totalCreditLabel}:
          </Text>
          <Badge
            colorPalette={accountingEntryItemConditionColor[accountingEntryItemCondition.credit]}
            variant="subtle"
          >
            {formatCurrencyBRL(totalCredit)}
          </Badge>
        </Flex>
      </Flex>

      {!isBalanced && (
        <Alert.Root status="warning" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{text.differenceHint}</Alert.Title>
            <Alert.Description>{formatCurrencyBRL(totalDebit - totalCredit)}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Erro de nível de ARRAY (Yup `.min(1)`/`.test()` client OU 422 real do
          servidor agregado na chave `items`) — Alert de SEÇÃO, mirror
          `arrayError` de `MovementAllocationEditor`. */}
      {arrayError && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{arrayError}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.sectionHint}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const rowErrors = (errors.items as any)?.[index] as
              FieldErrors<AccountingEntryItemForm> | undefined;

            return (
              <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
                <Box flex="2" minW="260px">
                  <Controller
                    name={`items.${index}.plan_account_uuid`}
                    control={control}
                    render={({ field: rowField }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={text.fields.planAccount}
                        service={listAnalyticalPlanAccountOptions}
                        mapOptions={(item: PlanAccountRef) => ({
                          label: `${item.code} — ${item.description}`,
                          value: item.uuid,
                        })}
                        findParams={findParamsFromSearch}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={rowErrors?.plan_account_uuid?.message}
                        isRequired
                        isDisabled={disabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />
                </Box>

                <Box flex="1" minW="180px">
                  <Controller
                    name={`items.${index}.condition`}
                    control={control}
                    render={({ field: rowField }) => (
                      <Select
                        label={text.fields.condition}
                        name={rowField.name}
                        value={rowField.value}
                        onChange={(option) => rowField.onChange(option ?? null)}
                        options={conditionOptions}
                        error={rowErrors?.condition?.message}
                        isRequired
                        isDisabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '180px' }}>
                  <Controller
                    name={`items.${index}.value`}
                    control={control}
                    render={({ field: rowField }) => (
                      <MoneyInput
                        name={rowField.name}
                        label={text.fields.value}
                        value={rowField.value ?? null}
                        onValueChange={(value) => rowField.onChange(value)}
                        error={rowErrors?.value?.message}
                        isRequired
                        disabled={disabled}
                      />
                    )}
                  />
                </Box>

                <Flex direction="column" gap="1.5">
                  {/* Spacer invisível — reserva a mesma altura de label das
                      demais colunas (mirror `MovementAllocationEditor`/
                      `ApportionmentsSection`). */}
                  <Flex alignItems="center" fontSize="14px" visibility="hidden">
                    {text.removeRowLabel}
                  </Flex>
                  <IconButtonTable
                    aria-label={text.removeRowLabel}
                    mensegerTooltip={text.removeRowLabel}
                    size="sm"
                    color="red.500"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => remove(index)}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Flex>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Button
        title={text.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default AccountingEntryItemsEditor;
