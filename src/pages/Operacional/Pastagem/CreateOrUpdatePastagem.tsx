// src/pages/Operacional/Pastagem/CreateOrUpdatePastagem.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Pastagem — TASK-PAST-FE-03 (casca +
// aba Geral + cascatas) + TASK-PAST-FE-04 (Equipamentos/Serviços/Produção) +
// TASK-PAST-FE-05 (Produtos/Insumos + Ocorrências). 1 `useForm` RAIZ
// (`PastureForm`) com resolver ÚNICO (`pastureSchemaResolver`), casca
// `Tabs.Root` (mirror `CreateOrUpdateAppropriation.tsx`) — cada aba de
// subcadastro é um arquivo próprio em `subcadastros/`, recebendo
// `control`/`errors`/`watch`/`setValue` do MESMO form raiz. Submit único
// (CLM-51) — os 5 arrays vão aninhados no mesmo payload de
// `createPasture`/`updatePasture`.
//
// GAP-PAST-FE-01 — cascata por `date` (`check-date`, RT-11) NÃO
// implementada: endpoint confirmado ausente no fork da API (decisão de
// condução do Maestro, 2026-08-19: deferir, não reabrir a camada api
// validada). A validação client-side desta tela cobre apenas o que os
// schemas locais conseguem expressar (área XOR módulo de pastejo,
// campos obrigatórios) — a checagem de data vs. disponibilidade de
// área/lote permanece pendente do endpoint. Ver `useCascadesPastagem.ts`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Tabs } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { fileToDataUri } from '@/utils/fileToDataUri';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { funcTypeOptions } from '@/constants/pastures/options/func-type-options';
import { priorityOptions } from '@/constants/pastures/options/priority-options';
import { queryKey } from '@/constants/query-key';

import { pastureSchemaResolver } from '@/validations/schemas/Pastures/pasture-schema';

import { createPasture, getPasture, updatePasture } from '@/services/v2/Pastures';

import type {
  PastureDetail,
  PastureForm as PastureFormType,
  PastureWritePayload,
} from '@/@types/v2/Pastures';

import { HeaderFieldsPastagem } from './HeaderFieldsPastagem';
import { EquipmentsFieldArray } from './subcadastros/EquipmentsFieldArray';
import { OccurrencesFieldArray } from './subcadastros/OccurrencesFieldArray';
import { ProductionFieldArray } from './subcadastros/ProductionFieldArray';
import { ProductsFieldArray } from './subcadastros/ProductsFieldArray';
import { ServicesFieldArray } from './subcadastros/ServicesFieldArray';

import type { FieldErrors } from 'react-hook-form';

type PastureTabKey = '0' | '1' | '2' | '3' | '4' | '5';

// TASK-PAST-FIX-FE-03b — `inputs_warehouse_uuid`/`productions_warehouse_uuid`
// relocados visualmente para o TOPO das abas Insumos/Produção
// (`ProductsFieldArray.tsx`/`ProductionFieldArray.tsx`, mirror do legado);
// o mapa de abas para o `onInvalid` (pula para a aba com erro) segue essa
// mesma relocação — mesmo campo RHF, aba visual diferente.
const TAB_FIELDS: Record<PastureTabKey, (keyof PastureFormType)[]> = {
  '0': [
    'date',
    'operation_uuid',
    'activity_uuid',
    'area_uuid',
    'grazing_uuid',
    'batch_uuid',
    'animal_uuid',
  ],
  '1': ['equipments'],
  '2': ['services'],
  '3': ['inputs', 'inputs_warehouse_uuid'],
  '4': ['occurrences'],
  '5': ['productions', 'productions_warehouse_uuid'],
};

const FIELD_TAB_MAP: Partial<Record<keyof PastureFormType, PastureTabKey>> = Object.fromEntries(
  (Object.entries(TAB_FIELDS) as [PastureTabKey, (keyof PastureFormType)[]][]).flatMap(
    ([tab, fields]) => fields.map((field) => [field, tab])
  )
);

