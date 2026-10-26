// src/pages/BaseRegistrations/BatchGrazings/CreateBatchGrazing.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO de Lote/Módulo (BatchGrazing) — Cadastros Base /
// Pecuários (TASK-FE-2002, execução 029). Rota: /cadastros-base/lote-modulo/novo
// (registrada em TASK-FE-2004, ANTES de `/:uuid`). SEM edição — a API não
// tem `PUT`/`PATCH` (D1, `contrato-lote-modulo.md`); por isso este arquivo
// NÃO usa o prefixo `CreateOrUpdate*` da convenção geral (decisão D-FE-2 do
// contrato de tela).
//
// Campos (`contrato-fe-lote-modulo.md §3`):
//   - Código — readonly, "—" até salvar (server-gerado, nunca no payload).
//   - Data — obrigatório.
//   - Responsável — readonly, usuário autenticado (`useAuth().user`), NUNCA
//     no payload (o backend resolve `user_id` do autenticado, §9 do contrato
//     de API).
//   - Módulo — Select single, via `useEligibleGrazingsChecklist`
//     (`GET /batch-grazings/eligible-grazings`, correção pós-reprovação de
//     fidelidade — esteira 061-reprovacoes,
//     `roteiro-lote-modulo-fidelidade.md §4.1`) — SÓ módulos SEM lote
//     vinculado (mirror `BatchGrazingController::create()` do legado), 1
//     fetch único da Collection inteira. SUBSTITUI o antigo fetch cru de
//     `listGrazings` (todos os módulos ativos, inclusive já vinculados).
//   - Lote — `CheckboxListField` multi (NÃO `SelectAsyncPaginate isMulti` —
//     componente canônico do projeto, mesmo precedente de "Operações" em
//     `CreateOrUpdateAtividade.tsx`), via `useEligibleBatchesChecklist`
//     (`GET /batch-grazings/eligible-batches`) — SÓ os lotes elegíveis
//     (ACTIVE, sem Módulo nem Área vinculado), SEM a entrada sintética "Sem
//     lote". Grid de 3 colunas (`columnsForm.threeColumns`, mirror do picker
//     legado, imgs 18/19) — encapsulado só nesta tela via a prop `columns`
//     de `CheckboxListField` (default preservado para os demais consumidores
//     do componente).
//   - Hectares / Quant Animais / Quant UA / Taxa Lotação — readonly, preview
//     AO VIVO client-side (ver nota abaixo). NUNCA "UA/Suporte" em lugar
//     nenhum (decisão G8).
//
// CORREÇÃO PÓS-E2E (Achados 3+4, `contrato-adendo-lotes-elegiveis-metricas.md`,
// TASK-FE-2005) — SUBSTITUI a limitação registrada na rodada anterior
// (`GET /batches/options` só expunha `{uuid,label}`, sem peso/quantidade):
//   - Hectares — preview real, vem do módulo selecionado
//     (`EligibleGrazing.areas_sum_total_area`, exposto por
//     `GET /batch-grazings/eligible-grazings` desde a correção pós-
//     reprovação de fidelidade, esteira 061-reprovacoes) — não depende dos
//     lotes escolhidos.
//   - Quant/Animais = Σ `quantity_animal` dos lotes selecionados; Quant/UA =
//     Σ `weight` / 450; Taxa de Lotação/UA = Quant/UA ÷ Hectares — somados AO
//     VIVO (`useMemo` sobre `selectedBatchUuids` × `eligibleBatchesQuery.data`)
//     a cada (des)marcação, a partir de `EligibleBatchGrazing.quantity_animal`/
//     `.weight` (`GET /batch-grazings/eligible-batches`). Fallback "—"/
//     `hints.metricsPending` só quando falta dado (nenhum lote selecionado;
//     Taxa de Lotação também exige Hectares carregado).
//
// Validação: RHF nativo (`register`/`Controller` com `rules`), SEM schema
// Yup dedicado — a Tarefa não lista um arquivo de schema entre os "Arquivos
// Afetados" (só este arquivo + `useBatchGrazings.tsx`); `batches` bloqueia o
// submit sem pelo menos 1 lote selecionado (client-side, além do 422
// `min:1` do servidor, §5.1 do contrato de API).
//
// 422 dedicado: exclusividade de localização (lote já vinculado a outro
// módulo/área) e `batches: []` — ambos aparecem no campo "Lote" via
// `setError('batches', ...)`, mirror `CreateOrUpdateGrazing.tsx` (`errors.areas`).
// Fallback genérico via `extractApiErrorMessage` (mesmo util que `useRequest`
// usa por baixo).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, SimpleGrid } from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form, InputReadOnly, Select } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import {
  extractApiErrorMessage,
  extractApiFieldErrorMessage,
} from '@/utils/extractApiErrorMessage';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createBatchGrazing } from '@/services/v2/BaseRegistrations/batch-grazings-service';

