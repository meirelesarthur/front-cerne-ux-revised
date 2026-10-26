// src/pages/BaseRegistrations/BatchAreas/CreateBatchArea.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO de Lote/Área (BatchArea) — Cadastros Base / Pecuários
// (TASK-FE-2102, execução 029). Rota: /cadastros-base/lote-area/novo (já
// registrada em `router/index.tsx`, TASK-FE-2104, ANTES de `/:uuid`). SEM
// edição — a API não tem `PUT`/`PATCH` (D1, `contrato-lote-area.md`); por
// isso este arquivo NÃO usa o prefixo `CreateOrUpdate*` da convenção geral
// (mesma razão D-FE-5/D-FE-2 do contrato de tela — mirror
// `CreateBatchGrazing.tsx`, irmã estrutural).
//
// Campos (`contrato-fe-lote-area.md §3`):
//   - Código — readonly, "—" até salvar (server-gerado, nunca no payload).
//   - Data — obrigatório.
//   - Responsável — readonly, usuário autenticado (`useAuth().user`), NUNCA
//     no payload (o backend resolve `user_id` do autenticado, §9 do contrato
//     de API).
//   - Área — Select single clearable, via `useEligibleAreasChecklist`
//     (`GET /batch-areas/eligible-areas`, correção pós-reprovação de
//     fidelidade — esteira 061-reprovacoes,
//     `roteiro-lote-area-fidelidade.md §4.1/§4.2`) — SÓ áreas SEM módulo e
//     SEM lote vinculado (mirror `AreaBatchController::create()` do
//     legado), 1 fetch único da Collection inteira (SEM paginação, mirror
//     `eligible-batches`). SUBSTITUI o antigo loop de páginas sobre
//     `GET /areas` (todas as áreas ativas, inclusive já vinculadas).
//   - Lote — `CheckboxListField` multi (componente canônico do projeto,
//     mesmo precedente de "Operações" em `CreateOrUpdateAtividade.tsx`), via
//     `useEligibleBatchesChecklist` (`GET /batch-areas/eligible-batches`) —
//     SÓ os lotes elegíveis (ACTIVE, sem Módulo nem Área vinculado), SEM a
//     entrada sintética "Sem lote". Grid de 3 colunas
//     (`columnsForm.threeColumns`, mirror do picker legado, imgs 18/19) via
//     a prop `columns` de `CheckboxListField` (encapsulado só nesta tela).
//   - Hectares / UA-Suporte / Quant Animais / Quant UA / Taxa Lotação —
//     readonly, preview AO VIVO client-side (ver nota abaixo). UA/Suporte
//     exibida LITERAL (cabeças/hectare, decisão do dono D9 do contrato de
//     API) — NUNCA "corrigida" para UA verdadeira.
//
// CORREÇÃO PÓS-E2E (Achados 3+4, `contrato-adendo-lotes-elegiveis-metricas.md`,
// TASK-FE-2105) — SUBSTITUI a limitação registrada na rodada anterior
// (`GET /batches/options` só expunha `{uuid,label}`, sem peso/quantidade):
//   - Hectares — preview real, vem da Área selecionada
//     (`AreaListItem.total_area`, formula canônica do contrato de API §7:
//     "hectares = area.total_area, sem divergência") — não depende dos
//     lotes escolhidos.
//   - Quant/Animais = Σ `quantity_animal`; Quant/UA = Σ `weight` / 450;
//     Taxa de Lotação/UA = Quant/UA ÷ Hectares; UA/Suporte = Σ
//     `quantity_animal` ÷ Hectares (cabeças/ha literal, D9) — somados AO
//     VIVO (`useMemo`) a cada (des)marcação, a partir de
//     `EligibleBatchArea.quantity_animal`/`.weight`. Fallback "—"/
//     `hints.metricsPending` só quando falta dado (nenhum lote selecionado;
//     Taxa de Lotação/UA-Suporte também exigem Hectares carregado).
//
// Validação: RHF nativo (`register`/`Controller` com `rules`), SEM schema
// Yup dedicado — mesma decisão de `CreateBatchGrazing.tsx` (a Tarefa não
// lista um arquivo de schema entre os "Arquivos Afetados", só este arquivo +
// `useBatchAreas.tsx`); `batches` bloqueia o submit sem pelo menos 1 lote
// selecionado (client-side, além do 422 `min:1` do servidor, §5.1 do
// contrato de API).
//
// 422 dedicado: exclusividade de localização — tanto do lado Lote quanto do
// lado Área (contrato de API §1.2 itens 2/3, regra simétrica nos 2 lados,
// diferente de `BatchGrazing` que só documenta o lado Lote). Ambos aparecem
// no campo correspondente via `setError`, mirror `CreateOrUpdateGrazing.tsx`
// (`errors.areas`)/`CreateBatchGrazing.tsx` (`errors.batches`). Fallback
// genérico via `extractApiErrorMessage`.
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
import { Field, Form, InputReadOnly, Select } from '@/components/Form';
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
import { todayLocalIso } from '@/utils/localDate';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { createBatchArea } from '@/services/v2/BaseRegistrations/batch-areas-service';

