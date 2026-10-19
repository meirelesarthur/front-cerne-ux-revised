// src/pages/Operacional/HarvestProduct/CreateOrUpdateHarvestProduct.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Colheita de Frutas — Operacional /
// Agricultura (F-040, execução 040, TASK-FE-1097 — casca + 10 campos de
// cabeçalho — e TASK-FE-1101 — estados de erro/vazio dos 2 selects
// assíncronos). Rotas `/operacional/colheita-frutas/nova` e
// `/operacional/colheita-frutas/:uuid/editar` (TASK-FE-1100).
//
// MANDATO INEGOCIÁVEL DO DONO (contrato §7.4/§7.6): exatamente 12 campos em
// create / 14 em edição — nem um a mais, nem um a menos. `boxes[]` delegado a
// `HarvestProductBoxesFieldArray` (TASK-FE-1098), montado aqui como filho.
//
// Esqueleto geral mirror `ProtocoloEstacao/CreateOrUpdateProtocolSeason.tsx`
// (`isEditing = isValidGuid(uuid)`, guard de navegação para uuid malformado,
// `useCustomFormQueryById`, `fillForm` nomeada com guarda `!isEmpty(dirtyFields)
// || resetForce` — `src/utils/isEmpty.ts` tem nome invertido: retorna `true`
// quando o objeto TEM alguma chave própria, ERRO-FE-001).
//
// ⚠️ ACHADO DE RECONCILIAÇÃO (leitura direta do api_root,
// `UpdateHarvestProductAtomicAction::handle()`, TASK-BE-1071): o cabeçalho do
// UPDATE usa `fill()` INCONDICIONAL a partir do DTO — não é PATCH parcial de
// `dirtyFields` (mirror `ProtocolSeasonRequest`). O cabeçalho é SEMPRE
// enviado completo tanto no create quanto no update; só o guard "nada mudou
// → não chama a API" (Lei 2) permanece client-side.
//
// D1 (código sem preview no create): `code` é `Input disabled` com
// placeholder "Gerado automaticamente ao salvar", sem valor, nunca enviado
// no payload.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { components as reactSelectComponents, NoticeProps } from 'react-select';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { MaskedInput } from '@/components/Form/MaskedInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { normalizeDocument } from '@/utils/cpfCnpj';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { harvestProductFormDefaultValues } from '@/constants/harvestProduct/default-values';
import { queryKey } from '@/constants/query-key';

import { harvestProductSchemaResolver } from '@/validations/schemas/HarvestProduct/harvestProduct-schema';

import {
  createHarvestProduct,
  getAreasOptions,
  getCitiesOptions,
  getClientsOptions,
  getProductsOptions,
  updateHarvestProduct,
} from '@/services/v2/HarvestProduct/harvestProduct-service';

import type { Option } from '@/@types/option';
import type {
  AreaOptionItem,
  ClientOptionItem,
  CityOptionItem,
  CreateHarvestProductRequest,
  HarvestProductData,
  HarvestProductForm,
  ProductOptionItem,
} from '@/@types/v2/HarvestProduct';

import { HarvestProductBoxesFieldArray } from './HarvestProductBoxesFieldArray';
import { fillHarvestProductForm, useHarvestProductForm } from './useHarvestProducts';

const HARVEST_PRODUCT_LIST_ROUTE = '/operacional/colheita-frutas';

function mapAreaOption(item: AreaOptionItem): Option<string> {
  return { value: item.uuid, label: item.description };
}

function mapClientOption(item: ClientOptionItem): Option<string> {
  return { value: item.uuid, label: item.name ?? '—' };
}

// TASK-FE-2781 (§1) — LABEL = `description` puro: o legado
// (`harvest-products/_forms.blade.php:152`) nunca concatena o código.
function mapProductOption(item: ProductOptionItem): Option<string> {
  return {
    value: item.uuid,
    label: item.description,
  };
}

function mapCityOption(item: CityOptionItem): Option<string> {
  return {
    value: item.uuid,
    label: item.state?.letter ? `${item.title} (${item.state.letter})` : item.title,
  };
}

