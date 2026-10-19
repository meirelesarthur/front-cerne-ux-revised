// src/components/WriteOff/WriteOffCreateModal.tsx
// -----------------------------------------------------------------------------
// Modal COMPARTILHADO de criação de 1 Baixa Manual (`POST
// /{segment}/{uuid}/writeoffs`) — TASK-FE-036-331, ONDA 3 sub-onda 3a.
// Consumido tanto por Contas a Receber (`segment='incomes'`, TASK-FE-036-333)
// quanto pela fatia irmã de Contas a Pagar (`segment='expenses'`, ainda não
// fatiada). NÃO DUPLICAR — nenhum import de `@/services/v2/Incomes/**` nem
// `@/services/v2/Financeiro/Expenses/**` aqui dentro (garante reuso real, não
// reuso de fachada); a única dependência de domínio é o `writeoff-service.ts`
// compartilhado (Tarefa 330).
//
// Estrutura MODAL AUTOCONTIDA (mirror `ClientFormModal.tsx`) — `useForm`
// PRÓPRIO, sem form pai (diferente de `MovementAllocationEditor`, que recebe
// `fields/append/remove` de fora). `CustomDialog` já usa `lazyMount` +
// `unmountOnExit` — a cada abertura o corpo é remontado do zero, garantindo
// `defaultValues` frescos (saldo sugerido do título recebido por prop) sem
// precisar de `key`/reset manual.
//
// O que NÃO entra nesta Tarefa: upload de anexo na baixa individual (só CaP
// no legado, fora de escopo do brief original); baixa em lote (componente
// irmão, `WriteOffBatchModal.tsx`).
//
// `TASK-036-GB-06` (correção de fidelidade, 2 bugs): (1) select "Motivo"
// (`reason_uuid`) REMOVIDO — o legado sempre resolveu isso no servidor
// (`LowReasonRepositoryInterface::findDefault()`), nunca foi campo escolhido
// pelo usuário; (2) `categories` agora vem PRÉ-PREENCHIDO ao abrir o modal, a
// partir de `GET .../writeoffs/suggested-categories` (rateio sugerido do
// título sobre o saldo ATUAL) — falha silenciosa mantém `categories: []`.
//
// `TASK-036-GB-07`/`08` (handshake HANDSHAKE-front-baixa-tipos-completo.md):
// seletor de `writeoff_type` (6 contrapartidas, universo por segmento) +
// campos condicionais (Conta Bancária/Título de Adiantamento/NFe de
// Devolução/Conta a Receber/Conta a Pagar/Fatura). Disponibilidade
// CONDICIONAL de `I`/`E` checada via a própria rota `*-options` do tipo (se
// vazia, desabilita a option no seletor). Upload de documento na baixa
// individual continua fora de escopo (§4 do handshake).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useMemo, useState } from 'react';

import { Alert, Box, Flex, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { getWriteOffCounterpartTypeOptions } from '@/constants/WriteOff/options/writeoff-counterpart-type-options';

import {
  calculateWriteOffNetValue,
  writeOffSchemaResolver,
} from '@/validations/schemas/WriteOff/writeoff-schema';

import {
  getAccountBalance,
  listAccounts,
} from '@/services/v2/CadastrosBase/Account/account-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listPlanAccountOptions } from '@/services/v2/PlanAccounts/plan-account-service';
import {
  createManualWriteOff,
  getSuggestedWriteOffCategories,
  listAdvanceOptions,
  listCardBillOptions,
  listExpenseOptions,
  listIncomeOptions,
  listNfeOptions,
  mapWriteOffCounterpartOption,
} from '@/services/v2/WriteOff/writeoff-service';

import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';
import type {
  WriteOffCategoryForm,
  WriteOffCategoryPayload,
  WriteOffCounterpartOptionItem,
  WriteOffCounterpartType,
  WriteOffForm,
  WriteOffSegment,
} from '@/@types/v2/WriteOff';

// Campos condicionais que carregam um `WriteOffCounterpartOption` (contrapartida
// da baixa, tipos B/D/I/E/C) — mirror da tabela do handshake §2.
type CounterpartFieldName =
  | 'related_title_uuid'
  | 'nfe_uuid'
  | 'external_income_uuid'
  | 'external_expense_uuid'
  | 'card_bill_uuid';

interface CounterpartFieldConfig {
  name: CounterpartFieldName;
  label: string;
  placeholder: string;
  service: (
    segment: WriteOffSegment,
    titleUuid: string
  ) => Promise<ResponsePagination<WriteOffCounterpartOptionItem[]>>;
}

export interface WriteOffCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  segment: WriteOffSegment;
  titleUuid: string;
  /** Saldo do título recebido por prop — só sugere o valor inicial de `amount` (sem lote/consulta própria). */
  titleBalance: number;
  /** Disparado após criar com sucesso — o CONSUMIDOR decide o que invalidar (query do próprio segmento). */
  onSuccess?: () => void;
}

