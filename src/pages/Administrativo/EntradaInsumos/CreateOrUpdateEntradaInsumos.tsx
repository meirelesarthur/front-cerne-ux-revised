// src/pages/Administrativo/EntradaInsumos/CreateOrUpdateEntradaInsumos.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de criação/ver/edição de Entrada de Insumos — esteira 037,
// TASK-IE-FE-06. Mirror ESTRUTURAL de `CreateOrUpdateInvoice.tsx`
// (`useFieldArray` no PAI, `useCustomFormQueryByGuid` para hidratar em
// edição — mirror `useInvoiceForm`), fundido com a seção de baixa
// automática de `CreateOrUpdateExpense.tsx`. Decisões do roteiro:
//   #2 — Uma ÚNICA tela para criar E ver/editar (`isEditing = isValidGuid`),
//        campos desabilitados (não removidos) quando `!can('input_entries_edit')`.
//   #3 — PUT é payload COMPLETO (reenvia `items[]` inteiro) — MESMO shape
//        de payload em criação e edição, sem PATCH parcial por campo.
//   #4 — Baixa financeira é HEADER-level, débito, condicional.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { useMyFarms } from '@/hooks/useMyFarms';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalDate, todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import {
  inputEntryAppropriationTypeOptions,
  type InputEntryAppropriationTypeValue,
} from '@/constants/inputEntries/options/appropriation-type-options';
import { queryKey } from '@/constants/query-key';

import { inputEntrySchemaResolver } from '@/validations/schemas/InputEntries/input-entry-schema';

import { listProprietaries } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import {
  createInputEntry,
  deleteInputEntry,
  getInputEntry,
  updateInputEntry,
} from '@/services/v2/InputEntries/input-entry-service';

import type { Harvest } from '@/@types/v2/Harvests';
import type {
  InputEntryCreateForm,
  InputEntryDetail,
  InputEntryItemPayload,
  InputEntryPayload,
} from '@/@types/v2/InputEntries';

import { EntradaInsumosAutomaticWriteoffSection } from './EntradaInsumosAutomaticWriteoffSection';
import {
  buildItemUuidPayload,
  cultivationOption,
  costCenterOption,
  extractItemUuidErrors,
  measurementOption,
  refOption,
} from './entradaInsumosHydration';
import { EntradaInsumosItemsTab } from './EntradaInsumosItemsTab';

const INPUT_ENTRY_LIST_ROUTE = '/administrativo/entrada-insumos';