import type { Option } from '@/@types/option';
import type {
  BatchGrazingPayload,
  EligibleGrazing,
} from '@/@types/v2/BaseRegistrations/batch-grazings';

import { useEligibleBatchesChecklist, useEligibleGrazingsChecklist } from './useBatchGrazings';

// AU legado — 1 Unidade Animal = 450kg de peso vivo (mirror literal de
// `agro365/app/Batch.php::getUaAttribute()`, D3 do adendo de API — front
// deriva, backend nunca persiste este divisor).
const KG_PER_ANIMAL_UNIT = 450;

interface CreateBatchGrazingFormValues {
  date: string;
  grazing_uuid: string;
  batches: string[];
}

export default function CreateBatchGrazing() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const text = languageGB.baseRegistrations.batchGrazing;
  const canSave = can('batch_grazing_create');

  const {
    control,
    handleSubmit,
    setError,
    formState: { dirtyFields },
  } = useForm<CreateBatchGrazingFormValues>({
    mode: 'onChange',
    defaultValues: {
      date: '',
      grazing_uuid: '',
      batches: [],
    },
  });

  // ---- Módulo (Select single) + preview de Hectares ------------------------
  // Módulos ELEGÍVEIS (`useEligibleGrazingsChecklist`, correção pós-
  // reprovação de fidelidade) — 1 fetch único da Collection inteira (SEM
  // paginação, mirror `eligible-batches`), já filtrada server-side (só
  // módulos SEM lote vinculado — mirror do legado).
  // `EligibleGrazing.areas_sum_total_area` preserva o preview de Hectares.
  const grazingModulesQuery = useEligibleGrazingsChecklist();
  const grazingModules = grazingModulesQuery.data ?? [];
  const grazingOptions: Option<string>[] = grazingModules.map((grazing: EligibleGrazing) => ({
    label: grazing.label,
    value: grazing.uuid,
  }));

  const selectedGrazingUuid = useWatch({ control, name: 'grazing_uuid' });
  const selectedGrazing = grazingModules.find((grazing) => grazing.uuid === selectedGrazingUuid);
  const hectaresPreview = selectedGrazing?.areas_sum_total_area;

  // ---- Lote (CheckboxListField multi) ---------------------------------------
  // Lotes ELEGÍVEIS (`useEligibleBatchesChecklist`, correção pós-E2E Achados
  // 3+4, TASK-FE-2005) — Collection INTEIRA em 1 fetch (SEM paginação, SEM
  // `search` no servidor, D6 do adendo). Busca é filtro CLIENT-SIDE sobre a
  // lista já carregada (`batchesSearch` abaixo) — sem cache local de rótulos
  // (não é mais necessário: a lista nunca perde os itens já selecionados
  // fora de uma "página" de busca, porque não há paginação/refetch).
  const [batchesSearch, setBatchesSearch] = useState('');
  const eligibleBatchesQuery = useEligibleBatchesChecklist();
  const eligibleBatches = eligibleBatchesQuery.data ?? [];

  const selectedBatchUuids = useWatch({ control, name: 'batches' });

  // Preview AO VIVO das métricas (Achado 3) — soma, a cada (des)marcação,
  // `quantity_animal`/`weight` dos lotes SELECIONADOS (não dos visíveis pela
  // busca) a partir do payload de `eligible-batches`.
  const selectedBatchesMetrics = useMemo(() => {
    const selected = eligibleBatches.filter((batch) => selectedBatchUuids.includes(batch.uuid));
    const animalsQuantity = selected.reduce((sum, batch) => sum + batch.quantity_animal, 0);
    const totalWeight = selected.reduce((sum, batch) => sum + batch.weight, 0);
    const uaQuantity = totalWeight / KG_PER_ANIMAL_UNIT;

    return { hasSelection: selected.length > 0, animalsQuantity, uaQuantity };
  }, [eligibleBatches, selectedBatchUuids]);

  const hasHectares =
    hectaresPreview !== null && hectaresPreview !== undefined && hectaresPreview > 0;
  const stockingRatePreview =
    selectedBatchesMetrics.hasSelection && hasHectares
      ? selectedBatchesMetrics.uaQuantity / (hectaresPreview as number)
      : null;

  async function tryPersistBatchGrazing(data: CreateBatchGrazingFormValues) {
    // Payload MÍNIMO (§5 do contrato de API) — `farm_id`/`code`/`user_id`
    // NUNCA aqui, resolvidos pelo backend.
    const payload: BatchGrazingPayload = {
      grazing_uuid: data.grazing_uuid,
      date: data.date,
      batches: data.batches,
    };

    return await createBatchGrazing(payload);
  }

  const batchGrazingMutation = useMutation({
    mutationFn: tryPersistBatchGrazing,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchGrazings.batchGrazingsList] });

      toaster.success({
        title: text.singularLabel,
        description: `${text.singularLabel} ${languageGB.defaltStrings.createRegister}`,
        duration: 7000,
      });

      // Sucesso → direto para a visualização (não há "editar" para onde
      // voltar, contrato de tela §3).
      navigate(`/cadastros-base/lote-modulo/${response.data.uuid}`);
    },
    onError: (error) => {
      console.error('BatchGrazing create - error:', error);

      // 422 dedicado — exclusividade de localização OU `batches: []` (§5.1
      // do contrato de API). Ambos aparecem no campo "Lote", nunca em toast
      // genérico (DoD desta Tarefa).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldMessage = extractApiFieldErrorMessage(error);
        const resData = error.response.data as { errors?: Record<string, string[]> };
        // Chave por PREFIXO, não igualdade exata — mesmo achado/correção da
        // feature irmã (esteira 061-reprovacoes,
        // `roteiro-lote-area-fidelidade.md §4.3`, item 11 "bônus"): a regra
        // `batches.*` do Request pode reprovar 1 uuid específico do array
        // (`errors['batches.0']`), chave que a checagem antiga (`===
        // 'batches'`) nunca reconhecia.
        const errorKeys = Object.keys(resData?.errors ?? {});
        const hasBatchesError = errorKeys.some(
          (key) => key === 'batches' || key.startsWith('batches.')
        );

        if (fieldMessage && hasBatchesError) {
          setError('batches', { type: 'server', message: fieldMessage });
          return;
        }
      }

      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isSubmitting = batchGrazingMutation.isPending;

  async function onSubmit(data: CreateBatchGrazingFormValues) {
    await batchGrazingMutation.mutateAsync(data);
  }

  return (
    <FormContainer
      title={text.form.title.create}
      subtitle={text.form.subtitle.create}
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
              create
              dirtyFields={dirtyFields}
              type="submit"
              form="batch-grazing-form"
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form id="batch-grazing-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        <Box mb={6}>
          <InputReadOnly
            label={text.form.fields.code}
            value="—"
            helperText={text.form.hints.codeGenerated}
          />
        </Box>

        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="date"
            control={control}
            rules={{ required: text.form.validation.dateRequired }}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(v) => field.onChange(v ?? '')}
                label={text.form.fields.date}
                error={error?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          <InputReadOnly label={text.form.fields.employee} value={user?.username || '—'} />

          <Controller
            name="grazing_uuid"
            control={control}
            rules={{ required: text.form.validation.grazingRequired }}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.grazing}
                name={name}
                placeholder={text.form.placeholders.grazing}
                value={grazingOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={grazingOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={grazingModulesQuery.isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Lote — `CheckboxListField` multi, NÃO `SelectAsyncPaginate isMulti`
            (componente canônico do projeto, mesmo precedente de "Operações"
            em `CreateOrUpdateAtividade.tsx`). Grid de 3 colunas (Achado 4,
            mirror do picker legado, imgs 18/19) via a prop `columns`. Célula
            própria de largura total (fora do `SimpleGrid` de colunas curtas). */}
        <Box mt={6}>
          <Controller
            name="batches"
            control={control}
            rules={{ validate: (value) => value.length > 0 || text.form.validation.batchesMin }}
            render={({ field: { value, onChange }, fieldState: { error } }) => {
              // Filtro CLIENT-SIDE (D6 do adendo) sobre a Collection inteira
              // já carregada — SEM chamada nova por tecla digitada.
              const searchTerm = batchesSearch.trim().toLowerCase();
              const filteredBatches = searchTerm
                ? eligibleBatches.filter((batch) => batch.label.toLowerCase().includes(searchTerm))
                : eligibleBatches;
              const checklistItems: CheckboxListItem<string>[] = filteredBatches.map((batch) => ({
                value: batch.uuid,
                label: batch.label,
              }));

              return (
                <>
                  <CheckboxListField<string>
                    label={text.form.fields.batches}
                    items={checklistItems}
                    selectedValues={value}
                    onChange={onChange}
                    searchValue={batchesSearch}
                    onSearchChange={setBatchesSearch}
                    searchPlaceholder={text.form.placeholders.batches}
                    selectedCountLabel={text.form.fields.batches}
                    isLoading={eligibleBatchesQuery.isLoading}
                    isError={eligibleBatchesQuery.isError}
                    onRetry={() => eligibleBatchesQuery.refetch()}
                    isDisabled={!canSave}
                    columns={columnsForm.threeColumns}
                  />
                  {error?.message && (
                    <Box mt={1} color="feedBack.errorMain" fontSize="sm">
                      {error.message}
                    </Box>
                  )}
                </>
              );
            }}
          />
        </Box>

        {/* Métricas readonly — preview AO VIVO (Achado 3, ver nota de
            cabeçalho do arquivo). NUNCA "UA/Suporte" (decisão G8). */}
        <SimpleGrid columns={2} gap={6} mt={6}>
          <InputReadOnly
            label={text.form.fields.hectares}
            value={
              hectaresPreview === null || hectaresPreview === undefined
                ? '—'
                : `${hectaresPreview} ha`
            }
            helperText={
              hectaresPreview === null || hectaresPreview === undefined
                ? text.form.hints.metricsPending
                : undefined
            }
          />
          <InputReadOnly
            label={text.form.fields.animalQuantity}
            value={
              selectedBatchesMetrics.hasSelection
                ? String(selectedBatchesMetrics.animalsQuantity)
                : '—'
            }
            helperText={
              selectedBatchesMetrics.hasSelection ? undefined : text.form.hints.metricsPending
            }
          />
          <InputReadOnly
            label={text.form.fields.uaQuantity}
            value={
              selectedBatchesMetrics.hasSelection
                ? selectedBatchesMetrics.uaQuantity.toFixed(2)
                : '—'
            }
            helperText={
              selectedBatchesMetrics.hasSelection ? undefined : text.form.hints.metricsPending
            }
          />
          <InputReadOnly
            label={text.form.fields.stockingRate}
            value={stockingRatePreview === null ? '—' : stockingRatePreview.toFixed(2)}
            helperText={stockingRatePreview === null ? text.form.hints.metricsPending : undefined}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