import type { Option } from '@/@types/option';
import type { BatchAreaPayload, EligibleArea } from '@/@types/v2/BaseRegistrations/batch-areas';

import { useEligibleAreasChecklist, useEligibleBatchesChecklist } from './useBatchAreas';

// AU legado — 1 Unidade Animal = 450kg de peso vivo (mirror literal de
// `agro365/app/Batch.php::getUaAttribute()`, D3 do adendo de API — front
// deriva, backend nunca persiste este divisor). Mirror
// `CreateBatchGrazing.tsx`.
const KG_PER_ANIMAL_UNIT = 450;

interface CreateBatchAreaFormValues {
  date: string;
  area_uuid: string;
  batches: string[];
}

export default function CreateBatchArea() {
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const text = languageGB.baseRegistrations.batchArea;
  const canSave = can('batch_area_create');

  const {
    control,
    handleSubmit,
    setError,
    formState: { dirtyFields },
  } = useForm<CreateBatchAreaFormValues>({
    mode: 'onChange',
    defaultValues: {
      // Default "Data" = hoje (TASK-FRONT-2, esteira 063-est03-9-
      // reprovacoes, roteiro `lote-area-f143-roteiro.md §3`) — o legado
      // pré-preenche com `today()->format('Y-m-d')`; expressão inline já é o
      // padrão dominante do repositório para este cenário (mirror
      // `CreateFarmTransfer.tsx`/`CreateOrUpdateAbsence.tsx`/
      // `CreateBaixaEstoque.tsx`), não introduz util novo.
      date: todayLocalIso(),
      area_uuid: '',
      batches: [],
    },
  });

  // ---- Área (Select single) + preview de Hectares --------------------------
  // Áreas ELEGÍVEIS (`useEligibleAreasChecklist`, correção pós-reprovação de
  // fidelidade) — 1 fetch único da Collection inteira (SEM paginação, mirror
  // `eligible-batches`), já filtrada server-side (só áreas SEM módulo e SEM
  // lote vinculado — mirror do legado). `EligibleArea.total_area` preserva o
  // preview de Hectares.
  const areasQuery = useEligibleAreasChecklist();
  const areas = areasQuery.data ?? [];
  const areaOptions: Option<string>[] = areas.map((area: EligibleArea) => ({
    label: area.label,
    value: area.uuid,
  }));

  const selectedAreaUuid = useWatch({ control, name: 'area_uuid' });
  const selectedArea = areas.find((area) => area.uuid === selectedAreaUuid);
  const hectaresPreview = selectedArea?.total_area;

  // ---- Lote (CheckboxListField multi) ---------------------------------------
  // Lotes ELEGÍVEIS (`useEligibleBatchesChecklist`, correção pós-E2E Achados
  // 3+4, TASK-FE-2105) — Collection INTEIRA em 1 fetch (SEM paginação, SEM
  // `search` no servidor, D6 do adendo). Busca é filtro CLIENT-SIDE sobre a
  // lista já carregada (`batchesSearch` abaixo) — sem cache local de
  // rótulos (não é mais necessário, mirror `CreateBatchGrazing.tsx`).
  const [batchesSearch, setBatchesSearch] = useState('');
  const eligibleBatchesQuery = useEligibleBatchesChecklist();
  const eligibleBatches = eligibleBatchesQuery.data ?? [];

  const selectedBatchUuids = useWatch({ control, name: 'batches' });

  // Preview AO VIVO das métricas (Achado 3) — soma, a cada (des)marcação,
  // `quantity_animal`/`weight` dos lotes SELECIONADOS a partir do payload
  // de `eligible-batches`. `uaSupport` (cabeças/ha literal, D9) é
  // EXCLUSIVO desta feature (não existe em `CreateBatchGrazing.tsx`).
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
  // UA/Suporte — LITERAL (cabeças/hectare, D9 do contrato de API), NÃO
  // `ua_quantity` ÷ Hectares (isso seria Taxa de Lotação, métrica diferente).
  const uaSupportPreview =
    selectedBatchesMetrics.hasSelection && hasHectares
      ? selectedBatchesMetrics.animalsQuantity / (hectaresPreview as number)
      : null;

  async function tryPersistBatchArea(data: CreateBatchAreaFormValues) {
    // Payload MÍNIMO (§5 do contrato de API) — `farm_id`/`code`/`user_id`
    // NUNCA aqui, resolvidos pelo backend.
    const payload: BatchAreaPayload = {
      area_uuid: data.area_uuid,
      date: data.date,
      batches: data.batches,
    };

    return await createBatchArea(payload);
  }

  const batchAreaMutation = useMutation({
    mutationFn: tryPersistBatchArea,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchAreas.batchAreasList] });

      toaster.success({
        title: text.singularLabel,
        description: `${text.singularLabel} ${languageGB.defaltStrings.createRegister}`,
        duration: 7000,
      });

      // Sucesso → direto para a visualização (não há "editar" para onde
      // voltar, contrato de tela §3).
      navigate(`/cadastros-base/lote-area/${response.data.uuid}`);
    },
    onError: (error) => {
      console.error('BatchArea create - error:', error);

      // 422 dedicado — exclusividade de localização, dos 2 lados (§1.2
      // itens 2/3 do contrato de API): lote já vinculado a outro módulo/área
      // (`errors.batches`) OU área já vinculada a outro módulo/lote
      // (`errors.area_uuid`). Ambos aparecem no campo correspondente, nunca
      // em toast genérico (DoD desta Tarefa).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldMessage = extractApiFieldErrorMessage(error);
        const resData = error.response.data as { errors?: Record<string, string[]> };
        // Chave por PREFIXO, não igualdade exata — correção pós-reprovação
        // de fidelidade (esteira 061-reprovacoes,
        // `roteiro-lote-area-fidelidade.md §4.3`): a regra `batches.*` do
        // `BatchAreaRequest` pode reprovar 1 uuid específico do array
        // (`errors['batches.0']`), chave que a checagem antiga (`===
        // 'batches'`) nunca reconhecia — o erro aparecia só em toast
        // genérico, sem marcar o campo "Lote".
        const errorKeys = Object.keys(resData?.errors ?? {});
        const hasBatchesError = errorKeys.some(
          (key) => key === 'batches' || key.startsWith('batches.')
        );
        const hasAreaError = !!resData?.errors?.area_uuid;

        if (fieldMessage && hasBatchesError) {
          setError('batches', { type: 'server', message: fieldMessage });
          return;
        }
        if (fieldMessage && hasAreaError) {
          setError('area_uuid', { type: 'server', message: fieldMessage });
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

  const isSubmitting = batchAreaMutation.isPending;

  async function onSubmit(data: CreateBatchAreaFormValues) {
    await batchAreaMutation.mutateAsync(data);
  }

  // UA/Suporte — LITERAL (cabeças/hectare, decisão do dono D9, GATE
  // aprovado). Preview AO VIVO agora possível (`uaSupportPreview` acima) —
  // o tooltip de nota de unidade (`hints.uaSupportTooltip`, D-FE-4) continua
  // exibido independentemente de haver ou não preview (rastreabilidade da
  // decisão do dono).
  const metricsPendingHelper = text.form.hints.metricsPending;

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
              form="batch-area-form"
              languageGB={languageGB}
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          )}
        </>
      }
    >
      <Form id="batch-area-form" noPadding onSubmit={handleSubmit(onSubmit)}>
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
            name="area_uuid"
            control={control}
            rules={{ required: text.form.validation.areaRequired }}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={text.form.fields.area}
                name={name}
                placeholder={text.form.placeholders.area}
                value={areaOptions.find((option) => option.value === value) ?? null}
                onChange={(opt: Option<string> | null) => onChange(opt?.value ?? '')}
                options={areaOptions}
                error={error?.message}
                isRequired
                isDisabled={!canSave}
                loading={areasQuery.isLoading}
              />
            )}
          />
        </SimpleGrid>

        {/* Lote — `CheckboxListField` multi, NÃO `SelectAsyncPaginate isMulti`
            (componente canônico do projeto). Grid de 3 colunas (Achado 4,
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
            cabeçalho do arquivo). Hectares TEM valor real (vem da Área
            selecionada); os outros 4 acompanham a seleção de lotes.
            UA/Suporte exibida LITERAL (cabeças/hectare, D9 do contrato de
            API) — o tooltip (D-FE-4) é o ÚNICO wrapper com nota de unidade,
            por isso usa `Field` direto (com `tooltip`) em vez de
            `InputReadOnly` (que não repassa essa prop). */}
        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mt={6}>
          <InputReadOnly
            label={text.form.fields.hectares}
            value={
              hectaresPreview === null || hectaresPreview === undefined
                ? '—'
                : `${hectaresPreview} ha`
            }
            helperText={
              hectaresPreview === null || hectaresPreview === undefined
                ? metricsPendingHelper
                : undefined
            }
          />
          <Field label={text.form.fields.uaSupport} tooltip={text.form.hints.uaSupportTooltip}>
            <InputReadOnly
              value={uaSupportPreview === null ? '—' : uaSupportPreview.toFixed(2)}
              helperText={uaSupportPreview === null ? metricsPendingHelper : undefined}
            />
          </Field>
          <InputReadOnly
            label={text.form.fields.animalQuantity}
            value={
              selectedBatchesMetrics.hasSelection
                ? String(selectedBatchesMetrics.animalsQuantity)
                : '—'
            }
            helperText={selectedBatchesMetrics.hasSelection ? undefined : metricsPendingHelper}
          />
          <InputReadOnly
            label={text.form.fields.uaQuantity}
            value={
              selectedBatchesMetrics.hasSelection
                ? selectedBatchesMetrics.uaQuantity.toFixed(2)
                : '—'
            }
            helperText={selectedBatchesMetrics.hasSelection ? undefined : metricsPendingHelper}
          />
          <InputReadOnly
            label={text.form.fields.stockingRate}
            value={stockingRatePreview === null ? '—' : stockingRatePreview.toFixed(2)}
            helperText={stockingRatePreview === null ? metricsPendingHelper : undefined}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
