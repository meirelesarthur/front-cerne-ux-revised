// src/pages/Operacional/Marcacao/CreateOrUpdateMarking.tsx
// -----------------------------------------------------------------------------
// Form único de criar/editar/ver Marcação (`SURFACE-MARKINGS-CREATE/-EDIT/
// -SHOW`) — mirror `CreateOrUpdateWeaning.tsx`. Modo "ver" é o MESMO
// componente com todos os campos `InputReadOnly`, ativado quando
// `status !== 1` (Marcado) OU o usuário não tem `markings_edit` (mirror
// `ACT-02`: editar só é permitido com `status===1`) — reforça no FRONT o
// que o roteiro já pede; o servidor não bloqueia por status hoje
// (`UpdateMarkingAction` não valida status), então esta é a única barreira
// nesta Tarefa (SEM MOCK de uma regra de servidor que não existe).
//
// `week_vintage_uuid` é preenchido pela cascata (`useCascadesMarking`,
// harvest_uuid+date → `GET /harvests/{uuid}/weeks/current`), nunca editável
// direto. Payload de create/update é SEMPRE completo (`MarkingRequest::
// rules()` real exige todos os campos, exceto employee/center, também no
// update — SEM PATCH parcial, confirmado por leitura direta de
// `UpdateMarkingAction`).
//
// FIX de fidelidade (achado do dono, confirmado por leitura direta de
// `agro365/resources/views/markings/_forms.blade.php`): o form legado NÃO
// tem inputs de Funcionário (`employee_id`) nem Centro de Custo
// (`center_id`) — só `area_id`/`date`/`variety_id`/`user_id` (hidden,
// sempre o usuário logado)/`quantity`/`harvest_id`/`week_vintage_id`
// (hidden, cascata)/`color` (cascata). `employee_id`/`center_id` são
// colunas nullable que o legado nunca expõe como input neste form — foram
// indevidamente promovidos a campos de form numa versão anterior desta
// Tarefa. Removidos aqui; o backend continua aceitando os dois como
// nullable (`MarkingData`/`MarkingRequest` reais) — este form simplesmente
// nunca os envia, ficam `null`, fiel ao legado.
//
// FIX de fidelidade #2 (decisão do dono, registrada no task-packet):
// "Responsável" (`user_uuid`) é READONLY = usuário logado, NUNCA um select
// — mirror EXATO de `CreateOrUpdatePastagem.tsx` (`TASK-PAST-FIX-FE-01`,
// `useAuth().user`): na criação exibe `user?.username` (sessão atual); na
// edição exibe o responsável já gravado (`markingQuery.data.user.name`),
// sem permitir troca. Por isso `user_uuid` SAIU do modelo do formulário
// (react-hook-form) — não é mais uma escolha do usuário, é resolvido
// direto em `tryPersistMarking` a partir da sessão (create) ou do registro
// carregado (edit), nunca de `dirtyFields`/Select.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { markingColorOptions } from '@/constants/marcacao/marking/options/marking-color-options';
import { queryKey } from '@/constants/query-key';

import { markingSchemaResolver } from '@/validations/schemas/Marcacao/marking-schema';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';
import { createMarking, getMarking, updateMarking } from '@/services/v2/Marcacao/marking-service';

import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { CultivationOption } from '@/@types/v2/Cultivation/cultivation';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  CreateMarkingRequest,
  MarkingData,
  MarkingForm as MarkingFormType,
  UpdateMarkingRequest,
} from '@/@types/v2/Marcacao/marking';

import { useCascadesMarking } from './useCascadesMarking';

const MARKING_LIST_ROUTE = '/operacional/marcacao';

const defaultValues: MarkingFormType = {
  area_uuid: null,
  date: null,
  variety_uuid: null,
  quantity: null,
  harvest_uuid: null,
  color: null,
  week_vintage_uuid: null,
};

