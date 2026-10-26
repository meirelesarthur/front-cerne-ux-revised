// src/pages/Operacional/Appropriations/FinishAppropriation.tsx
// -----------------------------------------------------------------------------
// Tela dedicada "Apontamento - Finalizar" — TASK-FE-737 (execução 034/035,
// REFAÇÃO COMPLETA, `GAP-BE-655` `[AVALIADO]`). **Substitui integralmente**
// a versão anterior (`TASK-FE-715`/`716`, que montava sua PRÓPRIA exibição
// read-only mirror `AppropriationDetalhe.tsx`) — o dono corrigiu o
// entendimento: a Finalização é o Apontamento INTEIRO reaberto, com máscara
// readonly/editável POR CAMPO, POR ABA — muito mais próxima do `edit` do que
// do modal de confirmação que o fork tinha antes.
//
// Reaproveita LITERALMENTE os mesmos componentes de `CreateOrUpdateAppropriation.
// tsx`: `AppropriationHeaderFields` (TASK-FE-731, `showCode={true}`) + os 5
// componentes de aba (`AppropriationLaborTab`/`AppropriationEquipmentTab`/
// `AppropriationStockTab`/`AppropriationOccurrencesTab`/
// `AppropriationProductionTab`), cada um recebendo `lockIdentityFields=true`
// + `hideRowActions=true` (TASK-FE-732/733/734/735) — EXCETO Ocorrências, que
// não recebe nenhuma prop de máscara (create/update/delete/adicionar livres,
// decisão do dono: incluir botão de remover, já existente em
// `AppropriationOccurrencesTab.tsx` sem código novo).
//
// `useForm<AppropriationForm>` (MESMO tipo do form principal, não mais um
// shape mínimo `{ equipment_items }`) + `finishAppropriationSchemaResolver`
// (TASK-FE-730) — hidratado a partir de `detail` via
// `mapAppropriationDetailToFormValues(data, formText, { mode: 'finish' })`
// (`appropriation-form-mapper.ts`, extraído de `CreateOrUpdateAppropriation.
// tsx`), que CORRIGE o bug do legado onde os 13 campos de qualidade/pesagem
// da Produção não vinham hidratados na tela de Finalização (Doc Bruta 08 §6)
// — mesma função de mapeamento, reaproveitada, sem lógica nova.
//
// TASK-FE-738 (execução 034/035, GAP-BE-655 entregue e validado pelo Tester
// Backend) — DESTRAVADA: o `onSubmit` monta e envia o payload editável
// INTEIRO (cabeçalho + Insumos/Máq/MO/Produção/Ocorrências) numa ÚNICA
// chamada ao `/finish` expandido, substituindo o estado interino anterior
// (que só enviava `equipment_items[]`). Ver `FinishAppropriationPayload`
// (`@types/v2/Appropriations`) e `buildFinishAppropriationFormData`
// (`appropriation-service.ts`). Em NENHUM cenário isto usa uma 2ª chamada
// (`updateAppropriation`) como paliativo — proibido pela "Decisão FECHADA"
// do `GAP-BE-655`.
//
// Guard de status preservado: só permite finalizar quando `status === 'O'`
// (mirror `showFinish` de `CreateOrUpdateAppropriation.tsx`) — `canFinish`
// passa a ser o `canSave` repassado a TODAS as 5 abas + ao header (DoD
// `TASK-FE-737`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Tabs } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { finishAppropriationSchemaResolver } from '@/validations/schemas/Appropriations/appropriation-schema';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';

import type { Option } from '@/@types/option';
import type {
  AppropriationDetail,
  AppropriationForm as AppropriationFormType,
  FinishAppropriationPayload,
} from '@/@types/v2/Appropriations';