export function WriteOffCreateModal({
  isOpen,
  onClose,
  segment,
  titleUuid,
  titleBalance,
  onSuccess,
}: WriteOffCreateModalProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.writeOff.form;

  if (!isOpen) return null;

  return (
    <WriteOffCreateModalBody
      isOpen={isOpen}
      title={text.createTitle}
      segment={segment}
      titleUuid={titleUuid}
      titleBalance={titleBalance}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface WriteOffCreateModalBodyProps {
  isOpen: boolean;
  title: string;
  segment: WriteOffSegment;
  titleUuid: string;
  titleBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
}

// Tem o `useForm`/mutação — renderiza o próprio `CustomDialog` para que o
// footer (Cancelar/Confirmar, que dependem de `isSubmitting`/`handleSubmit`)
// vá para o SLOT `footer` real do dialog — header/footer fixos, só o body
// rola, SEM footer-in-body sticky (que deixava faixa morta abaixo do
// footer).
function WriteOffCreateModalBody({
  isOpen,
  title,
  segment,
  titleUuid,
  titleBalance,
  onClose,
  onSuccess,
}: WriteOffCreateModalBodyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.writeOff.form;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting: isValidating },
  } = useForm<WriteOffForm>({
    resolver: writeOffSchemaResolver(languageGB, segment),
    defaultValues: {
      // Default mirror do comportamento anterior (`writeoff_type='M'` fixo) —
      // usuário pode trocar (`TASK-036-GB-07`).
      writeoff_type: 'M',
      account_uuid: null,
      // Mirror `IncomeAutomaticWriteoffSection` — sugere HOJE, o usuário pode trocar.
      movement_date: todayLocalIso(),
      related_title_uuid: null,
      nfe_uuid: null,
      external_income_uuid: null,
      external_expense_uuid: null,
      card_bill_uuid: null,
      // Sugere o saldo do título recebido por prop (Tela de origem decide o valor real).
      amount: titleBalance > 0 ? titleBalance : null,
      discount: 0,
      penalty: 0,
      interest: 0,
      increase: 0,
      note: '',
      categories: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'categories' });

  // Caches de rótulo `{label,value}` dos selects de linha — mesmo mecanismo
  // de `IncomeApportionmentTab.tsx` (o valor salvo no form é só o `uuid`,
  // `SelectAsyncPaginate` precisa da opção completa para exibir).
  const [categoryOptionsCache, setCategoryOptionsCache] = useState<Record<string, Option<string>>>(
    {}
  );
  const [centerOptionsCache, setCenterOptionsCache] = useState<Record<string, Option<string>>>({});
  const [planAccountOptionsCache, setPlanAccountOptionsCache] = useState<
    Record<string, Option<string>>
  >({});

  // ---- Rateio SUGERIDO do título — `GET
  // /{segment}/{titleUuid}/writeoffs/suggested-categories`
  // (`TASK-036-GB-06`). O corpo do modal é remontado do zero a cada abertura
  // (`CustomDialog` com `lazyMount`+`unmountOnExit`, ver cabeçalho do
  // arquivo), então disparar no MOUNT já equivale a disparar quando
  // `isOpen`+`titleUuid` mudam — sem precisar de dependência extra de
  // `isOpen` (a prop nem existe neste nível). `replace()` (não `setValue`)
  // para o `useFieldArray` reconciliar corretamente as `keys` internas.
  // Falha silenciosa (rede, 404, título sem categoria própria) — mirror
  // `accountBalancePreview` acima: o form abre com `categories: []` como
  // hoje, sem bloquear o fluxo. ----
  useEffect(() => {
    if (!titleUuid) return;
    let cancelled = false;

    getSuggestedWriteOffCategories(segment, titleUuid)
      .then((response) => {
        if (cancelled) return;
        const rows = response.data ?? [];
        if (rows.length === 0) return;

        const nextCategoryCache: Record<string, Option<string>> = {};
        const nextCenterCache: Record<string, Option<string>> = {};
        const nextPlanAccountCache: Record<string, Option<string>> = {};

        const formRows: WriteOffCategoryForm[] = rows.map((row) => {
          const categoryOption: Option<string> = {
            label: row.category_description ?? row.category_uuid,
            value: row.category_uuid,
          };
          const centerOption: Option<string> = {
            label: row.center_description ?? row.center_uuid,
            value: row.center_uuid,
          };
          const planAccountOption: Option<string> | null = row.plan_account_uuid
            ? {
                label: row.plan_account_description ?? row.plan_account_uuid,
                value: row.plan_account_uuid,
              }
            : null;

          nextCategoryCache[categoryOption.value] = categoryOption;
          nextCenterCache[centerOption.value] = centerOption;
          if (planAccountOption) {
            nextPlanAccountCache[planAccountOption.value] = planAccountOption;
          }

          return {
            category_uuid: categoryOption,
            center_uuid: centerOption,
            plan_account_uuid: planAccountOption,
            value: row.value,
          };
        });

        setCategoryOptionsCache((prev) => ({ ...prev, ...nextCategoryCache }));
        setCenterOptionsCache((prev) => ({ ...prev, ...nextCenterCache }));
        setPlanAccountOptionsCache((prev) => ({ ...prev, ...nextPlanAccountCache }));
        replace(formRows);
      })
      .catch(() => {
        // Falha silenciosa — o form permanece com `categories: []` (default).
      });

    return () => {
      cancelled = true;
    };
  }, [segment, titleUuid, replace]);

  const watchedAmount = watch('amount');
  const watchedDiscount = watch('discount');
  const watchedPenalty = watch('penalty');
  const watchedInterest = watch('interest');
  const watchedIncrease = watch('increase');
  const watchedAccount = watch('account_uuid');
  const watchedMovementDate = watch('movement_date');
  const watchedCategories = watch('categories') ?? [];
  const watchedType = watch('writeoff_type');
  const watchedRelatedTitle = watch('related_title_uuid');
  const watchedNfe = watch('nfe_uuid');
  const watchedExternalIncome = watch('external_income_uuid');
  const watchedExternalExpense = watch('external_expense_uuid');
  const watchedCardBill = watch('card_bill_uuid');

  // ---- Disponibilidade CONDICIONAL de `I`/`E` (handshake §2) — só o tipo
  // aplicável ao segmento ATUAL precisa ser checado (`I` só existe em
  // `expenses`, `E` só em `incomes`); a rota `*-options` correspondente vem
  // vazia quando o vínculo Provider↔Client necessário não existe. Falha
  // silenciosa (rede) mantém a option HABILITADA — nunca bloqueia o usuário
  // por erro de rede, o servidor rejeita no submit se o vínculo não existir. ----
  const [typeAvailability, setTypeAvailability] = useState<
    Partial<Record<WriteOffCounterpartType, boolean>>
  >({});
  useEffect(() => {
    if (!titleUuid) return;
    let cancelled = false;
    const checkType: WriteOffCounterpartType | null =
      segment === 'expenses' ? 'I' : segment === 'incomes' ? 'E' : null;
    if (!checkType) return;
    const fetcher = checkType === 'I' ? listIncomeOptions : listExpenseOptions;

    fetcher(segment, titleUuid)
      .then((response) => {
        if (cancelled) return;
        setTypeAvailability((prev) => ({
          ...prev,
          [checkType]: (response.data?.items?.length ?? 0) > 0,
        }));
      })
      .catch(() => {
        // Falha silenciosa — mantém a option habilitada (ver comentário acima).
      });

    return () => {
      cancelled = true;
    };
  }, [segment, titleUuid]);

  const typeOptions = useMemo(
    () =>
      getWriteOffCounterpartTypeOptions(segment, languageGB, {
        I: typeAvailability.I === false,
        E: typeAvailability.E === false,
      }),
    [segment, languageGB, typeAvailability.I, typeAvailability.E]
  );

  // ---- Config do campo condicional de contrapartida (B/D/I/E/C) — mirror
  // da tabela do handshake §2, 1 `SelectAsyncPaginate` por vez conforme
  // `watchedType`. `null` quando `writeoff_type` é `M`/vazio (nenhum campo
  // condicional de contrapartida — `account_uuid` já cobre `M`). ----
  const counterpartFieldConfig: CounterpartFieldConfig | null = (() => {
    switch (watchedType) {
      case 'B':
        return {
          name: 'related_title_uuid',
          label: text.fields.advanceTitle,
          placeholder: text.placeholders.advanceTitle,
          service: listAdvanceOptions,
        };
      case 'D':
        return {
          name: 'nfe_uuid',
          label: text.fields.nfe,
          placeholder: text.placeholders.nfe,
          service: listNfeOptions,
        };
      case 'I':
        return {
          name: 'external_income_uuid',
          label: text.fields.incomeTitle,
          placeholder: text.placeholders.incomeTitle,
          service: listIncomeOptions,
        };
      case 'E':
        return {
          name: 'external_expense_uuid',
          label: text.fields.expenseTitle,
          placeholder: text.placeholders.expenseTitle,
          service: listExpenseOptions,
        };
      case 'C':
        return {
          name: 'card_bill_uuid',
          label: text.fields.cardBill,
          placeholder: text.placeholders.cardBill,
          service: listCardBillOptions,
        };
      default:
        return null;
    }
  })();

  // Valor/saldo do campo de contrapartida ATUALMENTE ativo — `balance` já
  // veio junto da option escolhida (`WriteOffCounterpartOption`), SEM
  // round-trip extra (mirror do comentário original de `titleBalance`).
  const counterpartValue =
    watchedType === 'B'
      ? watchedRelatedTitle
      : watchedType === 'D'
        ? watchedNfe
        : watchedType === 'I'
          ? watchedExternalIncome
          : watchedType === 'E'
            ? watchedExternalExpense
            : watchedType === 'C'
              ? watchedCardBill
              : null;

  // Preview de líquido — 100% client-side (`useWatch` via `watch` acima),
  // MESMA fórmula do backend (`ManualWriteOffIncomeAction`/
  // `ManualWriteOffExpenseAction`), NUNCA enviado ao payload (`WriteOffPayload`
  // não tem o campo `net_value`).
  const netValue = calculateWriteOffNetValue({
    amount: watchedAmount,
    discount: watchedDiscount,
    penalty: watchedPenalty,
    interest: watchedInterest,
    increase: watchedIncrease,
  });

  const categoriesSum = watchedCategories.reduce(
    (sum, item) => sum + (Number(item?.value) || 0),
    0
  );

  // ---- Aviso de saldo bancário — SÓ para `segment='expenses'` (Expense
  // DEBITA e valida saldo; Income CREDITA e nunca valida — mirror
  // `IncomeAutomaticWriteoffSection.tsx:26-30`/
  // `CreateOrUpdateExpense.tsx::balanceInsufficient`). Debounce leve
  // (~300ms), falha silenciosa (o submit real ainda valida no servidor). ----
  const [accountBalancePreview, setAccountBalancePreview] = useState<number | null>(null);
  useEffect(() => {
    if (segment !== 'expenses' || !watchedAccount?.value || !watchedMovementDate) {
      setAccountBalancePreview(null);
      return;
    }
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      getAccountBalance(watchedAccount.value, watchedMovementDate)
        .then((response) => {
          if (!cancelled) setAccountBalancePreview(response.data.balance);
        })
        .catch(() => {
          if (!cancelled) setAccountBalancePreview(null);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [segment, watchedAccount?.value, watchedMovementDate]);

  // ---- Aviso de saldo — 2 fontes distintas conforme `writeoff_type`
  // (handshake §2, nota UX):
  //   `M` — saldo BANCÁRIO (`accountBalancePreview` acima), SÓ `expenses`
  //         (Income credita, nunca valida saldo).
  //   `B`/`D`/`I`/`E` — saldo do PRÓPRIO título/documento de contrapartida
  //         (`counterpartValue.balance`, já carregado na option — sem
  //         round-trip extra), nos 2 segmentos (é saldo do parceiro, não do
  //         banco).
  //   `C` (Fatura) — NUNCA mostra o aviso — o saldo CRESCE com a baixa
  //         (mirror legado §1.6), não é um limite.
  const balanceInsufficient =
    watchedType === 'M'
      ? segment === 'expenses' && accountBalancePreview !== null && accountBalancePreview < netValue
      : watchedType === 'B' || watchedType === 'D' || watchedType === 'I' || watchedType === 'E'
        ? counterpartValue !== null && counterpartValue.balance < netValue
        : false;

  // ---- Adicionar/remover linha de rateio (mirror `IncomeApportionmentTab`,
  // sem o gate "linha anterior preenchida" — o Yup já bloqueia o submit com
  // linha incompleta, e esta Tarefa não replica o `.btn-add-item` do legado). ----
  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);

  function handleAddRow() {
    append({ category_uuid: null, center_uuid: null, plan_account_uuid: null, value: null });
  }

  function handleRequestRemove(index: number) {
    if (fields.length <= 1) {
      toaster.warning({ description: text.removeRowBlockedMessage });
      return;
    }
    setRowIndexToRemove(index);
  }

  function handleConfirmRemove() {
    if (rowIndexToRemove !== null) {
      remove(rowIndexToRemove);
      setRowIndexToRemove(null);
    }
  }

  // ---- Submit — `POST /{segment}/{titleUuid}/writeoffs` ----
  // `useMutation` DIRETO (NÃO `useRequest`): o componente compartilhado não
  // conhece `queryKey` de Income/Expense — quem invalida é o CONSUMIDOR via
  // `onSuccess` (Estado, Tarefa 331).
  const mutation = useMutation({
    mutationFn: async (data: WriteOffForm) => {
      const categories: WriteOffCategoryPayload[] = data.categories.map((row) => ({
        category_uuid: row.category_uuid!.value,
        center_uuid: row.center_uuid!.value,
        value: Number(row.value) || 0,
        plan_account_uuid: row.plan_account_uuid?.value ?? null,
      }));

      // `writeoff_type` SEMPRE enviado; só o campo condicional aplicável ao
      // tipo escolhido é preenchido, os demais `undefined` (handshake §2 —
      // "nunca enviar todos preenchidos").
      return createManualWriteOff(segment, titleUuid, {
        writeoff_type: data.writeoff_type!,
        account_uuid:
          data.writeoff_type === 'M' ? (data.account_uuid?.value ?? undefined) : undefined,
        movement_date: data.writeoff_type === 'M' ? (data.movement_date as string) : undefined,
        related_title_uuid:
          data.writeoff_type === 'B' ? (data.related_title_uuid?.value ?? undefined) : undefined,
        nfe_uuid: data.writeoff_type === 'D' ? (data.nfe_uuid?.value ?? undefined) : undefined,
        external_income_uuid:
          data.writeoff_type === 'I' ? (data.external_income_uuid?.value ?? undefined) : undefined,
        external_expense_uuid:
          data.writeoff_type === 'E' ? (data.external_expense_uuid?.value ?? undefined) : undefined,
        card_bill_uuid:
          data.writeoff_type === 'C' ? (data.card_bill_uuid?.value ?? undefined) : undefined,
        amount: Number(data.amount) || 0,
        discount: Number(data.discount) || 0,
        penalty: Number(data.penalty) || 0,
        interest: Number(data.interest) || 0,
        increase: Number(data.increase) || 0,
        note: data.note || undefined,
        categories,
      });
    },
    onSuccess: () => {
      toaster.success({
        title: text.createTitle,
        description: text.createdToast,
        duration: 7000,
      });
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      // Mensagem literal da API (422/403 já formatada em PT-BR pelo
      // servidor — rateio divergente, saldo insuficiente, mês congelado, já
      // cancelada) — NUNCA reescrita aqui, mirror `useRequest`.
      const message = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({ title: text.createTitle, description: message, duration: 7000 });
    },
  });

  function onSubmit(data: WriteOffForm) {
    mutation.mutate(data);
  }

  const isSubmitting = mutation.isPending || isValidating;

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="xl"
        footer={
          <>
            <Button
              title={text.cancelButton}
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            />
            <Button
              title={text.submitButton}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </>
        }
      >
        <Form noPadding onSubmit={handleSubmit(onSubmit)}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Controller
              name="writeoff_type"
              control={control}
              render={({ field: { value, onChange }, fieldState }) => (
                <Select
                  name="writeoff_type"
                  label={text.fields.writeoffType}
                  value={typeOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: { value: WriteOffCounterpartType } | null) =>
                    onChange(option?.value ?? null)
                  }
                  options={typeOptions}
                  error={fieldState.error?.message}
                  isRequired
                  isDisabled={isSubmitting}
                  noClearable
                  disablePortal
                />
              )}
            />

            {watchedType === 'M' ? (
              <>
                <Controller
                  name="account_uuid"
                  control={control}
                  render={({ field, fieldState }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={text.fields.account}
                      placeholder={text.placeholders.account}
                      service={listAccounts}
                      mapOptions={(item: AccountListItem) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        is_enabled: 'true',
                      })}
                      value={field.value ?? undefined}
                      onChange={(option: any) => field.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isSubmitting}
                      disablePortal
                    />
                  )}
                />

                <Controller
                  name="movement_date"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      label={text.fields.movementDate}
                      errorText={fieldState.error?.message}
                      isRequired
                    >
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </Field>
                  )}
                />
              </>
            ) : (
              counterpartFieldConfig && (
                <>
                  <Controller
                    name={counterpartFieldConfig.name}
                    control={control}
                    render={({ field, fieldState }) => (
                      <SelectAsyncPaginate
                        name={field.name}
                        label={counterpartFieldConfig.label}
                        placeholder={counterpartFieldConfig.placeholder}
                        service={() => counterpartFieldConfig.service(segment, titleUuid)}
                        mapOptions={mapWriteOffCounterpartOption}
                        value={field.value ?? undefined}
                        onChange={(option: any) => field.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isSubmitting}
                        disablePortal
                      />
                    )}
                  />

                  <InputReadOnly
                    label={text.fields.counterpartBalance}
                    value={(counterpartValue?.balance ?? 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  />
                </>
              )
            )}

            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.amount}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="discount"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.discount}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="penalty"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.penalty}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="interest"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.interest}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <Controller
              name="increase"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.fields.increase}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isSubmitting}
                />
              )}
            />

            <InputReadOnly
              label={text.fields.netValuePreview}
              value={netValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
          </SimpleGrid>

          {/* Aviso de saldo — fonte varia por `writeoff_type` (ver
          `balanceInsufficient` acima): `M` só `expenses` (Income credita,
          não debita); `B`/`D`/`I`/`E` nos 2 segmentos (saldo do parceiro);
          `C` NUNCA mostra (o saldo da Fatura CRESCE com a baixa). */}
          {balanceInsufficient && (
            <Alert.Root status="warning" borderRadius="md" mt={3}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{text.insufficientBalanceWarning}</Alert.Title>
              </Alert.Content>
            </Alert.Root>
          )}

          <Box mt={4}>
            <Controller
              name="note"
              control={control}
              render={({ field, fieldState }) => (
                <Textarea
                  name={field.name}
                  label={text.fields.note}
                  placeholder={text.placeholders.note}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  maxLength={150}
                  disabled={isSubmitting}
                />
              )}
            />
          </Box>

          <Box mt={6}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={3}>
              <Text fontSize="sm" fontWeight="semibold">
                {text.apportionmentSectionTitle}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {text.sumLabel}:{' '}
                {categoriesSum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </Text>
            </Flex>

            {typeof (errors.categories as any)?.message === 'string' && (
              <Text fontSize="xs" color="fg.error" mb={3}>
                {(errors.categories as any).message}
              </Text>
            )}

            {fields.length === 0 ? (
              <Text fontSize="sm" color="fg.muted" mb={3}>
                {text.emptyLabel}
              </Text>
            ) : (
              <Flex direction="column" gap={3} mb={3}>
                {fields.map((field, index) => {
                  const rowId = field.id;
                  const categoryUuid = watchedCategories[index]?.category_uuid?.value ?? null;
                  const centerUuid = watchedCategories[index]?.center_uuid?.value ?? null;
                  const planAccountUuid =
                    watchedCategories[index]?.plan_account_uuid?.value ?? null;

                  return (
                    <Flex key={rowId} gap={3} align="flex-end" wrap="wrap">
                      <Box flex="1" minW="200px">
                        <Controller
                          name={`categories.${index}.category_uuid`}
                          control={control}
                          render={({ field: rowField, fieldState }) => (
                            <SelectAsyncPaginate
                              name={rowField.name}
                              label={text.fields.category}
                              placeholder={text.placeholders.category}
                              service={listFinancialCategoryOptions}
                              mapOptions={(item: FinancialCategoryOption) => ({
                                label: item.description,
                                value: item.uuid,
                              })}
                              findParams={(search: string | { search: string }) => ({
                                search: typeof search === 'string' ? search : search.search,
                              })}
                              value={categoryUuid ? categoryOptionsCache[categoryUuid] : undefined}
                              onChange={(option: any) => {
                                if (option) {
                                  setCategoryOptionsCache((prev) => ({
                                    ...prev,
                                    [option.value]: option,
                                  }));
                                }
                                rowField.onChange(option ?? null);
                              }}
                              error={fieldState.error?.message}
                              isRequired
                              isDisabled={isSubmitting}
                              disablePortal
                            />
                          )}
                        />
                      </Box>

                      <Box flex="1" minW="200px">
                        <Controller
                          name={`categories.${index}.center_uuid`}
                          control={control}
                          render={({ field: rowField, fieldState }) => (
                            <SelectAsyncPaginate
                              name={rowField.name}
                              label={text.fields.center}
                              placeholder={text.placeholders.center}
                              service={listCostCenterOptions}
                              mapOptions={(item: CostCenterRef) => ({
                                label: `${item.code} — ${item.description}`,
                                value: item.uuid,
                              })}
                              findParams={(search: string | { search: string }) => ({
                                search: typeof search === 'string' ? search : search.search,
                                only_analytic: true,
                              })}
                              value={centerUuid ? centerOptionsCache[centerUuid] : undefined}
                              onChange={(option: any) => {
                                if (option) {
                                  setCenterOptionsCache((prev) => ({
                                    ...prev,
                                    [option.value]: option,
                                  }));
                                }
                                rowField.onChange(option ?? null);
                              }}
                              error={fieldState.error?.message}
                              isRequired
                              isDisabled={isSubmitting}
                              disablePortal
                            />
                          )}
                        />
                      </Box>

                      <Box flex="1" minW="200px">
                        <Controller
                          name={`categories.${index}.plan_account_uuid`}
                          control={control}
                          render={({ field: rowField }) => (
                            <SelectAsyncPaginate
                              name={rowField.name}
                              label={text.fields.planAccount}
                              placeholder={text.placeholders.planAccount}
                              service={listPlanAccountOptions}
                              mapOptions={(item: PlanAccountRef) => ({
                                label: `${item.code} — ${item.description}`,
                                value: item.uuid,
                              })}
                              findParams={(search: string | { search: string }) => ({
                                search: typeof search === 'string' ? search : search.search,
                              })}
                              value={
                                planAccountUuid
                                  ? planAccountOptionsCache[planAccountUuid]
                                  : undefined
                              }
                              onChange={(option: any) => {
                                if (option) {
                                  setPlanAccountOptionsCache((prev) => ({
                                    ...prev,
                                    [option.value]: option,
                                  }));
                                }
                                rowField.onChange(option ?? null);
                              }}
                              isDisabled={isSubmitting}
                              disablePortal
                            />
                          )}
                        />
                      </Box>

                      <Box w={{ base: 'full', sm: '160px' }}>
                        <Controller
                          name={`categories.${index}.value`}
                          control={control}
                          render={({ field: rowField, fieldState }) => (
                            <MoneyInput
                              name={rowField.name}
                              label={text.fields.categoryValue}
                              value={rowField.value}
                              onValueChange={rowField.onChange}
                              error={fieldState.error?.message}
                              isRequired
                              disabled={isSubmitting}
                            />
                          )}
                        />
                      </Box>

                      <IconButtonTable
                        aria-label={text.removeRowLabel}
                        mensegerTooltip={text.removeRowLabel}
                        size="sm"
                        color="red.500"
                        variant="ghost"
                        disabled={isSubmitting}
                        onClick={() => handleRequestRemove(index)}
                      >
                        <Icon as={FiTrash2} />
                      </IconButtonTable>
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
              type="button"
              onClick={handleAddRow}
              disabled={isSubmitting}
            />
          </Box>
        </Form>
      </CustomDialog>

      <DeleteConfirmDialog
        isOpen={rowIndexToRemove !== null}
        onClose={() => setRowIndexToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={text.removeRowConfirmTitle}
        confirmButtonText={text.removeRowLabel}
        tone="warning"
        colorPalette="orange"
      />
    </>
  );
}
