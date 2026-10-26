// src/pages/Operacional/Rastreabilidade/Traceability/CreateOrUpdateTraceability.tsx
// -----------------------------------------------------------------------------
// Formulário ÚNICO de CRIAÇÃO/EDIÇÃO de Produto (Traceability — Rastreabilidade,
// F-067, TASK-TR-FE-06). 40 campos REAIS (`field_manifest` FD-02..FD-43, EXCETO
// `farm_id`(FD-01, servidor), `stored_areas`(FD-39)/`coordinates`(FD-43, scratch
// de mapa não recriado — `## 9.1` do contrato de tela) em 5 `FormSection`
// fiéis à ORDEM/SEÇÃO do legado (`_forms.blade.php`): Identificação → Sobre o
// produto → Informação nutricional → Exportador → Área e disponibilidade (+
// widget de mapa READ-ONLY, `TraceabilityMap.tsx`, `TASK-TR-FE-10`).
//
// Rotas (nascem em `TASK-TR-FE-11`, fora do escopo desta Tarefa):
// `/operacional/rastreabilidade/produtos/create` e `/.../:uuid`.
//
// Mirror ESTRUTURAL `get_pwa_form_query_pattern` (Lei 2 — `fillForm` nomeada +
// guarda de `dirtyFields`, `useCustomFormQueryById`) + `get_pwa_complex_
// screen_compositions_pattern` (`FormContainer` com `footer` opt-in) +
// `get_pwa_ui_components_pattern` (máscaras numéricas, `Option<T>` nos
// selects) — mirror direto de `Operacional/Budget/CreateOrUpdateBudget.tsx`
// (casca `FormContainer`+`ButtonSaveAndNext`+`useCustomFormQueryById`+
// `useUnsavedChangesGuard`) e `Operacional/Carregamento/CreateOrUpdateCharge.
// tsx` (guarda de navegação por GUID malformado, tratamento 422 por campo).
//
// Autofill `product_uuid` (`## 6.4` do contrato, `IG-01`) — CONDICIONADO a
// `dirtyFields.product_uuid` (RHF só marca `dirty` em mudança via `onChange`
// do usuário, NUNCA via `reset()` da hidratação de edição): dispara em
// CRIAÇÃO na 1ª seleção e em EDIÇÃO só quando o usuário TROCA o produto —
// nunca ao simplesmente abrir o form já preenchido (mirror `IG-01`/
// `limpaCampos()`, exigência da ficha). `TraceabilityProductAutofill`
// (TASK-TR-FE-03, rota REAL `GET /traceabilities/product-autofill/{uuid}`)
// expõe os 16 campos nutricionais + descritivos + `availability` — a
// verificação backend (`## 6.4`) já foi fechada na fundação, sem bloqueio de
// Gap aqui.
//
// Round-trip (`## 8` do contrato de tela, checklist OBRIGATÓRIO):
//   - `tracking_code`/`lot_number`: `InputReadOnly`, SEMPRE fora do payload e
//     do schema Yup — placeholder "gerado ao salvar" até o 1º save.
//   - `box_quantity`: hidratado DIRETO de `TraceabilityData.box_quantity`
//     (fecha D08 — bug do `$imte` do legado NÃO existe na API nova).
//   - 8 campos `_perc`: `PercentInput` formata SÓ na exibição
//     (`toLocaleString('pt-BR')` embutido na máscara do componente); o
//     `value`/`onValueChange` sempre trafegam o número decimal cru.
//   - `availability`: `number[]` nativo (`AvailabilityMonthsPicker`), Yup
//     `min(1)` fecha D09.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

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
import { NumberInput } from '@/components/Form/NumberInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';
import { FormSection } from '@/components/FormSection';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { traceabilityFormDefaultValues } from '@/constants/rastreabilidade/traceability/default-values';

import { traceabilitySchemaResolver } from '@/validations/schemas/Rastreabilidade/traceability-schema';

import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { getTraceabilityConfigOptions } from '@/services/v2/Rastreabilidade/traceability-config-service';
import {
  createTraceability,
  getProductAutofill,
  getTraceability,
  updateTraceability,
} from '@/services/v2/Rastreabilidade/traceability-service';
import { listServiceOrderAreaOptions } from '@/services/v2/ServiceOrders/service-order-service';

