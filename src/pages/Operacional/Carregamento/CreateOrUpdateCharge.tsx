// src/pages/Operacional/Carregamento/CreateOrUpdateCharge.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO, EDIÇÃO e VISUALIZAÇÃO de CARREGAMENTO (Charge) —
// Operacional > Agricultura (TASK-FE-CG-03, casca + aba Cabeçalho + aba
// Itens/cascata). Rotas: `/operacional/carregamento/novo` e
// `/operacional/carregamento/:chargeUuid`, registradas em `src/router/
// index.tsx` (posições reservadas pela TASK-FE-CG-02).
//
// Referência UX — UX-GAP declarada (`get_spa_ux_fidelity_pattern`, sem tela
// oficial no `cerne` para Carregamentos): mirror ESTRUTURAL do padrão real já
// migrado neste fork, `src/pages/Operacional/Romaneios/CreateOrUpdateRomaneio.
// tsx` (casca de abas, 1 `useForm` raiz, `Tabs.Root` com `value` string,
// `fillForm` nomeado com guarda de `dirtyFields`, footer com `onClick=
// {handleSubmit(onSubmit)}`, `DeleteConfirmDialog` como guarda de saída).
//
// Casca de 3 abas — Cabeçalho (campos deste arquivo) · Itens
// (`ChargeItemsTab.tsx`/`ChargeItemRow.tsx`, cascata armazém→produto→estoque)
// · Despesas acessórias (`ChargeExpensesTab.tsx`/`ChargeExpenseRow.tsx`,
// TASK-FE-CG-04, `value="2"`).
//
// Nota técnica 5 do plano de arquitetura frontend (CL-43, decisão (d2) já
// fechada na API — PRESERVAR sem bloqueio de servidor): não existe surface
// separada de "Visualizar" — a MESMA tela cobre criar/editar/visualizar.
//
// CORREÇÃO (decisão do dono #5, MANTER LIVRE — TASK-FE-CG-05): o Charge
// `finalizada` CONTINUA EDITÁVEL nesta tela; o backend permite `update`/
// `destroy` em qualquer status (nenhuma guarda de servidor por `status`) e a
// ação "Finalizar" (`FinishCharge.tsx`) só muda o `status`, nunca torna o
// registro imutável. `isReadOnly` reflete SÓ a ausência de `charge_edit`
// (usuário só com `charge_view`) — NUNCA o `status` do Charge.
//
// Armadilhas de payload (nota técnica 2 do plano, `## 3`):
//   1. `dt_charge` é STRING (`YYYY-MM-DD`), NUNCA `Date` — mesma armadilha já
//      documentada em `@types/v2/Carregamentos` (precedente `TransferForm`).
//   2. `total`/`total_amount`/`weight` (itens) são hints CLIENT-ONLY — NUNCA
//      vão ao payload (servidor recalcula de verdade, sem recálculo
//      bidirecional aqui).
//   3. `client_uuid`/`items[].product_uuid`/`items[].quantity`/
//      `items[].amount` são `required` (fecha CL-03 — client+server).
//   4. `expenses` é `present|array` no servidor — SEMPRE no payload, mesmo
//      `[]` (D6, `useFieldArray` real de `ChargeExpensesTab.tsx`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Tabs, Text, useDisclosure } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { normalizeDocument } from '@/utils/cpfCnpj';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';
import { formatPlateIfValid } from '@/utils/masks/plate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { chargeSchemaResolver } from '@/validations/schemas/Carregamentos/charge-schema';

import { listClients } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { createCharge, updateCharge } from '@/services/v2/Carregamentos/charge-service';
import { getProduct } from '@/services/v2/Products/product-service';
import { listStateOptions } from '@/services/v2/States/state-service';

import type { Option } from '@/@types/option';
import type { ClientListItem } from '@/@types/v2/CadastrosBase/client';
import type {
  ChargeDetail,
  ChargeForm as ChargeFormValues,
  CreateChargeRequest,
} from '@/@types/v2/Carregamentos';

import { ChargeExpensesTab } from './ChargeExpensesTab';
import { ChargeItemsTab } from './ChargeItemsTab';
import {
  buildChargeExpensePayload,
  buildChargeItemPayload,
  chargeExpenseToForm,
  chargeItemToForm,
  createEmptyChargeItem,
  NOT_INFORMED_LABEL,
  useChargeForm,
} from './useCarregamentos';

type ChargeTabKey = '0' | '1' | '2';

function todayIso(): string {
  return todayLocalIso();
}

