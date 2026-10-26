// src/pages/Administrativo/RegistroEventos/CreateOrUpdateRegistroEvento.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de REGISTRO DE EVENTOS (Bonus) —
// Administrativo. Esteira 037 (registro-eventos-front-roteiro.md,
// TASK-FE-07). Rotas: /administrativo/registro-eventos/novo (create, guarda
// `bonuses_create` no botão) e /administrativo/registro-eventos/:bonusUuid
// (edit, guarda `bonuses_edit`).
//
// Mirror ESTRUTURAL de `Adiantamento/CreateOrUpdateAdiantamento.tsx`: um
// único `useForm`, `isEditing = isValidGuid(bonusUuid)`, `fillBonusForm`
// nomeada com guarda de `dirtyFields` (Lei 2), `useRequest` para a mutação —
// SEM os blocos `installments`/`financial` (fora do núcleo de Bonus).
//
// ---- De-para dos 2 selects relacionais (employee/event) ----
// Mesmo racional de `CreateOrUpdateAdiantamento.tsx`: `BonusForm` guarda só
// o uuid CRU (`string`), e um estado local "picked option"
// (`useState<Option | null>`) guarda o par {label,value} para EXIBIÇÃO —
// semeado por `fillBonusForm` a partir da relação já resolvida pelo `show`
// (`employee`/`event`), e atualizado no `onChange` de cada Select.
//   - employee_uuid → `SelectAsyncPaginate service={listEmployees}` (tenant-
//     scoped, `X-Farm-Id`) — regra de posse por fazenda no backend
//     (`whereHas('farms')`), 422 mapeado no campo certo.
//   - event_uuid     → `SelectAsyncPaginate service={listEventOptions}`
//     (`GET /events/options`, cross-farm, lookup enxuto — CORRECAO-R2/REG-1;
//     `listEvents`/`GET /events` é farm-scoped e SÓ devolve os Eventos da
//     fazenda ativa, nunca usar num Select) — SEM filtro de tipo (mesma
//     decisão de `Advance`).
//
// ---- FE-FORM-MODE (create/update = full-replace) ----
// `tryPersistBonus` SEMPRE envia os 4 campos completos, tanto em create
// quanto em update — NUNCA um patch parcial por `dirtyFields`
// (`BonusRequest::rules()` não distingue os verbos, os 4 campos são
// `required` em ambos).
//
// ---- 422 por campo (FE-FORM-422) ----
// `tryPersistBonus` mapeia `error.response.data.errors → setError`
// LOCALMENTE (mirror `tryPersistAdvance`) — foco especial em `employee_uuid`
// (regra de posse por fazenda). O toast genérico de `useRequest` cobre a
// `message` de nível superior.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { bonusSchemaResolver } from '@/validations/schemas/Bonuses/bonus-schema';

import { createBonus, updateBonus } from '@/services/v2/Bonuses/bonus-service';
import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listEventOptions } from '@/services/v2/Events/event-service';

import type { Option } from '@/@types/option';
import type { Bonus, BonusForm as BonusFormType, BonusPayload } from '@/@types/v2/Bonuses';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { EventOption } from '@/@types/v2/Events';

import { useBonusForm } from './useBonuses';

const BONUSES_LIST_ROUTE = '/administrativo/registro-eventos';