import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { ProductOption } from '@/@types/v2/Products';
import type {
  CreateTraceabilityRequest,
  TraceabilityData,
  TraceabilityForm as TraceabilityFormValues,
} from '@/@types/v2/Rastreabilidade/traceability';
import type { TraceabilityConfigOption } from '@/@types/v2/Rastreabilidade/traceability-config';
import type { ServiceOrderAreaOption } from '@/@types/v2/ServiceOrders';

import { AvailabilityMonthsPicker } from './AvailabilityMonthsPicker';
import { TraceabilityMap } from './TraceabilityMap';

const TRACEABILITY_PRODUCTS_BASE_ROUTE = '/operacional/rastreabilidade/produtos';

// `Form id` + `form=` no botão externo (ficha da Tarefa) — o botão "Salvar"
// vive no `footer` do `FormContainer`, FORA da árvore DOM do `<form>`
// (`PageCard fullHeight`: header → corpo com scroll → footer, irmãos, não
// aninhados); o atributo HTML nativo `form=` liga o botão ao formulário por
// `id`, disparando o `onSubmit` real (`handleSubmit(onSubmit)`) sem precisar
// de um `onClick` manual duplicado.
const TRACEABILITY_FORM_ID = 'traceability-form';

// Nome EXATO do grupo esperado no cadastro de Grupos de Produto — mesmo
// racional documentado em `FilterSideTraceability.tsx` (`LK-01`: o lookup de
// `product_id` do form/filtro só oferece produtos do grupo "Produção", uuid
// resolvido em runtime, nunca hardcoded, `## 6.7` do contrato de destino).
const PRODUCTION_GROUP_NAME = 'Produção';

// `extends PaginationQueryParams` — sem isso o TS rejeita a atribuição a
// `SelectAsyncPaginateProps.service` como "weak type" (nenhuma propriedade em
// comum entre 2 interfaces só-opcionais), mesmo fix documentado em
// `ListProductGroupOptionsParams` (`product-group-service.ts`).
interface TraceabilityConfigOptionsQueryParams extends PaginationQueryParams {
  search?: string;
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const emptyPaginatedOptions = <T,>(): ResponsePagination<T[]> => ({
  success: true,
  message: '',
  data: {
    items: [],
    pagination: { total: 0, count: 0, per_page: 0, current_page: 1, total_pages: 1 },
  },
});

export default function CreateOrUpdateTraceability() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.rastreabilidade.traceability;
  const formText = text.form;

  // Detecção de modo (convenção do fork) — a rota `/create` não passa `uuid`
  // (ou passa um valor não-GUID, se casada acidentalmente pela rota
  // dinâmica); mirror `isValidGuid` de `CreateOrUpdateCharge.tsx`.
  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('traceab_edit') : can('traceab_create');