const PASTAGEM_LIST_ROUTE = '/operacional/pastagem';

const defaultValues: PastureFormType = {
  date: null,
  area_uuid: null,
  grazing_uuid: null,
  operation_uuid: null,
  activity_uuid: null,
  batch_uuid: null,
  animal_uuid: null,
  inputs_warehouse_uuid: null,
  productions_warehouse_uuid: null,
  equipments: [],
  inputs: [],
  productions: [],
  services: [],
  occurrences: [],
};

export default function CreateOrUpdatePastagem() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user } = useAuth();

  const isEditing = isValidGuid(uuid);
  const text = languageGB.pastures.pasture;
  const formText = text.form;

  const canSave = isEditing ? can('pastures_edit') : can('pastures_create');

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<PastureFormType>({
    mode: 'onChange',
    resolver: pastureSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  const [tabValue, setTabValue] = useState<PastureTabKey>('0');

  // `employee`/`area`/`grazing`/`operation`/`activity`/`batch`/`animal`/
  // `inputs_warehouse`/`productions_warehouse`/`equipment`/`measurement`/
  // `function`/`provider`/`stock` do detalhe agora expõem `name`
  // (`PastureRef` ampliado, ver `@/@types/v2/Pastures`) — a hidratação de
  // edição usa o nome real em todo Select. `priority` de Ocorrência usa o
  // mesmo mapeador `priorityOptions` já usado para exibir a opção (mirror
  // `funcTypeOptions` abaixo). UI honesta (SEM MOCK): nenhum rótulo é
  // inventado, só campos que a API devolve.
  function fillPastureForm(data: PastureDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        date: data.date,
        area_uuid: data.area ? { label: data.area.name, value: data.area.uuid } : null,
        grazing_uuid: data.grazing ? { label: data.grazing.name, value: data.grazing.uuid } : null,
        operation_uuid: data.operation
          ? { label: data.operation.name, value: data.operation.uuid }
          : null,
        activity_uuid: data.activity
          ? { label: data.activity.name, value: data.activity.uuid }
          : null,
        batch_uuid: data.batch ? { label: data.batch.name, value: data.batch.uuid } : null,
        animal_uuid: data.animal ? { label: data.animal.name, value: data.animal.uuid } : null,
        inputs_warehouse_uuid: data.inputs_warehouse
          ? { label: data.inputs_warehouse.name, value: data.inputs_warehouse.uuid }
          : null,
        productions_warehouse_uuid: data.productions_warehouse
          ? { label: data.productions_warehouse.name, value: data.productions_warehouse.uuid }
          : null,
        equipments: data.equipments.map((row) => ({
          uuid: row.uuid,
          equipment_uuid: row.equipment
            ? { label: row.equipment.name, value: row.equipment.uuid }
            : null,
          measurement_uuid: row.measurement
            ? { label: row.measurement.name, value: row.measurement.uuid }
            : null,
          start_hour_meter: row.start_hour_meter,
          end_hour_meter: row.end_hour_meter,
          note: row.note,
        })),
        inputs: data.inputs.map((row) => ({
          uuid: row.uuid,
          stock_uuid: row.stock
            ? {
                label: row.stock.product?.description ?? row.stock.name,
                value: row.stock.uuid,
                product: row.stock.product
                  ? { label: row.stock.product.description, value: row.stock.product.uuid }
                  : null,
              }
            : null,
          measurement_uuid: row.measurement
            ? { label: row.measurement.name, value: row.measurement.uuid }
            : null,
          quantity: row.quantity,
          quantity_unitary: row.quantity_unitary,
          total_quantity: row.total_quantity,
        })),
        productions: data.productions.map((row) => ({
          uuid: row.uuid,
          product_uuid: row.product
            ? { label: row.product.description, value: row.product.uuid }
            : null,
          measurement_uuid: row.measurement
            ? { label: row.measurement.name, value: row.measurement.uuid }
            : null,
          quantity: row.quantity,
          note: row.note,
        })),
        services: data.services.map((row) => ({
          uuid: row.uuid,
          // Discriminante de UI reconstituído a partir de qual FK real veio
          // preenchida no detalhe — mirror do XOR do `PastureRequest`.
          func_type: row.employee
            ? funcTypeOptions.getOption(1, languageGB)
            : row.function
              ? funcTypeOptions.getOption(2, languageGB)
              : row.provider
                ? funcTypeOptions.getOption(3, languageGB)
                : null,
          employee_uuid: row.employee
            ? { label: row.employee.name, value: row.employee.uuid }
            : null,
          function_uuid: row.function
            ? { label: row.function.name, value: row.function.uuid }
            : null,
          provider_uuid: row.provider
            ? { label: row.provider.name, value: row.provider.uuid }
            : null,
          measurement_uuid: row.measurement
            ? { label: row.measurement.name, value: row.measurement.uuid }
            : null,
          quantity: row.quantity,
          total_quantity: row.total_quantity,
        })),
        // TASK-PAST-FIX-FE-02b — `uuid` da ocorrência repassado (mirror
        // equipamentos/produtos/serviços/produção): a API faz upsert de
        // ocorrências ENDEREÇADO POR UUID; sem ele, toda ocorrência é
        // tratada como nova na edição (reconciliação apaga+recria,
        // reabrindo o bug de imagem órfã que o upsert existe para evitar).
        occurrences: data.occurrences.map((row) => ({
          uuid: row.uuid,
          diagnosis: row.diagnosis,
          recommendation: row.recommendation,
          priority: row.priority ? priorityOptions.getOption(row.priority, languageGB) : null,
          images: row.images.map((image) => ({
            latitude: image.latitude,
            longitude: image.longitude,
            existingUrl: image.image,
          })),
        })),
      });
    }
  }

  const pastureQuery = useCustomFormQueryByGuid<PastureDetail>({
    registrationId: isEditing ? uuid : undefined,
    queryKey: queryKey.pastures.pasture,
    asyncFunction: getPasture,
    fillForm: fillPastureForm,
  });

  const isLoading = isEditing && checkLoadingStatus([pastureQuery as any]);

  // TASK-PAST-FIX-FE-01 — "Responsável" readonly: na edição, `requester`
  // (já calculado pelo Resource, fallback `employee?.name ?? user?.name`);
  // na criação, o usuário da sessão atual. Calculado aqui (não dentro de
  // `HeaderFieldsPastagem`) para manter o componente sem acoplar a
  // `useAuth`/`isEditing` diretamente.
  const requesterLabel = isEditing
    ? (pastureQuery.data?.requester ?? '—')
    : (user?.username ?? '—');

  const pastureMutation = useRequest({
    asyncFunction: tryPersistPasture,
    entityName: text.singularLabel,
    queryKey: queryKey.pastures.pastures,
    queryKey2: queryKey.pastures.pasture,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(PASTAGEM_LIST_ROUTE);
    },
  });

  // TASK-PAST-FIX-FE-02 — converte cada imagem NOVA (`file`) para data URI
  // base64 (`fileToDataUri`, `FileReader.readAsDataURL`); imagem já
  // persistida (`existingUrl`, URL pública devolvida pela API) é reenviada
  // como está — o backend normaliza de volta ao path relativo. Assíncrono
  // por linha/imagem — resolvido ANTES de montar o payload (não dá para
  // converter dentro de um `.map()` síncrono).
  //
  // Gate de persistência (revertido — CLM-53, fiel ao legado e ao backend
  // real): `PastureController@store`/`@update` do legado (`agro365`) e as
  // Actions novas (`CreatePastureAction`/`UpdatePastureAction`) só
  // persistem a ocorrência quando `recommendation` NÃO é vazio — imagem/
  // diagnóstico sozinhos, sem recomendação, são descartados pelo backend de
  // qualquer forma. Um gate de front mais permissivo (imagem OU diagnóstico
  // OU recomendação) enviava a ocorrência, o backend a descartava do mesmo
  // jeito, e a imagem se perdia SEM AVISO — corrigido: o gate volta a ser
  // só `recommendation`, e o BLOQUEIO com aviso claro acontece ANTES do
  // submit chegar aqui — `pasture-schema.ts#occurrenceItemSchema` exige
  // `recommendation` quando a linha tem imagem/diagnóstico (roda no
  // `handleSubmit` do RHF, via resolver); `handleSubmit` chama `onInvalid`
  // em vez de `onSubmit`/`tryPersistPasture` quando isso falha — nunca mais
  // descarte silencioso. Mensagem específica + foco na aba certa em
  // `onInvalid`; erro inline no campo Recomendação da linha em
  // `OccurrencesFieldArray.tsx`.
  //
  // `uuid` (achado do lastro de costura API↔FE) — a API faz upsert de
  // ocorrências ENDEREÇADO POR UUID (`occurrences.*.uuid`, `sometimes`);
  // repassado apenas quando existir (ocorrência já persistida), mirror
  // equipamentos/produtos/serviços/produção. Ocorrência nova (sem `uuid`)
  // não envia a chave — nunca inventar um uuid.
  async function buildOccurrencesPayload(
    occurrences: PastureFormType['occurrences']
  ): Promise<PastureWritePayload['occurrences']> {
    const relevantRows = occurrences.filter((row) => row.recommendation?.trim());

    return Promise.all(
      relevantRows.map(async (row) => {
        const images = await Promise.all(
          row.images.map(async (image) => ({
            latitude: image.latitude,
            longitude: image.longitude,
            image: image.file ? await fileToDataUri(image.file) : image.existingUrl!,
          }))
        );

        return {
          ...(row.uuid ? { uuid: row.uuid } : {}),
          priority: row.priority?.value ?? '1',
          recommendation: row.recommendation?.trim() || undefined,
          diagnosis: row.diagnosis?.trim() || undefined,
          images,
        };
      })
    );
  }

  async function tryPersistPasture(data: PastureFormType) {
    const occurrences = await buildOccurrencesPayload(data.occurrences);

    const payload: PastureWritePayload = {
      date: data.date!,
      area_uuid: data.area_uuid?.value ?? undefined,
      grazing_uuid: data.grazing_uuid?.value ?? undefined,
      operation_uuid: data.operation_uuid!.value,
      activity_uuid: data.activity_uuid!.value,
      batch_uuid: data.batch_uuid?.value ?? undefined,
      animal_uuid: data.animal_uuid?.value ?? undefined,
      inputs_warehouse_uuid: data.inputs_warehouse_uuid?.value ?? undefined,
      productions_warehouse_uuid: data.productions_warehouse_uuid?.value ?? undefined,
      equipments: data.equipments
        .filter((row) => row.equipment_uuid && row.measurement_uuid)
        .map((row) => ({
          equipment_uuid: row.equipment_uuid!.value,
          measurement_uuid: row.measurement_uuid!.value,
          start_hour_meter: row.start_hour_meter ?? undefined,
          end_hour_meter: row.end_hour_meter ?? undefined,
          note: row.note?.trim() || undefined,
        })),
      inputs: data.inputs
        .filter((row) => row.stock_uuid && row.measurement_uuid)
        .map((row) => ({
          stock_uuid: row.stock_uuid!.value,
          product_uuid: row.stock_uuid!.product?.value ?? undefined,
          measurement_uuid: row.measurement_uuid!.value,
          quantity: row.quantity ?? undefined,
          quantity_unitary: row.quantity_unitary ?? undefined,
          // Recomputado no submit — nunca lido stale de `row.total_quantity`
          // (mirror do racional já usado em `AppropriationProductionTab`).
          total_quantity: (row.quantity ?? 0) * (row.quantity_unitary ?? 0),
        })),
      productions: data.productions
        .filter((row) => row.product_uuid && row.measurement_uuid)
        .map((row) => ({
          product_uuid: row.product_uuid!.value,
          measurement_uuid: row.measurement_uuid!.value,
          quantity: row.quantity ?? undefined,
          note: row.note?.trim() || undefined,
        })),
      services: data.services
        .filter((row) => row.func_type && row.measurement_uuid)
        .map((row) => ({
          employee_uuid: row.func_type?.value === 1 ? row.employee_uuid?.value : undefined,
          function_uuid: row.func_type?.value === 2 ? row.function_uuid?.value : undefined,
          provider_uuid: row.func_type?.value === 3 ? row.provider_uuid?.value : undefined,
          measurement_uuid: row.measurement_uuid!.value,
          quantity: row.quantity ?? undefined,
          total_quantity: row.total_quantity ?? undefined,
        })),
      // CLM-53 — a Action só persiste a ocorrência se `recommendation` não
      // for vazio; front filtra aqui para não gerar linha "fantasma" (mesmo
      // critério de `hasAtLeastOneAppropriationItem`, mirror Appropriations).
      // GAP-PAST-FE-02 (fechado) — imagem NOVA (`file`) agora É serializada
      // (convertida para data URI base64 em `buildOccurrencesPayload`).
      occurrences,
    };

    if (isEditing && uuid) {
      return await updatePasture(uuid, payload);
    }
    return await createPasture(payload);
  }

  const isSubmitting = pastureMutation.isPending;

  function onInvalid(formErrors: FieldErrors<PastureFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof PastureFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is PastureTabKey => !!tab && tab !== tabValue);
    if (erroredTab) setTabValue(erroredTab);

    // TASK-PAST-FIX-FE-02c (decisão do dono) — quando o bloqueio é
    // especificamente "ocorrência com imagem/diagnóstico sem Recomendação"
    // (schema `pasture-schema.ts#occurrenceItemSchema`), mostra a mensagem
    // ESPECÍFICA (aponta a causa real — imagem/diagnóstico não são salvos
    // sem recomendação) em vez da genérica. Nunca mais descarte silencioso:
    // o schema já bloqueia o submit E o campo Recomendação da(s) linha(s)
    // afetada(s) mostra o erro inline (ver `OccurrencesFieldArray.tsx`).
    const occurrenceErrors = formErrors.occurrences as
      Array<{ recommendation?: { message?: string } } | undefined> | undefined;
    const occurrenceRecommendationMessage = occurrenceErrors?.find(
      (occurrenceError) => occurrenceError?.recommendation
    )?.recommendation?.message;

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: occurrenceRecommendationMessage ?? formText.errors.invalidFields,
      duration: 6000,
    });
  }

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isSubmitting}
          />
          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="submit"
              form="pasture-form"
              loading={isSubmitting}
              disabled={isSubmitting || !!isLoading}
            />
          )}
        </>
      }
    >
      <Form
        id="pasture-form"
        onSubmit={handleSubmit((data) => pastureMutation.mutateAsync(data), onInvalid)}
        noPadding
      >
        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValue(details.value as PastureTabKey)
          }
          variant="outline"
        >
          {/* @ts-ignore - Tab List sticky no topo do body: abas sempre visíveis, só o conteúdo rola. */}
          <Tabs.List position="sticky" top="0" zIndex={1} bg="formBG">
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{formText.tabs.general}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{formText.tabs.equipments}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{formText.tabs.services}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{formText.tabs.inputs}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="4">{formText.tabs.occurrences}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="5">{formText.tabs.productions}</Tabs.Trigger>
          </Tabs.List>

          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <HeaderFieldsPastagem
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              canSave={canSave}
              isLoading={!!isLoading}
              requesterLabel={requesterLabel}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <EquipmentsFieldArray
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <ServicesFieldArray
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="3">
            <ProductsFieldArray
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="4">
            <OccurrencesFieldArray
              control={control}
              errors={errors}
              isLoading={!!isLoading}
              canSave={canSave}
            />
          </Tabs.Content>

          {/* @ts-ignore */}
          <Tabs.Content value="5">
            <ProductionFieldArray
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              isEditing={isEditing}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>
    </FormContainer>
  );
}
