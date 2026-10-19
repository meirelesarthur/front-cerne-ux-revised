// src/pages/Operacional/Marcacao/RealizacaoLoteMarking.tsx
// -----------------------------------------------------------------------------
// Ação em massa de Realizado (done) — `SURFACE-MARKINGS-DONE-BULK-CREATE`/
// `-EDIT` (TASK-MC-FE-07, esteira 97-Esteiras/044). Mesmo molde de
// `PrevisaoLoteMarking.tsx` — reaproveita `DoneLinesFields` (mesmo corpo de
// `RealizadoMarking.tsx`, TASK-MC-FE-06).
//
// Detecção de modo (criar vs. editar) — mesma decisão robusta de
// `PrevisaoLoteMarking.tsx`: consulta `getMarkingDoneBulk([uuid])` PARA CADA
// marking selecionado e classifica o GRUPO (nenhum tem done → criar; todos
// têm → editar, hidrata pela primeira; misto → erro explícito, nunca decide
// silenciosamente). O select `order` (`CLM-DONE-ORDER-LINK`) usa as linhas de
// forecast da PRIMEIRA marking selecionada (`ids[0]`) como referência —
// mesmo racional de hidratação "pela primeira marking do grupo".
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef } from 'react';

import { Skeleton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import { markingDoneLinesSchemaResolver } from '@/validations/schemas/Marcacao/marking-done-schema';

import {
  createMarkingDoneBulk,
  getMarkingDoneBulk,
  getMarkingForecastBulk,
  updateMarkingDoneBulk,
} from '@/services/v2/Marcacao/marking-service';

import type {
  BulkDoneRequest,
  MarkingDoneLine,
  MarkingDoneSaveResult,
  MarkingForecastLine,
} from '@/@types/v2/Marcacao/marking';

import { DoneLinesFields, type DoneLinesFormValues } from './DoneLinesFields';

const MARKING_LIST_ROUTE = '/operacional/marcacao';

function defaultDoneLine(forecastLines: MarkingForecastLine[]) {
  return {
    order: forecastLines[0]?.order ?? 1,
    date: '',
    quantity: 0,
    discard: 0,
    average_weight: 0,
    average_price: 0,
    status: '1' as const,
  };
}

export default function RealizacaoLoteMarking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.marcacao.marking;
  const canSave = can('markings_done');

  const ids = useMemo(
    () => (searchParams.get('ids') ?? '').split(',').filter(Boolean),
    [searchParams]
  );

  useEffect(() => {
    if (ids.length === 0) {
      toaster.error({ title: text.singularLabel, description: text.done.emptyIdsToast });
      navigate(MARKING_LIST_ROUTE, { replace: true });
    }
  }, [ids]);

  const forecastReferenceQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'forecast', ids[0]],
    queryFn: async () => (await getMarkingForecastBulk([ids[0]])).data,
    enabled: ids.length > 0,
    retry: false,
  });

  const detectQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'done-bulk-detect', ids],
    queryFn: async () => Promise.all(ids.map((id) => getMarkingDoneBulk([id]).then((r) => r.data))),
    enabled: ids.length > 0,
    retry: false,
  });

  const groupLines = detectQuery.data;
  const mode = useMemo<'create' | 'edit' | 'mixed' | null>(() => {
    if (!groupLines) return null;
    const nonEmptyCount = groupLines.filter((lines) => lines.length > 0).length;
    if (nonEmptyCount === 0) return 'create';
    if (nonEmptyCount === groupLines.length) return 'edit';
    return 'mixed';
  }, [groupLines]);

  const forecastLines = forecastReferenceQuery.data ?? [];

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

  // Lei 2 (get_pwa_form_query_pattern) — função nomeada com guarda de
  // dirtyFields; só a CARGA INICIAL (`resetForce`) sempre reseta.
  function fillDoneLines(lines: MarkingDoneLine[], resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({ lines });
    }
  }

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!mode || !groupLines || !forecastReferenceQuery.data) return;
    const lines = mode === 'edit' ? groupLines[0] : [defaultDoneLine(forecastLines)];
    fillDoneLines(lines, !hasHydratedRef.current);
    hasHydratedRef.current = true;
  }, [mode, groupLines, forecastReferenceQuery.data]);

  const hasError = detectQuery.isError || forecastReferenceQuery.isError || mode === 'mixed';

  useEffect(() => {
    if (!hasError) return;
    toaster.error({
      title: text.singularLabel,
      description: text.list.error.message,
      duration: 7000,
    });
    navigate(MARKING_LIST_ROUTE, { replace: true });
  }, [hasError]);

  const isLoading =
    ids.length > 0 && (detectQuery.isPending || forecastReferenceQuery.isPending || !mode);

  const persistedCount = mode === 'edit' && groupLines ? (groupLines[0]?.length ?? 0) : 0;

  const saveMutation = useRequest<MarkingDoneSaveResult[]>({
    asyncFunction: (data: DoneLinesFormValues) => {
      const payload: BulkDoneRequest = {
        ids,
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
      return mode === 'edit' ? updateMarkingDoneBulk(payload) : createMarkingDoneBulk(payload);
    },
    entityName: text.done.title,
    queryKey: queryKey.marcacao.markings,
    typesRequest: mode === 'edit' ? 'update' : 'create',
    personalizedMessage: text.done.successToast,
    actionSuccess: () => navigate(MARKING_LIST_ROUTE),
  });

  const isSaving = saveMutation.isPending;
  const isDisabled = !canSave || isSaving || !!isLoading;

  function onSubmit(data: DoneLinesFormValues) {
    saveMutation.mutateAsync(data);
  }

  return (
    <FormContainer
      title={text.done.title}
      subtitle={text.done.bulkSubtitleTemplate.replace('{count}', String(ids.length))}
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
              form="done-lote-marking-form"
              loading={isSaving}
              disabled={isDisabled}
            />
          )}
        </>
      }
    >
      <Skeleton loading={!!isLoading}>
        <Form id="done-lote-marking-form" onSubmit={handleSubmit(onSubmit)} noPadding>
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
