// src/pages/Administrativo/Faltas/CreateOrUpdateAbsence.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Falta — Administrativo / Gestão Pessoal
// (Tarefa 13). Rotas: /administrativo/faltas/novo e
// /administrativo/faltas/:absenceUuid (GUID), registradas em
// src/router/index.tsx, guardadas por `absences_view`.
//
// Reaproveitada também como modo LEITURA quando o usuário só tem
// `absences_view` (sem tela de Detalhe separada — mirror
// `CreateOrUpdateEvento.tsx`, decisão item 4 do §2 da matriz FID-G3F).
//
// Esqueleto geral mirror `Eventos/CreateOrUpdateEvento.tsx` (guard de GUID,
// `useForm` único, `fillAbsenceForm` nomeada com guarda explícita,
// `useRequest`, 422 mapeado por campo via `setError`). Bloco de lookups
// (`employee_uuid`/`event_uuid` via `SelectAsyncPaginate` + estado local de
// exibição) e campo `amount` (`MoneyInput`) mirror EXATO de
// `Adiantamento/CreateOrUpdateAdiantamento.tsx` (ignorado o bloco financeiro/
// parcelas, fora de escopo de Absence). Guard de GUID malformado mirror
// `CreateOrUpdateAdiantamento.tsx` (redireciona para a listagem ANTES de
// renderizar, `replace: true`).
//
// ⚠️ CHECKLIST OBRIGATÓRIO desta Tarefa (mirror `CreateOrUpdateEvento.tsx`):
//
// 1) Guard `onSubmit` — forma EXPLÍCITA `Object.keys(dirtyFields).length === 0`
//    (NUNCA `isEmpty`/`!isEmpty` — o `isEmpty` deste projeto tem semântica
//    INVERTIDA, `src/utils/isEmpty.ts`, evitar confusão).
// 2) Payload de update COMPLETO (full-resource-replace) — `AbsenceRequest`
//    exige todos os campos `required` em ambos os verbos (contrato de tela
//    §6); nunca um delta de `dirtyFields`.
// 3) `period` trafega como STRING no RHF (formato do `Select`) e é convertido
//    para `number|null` só no payload (`tryPersistAbsence`), mirror
//    `EventForm.type`.
// 4) `fillAbsenceForm` é função NOMEADA com guarda EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0 || resetForce` — nunca `reset()`
//    inline em `useEffect`.
// 5) Modo leitura (`canSave` falso): todo campo `disabled`, footer sem
//    `ButtonSaveAndNext`.
// 6) Guard de GUID malformado na rota `/:absenceUuid`: redireciona para
//    `/administrativo/faltas` (`replace: true`) ANTES de renderizar o form.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { absencePeriodOptions } from '@/constants/GestaoPessoal/Absence/options/absence-period-options';
import { queryKey } from '@/constants/query-key';

import { absenceSchemaResolver } from '@/validations/schemas/Absences/absence-schema';

import { createAbsence, updateAbsence } from '@/services/v2/Absences/absence-service';
import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listEventOptions } from '@/services/v2/Events/event-service';

import type { Option } from '@/@types/option';
import type { AbsenceDetail, AbsenceForm, AbsencePayload } from '@/@types/v2/Absences';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { EventOption } from '@/@types/v2/Events';

import { useAbsenceForm } from './useAbsences';

const ABSENCES_LIST_ROUTE = '/administrativo/faltas';