  // Guard de navegação — `uuid` presente e malformado não pode chegar ao
  // hook de detalhe (`useCustomFormQueryById` só desabilita a query, não
  // redireciona).
  useEffect(() => {
    if (!uuid) return;
    if (!isValidGuid(uuid)) {
      navigate(TRACEABILITY_PRODUCTS_BASE_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<TraceabilityFormValues>({
    mode: 'onChange',
    resolver: traceabilitySchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: traceabilityFormDefaultValues,
  });

  // ---- Lookup 1 — Produto (`product_uuid`, LK-01) — resolução do grupo
  // "Produção" em 2 passos, mirror EXATO `FilterSideTraceability.tsx` (mesma
  // Tarefa/feature, não duplicar a rota, só a resolução client-side local a
  // cada consumidor). Enquanto o grupo não resolve, o select devolve página
  // VAZIA real (estado honesto de "ainda resolvendo", nunca lista produtos
  // fora do grupo).
  const productionGroupQuery = useQuery({
    queryKey: ['rastreabilidade-traceability-form-production-group'],
    queryFn: () => listProductGroupOptions({ search: PRODUCTION_GROUP_NAME }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const productionGroupUuid = (() => {
    const items = productionGroupQuery.data?.data.items ?? [];
    const exactMatch = items.find(
      (group) => group.label.trim().toLowerCase() === PRODUCTION_GROUP_NAME.toLowerCase()
    );
    return (exactMatch ?? items[0])?.uuid;
  })();

  function listProductionProducts(params: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<ResponsePagination<ProductOption[]>> {
    if (!productionGroupUuid) {
      return Promise.resolve(emptyPaginatedOptions<ProductOption>());
    }
    return listProductOptions({ ...params, group_uuid: [productionGroupUuid] });
  }

  // ---- Lookup 2 — Produtor/Configuração (`traceability_config_uuid`, LK-02)
  // `getTraceabilityConfigOptions` devolve `T[]` FLAT (sem paginação real,
  // `## 1.3` do contrato) — adaptado para `ResponsePagination` só para casar
  // com a assinatura de `SelectAsyncPaginate.service` (mirror
  // `listProductionProducts` acima quanto ao shape de página única).
  async function listTraceabilityConfigOptions(
    params: TraceabilityConfigOptionsQueryParams
  ): Promise<ResponsePagination<TraceabilityConfigOption[]>> {
    const items = await getTraceabilityConfigOptions(params.search);
    return {
      success: true,
      message: '',
      data: {
        items,
        pagination: {
          total: items.length,
          count: items.length,
          per_page: items.length || 1,
          current_page: 1,
          total_pages: 1,
        },
      },
    };
  }

  // ---- Lei 2 — `fillForm` NOMEADA + guarda de `dirtyFields` (só reidrata
  // se o form ainda está PRISTINO ou `resetForce`, `useCustomFormQueryById`
  // sempre chama com `resetForce=true` na carga inicial/refetch).
  function fillTraceabilityForm(data: TraceabilityData, resetForce?: boolean) {
    if (!(!isEmpty(dirtyFields) || resetForce)) return;

    reset({
      product_uuid: { label: data.product.description, value: data.product.uuid },
      traceability_config_uuid: {
        label: data.traceability_config.name,
        value: data.traceability_config.uuid,
      },
      harvested_in: data.harvested_in,
      packing: data.packing,
      gross_weight: data.gross_weight ?? '',
      // Readonly SEMPRE — reidratado com o valor REAL do servidor (round-trip
      // `## 8`, nunca regenerado no client).
      tracking_code: data.tracking_code,
      name_pt: data.name_pt,
      name_en: data.name_en ?? '',
      name_es: data.name_es ?? '',
      description_pt: data.description_pt,
      description_en: data.description_en ?? '',
      description_es: data.description_es ?? '',
      energetic_value: data.energetic_value,
      energetic_value_perc: data.energetic_value_perc,
      carbohydrates: data.carbohydrates,
      carbohydrates_perc: data.carbohydrates_perc,
      proteins: data.proteins,
      proteins_perc: data.proteins_perc,
      fat_total: data.fat_total,
      fat_total_perc: data.fat_total_perc,
      fat_saturated: data.fat_saturated,
      fat_saturated_perc: data.fat_saturated_perc,
      fat_trans: data.fat_trans,
      fat_trans_perc: data.fat_trans_perc,
      dietary_fiber: data.dietary_fiber,
      dietary_fiber_perc: data.dietary_fiber_perc,
      sodium: data.sodium,
      sodium_perc: data.sodium_perc,
      barcode: data.barcode ?? '',
      exporter_name: data.exporter_name ?? '',
      exporter_address: data.exporter_address ?? '',
      exporter_zip_code: data.exporter_zip_code ?? '',
      exporter_city: data.exporter_city ?? '',
      exporter_state: data.exporter_state ?? '',
      exporter_country: data.exporter_country ?? '',
      area_uuid: data.area ? { label: data.area.description, value: data.area.uuid } : null,
      // Readonly SEMPRE, gerado no `store()` — reidratado com o valor real.
      lot_number: data.lot_number,
      // Fecha D08 — hidratado DIRETO do Resource real (o bug `$imte` do
      // legado nunca chegou à API nova). Se aparecer vazio aqui com dado
      // persistido, é REGRESSÃO (checklist `## 8`).
      box_quantity: data.box_quantity,
      availability: data.availability,
      latlng: data.latlng ?? '',
    });
  }

  const traceabilityQuery = useCustomFormQueryById<TraceabilityData>({
    registrationId: uuid ?? '',
    asyncFunction: getTraceability,
    queryKey: queryKey.rastreabilidade.traceability,
    fillForm: fillTraceabilityForm,
  });

  const traceabilityDetail = traceabilityQuery.data as TraceabilityData | undefined;
  const isLoadingTraceability = isEditing && checkLoadingStatus([traceabilityQuery as any]);

  // ---- Autofill `product_uuid` (`IG-01`, `## 6.4`) — CONDICIONADO a
  // `dirtyFields.product_uuid`: só é `true` quando o valor mudou via
  // `onChange` do `Controller` (seleção real do usuário), NUNCA via
  // `reset()` da hidratação acima — fecha a exigência da ficha ("SÓ em modo
  // criação ou quando o campo muda explicitamente... em edição, NÃO
  // sobrescrever os campos nutricionais já persistidos ao simplesmente abrir
  // o form").
  const productUuidValue = watch('product_uuid');
  // ---- Widget de mapa (FD-38 `latlng`, `## 9.1`, `TASK-TR-FE-10`) — display
  // READ-ONLY, só leitura do campo hidden já hidratado por `fillTraceabilityForm`.
  // Sem controle de escrita aqui (sem `Controller`/`register`): o campo nunca é
  // editado pelo usuário, só refletido no mapa. Dirigido pelo Produtor/
  // Configuração selecionado (`traceability_config_uuid`, mirror `mapBuild()`
  // legado) — troca de seleção dispara refetch/redesenho do farm-context no
  // próprio `TraceabilityMap`; `area_uuid` só centra o marcador (display-only)
  // quando ainda não há `latlng` persistido.
  const latlngValue = watch('latlng');
  const traceabilityConfigValue = watch('traceability_config_uuid');
  const areaUuidValue = watch('area_uuid');

  useEffect(() => {
    const productUuid = productUuidValue?.value;
    if (!productUuid || !dirtyFields.product_uuid) return;

    let cancelled = false;

    async function applyProductAutofill() {
      try {
        const { data } = await getProductAutofill(productUuid!);
        if (cancelled) return;

        setValue('name_pt', data.name_pt ?? '', { shouldDirty: true });
        setValue('name_en', data.name_en ?? '', { shouldDirty: true });
        setValue('name_es', data.name_es ?? '', { shouldDirty: true });
        setValue('description_pt', data.description_pt ?? '', { shouldDirty: true });
        setValue('description_en', data.description_en ?? '', { shouldDirty: true });
        setValue('description_es', data.description_es ?? '', { shouldDirty: true });
        setValue('packing', data.packing ?? '', { shouldDirty: true });
        if (data.availability) {
          setValue('availability', data.availability, { shouldDirty: true, shouldValidate: true });
        }
        setValue('energetic_value', data.energetic_value, { shouldDirty: true });
        setValue('energetic_value_perc', data.energetic_value_perc, { shouldDirty: true });
        setValue('carbohydrates', data.carbohydrates, { shouldDirty: true });
        setValue('carbohydrates_perc', data.carbohydrates_perc, { shouldDirty: true });
        setValue('proteins', data.proteins, { shouldDirty: true });
        setValue('proteins_perc', data.proteins_perc, { shouldDirty: true });
        setValue('fat_total', data.fat_total, { shouldDirty: true });
        setValue('fat_total_perc', data.fat_total_perc, { shouldDirty: true });
        setValue('fat_saturated', data.fat_saturated, { shouldDirty: true });
        setValue('fat_saturated_perc', data.fat_saturated_perc, { shouldDirty: true });
        setValue('fat_trans', data.fat_trans, { shouldDirty: true });
        setValue('fat_trans_perc', data.fat_trans_perc, { shouldDirty: true });
        setValue('dietary_fiber', data.dietary_fiber, { shouldDirty: true });
        setValue('dietary_fiber_perc', data.dietary_fiber_perc, { shouldDirty: true });
        setValue('sodium', data.sodium, { shouldDirty: true });
        setValue('sodium_perc', data.sodium_perc, { shouldDirty: true });
      } catch {
        // Fallback fiel ao legado (`IG-01`: "console.log(err) — sem feedback
        // visível ao usuário") — fire-and-forget, mirror
        // `resolveSatelliteLabels`/`resolveItemMeasurements` de
        // `CreateOrUpdateCharge.tsx` (autofill secundário não bloqueante).
      }
    }

    void applyProductAutofill();

    return () => {
      cancelled = true;
    };
  }, [productUuidValue?.value, dirtyFields.product_uuid]);

  const isDisabledField = !canSave || isLoadingTraceability;

  // ---- Guarda de saída sem salvar (mirror `CreateOrUpdateBudget.tsx`) ------
  const hasUnsavedChanges = !isEmpty(dirtyFields);
  const { isConfirmOpen, confirmNavigation, cancelNavigation, guardedNavigate } =
    useUnsavedChangesGuard(hasUnsavedChanges);

  const traceabilityMutation = useRequest({
    asyncFunction: tryPersistTraceability,
    entityName: text.singularLabel,
    queryKey: queryKey.rastreabilidade.traceability,
    queryKey2: queryKey.rastreabilidade.traceabilities,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(TRACEABILITY_PRODUCTS_BASE_ROUTE);
    },
  });

  async function tryPersistTraceability(data: TraceabilityFormValues) {
    const payload: CreateTraceabilityRequest = {
      product_uuid: data.product_uuid!.value,
      traceability_config_uuid: data.traceability_config_uuid!.value,
      harvested_in: data.harvested_in!,
      packing: data.packing.trim(),
      gross_weight: data.gross_weight.trim() || null,
      name_pt: data.name_pt.trim(),
      name_en: data.name_en.trim() || null,
      name_es: data.name_es.trim() || null,
      description_pt: data.description_pt.trim(),
      description_en: data.description_en.trim() || null,
      description_es: data.description_es.trim() || null,
      // 16 campos nutricionais — SEMPRE decimal cru no payload (round-trip
      // `## 8`, nunca a string formatada exibida pelo `PercentInput`).
      energetic_value: data.energetic_value!,
      energetic_value_perc: data.energetic_value_perc!,
      carbohydrates: data.carbohydrates!,
      carbohydrates_perc: data.carbohydrates_perc!,
      proteins: data.proteins!,
      proteins_perc: data.proteins_perc!,
      fat_total: data.fat_total!,
      fat_total_perc: data.fat_total_perc!,
      fat_saturated: data.fat_saturated!,
      fat_saturated_perc: data.fat_saturated_perc!,
      fat_trans: data.fat_trans!,
      fat_trans_perc: data.fat_trans_perc!,
      dietary_fiber: data.dietary_fiber!,
      dietary_fiber_perc: data.dietary_fiber_perc!,
      sodium: data.sodium!,
      sodium_perc: data.sodium_perc!,
      barcode: data.barcode.trim() || null,
      exporter_name: data.exporter_name.trim() || null,
      exporter_address: data.exporter_address.trim() || null,
      exporter_zip_code: data.exporter_zip_code.trim() || null,
      exporter_city: data.exporter_city.trim() || null,
      exporter_state: data.exporter_state.trim() || null,
      exporter_country: data.exporter_country.trim() || null,
      // `number[]` nativo — SEM `JSON.stringify` manual (fecha D09 por
      // tipagem, mirror `AvailabilityMonthsPicker`).
      availability: data.availability,
      latlng: data.latlng.trim() || null,
      area_uuid: data.area_uuid!.value,
      box_quantity: data.box_quantity!,
    };

    try {
      // `PUT` é SEMPRE o recurso COMPLETO (`TraceabilityRequest` unificado
      // store+update, sem branching por verbo — mirror `ChargeRequest`).
      return isEditing && uuid
        ? await updateTraceability(uuid, payload)
        : await createTraceability(payload);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
          Object.entries(fieldErrors).forEach(([field, fieldMessages]) => {
            if (fieldMessages?.[0]) {
              setError(field as any, { type: 'server', message: fieldMessages[0] });
            }
          });
        }
      }
      // `throw` preserva o toast genérico do `useRequest` (mensagem por
      // campo OU fallback de negócio, `formText.businessErrorFallback`).
      throw error;
    }
  }

  async function onSubmit(data: TraceabilityFormValues) {
    await traceabilityMutation.mutateAsync(data);
  }

  const isSaving = traceabilityMutation.isPending;

  return (
    <>
      <FormContainer
        title={isEditing ? formText.title.edit : formText.title.create}
        subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
        footer={
          <>
            <Button
              title={languageGB.defaltStrings.cancel}
              variant="secondary"
              type="button"
              onClick={() => guardedNavigate(TRACEABILITY_PRODUCTS_BASE_ROUTE)}
            />
            {canSave && (
              <ButtonSaveAndNext
                create={!isEditing}
                dirtyFields={dirtyFields}
                type="submit"
                form={TRACEABILITY_FORM_ID}
                languageGB={languageGB}
                loading={isSaving}
                disabled={isSaving || isLoadingTraceability}
              />
            )}
          </>
        }
      >
        <Form id={TRACEABILITY_FORM_ID} noPadding onSubmit={handleSubmit(onSubmit)}>
          {/* ---- 1. Identificação (FD-02..FD-10) ---- */}
          <FormSection title={formText.sections.identification} columns={3}>
            <Controller
              name="product_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.product}
                  service={listProductionProducts}
                  mapOptions={(item: ProductOption) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.product_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabledField}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="traceability_config_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.traceabilityConfig}
                  service={listTraceabilityConfigOptions}
                  mapOptions={(item: TraceabilityConfigOption) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={findParamsFromSearch}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.traceability_config_uuid?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabledField}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Box>
              <Field
                label={formText.fields.harvestedIn}
                errorText={errors.harvested_in?.message}
                isRequired
              >
                <Controller
                  name="harvested_in"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={onChange}
                      disabled={isDisabledField}
                    />
                  )}
                />
              </Field>
            </Box>

            <Input
              label={formText.fields.packing}
              {...register('packing')}
              error={errors.packing?.message}
              loading={isLoadingTraceability}
              disabled={isDisabledField}
              isRequired
            />

            <Input
              label={formText.fields.grossWeight}
              {...register('gross_weight')}
              error={errors.gross_weight?.message}
              loading={isLoadingTraceability}
              disabled={isDisabledField}
            />

            {/* Readonly SEMPRE (round-trip `## 8`) — gerado no servidor. */}
            <InputReadOnly
              label={formText.fields.trackingCode}
              value={
                traceabilityDetail?.tracking_code ||
                formText.fields.trackingCodeGeneratedPlaceholder
              }
              loading={isLoadingTraceability}
            />

            <Input
              label={formText.fields.namePt}
              {...register('name_pt')}
              error={errors.name_pt?.message}
              loading={isLoadingTraceability}
              disabled={isDisabledField}
              isRequired
              maxLength={80}
            />

            <Input
              label={formText.fields.nameEn}
              {...register('name_en')}
              error={errors.name_en?.message}
              loading={isLoadingTraceability}
              disabled={isDisabledField}
              maxLength={80}
            />

            <Input
              label={formText.fields.nameEs}
              {...register('name_es')}
              error={errors.name_es?.message}
              loading={isLoadingTraceability}
              disabled={isDisabledField}
              maxLength={80}
            />
          </FormSection>

          {/* ---- 2. Sobre o produto (FD-11..13) ---- */}
          <FormSection title={formText.sections.aboutProduct} columns={1}>
            <SimpleGrid columns={1} gap={4}>
              <Textarea
                label={formText.fields.descriptionPt}
                {...register('description_pt')}
                error={errors.description_pt?.message}
                disabled={isDisabledField}
                isRequired
              />
              <Textarea
                label={formText.fields.descriptionEn}
                {...register('description_en')}
                error={errors.description_en?.message}
                disabled={isDisabledField}
              />
              <Textarea
                label={formText.fields.descriptionEs}
                {...register('description_es')}
                error={errors.description_es?.message}
                disabled={isDisabledField}
              />
            </SimpleGrid>
          </FormSection>

          {/* ---- 3. Informação nutricional (FD-14..29, 8 pares) ---- */}
          <FormSection title={formText.sections.nutritionalInfo} columns={2}>
            <Controller
              name="energetic_value"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.energeticValue}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.energetic_value?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="energetic_value_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.energeticValuePerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.energetic_value_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="carbohydrates"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.carbohydrates}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.carbohydrates?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="carbohydrates_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.carbohydratesPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.carbohydrates_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="proteins"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.proteins}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.proteins?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="proteins_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.proteinsPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.proteins_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="fat_total"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.fatTotal}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.fat_total?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="fat_total_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.fatTotalPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.fat_total_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="fat_saturated"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.fatSaturated}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.fat_saturated?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="fat_saturated_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.fatSaturatedPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.fat_saturated_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="fat_trans"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.fatTrans}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.fat_trans?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="fat_trans_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.fatTransPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.fat_trans_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="dietary_fiber"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.dietaryFiber}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.dietary_fiber?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="dietary_fiber_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.dietaryFiberPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.dietary_fiber_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />

