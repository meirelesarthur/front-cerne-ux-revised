// src/pages/Administrativo/Eventos/CreateOrUpdateEvento.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de EVENTO — Administrativo / Gestão Pessoal
// (TASK-FE-EVT-02). Rotas: /administrativo/eventos/novo e
// /administrativo/eventos/:eventId (GUID), registradas em src/router/index.tsx
// (a rota-mãe da listagem foi registrada pela Tarefa irmã TASK-FE-EVT-01),
// guardadas por `events_view`.
//
// Reaproveitada também como modo LEITURA quando o usuário só tem `events_view`
// (decisão do contrato de tela §Leitura do dev item 1 — não há tela de
// Detalhe separada; work package MCP "Eventos-View" é satisfeito por esta via
// + pela própria listagem).
//
// Estrutura mecânica adaptada de Administrativo/Funcoes/CreateOrUpdateFuncao.tsx
// (guard de GUID, mutação via `useRequest`, 422 mapeado por campo via
// `setError`) — mais simples que o molde porque não há `SelectAsyncPaginate`/
// `MoneyInput`/campo calculado: só 1 `Input` texto + 3 `Select` de enum +
// 1 `Switch`.
//
// ⚠️ CHECKLIST OBRIGATÓRIO desta Tarefa (mirror `CreateOrUpdateFuncao.tsx`):
//
// 1) Guard `onSubmit` — forma EXPLÍCITA `Object.keys(dirtyFields).length === 0`
//    (NUNCA `isEmpty`/`!isEmpty`).
// 2) Payload de update COMPLETO (full-resource-replace) — `EventRequest`
//    exige todos os campos `required` em ambos os verbos (contrato de API
//    §3.2, sem `sometimes`); nunca um delta de `dirtyFields` (armadilha
//    catalogada na Leitura do dev da Tarefa — `ParameterWeight`, precedente
//    mais recente, usa PATCH parcial; NÃO copiar esse detalhe de lá).
// 3) Os 3 enums (`type`/`method`/`condition`) trafegam como STRING no RHF
//    (`EventForm`, formato do `Select`) e são convertidos para `number` só no
//    payload (`tryPersistEvento`), mirror `CostCenterForm.condition`.
// 4) `fillEventoForm` é função NOMEADA com guarda EXPLÍCITA
//    `Object.keys(dirtyFields).length === 0 || resetForce` — nunca `reset()`
//    inline em `useEffect`.
// 5) Modo leitura (`canSave` falso): todo campo `disabled`, footer sem
//    `ButtonSaveAndNext`.
// -----------------------------------------------------------------------------

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Switch } from '@/components/ui/switch';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { eventConditionOptions } from '@/constants/GestaoPessoal/Event/options/event-condition-options';
import { eventMethodOptions } from '@/constants/GestaoPessoal/Event/options/event-method-options';
import { eventTypeOptions } from '@/constants/GestaoPessoal/Event/options/event-type-options';
import { queryKey } from '@/constants/query-key';

import { eventoSchemaResolver } from '@/validations/schemas/Eventos/evento-schema';

import { createEvent, updateEvent } from '@/services/v2/Events/event-service';

import type { CreateEventRequest, EventDetail, EventForm } from '@/@types/v2/Events';

import { useEventoForm } from './useEventos';

