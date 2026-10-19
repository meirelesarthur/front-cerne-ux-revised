// src/pages/Incomes/IncomeAutomaticWriteoffSection.tsx
// -----------------------------------------------------------------------------
// Seção "Baixa Automática" do form de criação de Income — TASK-FE-036-316,
// GAP-FE-036-303. Só renderiza quando elegível (`payment_type=UNICA` +
// exatamente 1 parcela gerada pela aba de Parcelamento) — a condição de
// montagem vive no form raiz (`CreateOrUpdateIncome.tsx`), este componente
// assume que já é elegível.
//
// Fix (036fix5, item 2) — padronizado 1:1 com a mesma seção do Contas a
// Pagar (`CreateOrUpdateExpense.tsx`, bloco "Baixa Automática" dentro da
// aba Cabeçalho): MESMO layout `SimpleGrid` (`columnsForm.threeColumns`),
// MESMO controle de alternância (`Select` Sim/Não, não mais `Switch`) e
// MESMO componente de preview de saldo (`InputReadOnly`, não mais um bloco
// `Text`+`Skeleton` ad-hoc). O container (`Box mt={6} p={4} bg="bg.muted"
// borderRadius="lg"`) + título já eram idênticos — vêm do form raiz.
//
// Preview de saldo "na data" — `GET /accounts/{uuid}/balance?date=`
// (reaproveita a MESMA fórmula "na data" do backend, não o `Account.balance`
// denormalizado). Debounce leve (~300ms) ao trocar conta/data; falha do
// preview NÃO bloqueia o form (sem toast ruidoso — o submit real ainda
// valida no servidor, 422 se insuficiente).
//
// P0 (item 3, 036fix4) — Conta a RECEBER com baixa automática CREDITA o
// saldo da conta (aumenta), nunca debita — diferente do Contas a Pagar
// (`CreateOrUpdateExpense.tsx::balanceInsufficient`), onde "saldo
// insuficiente" faz sentido porque a baixa DEBITA. NUNCA reintroduzir aqui o
// aviso de "saldo insuficiente" do CaP — divergência de negócio REAL,
// preservada deliberadamente (o backend também removeu a checagem
// correspondente para este módulo). O preview de saldo é mantido como
// informação neutra, sem aviso de erro.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { Control, Controller, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';

import { useLanguage } from '@/hooks/useLanguage';

import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';

import {
  getAccountBalance,
  listAccounts,
} from '@/services/v2/CadastrosBase/Account/account-service';

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { IncomeForm as IncomeFormType } from '@/@types/v2/Incomes';

export interface IncomeAutomaticWriteoffSectionProps {
  control: Control<IncomeFormType>;
  watch: UseFormWatch<IncomeFormType>;
  setValue: UseFormSetValue<IncomeFormType>;
  isLoading: boolean;
  canSave: boolean;
  /**
   * Achado B-04/GAP-FE-036-303 (auditoria de fidelidade 2026-08) —
   * `payment_type=ADIANTAMENTO` força a baixa automática = Sim (mirror
   * legado `handlePaymentType()`). O form raiz já garante
   * `automatic_writeoff=true` via `setValue`; aqui só se trava o Select
   * (não pode desligar) e mostra o aviso via `tooltip` no label (Lote 2 —
   * migrado de `helperText`; mirror `CreateOrUpdateExpense.tsx::isAutomaticWriteoffLocked`).
   */
  forcedByAdvance?: boolean;
}

export function IncomeAutomaticWriteoffSection({
  control,
  watch,
  setValue,
  isLoading,
  canSave,
  forcedByAdvance = false,
}: IncomeAutomaticWriteoffSectionProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.incomes.income.form.automaticWriteoff;

  const isDisabled = !canSave || isLoading;
  // Só o Select fica travado quando forçado por Adiantamento — os campos de
  // conta/data continuam editáveis (o usuário ainda precisa escolher ONDE
  // a baixa automática cai).
  const isToggleDisabled = isDisabled || forcedByAdvance;

  const automaticWriteoff = watch('automatic_writeoff');
  const accountOption = watch('account_uuid');
  const movementDate = watch('movement_date');

  const [balance, setBalance] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const yesNoOptions = [
    { label: languageGB.defaltStrings.yes, value: true },
    { label: languageGB.defaltStrings.no, value: false },
  ];

  // INC-R20 (REAUDITORIA-036-2a-rodada) — o legado (`_forms.blade.php:750`)
  // preenche a data do movimento com HOJE, nunca a data de emissão do
  // título. Corrigido para o mesmo mirror já aplicado no CaP
  // (`CreateOrUpdateExpense.tsx:510-517`) — só preenche automaticamente 1x,
  // quando o usuário ainda não escolheu nada.
  useEffect(() => {
    if (automaticWriteoff && !movementDate) {
      setValue('movement_date', todayLocalIso());
    }
  }, [automaticWriteoff, movementDate, setValue]);

  // Preview de saldo "na data" — debounce leve (~300ms), sem `useQuery`
  // dedicado (é auxiliar, não precisa de cache/invalidação, mirror do
  // Roteiro do Gap). Falha silenciosa (sem toast) — o servidor ainda valida
  // de verdade no submit.
  useEffect(() => {
    if (!automaticWriteoff || !accountOption?.value || !movementDate) {
      setBalance(null);
      return;
    }

    setIsPreviewLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await getAccountBalance(accountOption.value, movementDate);
        setBalance(response.data.balance);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('IncomeAutomaticWriteoffSection — preview de saldo falhou:', error);
        setBalance(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [automaticWriteoff, accountOption?.value, movementDate]);

  const showAccountAndDate = automaticWriteoff || forcedByAdvance;

  return (
    <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
      <Controller
        name="automatic_writeoff"
        control={control}
        render={({ field }) => (
          <Select
            label={text.toggleLabel}
            name={field.name}
            options={yesNoOptions}
            value={
              yesNoOptions.find((option) => option.value === (field.value || forcedByAdvance)) ??
              null
            }
            onChange={(option: Option<boolean> | null) => field.onChange(!!option?.value)}
            tooltip={forcedByAdvance ? text.forcedByAdvanceHint : undefined}
            noClearable
            isDisabled={isToggleDisabled}
          />
        )}
      />

      {showAccountAndDate && (
        <>
          <Controller
            name="account_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.account}
                placeholder={text.accountPlaceholder}
                service={listAccounts}
                mapOptions={(item: AccountListItem) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                // INC-R23 (REAUDITORIA-036-2a-rodada) — mesma correção
                // aplicada aos selects de cliente/proprietário do form
                // raiz; conta inativa não deve ser oferecida na baixa
                // automática.
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                  is_enabled: 'true',
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={isDisabled}
              />
            )}
          />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>
              {text.movementDate}
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
            label={text.balancePreviewLabel}
            loading={isPreviewLoading}
            value={
              balance !== null
                ? balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : isPreviewLoading
                  ? text.loadingLabel
                  : '—'
            }
          />
        </>
      )}
    </SimpleGrid>
  );
}
