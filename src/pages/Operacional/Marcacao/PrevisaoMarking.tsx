// src/pages/Operacional/Marcacao/PrevisaoMarking.tsx
// -----------------------------------------------------------------------------
// Tela de Previsão de colheita (forecast) para UMA marcação
// (`SURFACE-MARKINGS-FORECAST-SINGLE`, TASK-MC-FE-05, esteira 97-Esteiras/044).
// Rota dedicada `/operacional/marcacao/:uuid/previsao` (registrada em
// TASK-MC-FE-09) — mirror estrutural de `Operacional/Pastagem/
// AppropriatePastagem.tsx`.
//
// LACUNA reconciliada contra o código real da API (`GB.Cerne.Api`): NÃO
// existe `GET /markings/{uuid}/forecast` dedicado (confirmado por leitura
// direta de `routes/api.php`) — a hidratação das linhas já existentes usa o
// MESMO endpoint bulk-edit (`GET /markings/forecast?ids[]=<uuid>`,
// `getMarkingForecastBulk`), que resolve corretamente pelo ÚNICO marking do
// grupo quando `ids` tem 1 elemento (`GetMarkingForecastLinesForBulkAction`).
// `getMarking(uuid)` é consultado em paralelo só para `quantity`/`date`
// (insumo do cálculo de feedback client-side, `CALC-02..05`).
//
// Salvar SEMPRE apaga e recria o conjunto de linhas (`PUT /markings/{uuid}/
// forecast`, replace-on-save) — nunca update parcial de uma linha.
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

import { markingForecastLinesSchemaResolver } from '@/validations/schemas/Marcacao/marking-forecast-schema';

import {
  getMarking,
  getMarkingForecastBulk,
  replaceMarkingForecast,
} from '@/services/v2/Marcacao/marking-service';

import type {
  MarkingForecastLine,
  MarkingForecastSaveResult,
  ReplaceMarkingForecastRequest,
} from '@/@types/v2/Marcacao/marking';

import { ForecastLinesFields, type ForecastLinesFormValues } from './ForecastLinesFields';

const MARKING_LIST_ROUTE = '/operacional/marcacao';

function defaultForecastLine(): MarkingForecastLine {
  return { order: 1, percentage: 100, average_weight: 0, average_price: 0, days: 0 };
}

export default function PrevisaoMarking() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.marcacao.marking;
  const canSave = can('markings_forecast');
  const validUuid = isValidGuid(uuid);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<ForecastLinesFormValues>({
    mode: 'onChange',
    resolver: markingForecastLinesSchemaResolver(languageGB) as any,
    defaultValues: { lines: [] },
  });

  const markingQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'forecast-reference', uuid],
    queryFn: async () => (await getMarking(uuid!)).data,
    enabled: validUuid,
    retry: false,
  });

  const forecastLinesQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'forecast', uuid],
    queryFn: async () => (await getMarkingForecastBulk([uuid!])).data,
    enabled: validUuid,
    retry: false,
  });

  // Lei 2 (get_pwa_form_query_pattern) — função nomeada com guarda de
  // dirtyFields: um eventual refetch em background nunca apaga edições do
  // usuário em andamento; só a CARGA INICIAL (`resetForce`) sempre reseta.
  function fillForecastLines(lines: MarkingForecastLine[], resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({ lines: lines.length > 0 ? lines : [defaultForecastLine()] });
    }
  }

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!forecastLinesQuery.data) return;
    fillForecastLines(forecastLinesQuery.data, !hasHydratedRef.current);
    hasHydratedRef.current = true;
  }, [forecastLinesQuery.data]);

  const hasError = !validUuid || markingQuery.isError || forecastLinesQuery.isError;

  useEffect(() => {
    if (!hasError) return;
    toaster.error({
      title: text.singularLabel,
      description: text.list.error.message,
      duration: 7000,
    });
    navigate(MARKING_LIST_ROUTE, { replace: true });
  }, [hasError]);

  const isLoading = validUuid && (markingQuery.isPending || forecastLinesQuery.isPending);

  const saveMutation = useRequest<MarkingForecastSaveResult>({
    asyncFunction: (data: ForecastLinesFormValues) => {
      const payload: ReplaceMarkingForecastRequest = {
        lines: data.lines.map((line, index) => ({
          order: index + 1,
          percentage: line.percentage,
          average_weight: line.average_weight,
          average_price: line.average_price,
          days: line.days,
        })),
      };
      return replaceMarkingForecast(uuid!, payload);
    },
    entityName: text.forecast.title,
    queryKey: queryKey.marcacao.markings,
    queryKey2: queryKey.marcacao.marking,
    typesRequest: 'update',
    personalizedMessage: text.forecast.successToast,
    actionSuccess: () => navigate(-1),
  });

  const isSaving = saveMutation.isPending;
  const isDisabled = !canSave || isSaving || !!isLoading;

  function onSubmit(data: ForecastLinesFormValues) {
    saveMutation.mutateAsync(data);
  }

  return (
    <FormContainer
      title={text.forecast.title}
      subtitle={text.forecast.subtitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSaving}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="forecast-marking-form"
              loading={isSaving}
              disabled={isDisabled}
            />
          )}
        </>
      }
    >
      <Skeleton loading={!!isLoading}>
        <Form id="forecast-marking-form" onSubmit={handleSubmit(onSubmit)} noPadding>
          <ForecastLinesFields
            control={control}
            errors={errors}
            disabled={isDisabled}
            referenceMarking={
              markingQuery.data
                ? { quantity: markingQuery.data.quantity, date: markingQuery.data.date }
                : null
            }
          />
        </Form>
      </Skeleton>
    </FormContainer>
  );
}