export default function CreateOrUpdateEvento() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // É edição quando existe um GUID válido na rota ("novo" não é GUID) —
  // guarda de GUID inválido também cai em modo create (mirror
  // `CreateOrUpdateFuncao`), nunca redireciona para a listagem.
  const isEditing = isValidGuid(eventId);

  const text = languageGB.events.event;

  const canSave = isEditing ? can('events_edit') : can('events_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<EventForm>({
    mode: 'onChange',
    resolver: eventoSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      type: '',
      method: '',
      condition: '',
      is_enabled: true,
    },
  });

  // Checklist item 4 — guarda EXPLÍCITA `Object.keys(dirtyFields).length === 0
  // || resetForce` (nunca `isEmpty`/`!isEmpty`). Converte os 3 enums de
  // `number` (vindos da API) para `string` (formato do `Select`/RHF).
  function fillEventoForm(data: EventDetail, resetForce?: boolean) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (hasNoFormChanges || resetForce) {
      reset({
        name: data.name,
        type: String(data.type),
        method: String(data.method),
        condition: String(data.condition),
        is_enabled: data.is_enabled,
      });
    }
  }

  const eventoQuery = useEventoForm({
    registrationId: isEditing ? eventId : undefined,
    fillForm: fillEventoForm,
  });

  const isLoading = isEditing && checkLoadingStatus([eventoQuery as any]);

  const eventoMutation = useRequest({
    asyncFunction: tryPersistEvento,
    entityName: text.singularLabel,
    queryKey: queryKey.events.eventsList,
    queryKey2: queryKey.events.event,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistEvento(data: EventForm) {
    // Checklist item 2 — payload sempre FULL-RESOURCE (nunca um delta de
    // `dirtyFields`) — `EventRequest` exige todos os campos `required` em
    // ambos os verbos (contrato de API §3.2). Checklist item 3 — os 3 enums
    // voltam para `number` só aqui.
    const payload: CreateEventRequest = {
      name: data.name,
      type: Number(data.type),
      method: Number(data.method),
      condition: Number(data.condition),
      is_enabled: !!data.is_enabled,
    };

    try {
      return isEditing && eventId
        ? await updateEvent(eventId, payload)
        : await createEvent(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — mesma técnica de
      // `tryPersistFunction`/`tryPersistCostCenter` (o `throw` preserva o
      // toast genérico que `useRequest` já mostra).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof EventForm, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Checklist item 1 — guard `onSubmit`: checagem EXPLÍCITA
  // `Object.keys(dirtyFields).length === 0`, nunca `isEmpty`/`!isEmpty`.
  async function onSubmit(data: EventForm) {
    const hasNoFormChanges = Object.keys(dirtyFields).length === 0;
    if (isEditing && hasNoFormChanges) {
      navigate(-1);
    } else {
      await eventoMutation.mutateAsync(data);
    }
  }

  const isSubmitting = eventoMutation.isPending;

  const typeOptions = eventTypeOptions.options(languageGB);
  const methodOptions = eventMethodOptions.options(languageGB);
  const conditionOptions = eventConditionOptions.options(languageGB);

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
              create={!isEditing}
              dirtyFields={dirtyFields}
              type="button"
              onClick={handleSubmit(onSubmit)}
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Input
            label={text.form.fields.name}
            placeholder={text.form.placeholders.name}
            {...register('name')}
            error={errors.name?.message}
            isRequired
            loading={isLoading}
            disabled={!canSave}
          />

          <Controller
            name="type"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.type}
                name={name}
                value={typeOptions.find((option) => option.value === value) ?? null}
                onChange={(opt) => onChange(opt?.value ?? '')}
                options={typeOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="method"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.method}
                name={name}
                value={methodOptions.find((option) => option.value === value) ?? null}
                onChange={(opt) => onChange(opt?.value ?? '')}
                options={methodOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="condition"
            control={control}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.condition}
                name={name}
                value={conditionOptions.find((option) => option.value === value) ?? null}
                onChange={(opt) => onChange(opt?.value ?? '')}
                options={conditionOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={isLoading}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field }) => (
              <Box display="flex" alignItems="center" justifyContent="space-between" h="full">
                <Text fontSize="sm" fontWeight="medium">
                  {text.form.fields.isEnabled}
                </Text>
                {/* @ts-ignore - Chakra UI v3 Switch API */}
                <Switch
                  checked={!!field.value}
                  onCheckedChange={(d: any) => field.onChange(d.checked)}
                  colorPalette="green"
                  disabled={!canSave || isLoading}
                  aria-label={text.form.fields.isEnabled}
                />
              </Box>
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
