// src/pages/Operacional/Reproducao/EstacaoDeMonta/CreateOrUpdateEstacaoDeMonta.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de Estação de Monta — Operacional /
// Reprodução (Tarefa 13). Rotas: /operacional/reproducao/nova e
// /operacional/reproducao/:breedingSeasonUuid/editar, registradas em
// src/router/index.tsx, guardadas por `breeding-seasons_create`/`_edit`.
//
// Esqueleto geral mirror `Operacional/ContratosVenda/CreateOrUpdateContratoVenda.tsx`
// (`isEditing = isValidGuid(id)`, `useCustomFormQueryByGuid`, `fillForm`
// nomeada com guarda `!isEmpty(dirtyFields) || resetForce`) + bloco de código
// sugerido/Responsável read-only mirror
// `Administrativo/FarmTransfer/CreateFarmTransfer.tsx` (`InputReadOnly` +
// `useQuery` + fallback `'—'`).
//
// "Responsável" é SEMPRE `InputReadOnly` — NUNCA um select real
// (`GAP-ESTACAOMONTA-FE-05`, mirror `GAP-EM-04` do backend); NUNCA vai ao
// payload. `code` também é read-only mas VAI no payload como está
// (`GAP-EM-07`, sem `unique` no backend).
//
// Prévia Dias/Semanas + gráfico "Dias por mês" (mirror `CV1`/`CV2`/`CV4` do
// legado) recalculados a cada `watch` de `start_date`/`end_date` — nunca
// `useState` local (Lei 3) — via `computeDaysAndWeeks`/`computeMonthlyDaysBars`
// (`breedingSeasonChart.ts`, Tarefa 12, MESMA função usada pelo Detalhe,
// `GAP-ESTACAOMONTA-FE-03`).
//
// `start_date > end_date` BLOQUEIA o submit de verdade (`GAP-ESTACAOMONTA-FE-06`,
// decisão do dono) — erro de campo real via `breedingSeasonSchemaResolver`,
// exclusivo da SPA (a API, `GAP-EM-08`, continua sem essa validação).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { breedingSeasonSchemaResolver } from '@/validations/schemas/BreedingSeasons/breeding-season-schema';

import {
  createBreedingSeason,
  getBreedingSeason,
  getBreedingSeasonNextCode,
  updateBreedingSeason,
} from '@/services/v2/BreedingSeasons/breeding-season-service';

import type {
  BreedingSeasonDetail,
  BreedingSeasonForm,
  BreedingSeasonPayload,
} from '@/@types/v2/BreedingSeasons';

import { computeDaysAndWeeks, computeMonthlyDaysBars } from './breedingSeasonChart';
import { EstacaoDeMontaBarChart } from './EstacaoDeMontaBarChart';