export default function CreateOrUpdateCharge() {
  const { chargeUuid } = useParams<{ chargeUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.carregamentos.charge;
  const formText = text.form;

  // Detecção de modo (convenção do fork) — "novo" não é GUID.
  const isEditing = isValidGuid(chargeUuid);

  // Guard — `chargeUuid` presente e malformado não pode chegar ao hook de
  // detalhe (`useCustomFormQueryById` só desabilita a query, não redireciona).
  useEffect(() => {
    if (!chargeUuid) return;
    if (!isValidGuid(chargeUuid)) {
      navigate('/operacional/carregamento', { replace: true });
    }
  }, [chargeUuid, navigate]);

  const canSave = isEditing ? can('charge_edit') : can('charge_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<ChargeFormValues>({
    mode: 'onChange',
    resolver: chargeSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      dt_charge: todayIso(),
      client_uuid: null,
      transporter_uuid: null,
      driver_name: '',
      driver_plate: '',
      driver_uf: null,
      driver_nif: '',
      note: '',
      // Create inicia com 1 linha vazia (mirror `RomaneioItemsTab`, IG-06/07);
      // edição chega vazia aqui e é substituída pelo `reset()` de
      // `fillChargeForm` assim que o `GET` resolve.
      items: isEditing ? [] : [createEmptyChargeItem()],
      // `present|array` no servidor (D6) — repeater de Despesas inicia VAZIO
      // ao criar (mirror `RomaneioExpensesTab`, diferente de Itens).
      expenses: [],
    },
  });

  // Lei do fork (`get_pwa_form_query_pattern`) — função NOMEADA com guarda de
  // `dirtyFields`; NUNCA `reset()` solto em `useEffect` (apagaria o que o
  // usuário digitou num refetch).
  function fillChargeForm(data: ChargeDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (!(hasNoFormChanges || resetForce)) return;

    reset({
      dt_charge: data.dt_charge,
      // DD-078-04 — `client`/`transporter` expõem `{uuid, name}` (`people.name`):
      // rótulo já no 1º render, sem GET satélite. Sem `name` → placeholder
      // (NUNCA o uuid).
      client_uuid: {
        label: data.client.name || NOT_INFORMED_LABEL,
        value: data.client.uuid,
      },
      transporter_uuid: data.transporter
        ? {
            label: data.transporter.name || NOT_INFORMED_LABEL,
            value: data.transporter.uuid,
          }
        : null,
      driver_name: data.driver_name ?? '',
      driver_plate: formatPlateIfValid(data.driver_plate),
      driver_uf: data.driver_uf ? { label: data.driver_uf, value: data.driver_uf } : null,
      driver_nif: data.driver_nif ?? '',
      note: data.note ?? '',
      // Itens — `item_uuid` SEMPRE preservado (perdê-lo faz o servidor
      // apagar/recriar a linha).
      items: data.items.map(chargeItemToForm),
      // Despesas acessórias — `expense_uuid` SEMPRE preservado (mesma
      // armadilha do `item_uuid`).
      expenses: data.expenses.map((expense) => chargeExpenseToForm(expense, languageGB)),
    });

    // Fire-and-forget — resolve a "Un. Medida" (FD-31) de cada item hidratado
    // (nota técnica CL-46: `ItemChargeResource` não expõe `product.
    // measurement`), sem bloquear o `reset()` acima.
    void resolveItemMeasurements(data);
  }

  // FD-31 ("Un. Medida", CL-46) — `ItemChargeResource` não expõe
  // `product.measurement`; resolvido linha a linha via `getProduct`
  // (fire-and-forget). `qtd_stock`
  // (FD-30, "Estoque") NÃO é resolvido aqui de propósito — é um hint de
  // saldo de armazém, só existe enquanto o usuário digita (ver
  // `ChargeItemRow.tsx`, IG-02), nunca hidratado de uma linha já persistida.
  async function resolveItemMeasurements(data: ChargeDetail) {
    const results = await Promise.allSettled(
      data.items.map((item) =>
        item.product ? getProduct(item.product.uuid) : Promise.resolve(null)
      )
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        setValue(`items.${index}.um`, result.value.data.measurement?.description ?? null);
      }
    });
  }

  const chargeQuery = useChargeForm({
    registrationId: chargeUuid ?? '',
    fillForm: fillChargeForm,
  });

  const chargeDetail = chargeQuery.data as ChargeDetail | undefined;
  const isLoading = isEditing && checkLoadingStatus([chargeQuery as any]);

  // Decisão do dono #5 (MANTER LIVRE, TASK-FE-CG-05) — `finalizada` CONTINUA
  // EDITÁVEL: o backend permite `update`/`destroy` em qualquer `status` (sem
  // guarda de servidor por `status`) e "Finalizar" (`FinishCharge.tsx`) só
  // muda o `status`, nunca torna o registro imutável. `isReadOnly` reflete
  // SÓ a ausência de `charge_edit` (usuário com apenas `charge_view`) —
  // NUNCA o `status` do Charge.
  const isReadOnly = isEditing && !!chargeDetail && !can('charge_edit');

  const isDisabledField = !canSave || isReadOnly || isLoading;

  // ---- Satélite estático de UF (FD-22, "select estático") ------------------
  const stateOptionsQuery = useQuery({
    queryKey: ['carregamentos-form-state-options'],
    queryFn: () => listStateOptions({ per_page: 100 }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const stateCatalogOptions: Option<string>[] = (stateOptionsQuery.data?.data.items ?? []).map(
    (item) => ({ label: item.title, value: item.letter })
  );
  const currentDriverUf = watch('driver_uf');
  const resolvedDriverUf = currentDriverUf
    ? (stateCatalogOptions.find((option) => option.value === currentDriverUf.value) ??
      currentDriverUf)
    : null;

  // ---- Saída com alterações não salvas -------------------------------------
  const exitGuard = useDisclosure();

  function guardedBack() {
    if (isDirty) {
      exitGuard.onOpen();
    } else {
      navigate(-1);
    }
  }

  function confirmExit() {
    exitGuard.onClose();
    navigate(-1);
  }

  const [businessError, setBusinessErrorState] = useState<string | undefined>(undefined);

  const chargeMutation = useRequest({
    asyncFunction: tryPersistCharge,
    entityName: text.singularLabel,
    queryKey: queryKey.carregamentos.charges,
    queryKey2: queryKey.carregamentos.charge,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistCharge(data: ChargeFormValues) {
    setBusinessErrorState(undefined);

    const payload: CreateChargeRequest = {
      // Armadilha #1 (nota técnica do tipo `ChargeForm`) — `dt_charge` é
      // STRING (`YYYY-MM-DD`), NUNCA `Date`.
      dt_charge: data.dt_charge!,
      client_uuid: data.client_uuid!.value,
      transporter_uuid: data.transporter_uuid?.value ?? null,
      driver_name: data.driver_name.trim() || null,
      driver_plate: data.driver_plate.trim() || null,
      driver_uf: data.driver_uf?.value ?? null,
      // CL-44/CL-45 (fix crítico) — o valor exibido é mascarado e a Action da
      // API grava sem limpar. `normalizeDocument` persiste `[0-9A-Z]` (CNPJ
      // alfanumérico, UT-000776) sem apagar letras (núcleo FE-06).
      driver_nif: normalizeDocument(data.driver_nif) || null,
      note: data.note.trim() || null,
      // Itens — descarta os hints client-only (`total_amount`/`weight`, nota
      // técnica 2) via `buildChargeItemPayload`. `items: []` é 422 esperado
      // (`required|min:1`) mas a aba nunca permite chegar lá (IG-07).
      items: (data.items ?? []).map(buildChargeItemPayload),
      // `present|array` no servidor (D6) — descarta o hint client-only
      // `value` via `buildChargeExpensePayload`; `[]` é válido e remove
      // todas as despesas (mesmo racional de `TransferRequest`).
      expenses: (data.expenses ?? []).map(buildChargeExpensePayload),
    };

    try {
      // `PUT` é SEMPRE o recurso COMPLETO (`ChargeRequest` unificado
      // store+update, sem branching por verbo).
      return isEditing && chargeUuid
        ? await updateCharge(chargeUuid, payload)
        : await createCharge(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          // Com `errors` → `setError` campo a campo. Chaves indexadas
          // (`items.0.product_uuid`) casam com o `useFieldArray` de itens.
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as any, { type: 'server', message: fieldMessages[0] });
            }
          });
        } else {
          // Sem `errors` (regra de negócio) → mensagem no TOPO do formulário.
          const serverMessage = (error.response.data as any)?.message;
          setBusinessErrorState(
            typeof serverMessage === 'string'
              ? serverMessage
              : (extractApiErrorMessage(error) ?? formText.businessErrorFallback)
          );
        }
      }
      // `throw` preserva o toast genérico do `useRequest`.
      throw error;
    }
  }

  async function onSubmit(data: ChargeFormValues) {
    await chargeMutation.mutateAsync(data);
  }

  const isSubmitting = chargeMutation.isPending;

  const [tabValue, setTabValueState] = useState<ChargeTabKey>('0');

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      footer={
        <>
          <Button
            title={isReadOnly ? formText.backButton : languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={guardedBack}
          />
          {canSave && !isReadOnly && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      {isReadOnly && (
        <Box mb={4} p={3} borderRadius="md" bg="bg.muted">
          <Text fontSize="sm" color="fg.muted">
            {formText.readOnlyBanner}
          </Text>
        </Box>
      )}

      {businessError && (
        <Box mb={4} p={3} borderRadius="md" bg="feedBack.error">
          <Text fontSize="sm" color="feedBack.errorMain">
            {businessError}
          </Text>
        </Box>
      )}

      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValueState(details.value as ChargeTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: as abas ficam
              sempre visíveis; só o conteúdo da aba rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.items}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{formText.tabs.expenses}</Tabs.Trigger>
          </Tabs.List>

          {/* ---- ABA 0: Cabeçalho ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <SimpleGrid columns={columnsForm.default} gap={6} mt={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {formText.fields.header.dtCharge}
                  <Text as="span" color="fg.error">
                    {' '}
                    *
                  </Text>
                </Text>
                <Controller
                  name="dt_charge"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={isDisabledField}
                    />
                  )}
                />
                {errors.dt_charge?.message && (
                  <Text fontSize="xs" color="fg.error" mt={1}>
                    {errors.dt_charge.message}
                  </Text>
                )}
              </Box>

              <Controller
                name="client_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.header.client}
                    service={listClients}
                    mapOptions={(item: ClientListItem) => ({ label: item.name, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.client_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="transporter_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.header.transporter}
                    service={listProviderOptions}
                    mapOptions={(item: ProviderOptionItem) => ({
                      label: item.label,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                      // FD-03 — `Provider::person() type=4` (Transportador).
                      type: 4,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Input
                label={formText.fields.header.driverName}
                {...register('driver_name')}
                error={errors.driver_name?.message}
                maxLength={40}
                loading={isLoading}
                disabled={isDisabledField}
              />

              <Controller
                name="driver_plate"
                control={control}
                render={({ field, fieldState }) => (
                  <MaskedInput
                    kind="plate"
                    label={formText.fields.header.driverPlate}
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    loading={isLoading}
                    disabled={isDisabledField}
                  />
                )}
              />

              <Controller
                name="driver_uf"
                control={control}
                render={({ field: { name, onChange } }) => (
                  <Select
                    label={formText.fields.header.driverUf}
                    name={name}
                    value={resolvedDriverUf}
                    onChange={(option) => onChange(option ?? null)}
                    options={stateCatalogOptions}
                    loading={stateOptionsQuery.isLoading}
                    isDisabled={isDisabledField}
                  />
                )}
              />

              {/* FD-20 — máscara CPF/CNPJ dinâmica por país do tenant, mirror
                  `StepIdentificacao.tsx` (mesmo helper `@/utils/cpfCnpj`);
                  dígito verificador validado só no servidor (`CpfCnpj
                  ($countryId)`), sem validação de formato client-side além
                  da máscara.
                  FIX (#3, execução 045) — `Controller` em vez de
                  `{...register('driver_nif')}`: com o padrão `children` do
                  `InputMask` (`react-input-mask` clonando o valor/`onChange`
                  mascarado no `<input>` filho), o `onChange` do `register`
                  NUNCA era chamado — o dígito jamais entrava no RHF e o
                  payload sempre levava `driver_nif: null`. `Controller`
                  liga `value`/`onChange` diretamente ao campo do form,
                  mirror `driver_uf` acima. */}
              <Controller
                name="driver_nif"
                control={control}
                render={({ field }) => (
                  <MaskedInput
                    kind="cpfCnpj"
                    label={formText.fields.header.driverNif}
                    name={field.name}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={errors.driver_nif?.message}
                    disabled={isDisabledField}
                  />
                )}
              />

              {/* FD-02/FD-18 — Responsável/Valor da carga: só em EDIÇÃO
                  (dado calculado/atribuído no servidor, sem equivalente em
                  modo criação). "Valor da carga" é hint de SERVIDOR
                  (`chargeDetail.total`), NUNCA recalculado no cliente. */}
              {isEditing && chargeDetail && (
                <>
                  <InputReadOnly
                    label={formText.fields.header.responsible}
                    value={chargeDetail.user?.label ?? '—'}
                  />
                  <InputReadOnly
                    label={formText.fields.header.total}
                    value={(chargeDetail.total ?? 0).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  />
                </>
              )}
            </SimpleGrid>

            <Box mt={6} w="full">
              <Textarea
                label={formText.fields.header.note}
                {...register('note')}
                error={errors.note?.message}
                disabled={isDisabledField}
              />
            </Box>
          </Tabs.Content>

          {/* ---- ABA 1: Itens (cascata armazém→produto→estoque) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <ChargeItemsTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabledField}
              isItemsLocked={isReadOnly}
            />
          </Tabs.Content>

          {/* ---- ABA 2: Despesas acessórias ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <ChargeExpensesTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isDisabled={isDisabledField}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>

      <DeleteConfirmDialog
        isOpen={exitGuard.open}
        onClose={exitGuard.onClose}
        onConfirm={confirmExit}
        title={formText.unsavedChanges.title}
        description={formText.unsavedChanges.message}
        warningText=""
        confirmButtonText={formText.unsavedChanges.confirm}
        colorPalette="orange"
      />
    </FormContainer>
  );
}
