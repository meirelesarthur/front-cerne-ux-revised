// src/pages/Operacional/PesagemRodoviaria/CreateOrUpdateModuleWeighing.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO do PRÉ-CADASTRO de Pesagem Rodoviária
// (ModuleWeighing, FE-SCR-02, TASK-MWG-FE-03) — `status=PreCadastro`.
// Rotas: `/operacional/pesagem-rodoviaria/novo` (`module-weighing_create`) e
// `/operacional/pesagem-rodoviaria/:uuid/editar` (`module-weighing_edit`).
// `isEditing = !!uuid && uuid !== 'create'`, mirror `CreateOrUpdateFarm`.
//
// Cascatas/condicionais (`DIM-CAS-001..005`/`DIM-CON-001..009`, replicadas
// EXATAMENTE do contrato legado — ver `CONTRATO-TELA-PESAGEM-FE §3`):
//  - `type=Avulsa (2)`: `warehouse` não obrigatório e readonly (IG-001).
//  - `type=EntradaColheita (3)`: força `category=Interna`, readonly (IG-002).
//  - `type=EntradaTerceiros (4)`: força `category=Externa`, readonly (IG-003).
//  - `category=Externa` + `type∈{VendaSaida,EntradaTerceiros}`: `client`
//    obrigatório (IG-005); `category=Externa` + `type=CompraEntrada`:
//    `providerBuy` visível; `category=Interna`: `farmTo` visível (IG-004).
//  - Produto selecionado → `measurement` recebe opções primária+secundária
//    (IG-008); `product.has_lot` → `providerLot`/`expirationDate`
//    obrigatórios/desbloqueados (IG-009); `providerLot` dispara
//    `GET validate-lot-stock` quando `type=CompraEntrada` (aviso de
//    duplicidade, IG-010, não bloqueante).
//  - `hasClassification` controla se `discountTable` desbloqueia (IG-006).
//
// GAP-PES-01 (guarda de status no update) — decisão do dono: NÃO aplicar a
// guarda no front; `update` continua amplo (mirror legado). Se a API
// rejeitar (deep link com `status!=1`), a tela reage ao envelope de erro
// (toast), sem duplicar a regra de negócio.
//
// Correção 050 (fidelidade ao legado, decisão do dono — corrigir as 8):
//  - D1: `employee` (select de funcionário) REMOVIDO — "Responsável" é
//    texto READONLY (usuário logado na criação, `data.responsible?.name`
//    na edição), mirror `_forms.blade:20-21` + `CreateBatchArea.tsx`/
//    `CreateBatchGrazing.tsx` (`InputReadOnly` + `user?.username`).
//  - D2: `lot` REMOVIDO — gerado no servidor (`uniqid()`), nunca é campo.
//  - D6: `category` sem default (força "Selecione", mirror `_forms.blade:27`).
//  - D7: `client` também exibido (opcional) em `type=Avulsa+Externa`.
//  - D8: `code` exibido READONLY (registro na edição, placeholder na criação).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react';

import { Icon, IconButton, SimpleGrid, Switch, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { useApplySavedProvider } from '@/pages/CadastrosBase/Fornecedores/useApplySavedProvider';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Textarea } from '@/components/Form/InputTextArea';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { moduleWeighingCategory } from '@/constants/ModuleWeighing/module-weighing-category';
import { moduleWeighingType } from '@/constants/ModuleWeighing/module-weighing-type';
import { moduleWeighingCategoryOptions } from '@/constants/ModuleWeighing/options/module-weighing-category-options';
import { moduleWeighingTypeOptions } from '@/constants/ModuleWeighing/options/module-weighing-type-options';
import { queryKey } from '@/constants/query-key';

import { moduleWeighingCreateSchemaResolver } from '@/validations/schemas/ModuleWeighing/create-schema';