            <Controller
              name="sodium"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.sodium}
                  allowDot
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.sodium?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
            <Controller
              name="sodium_perc"
              control={control}
              render={({ field }) => (
                <PercentInput
                  name={field.name}
                  label={formText.fields.sodiumPerc}
                  value={field.value}
                  onValueChange={field.onChange}
                  error={errors.sodium_perc?.message}
                  isRequired
                  disabled={isDisabledField}
                />
              )}
            />
          </FormSection>

          {/* ---- 4. Exportador (FD-30..36, opcional, sem i18n no legado —
              labels PT fixos preservados, `## 4.2` do contrato de tela) ---- */}
          <FormSection title={formText.sections.exporter} columns={3}>
            <Input
              label={formText.fields.barcode}
              {...register('barcode')}
              error={errors.barcode?.message}
              disabled={isDisabledField}
            />
            <Input
              label={formText.fields.exporterName}
              {...register('exporter_name')}
              error={errors.exporter_name?.message}
              disabled={isDisabledField}
            />
            <Input
              label={formText.fields.exporterAddress}
              {...register('exporter_address')}
              error={errors.exporter_address?.message}
              disabled={isDisabledField}
            />
            <Input
              label={formText.fields.exporterZipCode}
              {...register('exporter_zip_code')}
              error={errors.exporter_zip_code?.message}
              disabled={isDisabledField}
            />
            <Input
              label={formText.fields.exporterCity}
              {...register('exporter_city')}
              error={errors.exporter_city?.message}
              disabled={isDisabledField}
            />
            <Input
              label={formText.fields.exporterState}
              {...register('exporter_state')}
              error={errors.exporter_state?.message}
              disabled={isDisabledField}
            />
            <Input
              label={formText.fields.exporterCountry}
              {...register('exporter_country')}
              error={errors.exporter_country?.message}
              disabled={isDisabledField}
            />
          </FormSection>

          {/* ---- 5. Área e disponibilidade (FD-40..42, FD-37) — + widget de
              mapa (FD-38 `latlng`, `## 9.1`, `TASK-TR-FE-10`): display
              READ-ONLY da coordenada já persistida, SEM os controles de
              desenho mortos do legado (Geoman `D10`, defeito confirmado —
              fiel ao comportamento REAL, não ao visual quebrado). ---- */}
          <FormSection title={formText.sections.areaAvailability} columns={1}>
            <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
              <Controller
                name="area_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={formText.fields.area}
                    service={listServiceOrderAreaOptions}
                    mapOptions={(item: ServiceOrderAreaOption) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={errors.area_uuid?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              {/* Readonly SEMPRE, gerado no `store()` — `## 9.2`: sem prévia
                  em tempo real (mudança de UX documentada, não regressão). */}
              <InputReadOnly
                label={formText.fields.lotNumber}
                value={
                  traceabilityDetail?.lot_number || formText.fields.lotNumberGeneratedPlaceholder
                }
                loading={isLoadingTraceability}
              />

              <Controller
                name="box_quantity"
                control={control}
                render={({ field }) => (
                  <NumberInput
                    name={field.name}
                    label={formText.fields.boxQuantity}
                    allowDot
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.box_quantity?.message}
                    isRequired
                    disabled={isDisabledField}
                  />
                )}
              />
            </SimpleGrid>

            <Box mt={4}>
              <Controller
                name="availability"
                control={control}
                render={({ field }) => (
                  <AvailabilityMonthsPicker
                    label={formText.fields.availability}
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.availability?.message as string | undefined}
                    isRequired
                    isDisabled={isDisabledField}
                  />
                )}
              />
            </Box>

            <Box mt={4}>
              <Field label={formText.fields.map}>
                <TraceabilityMap
                  configUuid={traceabilityConfigValue?.value}
                  latlng={latlngValue ?? ''}
                  areaUuid={areaUuidValue?.value}
                />
              </Field>
            </Box>
          </FormSection>
        </Form>
      </FormContainer>

      <DeleteConfirmDialog
        isOpen={isConfirmOpen}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        tone="warning"
        colorPalette="orange"
        title={formText.unsavedChangesDialog.title}
        description={formText.unsavedChangesDialog.description}
        confirmButtonText={formText.unsavedChangesDialog.confirmButton}
        hideQuestionMark
        warningText=""
      />
    </>
  );
}