import { mapAppropriationDetailToFormValues } from './appropriation-form-mapper';
import { AppropriationHeaderFields } from './AppropriationHeaderFields';
import { APPROPRIATION_STATUS_META, getAppropriationStatusLegend } from './appropriationStatus';
import { AppropriationEquipmentTab } from './tabs/AppropriationEquipmentTab';
import { AppropriationLaborTab } from './tabs/AppropriationLaborTab';
import { AppropriationOccurrencesTab } from './tabs/AppropriationOccurrencesTab';
import { AppropriationProductionTab } from './tabs/AppropriationProductionTab';
import { AppropriationStockTab } from './tabs/AppropriationStockTab';
import { useAppropriationForm, useFinishAppropriation } from './useAppropriations';

const APPROPRIATIONS_LIST_ROUTE = '/operacional/apontamentos';

type FinishTabKey = '0' | '1' | '2' | '3' | '4' | '5';

const TAB_FIELDS: Record<FinishTabKey, (keyof AppropriationFormType)[]> = {
  '0': [
    'date',
    'area_uuid',
    'activity_uuid',
    'operation_uuid',
    'warehouse_production_uuid',
    'cultivation_uuid',
    'harvest_uuid',
    'used_area',
    'description',
  ],
  '1': ['labor_items'],
  '2': ['equipment_items'],
  '3': ['stock_items'],
  '4': ['occurrences'],
  '5': ['production_items'],
};

const FIELD_TAB_MAP: Partial<Record<keyof AppropriationFormType, FinishTabKey>> =
  Object.fromEntries(
    (Object.entries(TAB_FIELDS) as [FinishTabKey, (keyof AppropriationFormType)[]][]).flatMap(
      ([tab, fields]) => fields.map((field) => [field, tab])
    )
  );

const defaultValues: AppropriationFormType = {
  date: null,
  area_uuid: null,
  area_total: null,
  activity_uuid: null,
  operation_uuid: null,
  warehouse_production_uuid: null,
  cultivation_uuid: null,
  harvest_uuid: null,
  employee_uuid: null,
  used_area: null,
  description: null,
  stock_items: [],
  equipment_items: [],
  labor_items: [],
  production_items: [],
  occurrences: [],
};

