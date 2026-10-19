// src/pages/Operacional/Marcacao/PrevisaoLoteMarking.tsx
// -----------------------------------------------------------------------------
// Ação em massa de Previsão (forecast) — `SURFACE-MARKINGS-FORECAST-BULK-
// CREATE`/`-EDIT` (TASK-MC-FE-07, esteira 97-Esteiras/044). Tela dedicada por
// `?ids=uuid1,uuid2` (não modal Bootstrap do legado — mirror do padrão MAIS
// RECENTE da própria SPA, `VendaAnimaisList` → `/finalizar-lote?ids=...`).
// Reaproveita `ForecastLinesFields` (mesmo corpo de `PrevisaoMarking.tsx`,
// TASK-MC-FE-05).
//
// DETECÇÃO DE MODO (criar vs. editar) — decisão do Executor, mais robusta que
// o roteiro original (que sugeria inferir pelo `status` da listagem): consulta
// `getMarkingForecastBulk([uuid])` PARA CADA marking selecionado (não só a
// 1ª) e classifica o GRUPO:
//   - NENHUM marking tem linhas de forecast → modo CRIAR (`POST`).
//   - TODOS os markings têm linhas de forecast → modo EDITAR (`PUT`),
//     hidrata pela PRIMEIRA marking selecionada (`ids[0]`, mirror
//     `GetMarkingForecastLinesForBulkAction`).
//   - MISTO (só parte do grupo tem forecast) → o gate de seleção múltipla de
//     `TASK-MC-FE-03` (homogeneidade por `status`) não é suficiente para
//     excluir este caso (status `1`+`2` podem ser selecionados juntos no
//     mesmo lote de forecast) — trata-se como ERRO EXPLÍCITO (toast + volta
//     para a listagem), NUNCA decide silenciosamente por um dos dois modos
//     (`ARCHITECTURE-MARCACAO-FE.md`, Leitura do dev da Tarefa).
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

import { markingForecastLinesSchemaResolver } from '@/validations/schemas/Marcacao/marking-forecast-schema';

import {
  createMarkingForecastBulk,
  getMarkingForecastBulk,
  updateMarkingForecastBulk,
} from '@/services/v2/Marcacao/marking-service';

import type {
  BulkForecastRequest,
  MarkingForecastLine,
  MarkingForecastSaveResult,
} from '@/@types/v2/Marcacao/marking';

import { ForecastLinesFields, type ForecastLinesFormValues } from './ForecastLinesFields';

const MARKING_LIST_ROUTE = '/operacional/marcacao';

function defaultForecastLine() {
  return { order: 1, percentage: 100, average_weight: 0, average_price: 0, days: 0 };
}

export default function PrevisaoLoteMarking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.marcacao.marking;
  const canSave = can('markings_forecast');

  const ids = useMemo(
    () => (searchParams.get('ids') ?? '').split(',').filter(Boolean),
    [searchParams]
  );

  useEffect(() => {
    if (ids.length === 0) {
      toaster.error({ title: text.singularLabel, description: text.forecast.emptyIdsToast });
      navigate(MARKING_LIST_ROUTE, { replace: true });
    }
  }, [ids]);

  const detectQuery = useQuery({
    queryKey: [queryKey.marcacao.marking, 'forecast-bulk-detect', ids],
    queryFn: async () =>
      Promise.all(ids.map((id) => getMarkingForecastBulk([id]).then((r) => r.data))),
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

  // Lei 2 (get_pwa_form_query_pattern) — função nomeada com guarda de
  // dirtyFields; só a CARGA INICIAL (`resetForce`) sempre reseta.
  function fillForecastLines(lines: MarkingForecastLine[], resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({ lines });
    }
  }

  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!mode || !groupLines) return;
    const lines = mode === 'edit' ? groupLines[0] : [defaultForecastLine()];
    fillForecastLines(lines, !hasHydratedRef.current);
    hasHydratedRef.current = true;
  }, [mode, groupLines]);

  const hasError = detectQuery.isError || mode === 'mixed';

  useEffect(() => {
    if (!hasError) return;
    toaster.error({
      title: text.singularLabel,
      description: text.list.error.message,
      duration: 7000,
    });
    navigate(MARKING_LIST_ROUTE, { replace: true });
  }, [hasError]);

  const isLoading = ids.length > 0 && (detectQuery.isPending || !mode);

  const saveMutation = useRequest<MarkingForecastSaveResult[]>({
    asyncFunction: (data: ForecastLinesFormValues) => {
      const payload: BulkForecastRequest = {
        ids,
        lines: data.lines.map((line, index) => ({
          order: index + 1,
          percentage: line.percentage,
          average_weight: line.average_weight,
          average_price: line.average_price,
          days: line.days,
        })),
      };
      return mode === 'edit'
        ? updateMarkingForecastBulk(payload)
        : createMarkingForecastBulk(payload);
    },
    entityName: text.forecast.title,
    queryKey: queryKey.marcacao.markings,
    typesRequest: mode === 'edit' ? 'update' : 'create',
    personalizedMessage: text.forecast.successToast,
    actionSuccess: () => navigate(MARKING_LIST_ROUTE),
  });

  const isSaving = saveMutation.isPending;
  const isDisabled = !canSave || isSaving || !!isLoading;

  function onSubmit(data: ForecastLinesFormValues) {
    saveMutation.mutateAsync(data);
  }

  return (
    <FormContainer
      title={text.forecast.title}
      subtitle={text.forecast.bulkSubtitleTemplate.replace('{count}', String(ids.length))}
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
              form="forecast-lote-marking-form"
              loading={isSaving}
              disabled={isDisabled}
            />
          )}
        </>
      }
    >
      <Skeleton loading={!!isLoading}>
        <Form id="forecast-lote-marking-form" onSubmit={handleSubmit(onSubmit)} noPadding>
          <ForecastLinesFields control={control} errors={errors} disabled={isDisabled} />
        </Form>
      </Skeleton>
    </FormContainer>
  );
}
