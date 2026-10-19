// src/pages/CadastrosBase/Areas/CreateOrUpdateArea.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de ÁREA (Area — subdivisão geoespacial da
// Fazenda, F-348/UT-000446, esteira 067, TASK-FE-420) — PÁGINA CHEIA (mapa
// grande em cima + formulário embaixo, fiel aos prints do dono, UX-GAP-01
// já decidido pelo contrato de tela §6: "página cheia" > modal enxuto do
// `cerne`). Embute o `AreaMapEditor` (TASK-FE-419) + os 14 campos do
// formulário + cálculos em cascata + submit criar/editar.
//
// Rotas (registradas pela TASK-FE-422, `area-routes.ts` já as define):
// `areaCreateRoute(farmUuid)` → `/cadastros-base/fazendas/:farmId/areas/novo`
// `areaEditRoute(farmUuid, areaUuid)` → `.../areas/:areaId`.
//
// Molde estrutural: mirror de `CentroCusto/CreateOrUpdateCentroCusto.tsx`
// (CRUD Simples por GUID, `useRequest`, 422 mapeado por campo via `setError`,
// footer com `Button`/`ButtonSaveAndNext` fora do `<form>` apenas
// visualmente — o clique dispara `handleSubmit` mesmo assim) combinado com
// `Fazendas/CreateOrUpdateFarm.tsx` (integração do mapa via `getValues`/
// `setValue` do MESMO `useForm`, campo `coordinates` populado pelo editor de
// mapa). Diferença: Área não é wizard — 1 página só, mapa + formulário.
//
// Riscos/armadilhas do task-packet (ver `07-Tarefas_Frontend/420-*.md`):
//   (1) `isEmpty()` do projeto é INVERTIDO (`ERRO-FE-001`) — `fillAreaForm`
//       usa a guarda EXATA `!isEmpty(dirtyFields) || resetForce` (Lei 2).
//   (2) `KgInput` persiste SEMPRE `floatValue` (nunca a string mascarada).
//   (3) `unproductive_area` é SEMPRE derivada/readonly (`total − produtiva`)
//       — cascata client-side própria (`useEffect` abaixo), NUNCA um keyup
//       morto (CLM-06b, não portado).
//   (4) Escrita em modo EDIÇÃO usa FULL-REPLACE — reenvia o OBJETO COMPLETO
//       do formulário (mirror exato de `buildAreaCreatePayload`, ver
//       `buildAreaUpdatePayload` abaixo), IGUAL ao full-resource-replace de
//       `CentroCusto`/`Farm`/`Evento`. Decisão GAP-BE-688 (resolução (b),
//       fidelidade ao legado — o legado é um full-page resubmit que sempre
//       reenvia todos os campos): a API exige o recurso completo no update
//       (`sometimes|required` em quase todos os campos) e NÃO foi
//       afrouxada (a regra de soma de hectares depende dos campos). O PATCH
//       PARCIAL por `dirtyFields` que esta tela usava antes (TASK-FE-420)
//       foi ABANDONADO por quebrar 100% das edições parciais (422 em
//       qualquer campo isolado, reproduzido 3x pelo Tester). `services/v2/
//       BaseRegistrations/areas-service.ts::updateArea` continua aceitando
//       `Partial<UpdateAreaRequest>` (tipo mais permissivo, sem regressão de
//       assinatura) — esta tela sempre envia o objeto cheio.
//   (5) 422 flat → por campo no RHF (`mapAreaApiFieldToFormField`); 403
//       (limite de plano) já é tratado GLOBALMENTE pelo interceptor
//       (`services/api.ts`, evento `tier-access-denied` + `_tierHandled` —
//       `useRequest` não duplica toast) — nada extra a fazer aqui.
//   (6) Selects via fábrica de options (`getOption`/`options`); `color`/
//       `type` já nascem `Option<T>` no `AreaForm` (TASK-FE-415) — sem
//       conversão manual. `is_enabled`/`recreation_area` são `boolean` cru
//       no `AreaForm` (não `Option<boolean>`) — Select "Sim/Não" mirror
//       EXATO de `CentroCusto/CreateOrUpdateCentroCusto.tsx` (TASK-FE-CC-08).
//   (7) `date` é OBRIGATÓRIO (§4.D) — já garantido pelo schema (415).
//
// UX-GAP-01-Cor (contrato §6, default do dono): `Select` de `Option<AreaColor>`
// (14 cores, `areaColorOptions`) + chip de cor ao lado (preview do hex
// selecionado, `areaColor[value].hex`) — o `Select` compartilhado
// (`components/Form/Select.tsx`, ~50 callsites) não tem slot de swatch por
// opção; o chip é composto AO LADO do campo nesta tela (adaptação honesta,
// não uma cópia 1:1 do Storybook — Regra 2). O polígono do mapa já é pintado
// ao vivo pela própria cor via prop `color` do `AreaMapEditor` (419).
//
// GAP-FE-259 FECHADO (retoque F-348/UT-000446, esteira 067): `AreaResource`
// (`GET /areas/{uuid}`) agora expõe `proprietary: {uuid, label} | null`
// (`whenLoaded('proprietary')`, mirror `activity`/`infrastructure`) — o
// campo "Proprietário Gestor" é HIDRATADO em modo edição por `fillAreaForm`
// abaixo, mapeado para o `SelectCombobox` (`value=uuid`, `label=label`).
// Criação/edição continuam enviando `proprietary_uuid` normalmente quando o
// usuário seleciona (inalterado, `buildAreaCreatePayload`/`buildAreaUpdatePayload`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { KgInput } from '@/components/Form/kgInput';
import { Select } from '@/components/Form/Select';
import { SelectCombobox } from '@/components/Form/SelectCombobox';
import { Textarea } from '@/components/Form/Textarea';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { AreaColor } from '@/constants/areas/area/areas-status';
import { areaColorOptions, areaTypeOptions } from '@/constants/areas/area/options';
import { columnsForm } from '@/constants/coluns-form';
import { markerType } from '@/constants/Marker/marker-type';
import { queryKey } from '@/constants/query-key';