export default function CreateOrUpdateRegistroEvento() {
  const { bonusUuid } = useParams<{ bonusUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // `/novo` NÃO tem `:bonusUuid` (rota própria, sem param); só a rota
  // `/:bonusUuid` popula o param. Guard de navegação: uuid mal formado NA
  // ROTA DE EDIÇÃO redireciona para o grid ANTES de renderizar — mirror
  // `CreateOrUpdateAdiantamento.tsx`.
  const hasMalformedRouteParam = bonusUuid !== undefined && !isValidGuid(bonusUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(BONUSES_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(bonusUuid);
  const text = languageGB.bonuses.bonus;
  const canSave = isEditing ? can('bonuses_edit') : can('bonuses_create');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { dirtyFields },
  } = useForm<BonusFormType>({
    mode: 'onChange',
    resolver: bonusSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      employee_uuid: '',
      event_uuid: '',
      date: todayLocalIso(),
      amount: null,
    },
  });

  // ---- "Picked options" de exibição dos 2 selects relacionais — ver nota
  // de cabeçalho. Semeados por `fillBonusForm`; atualizados no `onChange`. --
  const [employeeOption, setEmployeeOption] = useState<Option | null>(null);
  const [eventOption, setEventOption] = useState<Option | null>(null);

  function fillBonusForm(data: Bonus, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        employee_uuid: data.employee?.uuid ?? '',
        event_uuid: data.event?.uuid ?? '',
        date: data.date,
        amount: Number(data.amount),
      });

      setEmployeeOption(
        data.employee
          ? { label: data.employee.name ?? data.employee.uuid, value: data.employee.uuid }
          : null
      );
      setEventOption(data.event ? { label: data.event.name, value: data.event.uuid } : null);
    }
  }

  const bonusQuery = useBonusForm({
    registrationId: isEditing ? bonusUuid : undefined,
    fillForm: fillBonusForm,
  });

  const isLoading = isEditing && checkLoadingStatus([bonusQuery as any]);

  const bonusMutation = useRequest({
    asyncFunction: tryPersistBonus,
    entityName: text.singularLabel,
    queryKey: queryKey.bonuses.bonuses,
    queryKey2: queryKey.bonuses.bonus,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  // FE-FORM-MODE — SEMPRE os 4 campos completos (create E update), nunca
  // patch parcial por `dirtyFields` (`BonusRequest::rules()` não distingue
  // os verbos, os 4 campos são `required` em ambos).
  async function tryPersistBonus(data: BonusFormType) {
    const payload: BonusPayload = {
      employee_uuid: data.employee_uuid,
      event_uuid: data.event_uuid,
      date: data.date,
      amount: Number(data.amount),
    };

    try {
      return isEditing && bonusUuid
        ? await updateBonus(bonusUuid, payload)
        : await createBonus(payload);
    } catch (error) {
      // 422 por campo mapeado LOCALMENTE (mirror `tryPersistAdvance`) — foco
      // especial em `employee_uuid` (regra de posse por fazenda,
      // `whereHas('farms')`) e `event_uuid` (`exists:events,uuid` escopado à
      // fazenda ativa).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as any, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: BonusFormType) {
    // `isEmpty` tem semântica INVERTIDA no projeto (`src/utils/isEmpty.ts`):
    // retorna `true` quando o objeto TEM chaves. Editar sem nenhum campo
    // "sujo" não deve chamar a API — mesmo padrão canônico de
    // `CreateOrUpdateAdiantamento.tsx`.
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await bonusMutation.mutateAsync(data);
    }
  }

  const isSubmitting = bonusMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              form="bonus-form"
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form id="bonus-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={4}
            pb={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            {text.detail.generalData.title}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="employee_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.employee}
                  service={listEmployees}
                  mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={employeeOption ?? undefined}
                  onChange={(opt: any) => {
                    setEmployeeOption(opt ?? null);
                    onChange(opt?.value ?? '');
                  }}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* Evento SEM filtro de tipo — default do roteiro, mesma decisão
              já registrada em `Advance`. `listEventOptions` (`/events/options`,
              cross-farm) — CORRECAO-R2/REG-1: `listEvents` (`/events`) é
              farm-scoped e só devolvia o Evento da fazenda ativa. */}
            <Controller
              name="event_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.event}
                  service={listEventOptions}
                  mapOptions={(item: EventOption) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={eventOption ?? undefined}
                  onChange={(opt: any) => {
                    setEventOption(opt ?? null);
                    onChange(opt?.value ?? '');
                  }}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            <Controller
              name="date"
              control={control}
              render={({ field, fieldState }) => (
                <DateInput
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  label={text.form.fields.date}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field, fieldState }) => (
                <MoneyInput
                  name={field.name}
                  label={text.form.fields.amount}
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                  error={fieldState.error?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>
      </Form>
    </FormContainer>
  );
}