const ESTACAO_DE_MONTA_LIST_ROUTE = '/operacional/reproducao';

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CreateOrUpdateEstacaoDeMonta() {
  const { breedingSeasonUuid } = useParams<{ breedingSeasonUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser } = useAuth();

  const text = languageGB.breedingSeasons.breedingSeason;

  // Guard de navegação: `breedingSeasonUuid` presente mas NÃO é um GUID
  // válido (URL adulterada) — redireciona para a listagem ANTES de
  // renderizar o form (mirror `CreateOrUpdateContratoVenda.tsx`).
  const hasMalformedRouteParam =
    breedingSeasonUuid !== undefined && !isValidGuid(breedingSeasonUuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(ESTACAO_DE_MONTA_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(breedingSeasonUuid);
  const canSave = isEditing ? can('breeding-seasons_edit') : can('breeding-seasons_create');

  const unsavedChangesText = text.form.unsavedChangesDialog;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<BreedingSeasonForm>({
    mode: 'onChange',
    resolver: breedingSeasonSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      code: '',
      date: todayIsoDate(),
      description: '',
      start_date: null,
      end_date: null,
    },
  });

  // ---- Guarda de saída sem salvar (correção de rejeição da Tarefa 13) ----
  // `!isEmpty(dirtyFields)` — mesmo critério de "sujo" já usado no resto do
  // arquivo (fillForm/onSubmit), nunca `formState.isDirty` isolado, para
  // manter um único conceito de "alteração não salva" na tela.
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  // ---- Código sugerido (SÓ em modo criação, `GET .../next-code`) ----------
  // Armadilha 3 da Tarefa 13: `next-code` NUNCA é chamado em edição — o
  // `code` vem do próprio detalhe carregado.
  const nextCodeQuery = useQuery({
    queryKey: [queryKey.breedingSeasons.breedingSeason, 'next-code'],
    queryFn: getBreedingSeasonNextCode,
    enabled: !isEditing,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isEditing && nextCodeQuery.data?.data?.code) {
      setValue('code', nextCodeQuery.data.data.code, { shouldDirty: false });
    }
  }, [isEditing, nextCodeQuery.data]);

  // ---- "Responsável" — SEMPRE read-only (`GAP-ESTACAOMONTA-FE-05`).
  // Criação: usuário autenticado local. Edição: `responsible_name` do
  // detalhe carregado (mirror `CreateFarmTransfer.tsx`/
  // `CreateOrUpdateContratoVenda.tsx`) — semeado por `fillForm`, nunca
  // editável (mesmo racional do "picked option" de exibição de
  // `CreateOrUpdateAbsence.tsx`, aqui sem select — puro texto read-only). ----
  const [responsibleName, setResponsibleName] = useState<string>('—');

  useEffect(() => {
    if (!isEditing) {
      setResponsibleName(authUser?.username ?? '—');
    }
  }, [isEditing, authUser?.username]);

  // Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` (Lei 2). `code`/
  // `responsible_name` NUNCA nascem de input do usuário — sempre do
  // servidor (edição) ou da prévia de criação.
  function fillForm(data: BreedingSeasonDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) && !resetForce) return;

    reset({
      code: data.code,
      date: data.date,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
    });
    setResponsibleName(data.responsible_name ?? '—');
  }

  const breedingSeasonQuery = useCustomFormQueryByGuid<BreedingSeasonDetail>({
    registrationId: isEditing ? breedingSeasonUuid : undefined,
    queryKey: queryKey.breedingSeasons.breedingSeason,
    asyncFunction: getBreedingSeason,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([breedingSeasonQuery as any]);

  const breedingSeasonMutation = useRequest({
    asyncFunction: tryPersistBreedingSeason,
    entityName: text.singularLabel,
    queryKey: queryKey.breedingSeasons.breedingSeasonsList,
    queryKey2: queryKey.breedingSeasons.breedingSeason,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(ESTACAO_DE_MONTA_LIST_ROUTE);
    },
  });

  async function tryPersistBreedingSeason(data: BreedingSeasonForm) {
    // Payload NUNCA contém user_id/user_uuid/employee_id/farm_id/days/weeks
    // (contrato de tela §5.4/§8) — só os 5 campos abaixo.
    const payload: BreedingSeasonPayload = {
      code: data.code,
      date: data.date,
      description: data.description,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };

    try {
      return isEditing && breedingSeasonUuid
        ? await updateBreedingSeason(breedingSeasonUuid, payload)
        : await createBreedingSeason(payload);
    } catch (error) {
      // 422 do backend mapeado por campo (contrato de tela §5.5) — mesma
      // técnica de `tryPersistAbsence`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof BreedingSeasonForm, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Guarda `isEditing && !isEmpty(dirtyFields)` (Lei 2, mirror EXATO
  // `CreateOrUpdateBullSeedSeason.tsx`/`CreateOrUpdateEstagioReprodutivo.tsx`/
  // `useProductFormController.ts`) — `isEmpty()` deste projeto retorna
  // `true` quando o objeto TEM alguma chave própria (nome invertido do
  // utilitário, `src/utils/isEmpty.ts`), então o guard de "nada mudou → só
  // navega" precisa da negação `!`. Sem ela (bug real reportado pelo dono,
  // reproduzido em local E homologação), `isEmpty(dirtyFields)` era `true`
  // sempre que HAVIA alteração — fazendo o Salvar navegar de volta sem
  // NUNCA chamar a API em NENHUMA edição real (ex.: Descrição alterada).
  async function onSubmit(data: BreedingSeasonForm) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await breedingSeasonMutation.mutateAsync(data);
  }

  const isSubmitting = breedingSeasonMutation.isPending;

  // ---- Prévia Dias/Semanas + gráfico "Dias por mês" — recalculados a cada
  // `watch` de start_date/end_date (nunca useState local, Lei 3). MESMA
  // função pura usada pelo Detalhe (Tarefa 12, `GAP-ESTACAOMONTA-FE-03`). ----
  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');
  const daysAndWeeksPreview = computeDaysAndWeeks(watchedStartDate, watchedEndDate);
  const monthlyBars = computeMonthlyDaysBars(watchedStartDate, watchedEndDate);

  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <>
      <FormContainer
        title={isEditing ? text.form.title.edit : text.form.title.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings?.cancel || 'Cancelar'}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(-1)}
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
            <InputReadOnly
              name="code"
              label={text.form.fields.code}
              value={watch('code') || '—'}
              loading={!isEditing && nextCodeQuery.isLoading}
            />

            <InputReadOnly
              name="responsible"
              label={text.form.fields.responsible}
              value={responsibleName}
              loading={!!isLoading}
            />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.form.fields.date}
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value ?? '')}
                  error={errors.date?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            <Input
              label={text.form.fields.description}
              {...register('description')}
              error={errors.description?.message}
              isRequired
              loading={!!isLoading}
              disabled={!canSave}
            />

            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field
                  label={text.form.fields.startDate}
                  errorText={errors.start_date?.message}
                  isRequired
                >
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={!canSave || !!isLoading}
                  />
                </Field>
              )}
            />

            <Controller
              name="end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Field
                  label={text.form.fields.endDate}
                  errorText={errors.end_date?.message}
                  isRequired
                >
                  <DateInput
                    value={value ?? null}
                    onChange={onChange}
                    disabled={!canSave || !!isLoading}
                  />
                </Field>
              )}
            />

            <InputReadOnly
              name="daysPreview"
              label={text.form.fields.daysPreview}
              value={daysAndWeeksPreview ? String(daysAndWeeksPreview.days) : '—'}
            />

            <InputReadOnly
              name="weeksPreview"
              label={text.form.fields.weeksPreview}
              value={daysAndWeeksPreview ? String(daysAndWeeksPreview.weeks) : '—'}
            />
          </SimpleGrid>

          <Box mt={6}>
            <EstacaoDeMontaBarChart
              bars={monthlyBars}
              title={text.chart.title}
              emptyLabel={text.chart.empty}
            />
          </Box>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={unsavedChangesText.title}
        description={unsavedChangesText.description}
        confirmButtonText={unsavedChangesText.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