import { areaSchemaResolver } from '@/validations/schemas/Areas/area-schema';

import { createArea, updateArea } from '@/services/v2/BaseRegistrations/areas-service';

import type { Option } from '@/@types/option';
import type {
  AreaCoordinates,
  AreaData,
  AreaForm,
  CreateAreaRequest,
  UpdateAreaRequest,
} from '@/@types/v2/BaseRegistrations/areas';

import { AreaMapEditor } from './AreaMapEditor';
import { useActiveMarkersList, useAreaForm } from './useAreas';

import { useProprietariesList } from '../ContasBancarias/useAccounts';

function emptyAreaForm(): AreaForm {
  return {
    description: '',
    registration: null,
    date: null,
    proprietary: null,
    type: null,
    activity: null,
    recreation_area: false,
    color: null,
    infrastructure: [],
    total_area: 0,
    productive_area: 0,
    unproductive_area: 0,
    is_enabled: true,
    note: null,
    coordinates: null,
    activity_icon_coordinates: null,
    infrastructure_icon_coordinates: null,
  };
}

// Mapa achado→campo do RHF — 1:1 na maioria, exceto os 2 lookups (`*_uuid`
// no payload vira `Option` sem sufixo no form). Chaves sem correspondência
// visível na tela (`farm_uuid`, se um dia vier no 422) caem no fallback
// genérico do `useRequest`/`getBusinessMutationErrorMessage` (toast), nunca
// são descartadas silenciosamente.
function mapAreaApiFieldToFormField(apiField: string): keyof AreaForm | null {
  const map: Partial<Record<string, keyof AreaForm>> = {
    description: 'description',
    registration: 'registration',
    date: 'date',
    type: 'type',
    color: 'color',
    recreation_area: 'recreation_area',
    is_enabled: 'is_enabled',
    note: 'note',
    coordinates: 'coordinates',
    total_area: 'total_area',
    productive_area: 'productive_area',
    unproductive_area: 'unproductive_area',
    infrastructure: 'infrastructure',
    proprietary_uuid: 'proprietary',
    activity_uuid: 'activity',
  };
  return map[apiField] ?? null;
}

// CREATE — payload SEMPRE completo (`farm_uuid` obrigatório, imutável depois).
function buildAreaCreatePayload(data: AreaForm, farmUuid: string): CreateAreaRequest {
  return {
    farm_uuid: farmUuid,
    description: data.description.trim(),
    registration: data.registration?.trim() || undefined,
    // `date`/`coordinates`/`type`/`color` são `required` pelo schema (415) —
    // non-null assertion é segura no submit (RHF só chama `tryPersistArea`
    // depois do resolver Yup validar).
    date: data.date as string,
    coordinates: data.coordinates as AreaCoordinates,
    type: data.type!.value,
    color: data.color!.value,
    recreation_area: !!data.recreation_area,
    total_area: data.total_area,
    productive_area: data.productive_area,
    unproductive_area: data.unproductive_area,
    is_enabled: !!data.is_enabled,
    note: data.note?.trim() || undefined,
    activity_icon_coordinates: data.activity_icon_coordinates ?? undefined,
    infrastructure_icon_coordinates: data.infrastructure_icon_coordinates ?? undefined,
    activity_uuid: data.activity?.value ?? null,
    proprietary_uuid: data.proprietary?.value ?? null,
    infrastructure: (data.infrastructure ?? []).map((item) => item.value),
  };
}