export default function FinishAppropriation() {
  const { appropriationId } = useParams<{ appropriationId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { activeFarmUuid } = useAuth();

  const text = languageGB.appropriations.appropriation;
  const formText = text.form;
  const screenText = text.finishScreen;
  const canSubmit = can('appropriations_edit');

  const isValidId = isValidGuid(appropriationId);

  useEffect(() => {
    if (appropriationId && !isValidId) {
      navigate(APPROPRIATIONS_LIST_ROUTE, { replace: true });
    }
  }, [appropriationId, isValidId, navigate]);

  const [tabValue, setTabValue] = useState<FinishTabKey>('0');
  const [detail, setDetail] = useState<AppropriationDetail | undefined>(undefined);
  const [existingEmployeeName, setExistingEmployeeName] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppropriationFormType>({
    mode: 'onChange',
    resolver: finishAppropriationSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  function fillForm(data: AppropriationDetail) {
    setDetail(data);
    setExistingEmployeeName(data.employee?.name ?? data.user?.name ?? null);
    // TASK-FE-737 (GAP-BE-655) — MESMA função de mapeamento de
    // `CreateOrUpdateAppropriation.tsx`, `mode: 'finish'` (única diferença:
    // hidratação de `end_hour_meter`/`end_hour_photo` do Máq/Implementos,
    // ver `appropriation-form-mapper.ts`). Corrige de quebra o bug do
    // legado dos 13 campos de qualidade da Produção não hidratados.
    reset(mapAppropriationDetailToFormValues(data, formText, { mode: 'finish' }));
  }

  const appropriationQuery = useAppropriationForm({
    registrationId: isValidId ? appropriationId : undefined,
    fillForm,
  });

  const isLoading = checkLoadingStatus([appropriationQuery as any]);

  // "Área Total" — MESMO lookup best-effort de `CreateOrUpdateAppropriation.
  // tsx` (o Response de detalhe não traz `productive_area`, ver cabeçalho
  // daquele arquivo). Só dispara 1x por Área carregada.
  const watchedArea = watch('area_uuid');
  const areaTotalQuery = useQuery({
    queryKey: ['appropriation-area-total', watchedArea?.value, activeFarmUuid],
    queryFn: async () => {
      if (!watchedArea?.value) return null;
      const response = await listAreas({ farm_uuid: activeFarmUuid ?? '', per_page: 100 });
      const found = response.data.items.find((item) => item.uuid === watchedArea.value);
      return found?.productive_area ?? null;
    },
    enabled: !!watchedArea?.value && watch('area_total') === null,
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (areaTotalQuery.data !== undefined && areaTotalQuery.data !== null) {
      setValue('area_total', areaTotalQuery.data);
    }
  }, [areaTotalQuery.data]);

  // TASK-FE-753 (GAP-BE-600) — "Estoque" (saldo real de Insumos) — mesmo
  // wiring de `CreateOrUpdateAppropriation.tsx`: na Finalização o Select
  // "Produto" vira `InputReadOnly` (`lockIdentityFields=true`), então o
  // caminho INTERATIVO (`mapOptions` do Select embutindo `quantity`) NUNCA
  // roda — é estruturalmente impossível hidratar "Estoque" aqui sem este
  // lookup pós-`reset()`. Mirror EXATO `area_total` (ver `areaTotalQuery`
  // acima): agrupa por `warehouse_uuid` DISTINTO (no máximo 1 chamada por
  // armazém, não por item) e mescla `quantity`/`measurement`/
  // `measurementSecond`/`factor`/`factorType` na option já hidratada,
  // preservando `label`.
  const watchedStockItems = watch('stock_items');
  const distinctStockWarehouseUuids = Array.from(
    new Set(
      (watchedStockItems ?? [])
        .filter(
          (item) =>
            item.product_uuid?.value &&
            item.warehouse_uuid?.value &&
            (item.product_uuid as Option<string> & { quantity?: number }).quantity === undefined
        )
        .map((item) => item.warehouse_uuid!.value)
    )
  );

  const stockAvailabilityQuery = useQuery({
    queryKey: [
      'appropriation-stock-availability',
      distinctStockWarehouseUuids.slice().sort().join(','),
      activeFarmUuid,
    ],
    queryFn: async () => {
      const results = await Promise.all(
        distinctStockWarehouseUuids.map((warehouseUuid) =>
          listStockAvailability({ warehouse_uuid: warehouseUuid, allow_pointing: true })
        )
      );
      return results.flatMap((result) => result.data.items);
    },
    enabled: distinctStockWarehouseUuids.length > 0,
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!stockAvailabilityQuery.data) return;

    (watchedStockItems ?? []).forEach((item, index) => {
      const productOption = item.product_uuid as
        | (Option<string> & {
            quantity?: number;
            measurement?: Option<string> | null;
            measurementSecond?: Option<string> | null;
            factor?: number | null;
            factorType?: 'M' | 'D' | null;
          })
        | null;
      const warehouseUuid = item.warehouse_uuid?.value;
      if (!productOption?.value || !warehouseUuid || productOption.quantity !== undefined) {
        return;
      }

      const match = stockAvailabilityQuery.data!.find(
        (candidate) =>
          candidate.product.uuid === productOption.value &&
          candidate.warehouse_uuid === warehouseUuid
      );
      if (!match) return;

      const mergedProductOption: Option<string> & {
        quantity?: number;
        measurement?: Option<string> | null;
        measurementSecond?: Option<string> | null;
        factor?: number | null;
        factorType?: 'M' | 'D' | null;
      } = {
        ...productOption,
        quantity: match.quantity,
        // TASK-FE-751 (destravada por ERRO-BE-018, achado adicional na
        // varredura sistêmica — mirror EXATO de `AppropriationStockTab.tsx`)
        // — `description` no lugar de `name`; fallback por segurança.
        measurement: match.measurement
          ? {
              label: match.measurement.description || match.measurement.name,
              value: match.measurement.uuid,
            }
          : null,
        measurementSecond: match.measurement_second
          ? {
              label: match.measurement_second.description || match.measurement_second.name,
              value: match.measurement_second.uuid,
            }
          : null,
        factor: match.factor ?? null,
        factorType: match.factor_type ?? null,
      };

      setValue(`stock_items.${index}.product_uuid`, mergedProductOption as Option<string>);
    });
  }, [stockAvailabilityQuery.data]);

  function listAreasForActiveFarm(params: { search?: string; page?: number; per_page?: number }) {
    return listAreas({ ...params, farm_uuid: activeFarmUuid ?? '' });
  }

  const legend = getAppropriationStatusLegend(languageGB);
  const currentStatusLabel = detail
    ? legend.find((item) => item.status === detail.status)?.label
    : undefined;

  // Guard de status — só permite finalizar um Apontamento Aberto (`O`),
  // mirror `showFinish` (`CreateOrUpdateAppropriation.tsx`). `canFinish`
  // passa a ser o `canSave` repassado a TODAS as 5 abas + ao header (DoD
  // TASK-FE-737).
  const canFinish = canSubmit && detail?.status === 'O';

  const finishMutation = useFinishAppropriation({
    actionSuccess: () => {
      navigate(`/operacional/apontamentos/${appropriationId}/detalhe`);
    },
  });

  // TASK-FE-738 (GAP-BE-655, execução 034/035) — monta o payload editável
  // INTEIRO (cabeçalho + Insumos/Máq/MO/Produção/Ocorrências) numa ÚNICA
  // chamada ao `/finish` expandido (backend entregue e validado pelo Tester
  // Backend). Substitui o estado interino de `TASK-FE-737`, que só enviava
  // `equipment_items[]`. Chave de identidade por linha conforme o Roteiro do
  // Gap: `product_uuid` (Insumos/Produção — não há `stock_uuid` exposto,
  // `App\Stock` sem `HasUuids`), `employee_uuid`/`function_uuid`/
  // `provider_uuid` conforme `type` (MO), `equipment_uuid` (Máq, inalterado).
  // As 4 abas travadas (`lockIdentityFields`) nunca adicionam/removem linha —
  // o array enviado é sempre exatamente o que veio hidratado de `detail`,
  // sem gate de "aba tem item" (o backend só exige cobertura quando a
  // categoria TEM item persistido; categoria vazia = array vazio, aceito).
  // Em NENHUM cenário isto usa uma 2ª chamada (`updateAppropriation`) como
  // paliativo — proibido pela "Decisão FECHADA" do `GAP-BE-655`.
  function onSubmit(formValues: AppropriationFormType) {
    if (!appropriationId || !detail) return;

    const payload: FinishAppropriationPayload = {
      // Cabeçalho — máscara editável de `TASK-FE-731` (sem `code`/
      // `user_name`/`total_area`, sempre readonly). `description` enviado
      // como `?? null` (não `?.trim() || undefined`, diferente de create/
      // update): a Finalização é o formulário INTEIRO reaberto, então limpar
      // o campo precisa de fato limpar (`null` explícito), nunca "preservar
      // o valor antigo por omissão".
      date: formValues.date!,
      description: formValues.description ?? null,
      area_uuid: formValues.area_uuid!.value,
      operation_uuid: formValues.operation_uuid?.value ?? null,
      activity_uuid: formValues.activity_uuid!.value,
      used_area: formValues.used_area ?? null,
      cultivation_uuid: formValues.cultivation_uuid?.value ?? null,
      harvest_uuid: formValues.harvest_uuid?.value ?? null,

      // Insumos — sem add/remove; `product_uuid` é a chave de casamento
      // (`FinishAppropriationStockItemData`, sem `stock_uuid` exposto).
      stock_items: formValues.stock_items
        .filter((item) => item.product_uuid)
        .map((item) => ({
          product_uuid: item.product_uuid!.value,
          quantity: Number(item.quantity ?? 0),
          total_quantity:
            item.total_quantity !== null && item.total_quantity !== undefined
              ? Number(item.total_quantity)
              : undefined,
          measurement_uuid: item.measurement_uuid?.value ?? undefined,
        })),

      // Máq/Implementos — inalterado (`GAP-BE-653`, já em produção).
      equipment_items: formValues.equipment_items.map((row) => ({
        equipment_uuid: row.equipment_uuid!.value,
        end_hour_meter: Number(row.end_hour_meter ?? 0),
        end_hour_photo: row.end_hour_photo?.file ?? undefined,
      })),

      // MO/Serviços — sem add/remove; `type_payment` decide o ramo aplicado
      // no backend (`FinishAppropriationLaborItemData`). `total_amount`
      // NUNCA é campo RHF (é sempre `InputReadOnly` calculado ao vivo na
      // aba) — recomputado aqui no submit, mirror EXATO do racional já usado
      // em `CreateOrUpdateAppropriation.tsx` (`total_quantity × amount`, só
      // no modo Valor). Sem `measurement_uuid` — o DTO/Request de `finish`
      // não declara esse campo para MO (diferente de `store`/`update`).
      labor_items: formValues.labor_items
        .filter((item) => item.type)
        .map((item) => {
          const isValuePayment = item.type_payment?.value === 'V';

          return {
            type: item.type!.value,
            type_payment: item.type_payment?.value ?? 'Q',
            employee_uuid: item.employee_uuid?.value ?? undefined,
            function_uuid: item.function_uuid?.value ?? undefined,
            provider_uuid: item.provider_uuid?.value ?? undefined,
            quantity: Number(item.quantity ?? 0),
            total_quantity: Number(item.total_quantity ?? 0) || undefined,
            amount: isValuePayment ? Number(item.amount ?? 0) || undefined : undefined,
            total_amount: isValuePayment
              ? Number(item.total_quantity ?? 0) * Number(item.amount ?? 0) || undefined
              : undefined,
          };
        }),

      // Produção — sem add/remove; SEM `amount`/`total` (decisão do dono,
      // premissa nº5 GAP-BE-655: o backend sempre recalcula os 2 a partir do
      // `average_cost` convertido — o Front nunca envia nem replica esse
      // cálculo). Os 13 campos de qualidade continuam persistência real.
      production_items: formValues.production_items
        .filter((item) => item.product_uuid)
        .map((item) => ({
          product_uuid: item.product_uuid!.value,
          quantity: Number(item.quantity ?? 0),
          measurement_uuid: item.measurement_uuid?.value ?? undefined,
          note: item.note?.trim() || undefined,
          ph: Number(item.ph ?? 0),
          phm: Number(item.phm ?? 0),
          damaged: Number(item.damaged ?? 0),
          burned: Number(item.burned ?? 0),
          others: Number(item.others ?? 0),
          impurities: Number(item.impurities ?? 0),
          qb_impurities: Number(item.qb_impurities ?? 0),
          moisture: Number(item.moisture ?? 0),
          qb_moisture: Number(item.qb_moisture ?? 0),
          rate: Number(item.rate ?? 0),
          qb_technique: Number(item.qb_technique ?? 0),
          cleaning_drying: Number(item.cleaning_drying ?? 0),
          broken: Number(item.broken ?? 0),
        })),

      // Ocorrências — ÚNICO bloco sem máscara (create/update/delete livres,
      // full-replace no backend via `SyncAppropriationOccurrencesAction`,
      // mesmo DTO/mecanismo do `store`/`update` — não há `uuid` de linha a
      // resolver). Mirror EXATO do filtro/mapeamento de
      // `CreateOrUpdateAppropriation.tsx`.
      occurrences: formValues.occurrences
        .filter((occurrence) => occurrence.diagnosis?.trim())
        .map((occurrence) => ({
          diagnosis: occurrence.diagnosis?.trim() || undefined,
          recommendation: occurrence.recommendation?.trim() || undefined,
          priority: occurrence.priority?.value ?? '0',
          images: occurrence.images
            .map((image) => ({
              latitude: image.latitude ?? 0,
              longitude: image.longitude ?? 0,
              image: image.file ?? image.existingUrl ?? '',
            }))
            .filter((image) => image.image !== ''),
        })),
    };

    finishMutation.mutate({ uuid: appropriationId, payload });
  }

  function onInvalid(formErrors: FieldErrors<AppropriationFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof AppropriationFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is FinishTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    toaster.error({
      title: screenText.title,
      description: formText.errors.invalidFields,
      duration: 6000,
    });
  }

  const responsibleLabel = existingEmployeeName ?? '—';

  if (!isValidId) {
    return null;
  }

  return (
    <FormContainer
      title={screenText.title}
      subtitle={screenText.subtitle}
      showDivider
      headerActions={
        detail && currentStatusLabel ? (
          <Status
            text={currentStatusLabel}
            backgroundColor={APPROPRIATION_STATUS_META[detail.status].badgeColor}
          />
        ) : undefined
      }
      footer={
        <>
          <Button
            title={screenText.cancel}
            variant="secondary"
            type="button"
            onClick={() => navigate(-1)}
            disabled={finishMutation.isPending}
          />
          {canFinish && (
            <Button
              title={screenText.submit}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={finishMutation.isPending}
              disabled={finishMutation.isPending || isLoading}
            />
          )}
        </>
      }
    >
      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) => setTabValue(details.value as FinishTabKey)}
          variant="outline"
        >
          {/* @ts-ignore - Tab List fixa (sticky) no topo do body: as abas ficam
              sempre visíveis; só o conteúdo da aba rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.header}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.labor}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{formText.tabs.equipment}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{formText.tabs.stock}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="4">{formText.tabs.occurrences}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="5">{formText.tabs.production}</Tabs.Trigger>
          </Tabs.List>

          {/* ---- ABA 1: Identificação — TASK-FE-731, `showCode={true}` ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <AppropriationHeaderFields
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              register={register}
              canSave={canFinish}
              isLoading={!!isLoading}
              isEditing
              responsibleLabel={responsibleLabel}
              listAreasForActiveFarm={listAreasForActiveFarm}
              showCode
              code={detail?.code}
            />
          </Tabs.Content>

          {/* ---- ABA 2: MO/Serviços — TASK-FE-732 (máscara) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <AppropriationLaborTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canFinish}
              itemsError={null}
              lockIdentityFields
              hideRowActions
            />
          </Tabs.Content>

          {/* ---- ABA 3: Máq/Implementos — TASK-FE-733 (máscara + Horímetro
              Final/Foto Final migrados de dentro desta tela) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <AppropriationEquipmentTab
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canFinish}
              itemsError={null}
              lockIdentityFields
              hideRowActions
            />
          </Tabs.Content>

          {/* ---- ABA 4: Insumos — TASK-FE-734 (máscara + Qtd Total
              editável) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="3">
            <AppropriationStockTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canFinish}
              itemsError={null}
              lockIdentityFields
              hideRowActions
            />
          </Tabs.Content>

          {/* ---- ABA 5: Ocorrências — SEM máscara (create/update/delete
              livres, decisão do dono: botão de remover incluído, já existe
              em `AppropriationOccurrencesTab.tsx` sem código novo) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="4">
            <AppropriationOccurrencesTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canFinish}
              itemsError={null}
            />
          </Tabs.Content>

          {/* ---- ABA 6: Produção — TASK-FE-735 (máscara cabeçalho+linha; 13
              campos de qualidade hidratados via `appropriation-form-mapper.
              ts`) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="5">
            <AppropriationProductionTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canFinish}
              itemsError={null}
              lockIdentityFields
              hideRowActions
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
