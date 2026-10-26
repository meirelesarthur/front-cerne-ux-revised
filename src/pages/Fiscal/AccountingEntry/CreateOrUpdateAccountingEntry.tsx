// src/pages/Fiscal/AccountingEntry/CreateOrUpdateAccountingEntry.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Partida Dobrada (AccountingEntry — domínio
// Fiscal, F-128, esteira 97-Esteiras/068, TASK-PD-FE-07). Rotas
// `/fiscal/partida-dobrada/novo` (criar) e `/fiscal/partida-dobrada/:uuid`
// (editar, GUID) — wiring real das 2 rotas é OBJETO DESTA MESMA Tarefa
// (router/index.tsx). Depende da fundação (TASK-PD-FE-01..05, commit
// ce2ff309) + listagem (TASK-PD-FE-06, commit c88df6c9). Tarefa de MAIOR
// complexidade/risco desta esteira (composição de tela + `useFieldArray` +
// balanceamento em tempo real + fidelidade ao 422 real).
//
// Molde estrutural: `CadastrosBase/CentroCusto/CreateOrUpdateCentroCusto.tsx`
// (`useFieldArray` no PAI + seção-irmã) E
// `Financeiro/MovCaixaBancario/CreateOrUpdateMovimento.tsx` (mesmo padrão
// create/edit por GUID + `useCustomFormQueryByGuid` + `applyServerFieldErrors`
// de 422 por campo/índice + array-root).
//
// 3 riscos deliberados (Leitura do dev da Tarefa):
//   1. Payload NUNCA leva `total_amount`/`code`/`user_id`/`farm_id` — servidor
//      resolve/calcula tudo (`AccountingEntryData`, GAP-PD-02/03/04 já
//      corrigidos). `code`/`total_amount`/autor são LEITURA DIRETA de
//      `accountingEntryQuery.data` no JSX — nunca `register()`/`Controller`/
//      campo oculto.
//   2. 422 de balanceamento vem AGREGADO na chave `items` (não `items.0.x`) —
//      `applyServerFieldErrors` abaixo trata a chave `items` EXATA (sem
//      índice) como erro de nível de ARRAY (`setError('items', ...)`), além
//      do mapeamento por índice para os demais campos de linha — mirror
//      `EditRateioMovimento.tsx`'s `setError('allocations', ...)`.
//   3. `items` é SEMPRE enviado por completo (create E update, nunca
//      omitido/filtrado) — decisão §1 do contrato de tela.
//
// DESVIO DELIBERADO do nome literal citado na ficha (`useCustomFormQueryById`)
// — mesmo racional já registrado em `CreateOrUpdateMovimento.tsx`/
// `BaseRegistrations/Parameters/CreateOrUpdateParameters.tsx`:
// `useCustomFormQueryById` (apesar do nome) é a variante LEGADA de ID
// numérico; `useCustomFormQueryByGuid` é o precedente REAL e dominante
// (~40 módulos) para forms create/edit por GUID neste projeto. Fonte de
// verdade real > texto genérico da ficha.
//
// `date`: `AccountingEntryForm.date` é `Date | null` (fundação, TASK-PD-FE-01)
// — widget `InputDate` (mirror `ParameterWeights/CreateOrUpdateParameterWeights.tsx`).
// Serialização usa `date-fns` `format`/`parseISO` (NUNCA `new Date(iso)` +
// `.toISOString()`, que sofre shift de fuso horário: `new Date('2024-01-15')`
// é meia-noite UTC, `.toISOString()` num Date de meia-noite LOCAL pode voltar
// 1 dia em fusos negativos como o do Brasil).
//
// Guard de navegação: `uuid` malformado (não-UUID, não literal `novo`)
// redireciona para a listagem ANTES de renderizar o form (mirror
// `CreateOrUpdateSystemUpdate.tsx`/`get_pwa_form_query_pattern` "Guard de
// navegação").
//
// Modo VISUALIZAR (TASK-PD-FE-08, rota `/:uuid/visualizar`): decisão do dono
// (Leitura do dev da Tarefa) — reuso do MESMO componente com `isViewMode`
// derivado de `useLocation().pathname` (mirror `isEditing`), em vez de uma
// tela `AccountingEntryDetalhe.tsx` separada — o form já concentra toda a
// lógica de hidratação/renderização das linhas. `isViewMode` desabilita TODOS
// os campos/linhas (mesmo que o usuário também tenha permissão de edição) e
// remove o footer de submit (`footer={isViewMode ? undefined : (<>...)}`,
// `FormContainer`'s footer é opt-in) — sem botão Salvar/Adicionar/Remover
// item habilitado no modo view.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { isAxiosError } from 'axios';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import {
  accountingEntryItemCondition,
  accountingEntryItemConditionOptions,
  accountingEntryOriginOptions,
} from '@/constants/Fiscal/accountingEntry';
import { accountingEntryFormDefaultValues } from '@/constants/Fiscal/accountingEntry/default-values';
import { queryKey } from '@/constants/query-key';