// EDIT — FULL-REPLACE (GAP-BE-688, resolução (b): fidelidade ao legado, que
// sempre reenvia o formulário inteiro no update). Mirror EXATO de
// `buildAreaCreatePayload`, SEM `farm_uuid` (imutável no update — aceito
// `sometimes` pela API mas IGNORADO pela Action, matriz FID-G3A A-04; não
// reenviado por decisão de produto). Todos os campos chegam aqui já
// hidratados pelo `fillAreaForm`/`getArea` — inclusive os que o usuário não
// tocou nesta sessão de edição — então o objeto é sempre completo, nunca um
// PATCH parcial.
function buildAreaUpdatePayload(data: AreaForm): UpdateAreaRequest {
  return {
    description: data.description.trim(),
    registration: data.registration?.trim() || undefined,
    date: data.date as string,
    coordinates: data.coordinates as AreaCoordinates,
    type: data.type!.value,
    color: data.color!.value,
    recreation_area: !!data.recreation_area,
    total_area: data.total_area,
    productive_area: data.productive_area,
    unproductive_area: data.unproductive_area,
    is_enabled: !!data.is_enabled,
    note: data.note?.trim() || undefined,
    activity_icon_coordinates: data.activity_icon_coordinates ?? undefined,
    infrastructure_icon_coordinates: data.infrastructure_icon_coordinates ?? undefined,
    activity_uuid: data.activity?.value ?? null,
    proprietary_uuid: data.proprietary?.value ?? null,
    infrastructure: (data.infrastructure ?? []).map((item) => item.value),
  };
}