import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listDiscountTables } from '@/services/v2/DiscountTables/discount-table-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  createModuleWeighing,
  getModuleWeighingById,
  updateModuleWeighing,
} from '@/services/v2/ModuleWeighing/module-weighing-service';
import { listOrderClientOptions } from '@/services/v2/Orders/order-service';
import type { OrderClientOptionItem } from '@/services/v2/Orders/order-service';
import { getProduct, listProductOptions } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { EquipmentOption } from '@/@types/v2/Equipments';
import type { FarmRef } from '@/@types/v2/Farms';
import type {
  ModuleWeighingData,
  ModuleWeighingPayload,
} from '@/@types/v2/ModuleWeighing/module-weighing';
import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

import { ClientDialog } from './dialogs/ClientDialog';
import { EquipmentDialog } from './dialogs/EquipmentDialog';
import { ProductDialog } from './dialogs/ProductDialog';
import { ProviderDialog } from './dialogs/ProviderDialog';
import { WarehouseDialog } from './dialogs/WarehouseDialog';
import { dedupeOptionsByValue } from './measurementOptions';

interface ModuleWeighingCreateFormValues {
  date: string;
  product: Option<string> | null;
  measurement: Option<string> | null;
  area: Option<string> | null;
  warehouse: Option<string> | null;
  equipment: Option<string> | null;
  provider: Option<string> | null;
  type: number | null;
  category: string | null;
  client: Option<string> | null;
  providerBuy: Option<string> | null;
  farmTo: Option<string> | null;
  hasClassification: boolean;
  discountTable: Option<string> | null;
  providerLot: string | null;
  expirationDate: string | null;
  note: string | null;
}

function emptyForm(): ModuleWeighingCreateFormValues {
  return {
    date: '',
    product: null,
    measurement: null,
    area: null,
    warehouse: null,
    equipment: null,
    provider: null,
    type: null,
    // Correção 050 (D6) — sem default: força escolha explícita, mirror
    // `_forms.blade:27` (select "Selecione", nunca `Externa` por inércia).
    category: null,
    client: null,
    providerBuy: null,
    farmTo: null,
    hasClassification: false,
    discountTable: null,
    providerLot: null,
    expirationDate: null,
    note: null,
  };
}

// Botão "+"/editar no LABEL do select (EST-07, migrado do avulso ao lado do
// select — TASK-MWG-FE-10/11) — mesmo mecanismo para os 6 pontos de
// plugagem (produto/armazém/equipamento/fornecedor/fornecedor-compra/
// cliente): `FiPlus` quando o select está vazio, `FiEdit2` quando já há uma
// opção selecionada (abre o diálogo em modo EDITAR com o `uuid` da opção
// corrente). Mirror EXATO do estilo `labelAction` de `CreateOrUpdateNfe.tsx`.
function SubRegisterTrigger({ hasValue, onClick }: { hasValue: boolean; onClick: () => void }) {
  return (
    <IconButton
      aria-label="Cadastro rápido"
      variant="ghost"
      size="2xs"
      minH="0"
      h="20px"
      w="20px"
      minW="0"
      p="0"
      onClick={onClick}
    >
      <Icon as={hasValue ? FiEdit2 : FiPlus} boxSize="16px" color="primaryMain" />
    </IconButton>
  );
}