export default function CreateOrUpdateAbsence() {
  const { absenceUuid } = useParams<{ absenceUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const [searchParams] = useSearchParams();

  // `?mode=view` força modo leitura mesmo para quem tem `absences_edit` —
  // ação "Visualizar" da listagem (index.tsx) navega com esse param. Sem o
  // param (ou `?mode=edit`), o formulário abre no modo normal (edição, se
  // `canEdit`).
  const isForcedViewMode = searchParams.get('mode') === 'view';

  // `/novo` NÃO tem `:absenceUuid` (rota própria, sem param); só a rota
  // `/:absenceUuid` popula o param. Guard de navegação: uuid mal formado NA
  // ROTA DE EDIÇÃO redireciona para o grid ANTES de renderizar — checklist
  // item 6, mirror `CreateOrUpdateAdiantamento.tsx`.
  const hasMalformedRouteParam = absenceUuid !== undefined && !isValidGuid(absenceUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(ABSENCES_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(absenceUuid);
  const text = languageGB.absences.absence;
  const canSave = isForcedViewMode
    ? false
    : isEditing
      ? can('absences_edit')
      : can('absences_create');

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<AbsenceForm>({
    mode: 'onChange',
    resolver: absenceSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: todayLocalIso(),
      employee_uuid: '',
      event_uuid: '',
      period: '',
      amount: 0,
    },
  });

  // ---- "Picked options" de exibição dos 2 selects relacionais — ver nota
  // de cabeçalho (mirror `CreateOrUpdateAdiantamento.tsx`). Semeados por
  // `fillAbsenceForm`; atualizados no `onChange`. ------
  const [employeeOption, setEmployeeOption] = useState<Option | null>(null);
  const [eventOption, setEventOption] = useState<Option | null>(null);

  // Checklist item 4 — guarda EXPLÍCITA `Object.keys(dirtyFields).length === 0
  // || resetForce` (nunca `isEmpty`/`!isEmpty`). Converte `period` de
  // `number|null` (vindo da API) para `string` (formato do `Select`/RHF).
  function fillAbsenceForm(data: AbsenceDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        date: data.date,
        employee_uuid: data.employee?.uuid ?? '',
        event_uuid: data.event?.uuid ?? '',
        period: data.period !== null && data.period !== undefined ? String(data.period) : '',
        amount: Number(data.amount),
      });

      setEmployeeOption(
        data.employee ? { label: data.employee.name, value: data.employee.uuid } : null
      );
      setEventOption(data.event ? { label: data.event.name, value: data.event.uuid } : null);
    }
  }

  const absenceQuery = useAbsenceForm({
    registrationId: isEditing ? absenceUuid : undefined,
    fillForm: fillAbsenceForm,
  });

  const isLoading = isEditing && checkLoadingStatus([absenceQuery as any]);

  const absenceMutation = useRequest({
    asyncFunction: tryPersistAbsence,
    entityName: text.singularLabel,
    queryKey: queryKey.absences.absencesList,
    queryKey2: queryKey.absences.absence,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistAbsence(data: AbsenceForm) {
    // Checklist item 2 — payload sempre FULL-RESOURCE (nunca um delta de
    // `dirtyFields`) — `AbsenceRequest` exige todos os campos `required` em
    // ambos os verbos (contrato de tela §6). Checklist item 3 — `period`
    // volta para `number|null` só aqui.
    const payload: AbsencePayload = {
      employee_uuid: data.employee_uuid,
      event_uuid: data.event_uuid,
      date: data.date,
      amount: Number(data.amount),
      period: data.period ? Number(data.period) : null,
    };

    try {
      return isEditing && absenceUuid
        ? await updateAbsence(absenceUuid, payload)
        : await createAbsence(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `tryPersistEvento`/`tryPersistAdvance` (o `throw` preserva o toast
      // genérico que `useRequest` já mostra).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof AbsenceForm, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Checklist item 1 — guard `onSubmit`: checagem EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0`, nunca `isEmpty`/`!isEmpty`.
  async function onSubmit(data: AbsenceForm) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (isEditing && hasNoFormChanges) {
      navigate(-1);
    } else {
      await absenceMutation.mutateAsync(data);
    }
  }

  const isSubmitting = absenceMutation.isPending;

  const periodOptions = absencePeriodOptions.options(languageGB);

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <FormContainer
      title={
        isForcedViewMode
          ? text.form.title.view
          : isEditing
            ? text.form.title.edit
            : text.form.title.create
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
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
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

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

          {/* Evento SEM filtro de tipo — `/events/options` não restringe
              server-side (contrato de tela §3, GAP-RF-05). */}
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
            name="period"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.period}
                name={name}
                value={periodOptions.find((option) => option.value === value) ?? null}
                onChange={(opt) => onChange(opt?.value ?? '')}
                options={periodOptions}
                error={error?.message}
                isDisabled={!canSave || !!isLoading}
                loading={!!isLoading}
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
      </Form>
    </FormContainer>
  );
}