export default function CreateOrUpdateMarking() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { activeFarmUuid, user } = useAuth();

  const isEditing = isValidGuid(uuid);
  const text = languageGB.marcacao.marking;
  const formText = text.form;

  const canEditPermission = can('markings_edit');
  const canCreatePermission = can('markings_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<MarkingFormType>({
    mode: 'onChange',
    resolver: markingSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  const { suggestedColor, weekInfo, handleHarvestOrDateChange } = useCascadesMarking({
    watch,
    setValue,
  });

  // ✅ Lei 2: função nomeada com guarda de dirtyFields.
  function fillMarkingForm(data: MarkingData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        area_uuid: { label: data.area.name, value: data.area.uuid },
        date: data.date,
        variety_uuid: { label: data.variety.name, value: data.variety.uuid },
        quantity: data.quantity,
        harvest_uuid: { label: data.harvest.name, value: data.harvest.uuid },
        color: markingColorOptions.getOption(data.color, languageGB),
        week_vintage_uuid: data.week_vintage.uuid,
      });
    }
  }

  const markingQuery = useCustomFormQueryByGuid<MarkingData>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.marcacao.marking,
    asyncFunction: getMarking,
    fillForm: fillMarkingForm,
  });

  // `useCustomFormQueryByGuid` tipa o retorno como `Response<TData>` (sem
  // `isError`/`isLoading`) embora o objeto real em runtime seja o
  // `UseQueryResult` do TanStack Query — mesma divergência já contornada com
  // `as any` em `CreateOrUpdateWeaning.tsx`.
  const markingQueryIsError = (markingQuery as any).isError as boolean;

  useEffect(() => {
    if (isEditing && markingQueryIsError) {
      toaster.error({
        title: text.singularLabel,
        description: text.list.error.message,
        duration: 7000,
      });
      navigate(MARKING_LIST_ROUTE);
    }
  }, [isEditing, markingQueryIsError]);

  const isLoading = isEditing && checkLoadingStatus([markingQuery as any]);
  const markingStatus = isEditing ? markingQuery.data?.status : undefined;
  // Modo "ver": status já não é Marcado (1) OU sem permissão de editar —
  // mirror `ACT-02`. Em modo criação nunca é "ver".
  const isViewOnly =
    isEditing && (!canEditPermission || (markingStatus !== undefined && markingStatus !== 1));
  const canSave = isEditing ? canEditPermission && !isViewOnly : canCreatePermission;
  const isDisabled = !canSave || !!isLoading;

  function listAreasForActiveFarm(params: { page?: number; per_page?: number }) {
    return listAreas({
      page: params.page,
      per_page: params.per_page,
      farm_uuid: activeFarmUuid ?? '',
    });
  }

  async function tryPersistMarking(data: MarkingFormType) {
    // Guarda de submit — `week_vintage_uuid` só existe depois da cascata
    // resolver com sucesso (`useCascadesMarking`). Sem ele, o servidor
    // devolveria 422 (`MarkingRequest::rules()` exige o campo); bloqueamos
    // ANTES de disparar a requisição — o `onError` de `useRequest` (abaixo)
    // já converte esta exceção num toast, nunca falha silenciosa.
    if (!data.week_vintage_uuid) {
      throw new Error(formText.cascade.errorToast);
    }

    // `user_uuid` (Responsável) NÃO vem do form — é READONLY (FIX #2 no
    // cabeçalho): na criação, o usuário da sessão atual; na edição, o
    // responsável já gravado no registro carregado. Guarda explícita:
    // sem um dos dois disponível, aborta ANTES da requisição (nunca envia
    // `undefined` silenciosamente).
    const responsibleUuid = isEditing ? markingQuery.data?.user.uuid : user?.uuid;
    if (!responsibleUuid) {
      throw new Error(formText.fields.user);
    }

    const payload: CreateMarkingRequest = {
      area_uuid: data.area_uuid!.value,
      date: data.date!,
      harvest_uuid: data.harvest_uuid!.value,
      variety_uuid: data.variety_uuid!.value,
      week_vintage_uuid: data.week_vintage_uuid,
      user_uuid: responsibleUuid,
      quantity: data.quantity!,
      color: data.color!.value,
      // `employee_uuid`/`center_uuid` NUNCA são enviados — o form legado
      // não os coleta (ver nota de fidelidade no cabeçalho); o backend os
      // aceita como nullable, então ficam `null` fiel ao legado.
    };

    if (isEditing && uuid) {
      const updatePayload: UpdateMarkingRequest = payload;
      return updateMarking(uuid, updatePayload);
    }
    return createMarking(payload);
  }

  const markingMutation = useRequest<MarkingData>({
    asyncFunction: tryPersistMarking,
    entityName: text.singularLabel,
    queryKey: queryKey.marcacao.markings,
    queryKey2: queryKey.marcacao.marking,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(MARKING_LIST_ROUTE);
    },
  });

  const isPersisting = markingMutation.isPending;

  const watchedHarvest = watch('harvest_uuid');
  const watchedColor = watch('color');

  // "Responsável" readonly = usuário logado (FIX #2, mirror
  // `CreateOrUpdatePastagem.tsx`/`TASK-PAST-FIX-FE-01`): na edição, o
  // responsável já gravado no registro (`MarkingResource.user.name`); na
  // criação, o usuário da sessão atual.
  const responsibleLabel = isEditing
    ? (markingQuery.data?.user.name ?? '—')
    : (user?.username ?? '—');

  return (
    <FormContainer
      title={
        isViewOnly ? formText.title.view : isEditing ? formText.title.edit : formText.title.create
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isPersisting}
          />
          {!isViewOnly && canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="marking-form"
              loading={isPersisting}
              disabled={isPersisting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form
        id="marking-form"
        onSubmit={handleSubmit((data) => markingMutation.mutateAsync(data))}
        noPadding
      >
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {isEditing && (
            <InputReadOnly
              name="code"
              label={formText.fields.code}
              value={String(markingQuery.data?.code ?? '')}
              loading={!!isLoading}
            />
          )}

          {isViewOnly ? (
            <InputReadOnly
              name="area_uuid"
              label={formText.fields.area}
              value={markingQuery.data?.area.name ?? ''}
            />
          ) : (
            <Controller
              name="area_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.area}
                  placeholder={formText.placeholders.area}
                  error={errors.area_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabled}
                  service={listAreasForActiveFarm}
                  mapOptions={(item: AreaListItem) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={() => ({})}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          {isViewOnly ? (
            <InputReadOnly
              name="date"
              label={formText.fields.date}
              value={markingQuery.data?.date ?? ''}
            />
          ) : (
            <Controller
              name="date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field label={formText.fields.date} isRequired errorText={errors.date?.message}>
                  <DateInput
                    value={value ?? null}
                    onChange={(nextDate) => {
                      onChange(nextDate);
                      handleHarvestOrDateChange();
                    }}
                    disabled={isDisabled}
                  />
                </Field>
              )}
            />
          )}

          {isViewOnly ? (
            <InputReadOnly
              name="variety_uuid"
              label={formText.fields.variety}
              value={markingQuery.data?.variety.name ?? ''}
            />
          ) : (
            <Controller
              name="variety_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.variety}
                  placeholder={formText.placeholders.variety}
                  error={errors.variety_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabled}
                  service={listCultivationOptions}
                  mapOptions={(item: CultivationOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          {/* "Responsável" — SEMPRE readonly (FIX #2), nunca um select,
              mirror EXATO do legado (`user_id` hidden = usuário logado) e de
              `CreateOrUpdatePastagem.tsx`. Não depende de `isViewOnly`. */}
          <InputReadOnly name="user_uuid" label={formText.fields.user} value={responsibleLabel} />

          {isViewOnly ? (
            <InputReadOnly
              name="quantity"
              label={formText.fields.quantity}
              value={String(markingQuery.data?.quantity ?? '')}
            />
          ) : (
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input
                  label={formText.fields.quantity}
                  type="number"
                  min={1}
                  isRequired
                  error={errors.quantity?.message as string | undefined}
                  disabled={isDisabled}
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                  onBlur={field.onBlur}
                />
              )}
            />
          )}

          {isViewOnly ? (
            <InputReadOnly
              name="harvest_uuid"
              label={formText.fields.harvest}
              value={markingQuery.data?.harvest.name ?? ''}
            />
          ) : (
            <Controller
              name="harvest_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.harvest}
                  placeholder={formText.placeholders.harvest}
                  error={errors.harvest_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabled}
                  service={listHarvestOptions}
                  mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    handleHarvestOrDateChange();
                  }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          )}

          {/* FIX de homologação (achado do dono): bloco READONLY da semana
              resolvida pela cascata Safra+Data — mirror da tabelinha `.weeks`
              do legado (`_forms.blade.php`: `number_week`/`start_date`/
              `end_date`). Visível só quando a semana está resolvida
              (`weekInfo` definido); em 404 o hook já limpa `harvest_uuid` e
              mostra o toast de erro, sem exibir este bloco. */}
          {weekInfo && (
            <>
              <InputReadOnly
                name="week_number"
                label={formText.fields.week}
                value={String(weekInfo.number_week)}
              />
              <InputReadOnly
                name="week_start_date"
                label={formText.fields.weekStartDate}
                value={formatDate(weekInfo.start_date)}
              />
              <InputReadOnly
                name="week_end_date"
                label={formText.fields.weekEndDate}
                value={formatDate(weekInfo.end_date)}
              />
            </>
          )}

          {isViewOnly ? (
            <InputReadOnly
              name="color"
              label={formText.fields.color}
              value={
                markingQuery.data
                  ? markingColorOptions.getLabel(markingQuery.data.color, languageGB)
                  : ''
              }
            />
          ) : (
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <Field
                  label={formText.fields.color}
                  isRequired
                  errorText={errors.color?.message as string | undefined}
                  helperText={
                    suggestedColor && !watchedColor
                      ? formText.hints.colorSuggestionByHarvest.replace('{color}', suggestedColor)
                      : undefined
                  }
                >
                  <Select
                    name={field.name}
                    placeholder={formText.placeholders.color}
                    isDisabled={isDisabled || !watchedHarvest}
                    options={markingColorOptions.options(languageGB)}
                    value={field.value}
                    onChange={(option) => field.onChange(option ?? null)}
                  />
                </Field>
              )}
            />
          )}
        </SimpleGrid>

        {/* `week_vintage_uuid` — hidden, preenchido só pela cascata
            (`useCascadesMarking`), nunca editável direto (register mantém o
            valor no submit sem renderizar campo visível). */}
        <input type="hidden" {...register('week_vintage_uuid')} />
      </Form>
    </FormContainer>
  );
}
