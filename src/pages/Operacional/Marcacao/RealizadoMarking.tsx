// src/pages/Operacional/Marcacao/RealizadoMarking.tsx
// -----------------------------------------------------------------------------
// Tela de Realização de colheita (done) para UMA marcação
// (`SURFACE-MARKINGS-DONE-SINGLE`, TASK-MC-FE-06, esteira 97-Esteiras/044).
// Rota dedicada `/operacional/marcacao/:uuid/realizado` (registrada em
// TASK-MC-FE-09) — mesmo molde de `PrevisaoMarking.tsx`.
//
// Mesma LACUNA reconciliada de `PrevisaoMarking.tsx`: NÃO existe
// `GET /markings/{uuid}/done` dedicado — hidratação via o endpoint bulk-edit
// (`getMarkingDoneBulk([uuid])`). `getMarkingForecastBulk([uuid])` também é
// consultado, para alimentar o select `order` (`CLM-DONE-ORDER-LINK`) com as
// linhas de forecast JÁ EXISTENTES desta marcação.
//
// Salvar SEMPRE apaga e recria o conjunto de linhas (replace-on-save).
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Skeleton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { markingDoneLinesSchemaResolver } from '@/validations/schemas/Marcacao/marking-done-schema';

import {
  getMarkingDoneBulk,
  getMarkingForecastBulk,
  replaceMarkingDone,
} from '@/services/v2/Marcacao/marking-service';

import type {
  MarkingDoneLine,
  MarkingDoneSaveResult,
  MarkingForecastLine,
  ReplaceMarkingDoneRequest,
} from '@/@types/v2/Marcacao/marking';

import { DoneLinesFields, type DoneLinesFormValues } from './DoneLinesFields';

const MARKING_LIST_ROUTE = '/operacional/marcacao';

function defaultDoneLine(forecastLines: MarkingForecastLine[]): MarkingDoneLine {
  return {
    order: forecastLines[0]?.order ?? 1,
    date: '',
    quantity: 0,
    discard: 0,
    average_weight: 0,
    average_price: 0,
    status: '1',
  };
}

export default function RealizadoMarking() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.marcacao.marking;
  const canSave = can('markings_done');
  const validUuid = isValidGuid(uuid);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<DoneLinesFormValues>({
    mode: 'onChange',
    resolver: markingDoneLinesSchemaResolver(languageGB) as any,
    defaultValues: { lines: [] },
  });

  const forecastLinesQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'forecast', uuid],
    queryFn: async () => (await getMarkingForecastBulk([uuid!])).data,
    enabled: validUuid,
    retry: false,
  });

  const doneLinesQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'done', uuid],
    queryFn: async () => (await getMarkingDoneBulk([uuid!])).data,
    enabled: validUuid,
    retry: false,
  });

  const forecastLines = forecastLinesQuery.data ?? [];
  const persistedCount = doneLinesQuery.data?.length ?? 0;

  // Lei 2 (get_pwa_form_query_pattern) — função nomeada com guarda de
  // dirtyFields; só a CARGA INICIAL (`resetForce`) sempre reseta.
  function fillDoneLines(
    lines: MarkingDoneLine[],
    forecasts: MarkingForecastLine[],
    resetForce?: boolean
  ) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({ lines: lines.length > 0 ? lines : [defaultDoneLine(forecasts)] });
    }
  }

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!doneLinesQuery.data || !forecastLinesQuery.data) return;
    fillDoneLines(doneLinesQuery.data, forecastLinesQuery.data, !hasHydratedRef.current);
    hasHydratedRef.current = true;
  }, [doneLinesQuery.data, forecastLinesQuery.data]);

  const hasError = !validUuid || forecastLinesQuery.isError || doneLinesQuery.isError;

  useEffect(() => {
    if (!hasError) return;
    toaster.error({
      title: text.singularLabel,
      description: text.list.error.message,
      duration: 7000,
    });
    navigate(MARKING_LIST_ROUTE, { replace: true });
  }, [hasError]);

  const isLoading = validUuid && (forecastLinesQuery.isPending || doneLinesQuery.isPending);

  const saveMutation = useRequest<MarkingDoneSaveResult>({
    asyncFunction: (data: DoneLinesFormValues) => {
      const payload: ReplaceMarkingDoneRequest = {
        lines: data.lines.map((line) => ({
          order: line.order,
          date: line.date,
          quantity: line.quantity,
          discard: line.discard,
          average_weight: line.average_weight,
          average_price: line.average_price,
          status: line.status,
          color: line.color,
        })),
      };
      return replaceMarkingDone(uuid!, payload);
    },
    entityName: text.done.title,
    queryKey: queryKey.marcacao.markings,
    queryKey2: queryKey.marcacao.marking,
    typesRequest: 'update',
    personalizedMessage: text.done.successToast,
    actionSuccess: () => navigate(-1),
  });

  const isSaving = saveMutation.isPending;
  const isDisabled = !canSave || isSaving || !!isLoading;

  function onSubmit(data: DoneLinesFormValues) {
    saveMutation.mutateAsync(data);
  }

  return (
    <FormContainer
      title={text.done.title}
      subtitle={text.done.subtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="done-marking-form"
              loading={isSaving}
              disabled={isDisabled}
            />
          )}
        </>
      }
    >
      <Skeleton loading={!!isLoading}>
        <Form id="done-marking-form" onSubmit={handleSubmit(onSubmit)} noPadding>
          <DoneLinesFields
            control={control}
            errors={errors}
            disabled={isDisabled}
            forecastLines={forecastLines}
            persistedCount={persistedCount}
          />
        </Form>
      </Skeleton>
    </FormContainer>
  );
}