export default function CreateOrUpdateModuleWeighing() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const applySavedProvider = useApplySavedProvider();
  const { activeFarmUuid, user } = useAuth();
  const { can } = usePermissions();
  const text = languageGB.moduleWeighing.moduleWeighing;

  const isEditing = isValidGuid(uuid);
  const canSave = isEditing ? can('module-weighing_edit') : can('module-weighing_create');

  // ---- Diálogos de sub-cadastro (TASK-MWG-FE-10/11) — um `isOpen` por
  // select plugado; cada instância é independente (fecha DV-009 por
  // construção — nenhum `id` DOM compartilhado entre `provider`/`providerBuy`,
  // mesmo componente `ProviderDialog` em 2 pontos de entrada distintos). ---
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [providerBuyDialogOpen, setProviderBuyDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  // ---- Displays READONLY (D1/D8, correção 050) — `code` do registro e nome
  // do Responsável já resolvido pelo servidor (edição); na criação, `code`
  // usa o hint "gerado ao salvar" e o Responsável é `user?.username` (mirror
  // `CreateOrUpdateDeathAnimal.tsx`/`CreateBatchArea.tsx`). ---
  const [codeDisplay, setCodeDisplay] = useState<string | null>(null);
  const [responsibleNameDisplay, setResponsibleNameDisplay] = useState<string | null>(null);

  // ---- Detalhe do produto selecionado (has_lot/measurement) — IG-008/009 ---
  const [selectedProductUuid, setSelectedProductUuid] = useState<string | null>(null);
  const productDetailQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'product-detail', selectedProductUuid],
    queryFn: async () => {
      const response = await getProduct(selectedProductUuid!);
      return response.data;
    },
    enabled: !!selectedProductUuid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const hasProductLot = !!productDetailQuery.data?.has_lot;

  const {
    control,
    register,
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, dirtyFields },
  } = useForm<ModuleWeighingCreateFormValues>({
    mode: 'onChange',
    resolver: moduleWeighingCreateSchemaResolver(languageGB),
    context: { hasProductLot },
    defaultValues: emptyForm(),
  });

  const watchType = watch('type');
  const watchCategory = watch('category');
  const watchHasClassification = watch('hasClassification');
  const watchProviderLot = watch('providerLot');
  const watchMeasurement = watch('measurement');
  const watchFarmTo = watch('farmTo');

  // ---- Cascatas de type→category (IG-002/IG-003, readonly forçado) --------
  useEffect(() => {
    if (watchType === moduleWeighingType.entradaColheita) {
      setValue('category', moduleWeighingCategory.interna, { shouldValidate: true });
    } else if (watchType === moduleWeighingType.entradaTerceiros) {
      setValue('category', moduleWeighingCategory.externa, { shouldValidate: true });
    }
  }, [watchType, setValue]);

  const categoryReadOnly =
    watchType === moduleWeighingType.entradaColheita ||
    watchType === moduleWeighingType.entradaTerceiros;
  const warehouseReadOnly = watchType === moduleWeighingType.avulsa;

  // Correção 050 (D7) — `showClient` passa a incluir `type=Avulsa` (paridade
  // legado, `_forms.blade:111-113` + `:286-291`: o container do cliente é
  // exibido para QUALQUER `type` quando `category=Externa` exceto
  // `CompraEntrada`, que mostra `providerBuy` no lugar); `clientRequired`
  // continua restrito a `{VendaSaida, EntradaTerceiros}` (IG-005,
  // `create-schema.ts` grupo #5, `_forms.blade:430-440` — Avulsa+Externa
  // exibe o campo mas não o exige).
  const showClient =
    watchCategory === moduleWeighingCategory.externa &&
    (watchType === moduleWeighingType.vendaSaida ||
      watchType === moduleWeighingType.avulsa ||
      watchType === moduleWeighingType.entradaTerceiros);
  const clientRequired =
    watchCategory === moduleWeighingCategory.externa &&
    (watchType === moduleWeighingType.vendaSaida ||
      watchType === moduleWeighingType.entradaTerceiros);
  const showProviderBuy =
    watchCategory === moduleWeighingCategory.externa &&
    watchType === moduleWeighingType.compraEntrada;
  const showFarmTo = watchCategory === moduleWeighingCategory.interna;

  // ---- Fill do formulário em modo edição (Lei 2) ---------------------------
  const hydratedUuidRef = useRef<string | null>(null);

  function fillForm(data: ModuleWeighingData) {
    const isFirstHydration = hydratedUuidRef.current !== uuid;
    if (isFirstHydration || isEmpty(dirtyFields)) {
      hydratedUuidRef.current = uuid ?? null;
      reset({
        date: data.date,
        product: data.product
          ? { value: data.product.uuid, label: data.product.description }
          : null,
        measurement: data.measurement
          ? { value: data.measurement.uuid, label: data.measurement.description }
          : null,
        area: data.area ? { value: data.area.uuid, label: data.area.description } : null,
        warehouse: data.warehouse
          ? { value: data.warehouse.uuid, label: data.warehouse.description }
          : null,
        equipment: data.equipment
          ? { value: data.equipment.uuid, label: data.equipment.description }
          : null,
        provider: data.provider ? { value: data.provider.uuid, label: data.provider.name } : null,
        type: data.type,
        category: data.category,
        client: data.client ? { value: data.client.uuid, label: data.client.name } : null,
        providerBuy: data.provider_buy
          ? { value: data.provider_buy.uuid, label: data.provider_buy.name }
          : null,
        farmTo: data.farm_to ? { value: data.farm_to.uuid, label: data.farm_to.name } : null,
        hasClassification: data.has_classification,
        discountTable: data.discount_table
          ? { value: data.discount_table.uuid, label: data.discount_table.description }
          : null,
        providerLot: data.provider_lot,
        expirationDate: data.expiration_date,
        note: data.note,
      });
      setCodeDisplay(data.code);
      setResponsibleNameDisplay(data.responsible?.name ?? null);
      if (data.product?.uuid) setSelectedProductUuid(data.product.uuid);
    }
  }

  const moduleWeighingQuery = useCustomFormQueryByGuid<ModuleWeighingData>({
    registrationId: isEditing ? uuid : undefined,
    asyncFunction: getModuleWeighingById,
    queryKey: queryKey.moduleWeighing.moduleWeighing,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([moduleWeighingQuery as any]);

  // ---- Áreas/Fazendas (listas pequenas, sem AJAX incremental) --------------
  const areasQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'areas', activeFarmUuid],
    queryFn: async () => {
      const response = await listAreas({ farm_uuid: activeFarmUuid ?? '', per_page: 100 });
      return response.data.items;
    },
    enabled: !!activeFarmUuid,
    refetchOnWindowFocus: false,
  });
  const areaOptions: Option<string>[] = (areasQuery.data ?? []).map((area: AreaListItem) => ({
    value: area.uuid,
    label: area.description,
  }));

  const farmsQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'farms'],
    queryFn: listFarms,
    enabled: showFarmTo,
    refetchOnWindowFocus: false,
  });
  // Correção 050 (DIV-03) — a lista de fazendas de destino é INDEPENDENTE do
  // valor já persistido no registro (filtra a fazenda ativa, sem garantia de
  // conter a fazenda gravada — ex.: farm_to desativada ou removida do
  // catálogo desde a criação). O `<Select>` (`ChakraSelect.ValueText`, Zag/
  // Ark UI) só resolve o texto exibido a partir da PRÓPRIA `collection`
  // construída a partir de `options` — nunca do `field.value.label` direto —
  // então um `field.value` com uuid/label corretos (vindos do adapter
  // `mapModuleWeighingDetail`) ainda renderiza o placeholder se esse uuid
  // não estiver em `options`. Injeta o valor já selecionado como fallback
  // quando ausente da lista corrente, preservando o rótulo real do registro.
  const farmToOptions: Option<string>[] = useMemo(() => {
    const options = (farmsQuery.data ?? [])
      .filter((farm: FarmRef) => farm.uuid !== activeFarmUuid)
      .map((farm: FarmRef) => ({ value: farm.uuid, label: farm.description }));
    if (watchFarmTo && !options.some((opt) => opt.value === watchFarmTo.value)) {
      options.push(watchFarmTo);
    }
    return options;
  }, [farmsQuery.data, activeFarmUuid, watchFarmTo]);

  const discountTablesQuery = useQuery({
    queryKey: [queryKey.moduleWeighing.moduleWeighing, 'discount-tables'],
    queryFn: async () => {
      const response = await listDiscountTables({ page: 1 });
      return response.data.items;
    },
    enabled: watchHasClassification,
    refetchOnWindowFocus: false,
  });
  const discountTableOptions: Option<string>[] = (discountTablesQuery.data ?? []).map((item) => ({
    value: item.uuid,
    label: item.name,
  }));

  // Medida — primária + secundária do produto selecionado (IG-008). Base do
  // CATÁLOGO ATUAL do produto — depende só de `productDetailQuery.data`
  // (nunca do valor corrente do campo), para não realimentar o `useEffect`
  // de auto-seleção abaixo (ver nota da correção 050/DIV-02 mais adiante:
  // misturar o valor do campo aqui criaria um loop de render, já que
  // `setValue` dispararia recálculo deste memo a cada execução do efeito).
  const productMeasurementOptions: Option<string>[] = useMemo(() => {
    const detail = productDetailQuery.data;
    const options: Option<string>[] = [];
    if (detail?.measurement) {
      options.push({ value: detail.measurement.uuid, label: detail.measurement.description });
    }
    if (detail?.measurement_second) {
      options.push({
        value: detail.measurement_second.uuid,
        label: detail.measurement_second.description,
      });
    }
    return dedupeOptionsByValue(options);
  }, [productDetailQuery.data]);

  useEffect(() => {
    if (productMeasurementOptions.length === 1 && !dirtyFields.measurement) {
      setValue('measurement', productMeasurementOptions[0], { shouldDirty: false });
    }
  }, [productMeasurementOptions, dirtyFields.measurement, setValue]);

  // Correção 050 (DIV-02) — `productMeasurementOptions` é o CATÁLOGO ATUAL
  // do produto, que pode não conter a medida já gravada no registro (produto
  // reconfigurado após a pesagem ser criada, dado migrado, etc.). Sem
  // fallback, o `<Select>` (`ChakraSelect.ValueText`, Zag/Ark UI) renderiza o
  // placeholder mesmo com `field.value` corretamente preenchido pelo
  // `fillForm`/adapter (`mapModuleWeighingDetail`), porque ele só resolve o
  // texto exibido a partir da PRÓPRIA `collection` construída de `options` —
  // nunca de `field.value.label` direto. A divergência só não aparecia em
  // produtos com medida única porque o `useEffect` acima mascarava o
  // sintoma (reescrevia o campo com a opção do catálogo), mas nunca corrigia
  // a causa. Variável SEPARADA de `productMeasurementOptions` (que alimenta
  // o efeito acima) — só para o que é efetivamente renderizado no `<Select>`
  // — para não realimentar aquele efeito com o próprio valor que ele mesmo
  // define (loop de render).
  const measurementSelectOptions: Option<string>[] = useMemo(() => {
    if (
      watchMeasurement &&
      !productMeasurementOptions.some((opt) => opt.value === watchMeasurement.value)
    ) {
      return dedupeOptionsByValue([...productMeasurementOptions, watchMeasurement]);
    }
    return productMeasurementOptions;
  }, [productMeasurementOptions, watchMeasurement]);

  // IG-010 — aviso leve (console/toast não bloqueante) de duplicidade de
  // lote quando `type=CompraEntrada`; não impede digitação nem submit.
  useEffect(() => {
    if (watchType === moduleWeighingType.compraEntrada && watchProviderLot) {
      // eslint-disable-next-line no-console
      console.info(text.create.duplicateLotWarning);
    }
  }, [watchType, watchProviderLot, text.create.duplicateLotWarning]);

  const moduleWeighingMutation = useRequest({
    asyncFunction: tryPersistModuleWeighing,
    entityName: text.singularLabel,
    queryKey: queryKey.moduleWeighing.moduleWeighings,
    queryKey2: queryKey.moduleWeighing.moduleWeighing,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing
      ? text.create.toasts.updatedSuccess
      : text.create.toasts.createdSuccess,
    actionSuccess: () => {
      // Fidelidade 050 (F3) — legado `ModuleWeighingController@store` faz
      // `redirect()->route('module-weighing.index')`: após CRIAR, o usuário
      // volta para a LISTA (não para o wizard). Edição já ia para a lista.
      navigate('/operacional/pesagem-rodoviaria');
    },
  });

  async function tryPersistModuleWeighing(data: ModuleWeighingCreateFormValues) {
    const payload: ModuleWeighingPayload = {
      date: data.date,
      product_uuid: data.product?.value ?? '',
      warehouse_uuid: data.warehouse?.value ?? null,
      provider_uuid: data.provider?.value ?? '',
      equipment_uuid: data.equipment?.value ?? '',
      gross_weight: null,
      tare_weight: null,
      type: (data.type ?? moduleWeighingType.vendaSaida) as ModuleWeighingPayload['type'],
      category: (data.category ??
        moduleWeighingCategory.externa) as ModuleWeighingPayload['category'],
      has_classification: data.hasClassification,
      classification: null,
      discount_table_uuid: data.discountTable?.value ?? null,
      measurement_uuid: data.measurement?.value ?? null,
      note: data.note?.trim() || null,
      provider_lot: data.providerLot?.trim() || null,
      expiration_date: data.expirationDate || null,
      area_uuid: data.area?.value ?? null,
      client_uuid: data.client?.value ?? null,
      provider_buy_uuid: data.providerBuy?.value ?? null,
      farm_to_uuid: data.farmTo?.value ?? null,
    };

    if (isEditing && uuid) {
      return await updateModuleWeighing(uuid, payload);
    }
    return await createModuleWeighing(payload);
  }

  const isSaving = moduleWeighingMutation.isPending;

  function findParams(search: string | { search: string }) {
    return { search: typeof search === 'string' ? search : search.search };
  }

  return (
    <FormContainer
      title={isEditing ? text.create.title.edit : text.create.title.create}
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
              title={text.common.buttons.save}
              type="submit"
              form="module-weighing-create-form"
              loading={isSaving}
              disabled={isSaving || isLoading}
            />
          )}
        </>
      }
    >
      <Form
        id="module-weighing-create-form"
        onSubmit={handleSubmit((data) => moduleWeighingMutation.mutate(data))}
      >
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {/* D8 (correção 050) — `code` gerado no servidor, SEMPRE texto
              READONLY (nunca campo de payload), mirror `_forms.blade:14` +
              `CreateOrUpdateDeathAnimal.tsx`. Sem endpoint de "próximo
              código" nesta API — na criação usa o hint padrão do módulo. */}
          <InputReadOnly
            label={text.create.fields.code}
            value={isEditing ? (codeDisplay ?? '') : text.create.hints.codeGeneratedOnSave}
            loading={isLoading}
          />

          {/* EST-07 (DEC-018) — `date` migrado para `DateInput` nativo Chakra
              (não regredir para `<Input type="date">`); contrato string
              `yyyy-MM-dd` ponta-a-ponta, idêntico ao payload anterior. */}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DateInput
                label={text.create.fields.date}
                isRequired
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? '')}
                error={errors.date?.message}
                disabled={isLoading}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label={text.create.fields.type}
                name={field.name}
                isRequired
                loading={isLoading}
                options={moduleWeighingTypeOptions.options(languageGB)}
                value={
                  field.value != null
                    ? moduleWeighingTypeOptions.getOption(field.value as any, languageGB)
                    : null
                }
                onChange={(option) => field.onChange(option?.value ?? null)}
                error={errors.type?.message}
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select
                label={text.create.fields.category}
                name={field.name}
                isRequired
                isDisabled={categoryReadOnly}
                loading={isLoading}
                options={moduleWeighingCategoryOptions.options(languageGB)}
                value={
                  field.value
                    ? moduleWeighingCategoryOptions.getOption(field.value as any, languageGB)
                    : null
                }
                onChange={(option) => field.onChange(option?.value ?? null)}
                error={errors.category?.message}
              />
            )}
          />

          <Controller
            name="product"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.create.fields.product}
                isRequired
                service={listProductOptions}
                mapOptions={(item: ProductOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={findParams}
                value={field.value ?? null}
                onChange={(option: any) => {
                  field.onChange(option ?? null);
                  setSelectedProductUuid(option?.value ?? null);
                  setValue('measurement', null, { shouldDirty: false });
                }}
                error={errors.product?.message}
                labelActionTooltip="Cadastro rápido"
                labelAction={
                  <SubRegisterTrigger
                    hasValue={!!field.value}
                    onClick={() => setProductDialogOpen(true)}
                  />
                }
              />
            )}
          />

          <Controller
            name="measurement"
            control={control}
            render={({ field }) => (
              <Select
                label={text.create.fields.measurement}
                name={field.name}
                // Correção 050 (D5) — obrigatório, mirror `_forms.blade:60`.
                isRequired
                loading={productDetailQuery.isFetching}
                options={measurementSelectOptions}
                value={field.value}
                onChange={(option) => field.onChange(option ?? null)}
                error={errors.measurement?.message}
              />
            )}
          />

          <Controller
            name="area"
            control={control}
            render={({ field }) => (
              <Select
                label={text.create.fields.area}
                name={field.name}
                loading={areasQuery.isFetching}
                options={areaOptions}
                value={field.value}
                onChange={(option) => field.onChange(option ?? null)}
                error={errors.area?.message}
              />
            )}
          />

          <Controller
            name="warehouse"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.create.fields.warehouse}
                isRequired={!warehouseReadOnly}
                isDisabled={warehouseReadOnly}
                service={listWarehouseOptions}
                mapOptions={(item: WarehouseOption) => ({
                  label: `${item.initials} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={findParams}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={errors.warehouse?.message}
                labelActionTooltip={warehouseReadOnly ? undefined : 'Cadastro rápido'}
                labelAction={
                  warehouseReadOnly ? undefined : (
                    <SubRegisterTrigger
                      hasValue={!!field.value}
                      onClick={() => setWarehouseDialogOpen(true)}
                    />
                  )
                }
              />
            )}
          />

          <Controller
            name="equipment"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.create.fields.equipment}
                isRequired
                service={listEquipmentCatalogOptions}
                mapOptions={(item: EquipmentOption) => ({
                  label: `${item.code} — ${item.description}`,
                  value: item.uuid,
                })}
                findParams={findParams}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={errors.equipment?.message}
                labelActionTooltip="Cadastro rápido"
                labelAction={
                  <SubRegisterTrigger
                    hasValue={!!field.value}
                    onClick={() => setEquipmentDialogOpen(true)}
                  />
                }
              />
            )}
          />

          <Controller
            name="provider"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={text.create.fields.provider}
                isRequired
                service={listProviderOptions}
                mapOptions={(item: ProviderOptionItem) => ({
                  label: item.label,
                  value: item.uuid,
                })}
                findParams={findParams}
                value={field.value ?? null}
                onChange={(option: any) => field.onChange(option ?? null)}
                error={errors.provider?.message}
                labelActionTooltip="Cadastro rápido"
                labelAction={
                  <SubRegisterTrigger
                    hasValue={!!field.value}
                    onClick={() => setProviderDialogOpen(true)}
                  />
                }
              />
            )}
          />

          {/* D1 (correção 050) — "Responsável" é texto READONLY, nunca um
              select de funcionário: usuário logado na criação
              (`user?.username`), responsável já resolvido pelo servidor na
              edição (`data.responsible?.name`), mirror `_forms.blade:20-21`
              + `CreateBatchArea.tsx`/`CreateBatchGrazing.tsx`. */}
          <InputReadOnly
            label={text.create.fields.employee}
            value={isEditing ? (responsibleNameDisplay ?? '') : (user?.username ?? '')}
            loading={isLoading}
          />

          {showClient && (
            <Controller
              name="client"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.create.fields.client}
                  // Correção 050 (D7) — obrigatório só em
                  // `{VendaSaida, EntradaTerceiros}`; opcional em
                  // `Avulsa+Externa` (mirror `_forms.blade:430-440`).
                  isRequired={clientRequired}
                  service={listOrderClientOptions}
                  mapOptions={(item: OrderClientOptionItem) => ({
                    label: item.name ?? item.uuid,
                    value: item.uuid,
                  })}
                  findParams={findParams}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.client?.message}
                  labelActionTooltip="Cadastro rápido"
                  labelAction={
                    <SubRegisterTrigger
                      hasValue={!!field.value}
                      onClick={() => setClientDialogOpen(true)}
                    />
                  }
                />
              )}
            />
          )}

          {showProviderBuy && (
            <Controller
              name="providerBuy"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.create.fields.providerBuy}
                  isRequired
                  service={listProviderOptions}
                  mapOptions={(item: ProviderOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={findParams}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.providerBuy?.message}
                  labelActionTooltip="Cadastro rápido"
                  labelAction={
                    <SubRegisterTrigger
                      hasValue={!!field.value}
                      onClick={() => setProviderBuyDialogOpen(true)}
                    />
                  }
                />
              )}
            />
          )}

          {showFarmTo && (
            <Controller
              name="farmTo"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.create.fields.farmTo}
                  name={field.name}
                  isRequired
                  loading={farmsQuery.isFetching}
                  options={farmToOptions}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={errors.farmTo?.message}
                />
              )}
            />
          )}

          {hasProductLot && (
            <Input
              label={text.create.fields.providerLot}
              isRequired
              error={errors.providerLot?.message}
              {...register('providerLot')}
            />
          )}
          {/* D2 (correção 050) — `lot` REMOVIDO: não é campo de form no
              legado (`uniqid()` gerado no servidor). `providerLot` acima
              continua sendo o único campo de lote do usuário. */}
          {hasProductLot && (
            <Controller
              name="expirationDate"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.create.fields.expirationDate}
                  isRequired
                  value={field.value ?? null}
                  onChange={(value) => field.onChange(value ?? '')}
                  error={errors.expirationDate?.message}
                />
              )}
            />
          )}

          <Controller
            name="hasClassification"
            control={control}
            render={({ field }) => (
              <Switch.Root
                checked={field.value}
                onCheckedChange={({ checked }: { checked: boolean }) => field.onChange(checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>{text.create.fields.hasClassification}</Switch.Label>
              </Switch.Root>
            )}
          />

          {watchHasClassification && (
            <Controller
              name="discountTable"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.create.fields.discountTable}
                  name={field.name}
                  loading={discountTablesQuery.isFetching}
                  options={discountTableOptions}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  error={errors.discountTable?.message}
                />
              )}
            />
          )}
        </SimpleGrid>

        <Text mt={4} mb={2} fontWeight="medium">
          {text.create.fields.note}
        </Text>
        <Textarea {...register('note')} />
      </Form>

      {/* Diálogos de sub-cadastro (TASK-MWG-FE-10/11) — cada `ProviderDialog`
          é uma instância isolada com `uuid` próprio (fecha DV-009 por
          construção: nenhum `id` DOM compartilhado entre `provider` e
          `providerBuy`, mesmo componente em 2 pontos de entrada). */}
      <ProductDialog
        isOpen={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        productUuid={watch('product')?.value}
        onSaved={(product) => {
          setValue('product', { value: product.uuid, label: product.label }, { shouldDirty: true });
          setSelectedProductUuid(product.uuid);
        }}
      />
      <WarehouseDialog
        isOpen={warehouseDialogOpen}
        onClose={() => setWarehouseDialogOpen(false)}
        warehouseUuid={watch('warehouse')?.value}
        onSaved={(warehouse) =>
          setValue(
            'warehouse',
            { value: warehouse.uuid, label: warehouse.label },
            { shouldDirty: true }
          )
        }
      />
      <EquipmentDialog
        isOpen={equipmentDialogOpen}
        onClose={() => setEquipmentDialogOpen(false)}
        equipmentUuid={watch('equipment')?.value}
        onSaved={(equipment) =>
          setValue(
            'equipment',
            { value: equipment.uuid, label: equipment.label },
            { shouldDirty: true }
          )
        }
      />
      <ProviderDialog
        isOpen={providerDialogOpen}
        onClose={() => setProviderDialogOpen(false)}
        providerUuid={watch('provider')?.value}
        onSaved={(provider) =>
          applySavedProvider(provider, () =>
            setValue(
              'provider',
              { value: provider.uuid, label: provider.label },
              { shouldDirty: true }
            )
          )
        }
      />
      <ProviderDialog
        isOpen={providerBuyDialogOpen}
        onClose={() => setProviderBuyDialogOpen(false)}
        providerUuid={watch('providerBuy')?.value}
        onSaved={(provider) =>
          applySavedProvider(provider, () =>
            setValue(
              'providerBuy',
              { value: provider.uuid, label: provider.label },
              { shouldDirty: true }
            )
          )
        }
      />
      <ClientDialog
        isOpen={clientDialogOpen}
        onClose={() => setClientDialogOpen(false)}
        clientUuid={watch('client')?.value}
        onSaved={(client) =>
          setValue('client', { value: client.uuid, label: client.label }, { shouldDirty: true })
        }
      />
    </FormContainer>
  );
}