// `accounting-entry-schema.ts` (fundação, TASK-PD-FE-04) só exporta o
// FACTORY do schema Yup cru (`export default accountingEntrySchema`), sem um
// `xxxSchemaResolver` pronto (diferente de `movement-schema.ts`/
// `centro-custo-schema.ts`) — `yupResolver(...)` é aplicado AQUI, na tela.
import accountingEntrySchema from '@/validations/schemas/Fiscal/accounting-entry-schema';

import {
  createAccountingEntry,
  getAccountingEntry,
  updateAccountingEntry,
} from '@/services/v2/Fiscal/accounting-entry-service';

import type {
  AccountingEntryData,
  AccountingEntryForm,
  CreateOrUpdateAccountingEntryRequest,
} from '@/@types/v2/Fiscal/accountingEntry';

import { AccountingEntryItemsEditor } from './AccountingEntryItemsEditor';

const ACCOUNTING_ENTRY_LIST_ROUTE = '/fiscal/partida-dobrada';

// 422 por campo/índice (contrato-tela §2) ALÉM do array-root `items` (Risco 2
// do cabeçalho do arquivo) — mirror `applyServerFieldErrors` de
// `CreateOrUpdateMovimento.tsx`/`EditRateioMovimento.tsx`. Erro de negócio
// sem campo específico cai no fallback genérico do toast (já exibido pelo
// `onError` do `useRequest`).
function applyServerFieldErrors(
  error: unknown,
  setError: (name: any, error: { type: string; message: string }) => void
) {
  if (!isAxiosError(error) || error.response?.status !== 422) return;
  const backendErrors = (error.response.data as any)?.errors as
    Record<string, string[] | string> | undefined;
  if (!backendErrors) return;

  const knownRootFields = new Set(['date', 'description', 'origin']);
  const itemFieldPattern = /^items\.(\d+)\.(plan_account_uuid|condition|value)$/;

  Object.entries(backendErrors).forEach(([field, messages]) => {
    const message = Array.isArray(messages) ? messages[0] : messages;
    if (!message) return;

    const itemMatch = field.match(itemFieldPattern);
    if (itemMatch) {
      setError(`items.${itemMatch[1]}.${itemMatch[2]}`, { type: 'server', message });
      return;
    }

    if (knownRootFields.has(field)) {
      setError(field, { type: 'server', message });
      return;
    }

    // Risco 2 (cabeçalho do arquivo) — 422 de balanceamento vem AGREGADO na
    // chave EXATA `items` (não `items.0.x`): "É necessário informar ao menos
    // 1 item de débito/crédito.", "O somatório de débito deve ser igual ao
    // somatório de crédito." Tratado como erro de nível de ARRAY — o mesmo
    // `errors.items?.message` que `AccountingEntryItemsEditor` já lê para o
    // schema client (Yup `.test()`), mirror `setError('allocations', ...)`
    // de `EditRateioMovimento.tsx`.
    if (field === 'items') {
      setError('items', { type: 'server', message });
    }
    // Qualquer outro erro de negócio sem campo específico cai no fallback
    // genérico do toast (já exibido pelo `onError` do `useRequest`).
  });
}