export default function CreateOrUpdateEntradaInsumos() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser, activeFarmUuid } = useAuth();

  // ENT-1 (CORRECAO-R2) — decisão do dono: exibir a fazenda ATIVA no
  // cabeçalho, read-only, SEM seletor multi-fazenda (o backend já resolve a
  // fazenda pelo `X-Farm-Id`, o campo não entra no payload). MESMA fonte do
  // `FarmSwitcher`/`CreateOrUpdateExpense.tsx` (`useMyFarms()` + `useAuth().
  // activeFarmUuid`).
  const myFarmsQuery = useMyFarms();
  const activeFarm = myFarmsQuery.data?.find((farm) => farm.uuid === activeFarmUuid);

  const text = languageGB.inputEntries.inputEntry;
  const formText = text.form;

  const isEditing = isValidGuid(uuid ?? null);
  const canSave = isEditing ? can('input_entries_edit') : can('input_entries_create');
  const canDelete = can('input_entries_delete');

  // Guarda de entrada — `uuid` mal-formado nunca dispara a chamada de rede
  // (mirror `CreateOrUpdateInvoice.tsx`/`UpdateDevolucao.tsx`).
  useEffect(() => {
    if (uuid && !isValidGuid(uuid)) {
      navigate(INPUT_ENTRY_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<InputEntryCreateForm>({
    mode: 'onChange',
    resolver: inputEntrySchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      // DD-078-01: criação nasce com hoje (dia local); edição mantém a data salva (fillForm).
      date: isEditing ? '' : todayLocalIso(),
      harvest_uuid: null,
      proprietary_uuid: null,
      note: '',
      // Itens exigem ao menos 1 (schema) e a criação sempre precisa de um item;
      // já exibe um card de item vazio por padrão para evitar o clique
      // obrigatório em "Adicionar Item" no caso comum. Na edição, a hidratação
      // (fillForm) substitui pelos itens salvos. Mesmo shape do append.
      items: isEditing
        ? []
        : [
            {
              product_uuid: null,
              measurement_uuid: null,
              quantity: null,
              unit_value: null,
              total_value: 0,
              generate_stock: true,
              warehouse_uuid: null,
              appropriation_type: null,
              provider_lot: '',
              shelf_life: null,
              cultivation_uuid: null,
              category_uuid: null,
              center_uuid: null,
            },
          ],
      automatic_writeoff: false,
      account_uuid: null,
      movement_date: null,
    },
  });

  // Lei 2 — `fillForm` nomeada, guarda `!isEmpty(dirtyFields) || resetForce`.
  // Popula o CABEÇALHO E o `useFieldArray` inteiro (decisão #3 — payload
  // sempre completo, sem PATCH parcial por linha).
  function fillEntradaInsumosForm(data: InputEntryDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        date: data.date,
        harvest_uuid: data.harvest ? refOption(data.harvest.uuid, data.harvest.description) : null,
        proprietary_uuid: data.proprietary
          ? { label: data.proprietary.name, value: data.proprietary.uuid }
          : null,
        note: data.note ?? '',
        items: (data.items ?? []).map((item) => ({
          // DD-078-07 (b) — uuid do item existente vai no update; lote travado.
          uuid: item.uuid,
          // CORRECAO-R1/E3 — `has_lot` do produto semeado JÁ NA HIDRATAÇÃO
          // de edição (`items[N].product.has_lot`, API Onda 3), embutido na
          // própria option (mirror `mapOptions` de `EntradaInsumosItemsTab.
          // tsx`) — sem isso, `provider_lot`/`shelf_life` nasciam SEMPRE
          // bloqueados até o usuário reselecionar o produto.
          product_uuid: item.product
            ? {
                label: item.product.description,
                value: item.product.uuid,
                has_lot: item.product.has_lot,
                // T-078-FE-04 — unidades do produto para a lista de "Un. Medida"
                // (mesmo shape do `mapOptions` de `EntradaInsumosItemsTab`).
                measurement: measurementOption(item.product.measurement),
                measurementSecond: measurementOption(item.product.measurement_second),
              }
            : null,
          measurement_uuid: measurementOption(item.measurement),
          quantity: item.quantity,
          unit_value: item.unit_value,
          total_value: item.total_value ?? 0,
          generate_stock: !!item.generate_stock,
          warehouse_uuid: item.warehouse
            ? { label: item.warehouse.description, value: item.warehouse.uuid }
            : null,
          // CORRECAO-R1/E5 — `appropriation_type` reidratado como `Option`
          // (Select Agricultura/Pecuária), a partir do valor bruto ("1"/"2").
          appropriation_type: item.appropriation_type
            ? inputEntryAppropriationTypeOptions.getOption(
                item.appropriation_type as InputEntryAppropriationTypeValue,
                languageGB
              )
            : null,
          provider_lot: item.provider_lot ?? '',
          shelf_life: item.shelf_life ?? null,
          cultivation_uuid: item.cultivation ? cultivationOption(item.cultivation) : null,
          category_uuid: item.category
            ? { label: item.category.description, value: item.category.uuid }
            : null,
          // DD-06: CC sintético salvo é só EXIBIDO (menu segue `only_analytic`).
          center_uuid: item.center ? costCenterOption(item.center) : null,
        })),
        // Baixa financeira é WRITE-ONLY para efeito de reidratação — o
        // `movement` devolvido é só informativo (`InputEntryMovementRef`,
        // pode ser `null`); a seção de edição nasce sempre desligada,
        // mirror decisão #4 (nova baixa não reabre a anterior).
        automatic_writeoff: false,
        account_uuid: null,
        movement_date: null,
      });
    }
  }

  const inputEntryQuery = useCustomFormQueryByGuid<InputEntryDetail>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.inputEntries.inputEntry,
    asyncFunction: getInputEntry,
    fillForm: fillEntradaInsumosForm,
  });

  const isLoading = isEditing && checkLoadingStatus([inputEntryQuery as any]);
  const detail = (inputEntryQuery as any)?.data as InputEntryDetail | undefined;

  const inputEntryMutation = useRequest({
    asyncFunction: tryPersistEntradaInsumos,
    entityName: text.singularLabel,
    queryKey: queryKey.inputEntries.inputEntries,
    queryKey2: queryKey.inputEntries.inputEntry,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // Payload SEMPRE completo (decisão #3) — chama `createInputEntry` ou
  // `updateInputEntry`, MESMO shape nos dois casos.
  async function tryPersistEntradaInsumos(data: InputEntryCreateForm) {
    const items: InputEntryItemPayload[] = data.items.map((item) => ({
      // DD-078-07 (b) — só itens já gravados enviam `uuid`, e só no update.
      ...buildItemUuidPayload(item.uuid, isEditing),
      product_uuid: item.product_uuid!.value,
      measurement_uuid: item.measurement_uuid!.value,
      quantity: Number(item.quantity),
      unit_value: Number(item.unit_value),
      generate_stock: !!item.generate_stock,
      warehouse_uuid: item.generate_stock ? (item.warehouse_uuid?.value ?? undefined) : undefined,
      // CORRECAO-R1/E5 — apropriação só é enviada quando NÃO gera estoque
      // (mirror `clear_appropriation`, readonly/limpa quando `generate_stock=true`).
      appropriation_type: item.generate_stock
        ? undefined
        : (item.appropriation_type?.value ?? undefined),
      // F-084 item 1 — gateados por `has_lot` do produto (embutido em
      // `product_uuid`, mirror do gate visual em `EntradaInsumosItemsTab.
      // tsx`): mesmo que um valor residual permaneça no form state de um
      // campo OCULTO (ex.: produto trocado por outro sem lote sem que o
      // usuário tenha reaberto o Select), o payload nunca envia
      // `provider_lot`/`shelf_life` quando o produto atual não usa lote —
      // "ignorados" ao invés de apenas "limpos" na UI.
      provider_lot: item.product_uuid?.has_lot ? item.provider_lot?.trim() || undefined : undefined,
      shelf_life: item.product_uuid?.has_lot ? item.shelf_life || undefined : undefined,
      cultivation_uuid: item.cultivation_uuid?.value,
      category_uuid: item.category_uuid?.value,
      center_uuid: item.center_uuid?.value,
    }));

    const payload: InputEntryPayload = {
      date: data.date,
      harvest_uuid: data.harvest_uuid?.value ?? undefined,
      proprietary_uuid: data.proprietary_uuid?.value ?? undefined,
      note: data.note?.trim() || undefined,
      items,
      automatic_writeoff: data.automatic_writeoff,
      account_uuid: data.automatic_writeoff ? (data.account_uuid?.value ?? null) : undefined,
      movement_date: data.automatic_writeoff ? data.movement_date || null : undefined,
    };

    try {
      if (isEditing && uuid) {
        return await updateInputEntry(uuid, payload);
      }
      return await createInputEntry(payload);
    } catch (error) {
      // DD-078-01: 422 de `date` (ex.: data futura) exibido no campo Data — o
      // `throw` preserva o toast genérico que `useRequest` já mostra.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors?.date?.[0]) {
          setError('date', { type: 'server', message: fieldErrors.date[0] });
        }
        // DD-078-07 (b): 422 em `items.N.uuid` (troca de produto de item
        // existente) aparece na linha do item.
        extractItemUuidErrors(fieldErrors).forEach(({ index, message }) =>
          setError(`items.${index}.uuid`, { type: 'server', message })
        );
      }
      throw error;
    }
  }

  const isSubmitting = inputEntryMutation.isPending;

  async function onSubmit(data: InputEntryCreateForm) {
    // `isEmpty` deste projeto é INVERTIDO (retorna true quando TEM chaves), então
    // "nada mudou" = `!isEmpty(dirtyFields)` — mesma convenção do guard de
    // `fillForm` acima. O bug anterior (`isEmpty(dirtyFields)`) atalhava para
    // `navigate(-1)` JUSTAMENTE quando havia alteração (ex.: só a quantidade),
    // descartando a edição sem salvar.

    // `isEmpty()` do projeto tem nome invertido: retorna `true` quando HÁ chaves.
    // Logo `!isEmpty(dirtyFields)` = "nada mudou" (mesmo padrão de Solicitacao).
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await inputEntryMutation.mutateAsync(data);
  }

  function onInvalid(formErrors: FieldErrors<InputEntryCreateForm>) {
    const firstErrorMessage = Object.values(formErrors).find(
      (fieldError): fieldError is { message?: string } =>
        !!fieldError && typeof fieldError === 'object' && 'message' in fieldError
    )?.message;

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: firstErrorMessage ?? formText.errors.invalidFields,
      duration: 6000,
    });
  }

  const watchedItems = watch('items') ?? [];
  const totalAmount = watchedItems.reduce((total, item) => {
    const quantity = Number(item?.quantity) || 0;
    const unitValue = Number(item?.unit_value) || 0;
    return total + quantity * unitValue;
  }, 0);

  // ---- Exclusão -------------------------------------------------------------
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  const deleteMutation = useRequest({
    asyncFunction: async ({ inputEntryUuid }: { inputEntryUuid: string }) => {
      await deleteInputEntry(inputEntryUuid);
      return undefined;
    },
    queryKey: queryKey.inputEntries.inputEntries,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.deletedToast,
    actionSuccess: () => {
      setIsOpenDeleteDialog(false);
      navigate(INPUT_ENTRY_LIST_ROUTE);
    },
  });

  function handleConfirmDelete() {
    if (uuid) {
      deleteMutation.mutate({ inputEntryUuid: uuid });
    }
  }

  if (uuid && !isValidGuid(uuid)) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      showDivider
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          />
          {isEditing && canDelete && (
            <Button
              title={text.detail.deleteButton}
              variant="outline"
              colorPalette="red"
              type="button"
              onClick={() => setIsOpenDeleteDialog(true)}
              disabled={!detail || isSubmitting}
            />
          )}
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit, onInvalid)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {isEditing && (
            <InputReadOnly
              label={formText.fields.code}
              value={detail?.code ?? '—'}
              loading={!!isLoading}
            />
          )}

          <Controller
            name="date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                label={formText.fields.date}
                isRequired
                value={value ?? null}
                onChange={(next) => {
                  // Limpa o erro (inclusive o 422 do servidor) ao alterar a data.
                  if (errors.date?.type === 'server') clearErrors('date');
                  onChange(next);
                }}
                error={errors.date?.message}
                maxDate={todayLocalDate()}
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <InputReadOnly
            label={formText.fields.responsible}
            value={isEditing ? (detail?.user?.name ?? '—') : (authUser?.username ?? '—')}
          />

          {/* ENT-1 (CORRECAO-R2) — Fazenda ativa, read-only, decisão do
              dono. Não é seletor editável nem entra no payload. */}
          <InputReadOnly
            label={formText.fields.farm}
            value={activeFarm?.description ?? '—'}
            loading={myFarmsQuery.isLoading}
          />

          <Controller
            name="harvest_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.harvest}
                placeholder={formText.placeholders.harvest}
                service={listHarvests}
                mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="proprietary_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.proprietary}
                placeholder={formText.placeholders.proprietary}
                service={listProprietaries}
                mapOptions={(item: { uuid: string; name: string }) => ({
                  label: item.name,
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isDisabled={!canSave || !!isLoading}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6} w="full">
          <Textarea
            label={formText.fields.note}
            {...register('note')}
            error={errors.note?.message}
            disabled={!canSave || !!isLoading}
          />
        </Box>

        <EntradaInsumosItemsTab
          control={control}
          errors={errors}
          watch={watch}
          setValue={setValue}
          isLoading={!!isLoading}
          canSave={canSave}
        />

        <EntradaInsumosAutomaticWriteoffSection
          control={control}
          errors={errors}
          watch={watch}
          totalAmount={totalAmount}
          canSave={canSave}
          isLoading={!!isLoading}
        />
      </Form>

      <DeleteConfirmDialog
        isOpen={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
        itemName={detail?.code}
        tone="danger"
      />
    </FormContainer>
  );
}