// 422 do servidor mapeado por campo — o wire do backend é snake_case
// (`area_uuid`, `boxes.0.amount`), o form React usa camelCase para os campos
// de cabeçalho; `boxes.N.<campo>` não muda de case (single word).
const SERVER_FIELD_MAP: Record<string, string> = {
  area_uuid: 'areaUuid',
  client_uuid: 'clientUuid',
  product_uuid: 'productUuid',
  city_uuid: 'cityUuid',
  driver_name: 'driverName',
  driver_nif: 'driverNif',
};

function mapServerFieldToFormField(field: string): string {
  const [head, ...rest] = field.split('.');
  const mappedHead = SERVER_FIELD_MAP[head] ?? head;
  return [mappedHead, ...rest].join('.');
}

export default function CreateOrUpdateHarvestProduct() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.harvestProduct;
  const formText = text.form;

  // Guard de navegação: `uuid` presente mas NÃO é um GUID válido (URL
  // adulterada) — redireciona para a listagem ANTES de renderizar o form.
  const hasMalformedRouteParam = uuid !== undefined && !isValidGuid(uuid);

  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(HARVEST_PRODUCT_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('harvest-products_edit') : can('harvest-products_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<HarvestProductForm>({
    mode: 'onChange',
    resolver: harvestProductSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: {
      ...harvestProductFormDefaultValues(),
      // FID-G5 (execução 040) — legado prefila `date` com HOJE no CREATE
      // (`harvest-products/_forms.blade.php`). Em EDIÇÃO o default é
      // descartado pelo `reset()` de `fillHarvestProductForm` assim que a
      // query resolve (`isLoading` mantém a tela em Skeleton até lá) — NÃO
      // altera a hidratação real do registro.
      date: isEditing ? '' : format(new Date(), 'yyyy-MM-dd'),
      // a UI de grid decide o mínimo de 1 linha inicial na tela (TASK-FE-1093
      // nota) — o default do form/constant fica com `boxes: []`.
      boxes: [{ uuid: undefined, amount: null }],
    },
  });

  const boxesFieldArray = useFieldArray({ control, name: 'boxes' });

  // ---- Guarda EXPLÍCITA `!isEmpty(dirtyFields) || resetForce` (Lei 2) ----
  function fillForm(data: HarvestProductData, resetForce?: boolean) {
    fillHarvestProductForm(reset, dirtyFields, data, resetForce);
  }

  const harvestProductQuery = useHarvestProductForm({
    uuid: isEditing ? uuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([harvestProductQuery as any]);

  // ---- Lookups locais (Área/Cliente) — Select simples, `areas/options`/
  // `clients/options` são FLAT (sem paginação real, contrato §7.4/§3.5). ----
  const areasQuery = useQuery({
    queryKey: [queryKey.harvestProducts.harvestProducts, 'areas-options'],
    queryFn: getAreasOptions,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const areaOptions: Option<string>[] = (areasQuery.data ?? []).map(mapAreaOption);

  const clientsQuery = useQuery({
    queryKey: [queryKey.harvestProducts.harvestProducts, 'clients-options'],
    queryFn: getClientsOptions,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const clientOptions: Option<string>[] = (clientsQuery.data ?? []).map(mapClientOption);

  // ---- D5 (contrato §7.10/§7.4 SURF-LOOKUP-ERROR) — estados de erro/vazio
  // dos selects assíncronos (Produto/Cidade). O legado NUNCA tratou isso
  // (DIV-07); a Lei 1 do `cerne` (5 estados obrigatórios) é MANDATORY. -----
  const [productLookupError, setProductLookupError] = useState(false);
  const [productRetryToken, setProductRetryToken] = useState(0);
  const [cityLookupError, setCityLookupError] = useState(false);
  const [cityRetryToken, setCityRetryToken] = useState(0);

  async function fetchProductsWithErrorTracking(params: any) {
    try {
      const result = await getProductsOptions(params);
      setProductLookupError(false);
      return result;
    } catch (error) {
      setProductLookupError(true);
      throw error;
    }
  }

  async function fetchCitiesWithErrorTracking(params: any) {
    try {
      const result = await getCitiesOptions(params);
      setCityLookupError(false);
      return result;
    } catch (error) {
      setCityLookupError(true);
      throw error;
    }
  }

  // "Sem resultados" (termo buscado sem match) DISTINTO de "digite ao menos 3
  // caracteres" (guarda de rede, `getProductsOptions`/`getCitiesOptions`) —
  // override do `NoOptionsMessage` padrão do `SelectAsyncPaginate` ("Sem
  // opções" genérico), lido do `inputValue` corrente do `react-select`.
  function LookupNoOptionsMessage(props: NoticeProps<unknown, false, any>) {
    const inputValue = (props.selectProps as any)?.inputValue ?? '';
    const message =
      inputValue.trim().length < 3 ? formText.lookupTypeToSearch : formText.lookupNoResults;
    return (
      <reactSelectComponents.NoOptionsMessage {...props}>
        {message}
      </reactSelectComponents.NoOptionsMessage>
    );
  }

  const harvestProductMutation = useRequest({
    asyncFunction: tryPersistHarvestProduct,
    entityName: text.singularLabel,
    queryKey: queryKey.harvestProducts.harvestProducts,
    queryKey2: queryKey.harvestProducts.harvestProduct,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing ? text.toast.updateSuccess : text.toast.createSuccess,
    actionSuccess: () => {
      navigate(HARVEST_PRODUCT_LIST_ROUTE);
    },
  });

  async function tryPersistHarvestProduct(data: HarvestProductForm) {
    // Cabeçalho SEMPRE completo (create E update — achado de reconciliação
    // no cabeçalho do arquivo) + `boxes[]` sempre integral (reconciliação por
    // uuid no backend).
    const payload: CreateHarvestProductRequest = {
      date: data.date,
      area_uuid: data.areaUuid!.value!,
      client_uuid: data.clientUuid!.value!,
      product_uuid: data.productUuid!.value!,
      plate: data.plate || undefined,
      city_uuid: data.cityUuid?.value || undefined,
      driver_name: data.driverName || undefined,
      driver_nif: data.driverNif ? normalizeDocument(data.driverNif) : undefined,
      boxes: data.boxes.map((box) => ({
        // `null` (nunca `undefined`) — a chave `uuid` precisa ficar SEMPRE
        // presente no JSON serializado: o backend valida `present|nullable`
        // no PUT/PATCH (reconciliação por uuid, LAC-05) e `sometimes|nullable`
        // no POST; `undefined` faz o `JSON.stringify` remover a chave e o PUT
        // reprova 422 `boxes.N.uuid` ao adicionar caixa nova em edição.
        uuid: box.uuid ?? null,
        // `.toFixed(5)` — evita artefato de ponto flutuante ao serializar o
        // `number` do form, preservando as 5 casas físicas (D3, DIV-03).
        amount: Number(box.amount ?? 0).toFixed(5),
      })),
    };

    try {
      return isEditing && uuid
        ? await updateHarvestProduct(uuid, payload)
        : await createHarvestProduct(payload);
    } catch (error) {
      // 422 do backend mapeado por campo — inclusive `boxes`/`boxes.N.amount`.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const mappedField = mapServerFieldToFormField(field);
          if (mappedField && messages?.[0]) {
            setError(mappedField as any, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  // Guarda `isEditing && !isEmpty(dirtyFields)` — mirror EXATO da versão já
  // em produção em `CreateOrUpdateProtocolSeason.tsx` (ver nota de cabeçalho:
  // `isEmpty()` deste projeto tem nome invertido — sem a negação, o Salvar
  // navegaria de volta sem chamar a API em QUALQUER edição).
  async function onSubmit(data: HarvestProductForm) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
      return;
    }
    await harvestProductMutation.mutateAsync(data);
  }

  const isSaving = harvestProductMutation.isPending;

  if (hasMalformedRouteParam) {
    return null;
  }

  if (isLoading) {
    return (
      <FormContainer title={isEditing ? text.editTitle : text.createTitle} showDivider>
        <Box pt={4}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
            <Skeleton height="40px" borderRadius="md" />
          </SimpleGrid>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={isEditing ? text.editTitle : text.createTitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings?.cancel || 'Cancelar'}
            variant="outline"
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
              loading={isSaving || isSubmitting}
              disabled={isSaving || isSubmitting}
            />
          )}
        </>
      }
    >
      <Form id="harvestProduct-form" noPadding onSubmit={handleSubmit(onSubmit)}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* 1. code — Input disabled, D1 (sem preview no create) */}
          <Input
            label={formText.code}
            value={watch('code') || ''}
            placeholder={!isEditing ? formText.codeHelper : undefined}
            disabled
          />

          {/* 2. date */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                label={formText.date}
                error={errors.date?.message}
                isRequired
                disabled={!canSave}
              />
            )}
          />

          {/* 3. areaUuid — Select local (areas/options) */}
          <Controller
            name="areaUuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={formText.area}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={areaOptions}
                error={error?.message}
                isRequired
                loading={areasQuery.isLoading}
                isDisabled={!canSave}
              />
            )}
          />

          {/* 4. clientUuid — Select local (clients/options, NOVO) */}
          <Controller
            name="clientUuid"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={formText.client}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                options={clientOptions}
                error={error?.message}
                isRequired
                loading={clientsQuery.isLoading}
                isDisabled={!canSave}
              />
            )}
          />

          {/* 5. productUuid — SelectAsyncPaginate (products/options, min 3 chars) */}
          <Box>
            <Controller
              name="productUuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.product}
                  service={fetchProductsWithErrorTracking as any}
                  pageSize={20}
                  mapOptions={mapProductOption as any}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  cacheUniqs={[productRetryToken]}
                  components={{ NoOptionsMessage: LookupNoOptionsMessage as any }}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
            {productLookupError && (
              <Button
                title={formText.lookupErrorRetry}
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => {
                  setProductLookupError(false);
                  setProductRetryToken((token) => token + 1);
                }}
              />
            )}
          </Box>

          {/* 6. plate — máscara de placa (UT-000787, D5; reverte DIV-09) */}
          <Controller
            name="plate"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="plate"
                label={formText.plate}
                name={field.name}
                value={field.value ?? ''}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                disabled={!canSave}
              />
            )}
          />

          {/* 7. cityUuid — SelectAsyncPaginate (cities/options, min 3 chars) */}
          <Box>
            <Controller
              name="cityUuid"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.city}
                  service={fetchCitiesWithErrorTracking as any}
                  pageSize={20}
                  mapOptions={mapCityOption as any}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  cacheUniqs={[cityRetryToken]}
                  components={{ NoOptionsMessage: LookupNoOptionsMessage as any }}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={error?.message}
                  isDisabled={!canSave}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
            {cityLookupError && (
              <Button
                title={formText.lookupErrorRetry}
                variant="ghost"
                size="xs"
                type="button"
                onClick={() => {
                  setCityLookupError(false);
                  setCityRetryToken((token) => token + 1);
                }}
              />
            )}
          </Box>

          {/* 8. driverName — max:191 (DIV-04 já corrigido no backend) */}
          <Input
            label={formText.driverName}
            {...register('driverName')}
            maxLength={191}
            error={errors.driverName?.message}
            disabled={!canSave}
          />

          {/* 9. driverNif — CPF/CNPJ alfanumérico (MaskedInput kind="cpfCnpj", UT-000776) */}
          <Controller
            name="driverNif"
            control={control}
            render={({ field, fieldState }) => (
              <MaskedInput
                kind="cpfCnpj"
                label={formText.driverNif}
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        {/* 10. boxes[] — subcadastro grid repetível (TASK-FE-1098) */}
        <Box mt={6}>
          <HarvestProductBoxesFieldArray
            control={control}
            fields={boxesFieldArray.fields}
            append={boxesFieldArray.append}
            remove={boxesFieldArray.remove}
            errors={errors}
            disabled={!canSave}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
