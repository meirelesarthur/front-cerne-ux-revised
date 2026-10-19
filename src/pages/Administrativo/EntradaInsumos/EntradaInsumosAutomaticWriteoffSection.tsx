// src/pages/Administrativo/EntradaInsumos/EntradaInsumosAutomaticWriteoffSection.tsx
// -----------------------------------------------------------------------------
// Seção "Baixa Automática" de Entrada de Insumos — esteira 037,
// TASK-IE-FE-06. Mirror ESTRUTURAL do bloco "Baixa Automática" de
// `CreateOrUpdateExpense.tsx` (débito, COM `Alert` de saldo insuficiente —
// NÃO a variante de Incomes, que é crédito e não avisa). HEADER-level,
// condicional: só é efetivada quando `automatic_writeoff=true` E
// `total_amount > 0` (`ApplyAutomaticWriteOffAction`, CL-007).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Alert, Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import {
  getAccountBalance,
  listAccounts,
} from '@/services/v2/CadastrosBase/Account/account-service';

import type { Response } from '@/@types/response-api';
import type { InputEntryCreateForm } from '@/@types/v2/InputEntries';

import type { Control, FieldErrors, UseFormWatch } from 'react-hook-form';

export interface EntradaInsumosAutomaticWriteoffSectionProps {
  control: Control<InputEntryCreateForm>;
  errors: FieldErrors<InputEntryCreateForm>;
  watch: UseFormWatch<InputEntryCreateForm>;
  totalAmount: number;
  canSave: boolean;
  isLoading: boolean;
}

export function EntradaInsumosAutomaticWriteoffSection({
  control,
  errors,
  watch,
  totalAmount,
  canSave,
  isLoading,
}: EntradaInsumosAutomaticWriteoffSectionProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.inputEntries.inputEntry.form;

  const isDisabled = !canSave || isLoading;

  const automaticWriteoffValue = watch('automatic_writeoff');
  const accountUuidValue = watch('account_uuid')?.value;
  const movementDateValue = watch('movement_date');

  // Preview de saldo "na data" — mirror `CreateOrUpdateExpense.tsx`
  // (debounce implícito via `useEffect`, falha silenciosa).
  const [accountBalancePreview, setAccountBalancePreview] = useState<number | null>(null);
  useEffect(() => {
    if (!accountUuidValue || !movementDateValue) {
      setAccountBalancePreview(null);
      return;
    }
    let cancelled = false;
    const timeout = setTimeout(() => {
      getAccountBalance(accountUuidValue, movementDateValue)
        .then((response: Response<{ balance: number }>) => {
          if (!cancelled) setAccountBalancePreview(response.data.balance);
        })
        .catch(() => {
          if (!cancelled) setAccountBalancePreview(null);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [accountUuidValue, movementDateValue]);

  const balanceInsufficient = accountBalancePreview !== null && accountBalancePreview < totalAmount;

  // ENT-2 (CORRECAO-R2) — REMOVIDO o gate `if (totalAmount <= 0) return null`
  // (a seção some quando não há total ainda). Fiel ao legado: a seção
  // Financeiro aparece SEMPRE (Vl. Total + Gerar Movimento Bancário; Conta/
  // Saldo/Data condicionais a `automatic_writeoff=true`, como já estava).

  return (
    <Box mt={6} p={4} bg="bg.muted" borderRadius="lg">
      <Text fontSize="sm" fontWeight="semibold" mb={4}>
        {formText.sections.automaticWriteoff}
      </Text>
      <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
        {/* ENT-2 (CORRECAO-R2) — "Vl. Total" read-only, 1º campo da seção
            Financeiro, fiel ao legado (mesma label da linha de itens,
            `formText.fields.totalValue`). */}
        <InputReadOnly
          label={formText.fields.totalValue}
          value={totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        />

        <Controller
          name="automatic_writeoff"
          control={control}
          render={({ field }) => (
            <Select
              label={formText.fields.automaticWriteoff}
              name={field.name}
              options={[
                { value: true, label: languageGB.defaltStrings.yes },
                { value: false, label: languageGB.defaltStrings.no },
              ]}
              value={
                [
                  { value: true, label: languageGB.defaltStrings.yes },
                  { value: false, label: languageGB.defaltStrings.no },
                ].find((option) => option.value === field.value) ?? null
              }
              onChange={(option: { value: boolean; label: string } | null) =>
                field.onChange(!!option?.value)
              }
              noClearable
              isDisabled={isDisabled}
            />
          )}
        />

        {automaticWriteoffValue && (
          <>
            <Controller
              name="account_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.account}
                  placeholder={formText.placeholders.account}
                  service={(params) => listAccounts({ ...params, is_enabled: 'true' })}
                  mapOptions={(item: {
                    uuid: string;
                    bank: string;
                    agency: string;
                    account: string;
                  }) => ({
                    label: `${item.bank} — Ag. ${item.agency} / Cta. ${item.account}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.account_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {formText.fields.movementDate}
              </Text>
              <Controller
                name="movement_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isDisabled} />
                )}
              />
            </Box>

            <InputReadOnly
              label={formText.fields.accountBalancePreview}
              value={
                accountBalancePreview !== null
                  ? accountBalancePreview.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : '—'
              }
            />
          </>
        )}
      </SimpleGrid>

      {automaticWriteoffValue && balanceInsufficient && (
        <Alert.Root status="warning" borderRadius="md" mt={3}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{formText.hints.insufficientBalanceWarning}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}
    </Box>
  );
}