export default function CreateOrUpdateAccountingEntry() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.accountingEntries.accountingEntry;

  // Modo VISUALIZAR (TASK-PD-FE-08) — rota `/fiscal/partida-dobrada/:uuid/visualizar`,
  // mirror `isEditing` derivado da própria rota (sem prop externa).
  const isViewMode = location.pathname.endsWith('/visualizar');

  // É edição quando existe um GUID válido na rota ("novo" não é GUID).
  const isEditing = isValidGuid(uuid);
  const canSave = isEditing
    ? can('double-entry-accountings_edit')
    : can('double-entry-accountings_create');

  // Gate de campos — modo view desabilita SEMPRE, mesmo que o usuário também
  // tenha `double-entry-accountings_edit` (a rota `/visualizar` é somente
  // leitura por contrato de tela, não por ausência de permissão).
  const fieldsDisabled = isViewMode || !canSave;

  // Guard de navegação — `uuid` presente, malformado E diferente do literal
  // `novo` (rota de criação) nunca deve chegar ao form/hook de query (mirror
  // `CreateOrUpdateSystemUpdate.tsx`/`get_pwa_form_query_pattern` "Guard de
  // navegação"). Redireciona para a listagem ANTES de renderizar.
  useEffect(() => {
    if (uuid && uuid !== 'novo' && !isValidGuid(uuid)) {
      navigate(ACCOUNTING_ENTRY_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<AccountingEntryForm>({
    mode: 'onChange',
    resolver: yupResolver(accountingEntrySchema(languageGB)) as any,
    reValidateMode: 'onChange',
    defaultValues: accountingEntryFormDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Lei 2 (`get_pwa_form_query_pattern`) — função NOMEADA com guarda de
  // `dirtyFields`. Converte `origin`/`condition`/`plan_account_uuid` de
  // string/uuid para `Option<T>` na hidratação (Selects Chakra são sempre
  // controlados por `Option<T>`, nunca por valor cru).
  function fillAccountingEntryForm(data: AccountingEntryData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        date: data.date,
        description: data.description,
        origin: accountingEntryOriginOptions.getOption(data.origin.value, languageGB),
        items: (data.items ?? []).map((item) => ({
          uuid: item.uuid,
          plan_account_uuid: item.plan_account
            ? {
                label: `${item.plan_account.code} — ${item.plan_account.description}`,
                value: item.plan_account.uuid,
              }
            : null,
          condition: accountingEntryItemConditionOptions.getOption(
            item.condition.value,
            languageGB
          ),
          value: item.value,
        })),
      });
    }
  }

  const accountingEntryQuery = useCustomFormQueryByGuid<AccountingEntryData>({
    registrationId: isEditing ? uuid : undefined,
    asyncFunction: getAccountingEntry,
    queryKey: queryKey.accountingEntries.accountingEntry,
    fillForm: fillAccountingEntryForm,
  });

  const isLoading = isEditing && checkLoadingStatus([accountingEntryQuery as any]);
  const accountingEntryData = (accountingEntryQuery as any)?.data as
    AccountingEntryData | undefined;

  const accountingEntryMutation = useRequest({
    asyncFunction: tryPersistAccountingEntry,
    entityName: text.singularLabel,
    queryKey: queryKey.accountingEntries.accountingEntriesList,
    queryKey2: queryKey.accountingEntries.accountingEntry,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Risco 1/3 (cabeçalho do arquivo) — `total_amount`/`code`/`user_id`/
  // `farm_id` NUNCA entram aqui; `items` SEMPRE enviado por completo (create
  // E update, nunca omitido/filtrado — decisão §1 do contrato de tela).
  async function tryPersistAccountingEntry(data: AccountingEntryForm) {
    const payload: CreateOrUpdateAccountingEntryRequest = {
      date: data.date as string,
      description: data.description.trim(),
      origin: data.origin!.value,
      items: data.items.map((item) => ({
        plan_account_uuid: item.plan_account_uuid!.value,
        condition: item.condition!.value,
        value: Number(item.value),
      })),
    };

    if (isEditing && uuid) {
      return await updateAccountingEntry(uuid, payload);
    }
    return await createAccountingEntry(payload);
  }

  async function onSubmit(data: AccountingEntryForm) {
    try {
      await accountingEntryMutation.mutateAsync(data);
    } catch (error) {
      applyServerFieldErrors(error, setError as any);
    }
  }

  const isSaving = isSubmitting || accountingEntryMutation.isPending;

  // Gate de submit (checklist de nova tela inviolável — Tarefa) — desabilita
  // Salvar em tempo real enquanto `|Σd−Σc| > 0.01` OU faltar ≥1 débito/≥1
  // crédito, MESMO cálculo/tolerância de `accounting-entry-schema.ts`
  // (TASK-PD-FE-04) e de `AccountingEntryItemsEditor` (que faz o MESMO
  // `useWatch` para os badges — duplicar a fórmula aqui, não importar
  // estado do componente filho, é o mesmo padrão já usado no projeto entre
  // `MovementAllocationEditor` (cálculo de exibição) e o guard manual de
  // `EditRateioMovimento.tsx` (`allocationsSumMatchesHeader`, cálculo de
  // bloqueio) — dois cálculos INDEPENDENTES da mesma fórmula, não uma
  // dependência cruzada de componente). O Yup (`resolver`) continua sendo a
  // fonte de verdade que efetivamente barra o `handleSubmit`/dá o 422 real
  // do servidor — este gate só ESPELHA o mesmo resultado em tempo real no
  // próprio botão, sem esperar o ciclo de validação `onChange` do RHF tocar
  // `items` (contrato-tela §5: "não há bloqueio adicional fora do form" —
  // a MESMA regra, só antecipada visualmente no botão).
  const watchedItemsForGate = useWatch({ control, name: 'items' }) ?? [];
  const totalDebitForGate = watchedItemsForGate.reduce(
    (sum, item) =>
      item?.condition?.value === accountingEntryItemCondition.debit
        ? sum + (Number(item?.value) || 0)
        : sum,
    0
  );
  const totalCreditForGate = watchedItemsForGate.reduce(
    (sum, item) =>
      item?.condition?.value === accountingEntryItemCondition.credit
        ? sum + (Number(item?.value) || 0)
        : sum,
    0
  );
  const hasDebitForGate = watchedItemsForGate.some(
    (item) => item?.condition?.value === accountingEntryItemCondition.debit
  );
  const hasCreditForGate = watchedItemsForGate.some(
    (item) => item?.condition?.value === accountingEntryItemCondition.credit
  );
  const isBalancedForGate =
    Math.round(Math.abs(totalDebitForGate - totalCreditForGate) * 100) / 100 <= 0.01;

  const isSaveDisabled =
    isSaving || isLoading || !hasDebitForGate || !hasCreditForGate || !isBalancedForGate;

  return (
    <FormContainer
      title={isViewMode ? text.viewTitle : isEditing ? text.editTitle : text.createTitle}
      footer={
        isViewMode ? undefined : (
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => navigate(-1)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="submit"
                form="accountingEntry-form"
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaveDisabled}
              />
            )}
          </>
        )
      }
    >
      <Form id="accountingEntry-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Código gerado pelo servidor + autor — display-only, NUNCA
            register()/Controller/hidden (Risco 1/3 do cabeçalho do arquivo).
            Autor só aparece em edição (whenLoaded no show/edit). */}
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          mb={6}
        >
          <Skeleton loading={isLoading} borderRadius="md">
            <SimpleGrid columns={isEditing ? { base: 1, sm: 2 } : 1} gap={4}>
              <InputReadOnly
                name="code"
                label={text.form.fields.code}
                value={accountingEntryData?.code ?? text.form.fields.codePlaceholder}
              />
              {isEditing && accountingEntryData?.user?.name && (
                <InputReadOnly
                  name="author"
                  label={text.form.fields.author}
                  value={accountingEntryData.user.name}
                />
              )}
            </SimpleGrid>
          </Skeleton>
        </Box>

        {/* Cabeçalho — Data | Origem | Descrição */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                label={text.form.fields.date}
                value={field.value}
                onChange={(value) => field.onChange(value)}
                error={error?.message}
                isRequired
                disabled={fieldsDisabled || isLoading}
              />
            )}
          />

          <Controller
            name="origin"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.form.fields.origin}
                name={field.name}
                value={field.value}
                onChange={(option) => field.onChange(option ?? null)}
                options={accountingEntryOriginOptions.options(languageGB)}
                error={error?.message}
                isRequired
                isDisabled={fieldsDisabled}
                loading={isLoading}
              />
            )}
          />

          <Input
            label={text.form.fields.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={isLoading}
            disabled={fieldsDisabled}
          />
        </SimpleGrid>

        {/* Linhas D/C dinâmicas + balanceamento em tempo real — componente
            NOVO (TASK-PD-FE-07), `useFieldArray` fica AQUI no pai. */}
        <Box mt={6}>
          <AccountingEntryItemsEditor
            control={control}
            fields={fields}
            append={append}
            remove={remove}
            errors={errors}
            languageGB={languageGB}
            disabled={fieldsDisabled || isLoading}
          />
        </Box>

        {/* `total_amount` — Badge/rodapé cosmético (soma client de
            `items[].value`) já é exibido dentro de `AccountingEntryItemsEditor`
            (Débito/Crédito). O total salvo pelo servidor (leitura honesta,
            NUNCA calculado no client) só existe em edição, já hidratado no
            card de Código acima quando o dono decidir exibi-lo lá — mantido
            fora do `useForm` (Risco 1 do cabeçalho do arquivo). */}
        {isEditing && (
          <Box mt={2}>
            <Text fontSize="xs" color="fg.muted">
              {text.form.fields.totalAmount}:{' '}
              {(accountingEntryData?.total_amount ?? 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </Text>
          </Box>
        )}
      </Form>
    </FormContainer>
  );
}