export default function CreateOrUpdateArea() {
  const { farmId, areaId } = useParams<{ farmId: string; areaId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const isFarmValid = isValidGuid(farmId);
  const isEditing = isValidGuid(areaId);
  const canSave = isEditing ? can('farms_edit') : can('farms_create');

  const text = languageGB.areas.area.form;

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<AreaForm>({
    mode: 'onChange',
    resolver: areaSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    // Correção do dono (F-348/UT-000446): "Cor da Área" nasce Verde
    // (`AreaColor.GREEN`) em vez de `null` — continua editável/`isRequired`.
    // `languageGB` só existe DENTRO do componente (`getOption` exige o
    // idioma para o `label`) — por isso o default NÃO entra na função pura
    // `emptyAreaForm()`, só aqui, sobrepondo o `color: null` dela.
    defaultValues: {
      ...emptyAreaForm(),
      color: areaColorOptions.getOption(AreaColor.GREEN, languageGB),
    },
  });

  // Lei 2 — função NOMEADA com guarda `!isEmpty(dirtyFields) || resetForce`
  // (ERRO-FE-001: `isEmpty` retorna `true` quando HÁ chaves — nunca remover
  // o `!`).
  function fillAreaForm(data: AreaData, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        registration: data.registration ?? null,
        date: data.date ?? null,
        // GAP-FE-259 FECHADO — `AreaResource` agora devolve `proprietary`
        // (`whenLoaded`), mirror EXATO de `activity` logo abaixo.
        proprietary: data.proprietary
          ? { label: data.proprietary.label, value: data.proprietary.uuid }
          : null,
        type: data.type != null ? areaTypeOptions.getOption(data.type, languageGB) : null,
        activity: data.activity
          ? { label: data.activity.description, value: data.activity.uuid }
          : null,
        recreation_area: !!data.recreation_area,
        color: data.color ? areaColorOptions.getOption(data.color, languageGB) : null,
        infrastructure: (data.infrastructure ?? []).map((item) => ({
          label: item.description,
          value: item.uuid,
        })),
        total_area: data.total_area,
        productive_area: data.productive_area,
        unproductive_area: data.unproductive_area,
        is_enabled: !!data.is_enabled,
        note: data.note ?? null,
        coordinates: data.coordinates ?? null,
        activity_icon_coordinates: data.activity_icon_coordinates ?? null,
        infrastructure_icon_coordinates: data.infrastructure_icon_coordinates ?? null,
      });
    }
  }

  const areaQuery = useAreaForm({
    registrationId: isEditing ? areaId : undefined,
    fillForm: fillAreaForm,
  });

  const isLoading = isEditing && checkLoadingStatus([areaQuery as any]);

  // "Proprietário Gestor" — `SelectCombobox` sobre `listProprietaryOptions`
  // (endpoint NÃO-paginado), reaproveitando `useProprietariesList()` já
  // existente (`ContasBancarias/useAccounts.tsx`) — mirror EXATO do mesmo
  // campo em `CreateSaldoInicial.tsx`, nenhum hook/service novo.
  // F-348/UT-000446 (esteira 067): filtrado pela FAZENDA DA ÁREA (`farmId`
  // da rota, mirror `farmId as string` usado no resto do arquivo) via
  // `farm_uuid` — fiel ao legado, que nunca listou proprietários de outras
  // fazendas do tenant neste campo.
  const proprietariesQuery = useProprietariesList(farmId as string);
  const proprietaryOptions: Option<string>[] = (proprietariesQuery.data ?? []).map((item) => ({
    label: item.label,
    value: item.uuid,
  }));

  // "Atividade"/"Infraestrutura" — correção do dono (F-348/UT-000446):
  // `listMarkers` (`GET /markers`, gated `permission:markers_view`, escopo
  // ADMINISTRATIVO de CRUD de Marcadores) devolvia 403/toast "Sem permissão"
  // para o usuário comum de Área. `useActiveMarkersList` consome a rota
  // ABERTA `GET /markers/active?type=N` (SOMENTE `auth:sanctum`, DA-MK-12) —
  // mirror EXATO do padrão `useProprietariesList` acima (endpoint
  // NÃO-paginado, options client-side). Atividade é single (`SelectCombobox`,
  // mirror Proprietário); Infraestrutura é multi — `Select` do próprio
  // projeto já suporta `multiple` (mesmo componente usado por
  // `type`/`color`/Sim-Não abaixo), sem precisar de um combobox multi novo.
  const activityMarkersQuery = useActiveMarkersList(markerType.activity);
  const activityOptions: Option<string>[] = (activityMarkersQuery.data ?? []).map((item) => ({
    label: item.description,
    value: item.uuid,
  }));

  const infrastructureMarkersQuery = useActiveMarkersList(markerType.infrastructure);
  const infrastructureOptions: Option<string>[] = (infrastructureMarkersQuery.data ?? []).map(
    (item) => ({
      label: item.description,
      value: item.uuid,
    })
  );

  // "Sim/Não" (`is_enabled`/`recreation_area`) — mirror EXATO de
  // `CentroCusto/CreateOrUpdateCentroCusto.tsx` (TASK-FE-CC-08): o DADO
  // continua `boolean` no RHF (`AreaForm.is_enabled`/`.recreation_area`,
  // TASK-FE-415), a conversão string↔boolean só acontece na fronteira do
  // próprio `Select`.
  const yesNoOptions: Option<string>[] = [
    { value: 'true', label: languageGB.defaltStrings.yes },
    { value: 'false', label: languageGB.defaltStrings.no },
  ];

  const areaMutation = useRequest({
    asyncFunction: tryPersistArea,
    entityName: languageGB.areas.area.singularLabel,
    queryKey: queryKey.cadastrosBase.areas,
    queryKey2: queryKey.cadastrosBase.area,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistArea(data: AreaForm) {
    try {
      if (isEditing && areaId) {
        const payload = buildAreaUpdatePayload(data);
        return await updateArea(areaId, payload);
      }
      const payload = buildAreaCreatePayload(data, farmId as string);
      return await createArea(payload);
    } catch (error) {
      // 422 flat → por campo (Riscos #5) — 403 de limite de plano já é
      // tratado GLOBALMENTE pelo interceptor (`services/api.ts`), nunca
      // chega aqui como algo a mapear.
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const formField = mapAreaApiFieldToFormField(field);
          if (formField && messages?.[0]) {
            setError(formField, { type: 'server', message: messages[0] });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: AreaForm) {
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await areaMutation.mutateAsync(data);
    }
  }

  const isSubmitting = areaMutation.isPending;

  // Cascata (de-para §4 item 3): `unproductive_area` é SEMPRE derivada
  // (`total_area − productive_area`) — dispara só quando o PRÓPRIO usuário
  // (ou o mapa, via `AreaMapEditor.commitFeature`) sujou `total_area`/
  // `productive_area`; nunca na hidratação inicial (`fillAreaForm` já traz o
  // valor autoritativo do backend). NÃO portar o keyup morto de
  // `unproductive_area` (CLM-06b).
  const watchedTotalArea = watch('total_area');
  const watchedProductiveArea = watch('productive_area');

  useEffect(() => {
    if (!dirtyFields.total_area && !dirtyFields.productive_area) return;
    const total = Number(watchedTotalArea) || 0;
    const productive = Number(watchedProductiveArea) || 0;
    const nextUnproductive = Math.round((total - productive) * 100) / 100;
    setValue('unproductive_area', nextUnproductive, { shouldDirty: true, shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedTotalArea,
    watchedProductiveArea,
    dirtyFields.total_area,
    dirtyFields.productive_area,
  ]);

  // Props ao vivo do `AreaMapEditor` (419) — cor repinta o polígono,
  // atividade/infra alimentam os marcadores arrastáveis.
  const watchedColor = watch('color');
  const watchedActivity = watch('activity');
  const watchedInfrastructure = watch('infrastructure');
  // GAP-FE-261 Fix II.1 — `coordinates` ao vivo (mirror de como `color`/
  // `activity`/`infrastructure` já são passados acima): em edição, `null`
  // na 1ª renderização e populado quando `fillAreaForm`/`getArea` resolvem
  // (assíncrono). Ser PROP reativa é o que permite ao `AreaMapEditor`
  // reagir e desenhar o polígono quando o dado chega — não mais um
  // `getValues` lido uma única vez na montagem do mapa.
  const watchedCoordinates = watch('coordinates');

  if (!isFarmValid) {
    return (
      <FormContainer title={isEditing ? text.title.edit : text.title.create}>
        <Box
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          px={4}
          py={6}
          textAlign="center"
        >
          <Text fontSize="md" fontWeight="semibold" color="fg.error">
            {text.farmNotFound.title}
          </Text>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            {text.farmNotFound.description}
          </Text>
        </Box>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={isEditing ? text.title.edit : text.title.create}
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
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form noPadding onSubmit={handleSubmit(onSubmit)}>
        {/* Seção 1 — Demarcação (mapa grande em cima, fiel aos prints do
            dono, UX-GAP-01 §6). Embute o editor de mapa (419) via
            getValues/setValue do MESMO useForm. */}
        <Box mb={3}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {text.sections.map}
          </Text>
        </Box>

        <AreaMapEditor
          getValues={getValues}
          setValue={setValue}
          farmUuid={farmId as string}
          areaUuid={isEditing ? areaId : undefined}
          color={watchedColor?.value ?? null}
          coordinates={watchedCoordinates ?? null}
          activityMarker={
            watchedActivity
              ? {
                  key: watchedActivity.value,
                  // `icon_url` resolvido da MESMA lista aberta que alimenta o
                  // Select acima — sem `GET /markers/{uuid}` gated.
                  iconUrl:
                    activityMarkersQuery.data?.find((item) => item.uuid === watchedActivity.value)
                      ?.icon_url ?? null,
                }
              : null
          }
          infrastructureMarkers={(watchedInfrastructure ?? []).map((item) => ({
            key: item.value,
            iconUrl:
              infrastructureMarkersQuery.data?.find((marker) => marker.uuid === item.value)
                ?.icon_url ?? null,
          }))}
          disabled={!canSave || isSubmitting}
          loading={!!isLoading}
        />

        {/* Seção 2 — Dados da área (14 campos, formulário embaixo do mapa). */}
        <Box mt={8} mb={3}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            {text.sections.details}
          </Text>
        </Box>

        <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
          <Input
            label={text.fields.description}
            placeholder={text.placeholders.description}
            {...register('description')}
            error={errors.description?.message}
            isRequired
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DateInput
                value={field.value ?? null}
                onChange={(value) => field.onChange(value ?? null)}
                label={text.fields.date}
                error={error?.message}
                isRequired
                disabled={!canSave || !!isLoading}
              />
            )}
          />

          <Input
            label={text.fields.registration}
            placeholder={text.placeholders.registration}
            {...register('registration')}
            error={errors.registration?.message}
            loading={!!isLoading}
            disabled={!canSave}
          />

          <Controller
            name="proprietary"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.fields.proprietary}
                placeholder={text.placeholders.proprietary}
                options={proprietaryOptions}
                loading={proprietariesQuery.isLoading || !!isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.fourColumns} gap={6} mt={6}>
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.fields.type}
                name={field.name}
                value={field.value ?? null}
                onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                options={areaTypeOptions.options(languageGB)}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={!!isLoading}
              />
            )}
          />

          <Controller
            name="activity"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <SelectCombobox
                name={field.name}
                label={text.fields.activity}
                placeholder={text.placeholders.activity}
                options={activityOptions}
                loading={activityMarkersQuery.isLoading}
                value={field.value ?? null}
                onChange={(option) => field.onChange(option ?? null)}
                error={error?.message}
                disabled={!canSave}
              />
            )}
          />

          <Controller
            name="recreation_area"
            control={control}
            render={({ field }) => (
              <Select
                label={text.fields.recreationArea}
                name={field.name}
                value={
                  yesNoOptions.find((o) => o.value === (field.value ? 'true' : 'false')) ?? null
                }
                onChange={(option: Option<string> | null) =>
                  field.onChange(option?.value === 'true')
                }
                options={yesNoOptions}
                noClearable
                isDisabled={!canSave}
                loading={!!isLoading}
              />
            )}
          />

          {/* Cor da Área — UX-GAP-01-Cor (§6): Select das 14 cores + chip de
              preview ao lado (adaptação honesta, ver nota de cabeçalho). */}
          <Flex gap={2} align="flex-end">
            <Box flex="1">
              <Controller
                name="color"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Select
                    label={text.fields.color}
                    name={field.name}
                    value={field.value ?? null}
                    onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                    options={areaColorOptions.options(languageGB)}
                    error={error?.message}
                    isRequired
                    noClearable
                    isDisabled={!canSave}
                    loading={!!isLoading}
                  />
                )}
              />
            </Box>
            <Box
              aria-hidden="true"
              boxSize="38px"
              borderRadius="md"
              border="1px solid"
              borderColor="border.subtle"
              bg={watchedColor?.value ?? 'transparent'}
              flexShrink={0}
            />
          </Flex>
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.twoColumns} gap={6} mt={6}>
          <Controller
            name="infrastructure"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                multiple
                name={field.name}
                label={text.fields.infrastructure}
                placeholder={text.placeholders.infrastructure}
                options={infrastructureOptions}
                loading={infrastructureMarkersQuery.isLoading}
                value={field.value ?? []}
                onChange={(options: Option<string>[] | null) => field.onChange(options ?? [])}
                error={error?.message}
                isDisabled={!canSave}
              />
            )}
          />

          <Controller
            name="is_enabled"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Select
                label={text.fields.isEnabled}
                name={field.name}
                value={
                  yesNoOptions.find((o) => o.value === (field.value ? 'true' : 'false')) ?? null
                }
                onChange={(option: Option<string> | null) =>
                  field.onChange(option?.value === 'true')
                }
                options={yesNoOptions}
                error={error?.message}
                isRequired
                noClearable
                isDisabled={!canSave}
                loading={!!isLoading}
              />
            )}
          />
        </SimpleGrid>

        <SimpleGrid columns={columnsForm.threeColumns} gap={6} mt={6}>
          <Controller
            name="total_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <KgInput
                name={field.name}
                label={text.fields.totalArea}
                value={field.value ?? ''}
                onChange={(_event, _masked, floatValue) => field.onChange(floatValue ?? 0)}
                allowDot
                decimalPlaces={2}
                isRequired
                isReadOnly={!canSave}
                error={error?.message}
              />
            )}
          />

          <Controller
            name="productive_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <KgInput
                name={field.name}
                label={text.fields.productiveArea}
                value={field.value ?? ''}
                onChange={(_event, _masked, floatValue) => field.onChange(floatValue ?? 0)}
                allowDot
                decimalPlaces={2}
                isRequired
                isReadOnly={!canSave}
                error={error?.message}
              />
            )}
          />

          {/* Sempre readonly/derivada — total − produtiva (de-para §4 item
              2/3). NÃO portar o keyup morto (CLM-06b). */}
          <Controller
            name="unproductive_area"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <KgInput
                name={field.name}
                label={text.fields.unproductiveArea}
                value={field.value ?? ''}
                allowDot
                decimalPlaces={2}
                isRequired
                isReadOnly
                error={error?.message}
              />
            )}
          />
        </SimpleGrid>

        <Box mt={6}>
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Textarea
                label={text.fields.note}
                placeholder={text.placeholders.note}
                name={field.name}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value)}
                error={error?.message}
                loading={!!isLoading}
                disabled={!canSave}
              />
            )}
          />
        </Box>
      </Form>
    </FormContainer>
  );
}
