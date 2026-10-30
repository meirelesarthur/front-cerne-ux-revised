// src/pages/CadastrosBase/Fazendas/CreateOrUpdateFarm.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de FAZENDA — Cadastros Base (execução 024).
// Wizard de 6 steps fixos (Identificação/Documentação/Endereço/Demarcação/
// Financeiro/Configurações), fidelidade estrutural a `FazendaCadastro.tsx` do
// `cerne` (commit `305e10e3`). Rotas: `/cadastros-base/fazendas/novo` e
// `/cadastros-base/fazendas/:uuid` (guardadas por `farms_view`; `canSave`
// interno = `farms_create`/`farms_edit` — wiring de rota real em
// `TASK-FE-404`).
//
// `TASK-FE-402` fecha steps 1-3 + upload de logo; `TASK-FE-403` fecha steps
// 4-5 (numeração original de 5 steps) + submit completo (create/update
// multipart, `centers` inline).
//
// ✅ BLOQUEIO #1 FECHADO (GAP-FE-120/GAP-FE-124, companheira desta execução) —
// backend commitado (`TASK-BE-421`/`TASK-BE-423`/`TASK-BE-424`): `FarmRequest`
// agora aceita `city_uuid`/`country_uuid` (string, uuid), resolvidos para os
// `id`s internos na Action (mirror `TASK-BE-334`, Pessoas). `city_uuid`
// consome `/cities/options` (já existia); `country_uuid` consome o catálogo
// novo `/countries/options` (`listCountryOptions`). Prefill em edição via
// `GET /farms/{uuid}` → `town.uuid`/`country{uuid,nome,codigo}`.
//
// ✅ BLOQUEIO #2 FECHADO (GAP-FE-125, `TASK-BE-422`) — `FarmDetailResource`
// agora expõe `centers[]` (uuid/code/description) dos Centros de Custo JÁ
// VINCULADOS à fazenda no `show`. O campo `CheckboxListField` de Configurações
// é reabilitado em modo EDIÇÃO, pré-preenchido a partir de `data.centers`, e o
// payload de UPDATE volta a enviar a seleção completa (o backend faz
// `sync()` — substitui o conjunto inteiro pelo array enviado, comportamento
// documentado em §7.4 do contrato).
//
// ✅ GAP-FE-121 REABERTO E FECHADO (execução 024, 2026-07-29) — dev decidiu
// construir a etapa Demarcação completa (mapa Leaflet + `leaflet-draw`,
// desenho de polígono, importação de KML/KMZ via endpoint backend
// `TASK-BE-425`), revogando a Opção A (v1 sem mapa). Wizard passa de 5 para
// 6 steps (`'demarcacao'`, 4ª posição, `TASK-FE-410`); `StepDemarcacao.tsx`
// (`TASK-FE-411`/`TASK-FE-412`) deriva `coordinates`/`total_area`/
// `latitude`/`longitude` do polígono, sem geocodificação reversa (decisão
// fechada — Cidade/Bairro/CEP/País continuam 100% manuais). `coordinates`
// passa a trafegar de fato no payload (`TASK-FE-414`), antes sempre `null`.
// Ver `PLANO-farm-demarcacao-mapa.md`.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { Form } from '@/components/Form';
import { StepFooter } from '@/components/ui/StepFooter';
import { Steps, StepsList, StepsRoot } from '@/components/ui/steps';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useActivateFarm } from '@/hooks/useActivateFarm';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { normalizeDocument } from '@/utils/cpfCnpj';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';
import { shouldActivateCreatedFarm } from '@/utils/shouldActivateCreatedFarm';

import { queryKey } from '@/constants/query-key';

import { listCountryOptions } from '@/services/v2/Countries/country-service';
import { createFarm, updateFarm } from '@/services/v2/Farms/farm-admin-service';

import type { FarmDetail, FarmFormType, FarmPayload } from '@/@types/v2/Farms/farm-admin';

import { farmSchemaResolver } from './farm-schema';
import { StepConfiguracoes } from './steps/StepConfiguracoes';
import { StepDemarcacao } from './steps/StepDemarcacao';
import { StepDocumentacao } from './steps/StepDocumentacao';
import { StepEndereco } from './steps/StepEndereco';
import { StepFinanceiro } from './steps/StepFinanceiro';
import { StepIdentificacao } from './steps/StepIdentificacao';
import { useFarmCostCenterOptions, useFarmForm } from './useFarms';

// GAP-FE-121 (reaberto, `TASK-FE-410`) — wizard passa de 5 para 6 etapas,
// `'demarcacao'` na 4ª posição (entre `'endereco'` e `'financeiro'`), mesma
// ordem confirmada em `FazendaCadastro.tsx` do `cerne`.
type StepKey =
  'identificacao' | 'documentacao' | 'endereco' | 'demarcacao' | 'financeiro' | 'configuracoes';
const STEPS: StepKey[] = [
  'identificacao',
  'documentacao',
  'endereco',
  'demarcacao',
  'financeiro',
  'configuracoes',
];

const STEP_FIELDS: Record<StepKey, (keyof FarmFormType)[]> = {
  identificacao: ['description', 'descriptive', 'nif', 'phone', 'tenant_id'],
  documentacao: ['exploration_type', 'state_registration', 'car', 'nirf', 'ccir', 'caepf', 'cafir'],
  endereco: [
    'country_uuid',
    'zip_code',
    'city_uuid',
    'district',
    'number',
    'latitude',
    'longitude',
  ],
  // Sem validação obrigatória (mesmo racional do `cerne`) — o step é
  // opcional, avançar sem desenhar nada não bloqueia o wizard.
  demarcacao: ['coordinates'],
  financeiro: ['total_area', 'value_ha', 'rate', 'coin', 'is_enabled', 'use_cash_book'],
  configuracoes: ['cost_processing_date', 'control_supplies_stock', 'centers', 'note'],
};

function emptyFarmForm(): FarmFormType {
  return {
    description: '',
    descriptive: '',
    nif: '',
    phone: '',
    exploration_type: null,
    car: '',
    nirf: '',
    ccir: '',
    cafir: '',
    caepf: '',
    state_registration: '',
    // GAP-FE-124 (fechado) — pré-selecionado com "Brasil" em modo criação
    // (ver `useEffect` de default em `CreateOrUpdateFarm`, mesmo default
    // hardcoded de `FarmRequest::rules()`, fallback `?: 30`); `null` aqui,
    // preenchido assim que o catálogo `/countries/options` responder.
    country_uuid: null,
    zip_code: '',
    city_uuid: null,
    district: '',
    number: '',
    latitude: '',
    longitude: '',
    coin: 'R',
    total_area: null,
    value_ha: null,
    rate: null,
    is_enabled: true,
    use_cash_book: true,
    cost_processing_date: 5,
    control_supplies_stock: false,
    note: '',
    centers: [],
    tenant_id: null,
    // GAP-FE-121 (reaberto, `TASK-FE-410`) — GeoJSON do polígono, escrito por
    // `StepDemarcacao.tsx` (`TASK-FE-411`/`TASK-FE-412`); `null` até o
    // usuário desenhar/importar algo (step opcional).
    coordinates: null,
  };
}

export default function CreateOrUpdateFarm() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasRole } = usePermissions();
  const { activeFarmUuid, markHasFarms, refreshProfile } = useAuth();
  const activateFarm = useActivateFarm();

  const isEditing = isValidGuid(farmId);
  const canSave = isEditing ? can('farms_edit') : can('farms_create');
  const text = languageGB.farms.farm;

  // §8.1 do contrato — `tenant_id` só existe para `Gestor_Plataf`, e só no
  // CREATE (imutável no update via este Request — troca de tenant é operação
  // exclusiva de `PUT /farms/{uuid}/tenant`, fora do escopo desta fatia).
  const showTenantId = !isEditing && hasRole('Gestor_Plataf');

  const {
    control,
    register,
    reset,
    trigger,
    setError,
    setValue,
    getValues,
    formState: { errors, dirtyFields },
  } = useForm<FarmFormType>({
    mode: 'onChange',
    resolver: farmSchemaResolver(languageGB),
    reValidateMode: 'onChange',
    defaultValues: emptyFarmForm(),
  });

  // ---- Estado da imagem (logo) — NÃO é campo RHF, mirror
  // `CreateOrUpdateFamiliaBens.tsx` (upload multipart inline). -------------
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  // ---- Default de País (GAP-FE-124 fechado) — pré-seleciona "Brasil" em modo
  // CRIAÇÃO, mesmo default hardcoded do legado/`FarmRequest::rules()`
  // (fallback `?: 30`), sem sobrescrever escolha do usuário nem o prefill de
  // edição (`fillForm` já resolve `country_uuid` a partir de `data.country`).
  const defaultCountryQuery = useQuery({
    queryKey: [queryKey.countries.options, 'brasil-default'],
    queryFn: async () => {
      const response = await listCountryOptions({ search: 'Brasil', per_page: 5 });
      return response.data?.items ?? [];
    },
    enabled: !isEditing,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (isEditing) return;
    if (dirtyFields.country_uuid) return;
    const brasil = defaultCountryQuery.data?.find((item) => item.nome === 'Brasil');
    if (brasil) {
      setValue('country_uuid', { value: brasil.uuid, label: brasil.nome }, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountryQuery.data, isEditing]);

  function handleFileSelected(file: File | null) {
    setImageFile(file);
    setRemoveImage(false);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setRemoveImage(true);
    setCurrentImageUrl(null);
  }

  // ---- Navegação do wizard ---------------------------------------------------
  const [currentKey, setCurrentKey] = useState<StepKey>('identificacao');
  const idx = STEPS.indexOf(currentKey);
  const isLast = idx === STEPS.length - 1;

  function fillForm(data: FarmDetail, resetForce?: boolean) {
    // Lei 2 (`get_pwa_form_query_pattern`) — guarda `!isEmpty(dirtyFields) ||
    // resetForce` (ERRO-FE-001 — `isEmpty` retorna `true` quando HÁ chaves;
    // fórmula copiada literalmente de `CreateOrUpdateFamiliaBens.tsx`/
    // `CreateOrUpdatePessoa.tsx`, nunca remover o `!`).
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        description: data.description,
        descriptive: data.descriptive,
        nif: data.nif ?? '',
        phone: data.phone ?? '',
        exploration_type: data.exploration_type?.value ?? null,
        car: data.car ?? '',
        nirf: data.nirf ?? '',
        ccir: data.ccir ?? '',
        cafir: data.cafir ?? '',
        caepf: data.caepf ?? '',
        state_registration: data.state_registration ?? '',
        // GAP-FE-124 fechado — `data.country.uuid` já resolve o `Option`
        // (mirror `city_uuid`/People, `TASK-BE-424`).
        country_uuid: data.country ? { value: data.country.uuid, label: data.country.nome } : null,
        zip_code: data.zip_code ?? '',
        // GAP-FE-120 fechado — `data.town.uuid` já resolve o `Option`
        // (mirror `PersonDetailResource.city.uuid`, `TASK-BE-421`).
        city_uuid: data.town
          ? {
              value: data.town.uuid,
              label: [data.town.name, data.town.state].filter(Boolean).join(' — '),
            }
          : null,
        district: data.district ?? '',
        number: data.number ?? '',
        latitude: data.latitude ?? '',
        longitude: data.longitude ?? '',
        coin: data.coin ?? 'R',
        total_area: data.total_area,
        value_ha: data.value_ha,
        rate: data.rate,
        is_enabled: !!data.is_enabled,
        use_cash_book: !!data.use_cash_book,
        cost_processing_date: data.cost_processing_date,
        control_supplies_stock: !!data.control_supplies_stock,
        note: data.note ?? '',
        // GAP-FE-125 fechado — `data.centers` já vem com os Centros de Custo
        // JÁ VINCULADOS à fazenda (`TASK-BE-422`); prefill real, campo
        // reabilitado em edição (ver `tryPersistFarm`/`StepConfiguracoes`).
        centers: (data.centers ?? []).map((center) => center.uuid),
        tenant_id: null,
        // GAP-FE-121 (reaberto) — prefill do polígono salvo; `StepDemarcacao`
        // restaura o desenho no mapa a partir deste valor (`fitBounds`).
        coordinates: data.coordinates ?? null,
      });
    }
    if (!imageFile && !removeImage) {
      // ERRO-E2E (feature 024, Fazenda) — `data.logo` é o caminho cru, não
      // serve como `src` de imagem; o backend agora expõe `logo_url`
      // (`Storage::disk('public')->url()`, mirror `FamilyEquipment.image_url`)
      // com a URL absoluta pronta para o preview.
      setCurrentImageUrl(data.logo_url ?? null);
    }
  }

  const farmQuery = useFarmForm({
    registrationId: isEditing ? farmId : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([farmQuery as any]);

  // ---- Centros de Custo (CheckboxListField, TASK-FE-403) --------------------
  const [centerSearch, setCenterSearch] = useState('');
  const centerOptionsQuery = useFarmCostCenterOptions(centerSearch);

  // TASK-072-FE-09 (E2, G-FE-3) — `queryKey3: farms.mine` invalida "minhas
  // fazendas" (fonte do `FarmSwitcher`) em create E update. No CREATE sem
  // fazenda ativa, a nova fazenda é ativada no servidor (`useActivateFarm`:
  // select → setActiveFarm → invalidate total), como o legado
  // (`FarmController.php:246-266`); falha do select só avisa, não bloqueia.
  const farmMutation = useRequest({
    asyncFunction: tryPersistFarm,
    entityName: text.singularLabel,
    queryKey: queryKey.farms.farmsAdminList,
    queryKey2: queryKey.farms.farmsAdminDetail,
    queryKey3: queryKey.farms.mine,
    typesRequest: isEditing ? 'update' : 'create',
    personalizedMessage: isEditing
      ? text.form.toasts.updatedSuccess
      : text.form.toasts.createdSuccess,
    actionSuccess: handleFarmSaved,
  });

  async function handleFarmSaved(savedFarm: FarmDetail) {
    if (shouldActivateCreatedFarm({ isEditing, activeFarmUuid }) && savedFarm?.uuid) {
      try {
        await activateFarm.mutateAsync(savedFarm.uuid);
      } catch {
        toaster.warning({
          title: text.singularLabel,
          description: text.form.toasts.activateFailed,
          duration: 7000,
        });
      }
    }
    // TASK-072-FE-11 — no CREATE, libera o guard "contratante sem fazenda"
    // sem novo login: setter otimista (`has_farms=true`) + `/auth/me` real,
    // ANTES do `navigate` (a próxima rota já é avaliada com o sinal novo).
    if (!isEditing) {
      markHasFarms();
      await refreshProfile();
    }
    navigate(-1);
  }

  async function tryPersistFarm(data: FarmFormType) {
    const latitudeLongitude =
      data.latitude?.trim() && data.longitude?.trim()
        ? `${data.latitude.trim()},${data.longitude.trim()}`
        : undefined;

    const payload: FarmPayload = {
      description: data.description.trim(),
      descriptive: data.descriptive.trim(),
      total_area: data.total_area ?? 0,
      value_ha: data.value_ha ?? 0,
      // GAP-FE-120/GAP-FE-124 fechados — `city_uuid.value`/`country_uuid.value`
      // já são os `uuid`s reais exigidos por `FarmRequest::rules()`
      // (`TASK-BE-421`/`TASK-BE-424`), resolvidos internamente na Action.
      city_uuid: data.city_uuid?.value ?? '',
      country_uuid: data.country_uuid?.value ?? '',
      is_enabled: !!data.is_enabled,
      control_supplies_stock: !!data.control_supplies_stock,
      use_cash_book: !!data.use_cash_book,
      cost_processing_date: data.cost_processing_date ?? 5,
      phone: data.phone.trim(),
      coin: data.coin || 'R',
      zip_code: data.zip_code.trim(),
      district: data.district.trim(),
      car: data.car?.trim() || undefined,
      note: data.note?.trim() || undefined,
      rate: data.rate ?? undefined,
      nif: data.nif ? normalizeDocument(data.nif) : undefined,
      state_registration: data.state_registration?.trim() || undefined,
      cafir: data.cafir?.trim() || undefined,
      caepf: data.caepf?.trim() || undefined,
      number: data.number?.trim() || undefined,
      exploration_type: data.exploration_type ?? undefined,
      nirf: data.nirf?.trim() || undefined,
      ccir: data.ccir?.trim() || undefined,
      latitude_longitude: latitudeLongitude,
      // GAP-FE-121 fechado (reaberto, `TASK-FE-414`) — GeoJSON real do
      // polígono desenhado/importado em `StepDemarcacao` (antes sempre
      // omitido); `null`/omitido apenas quando nenhum perímetro foi
      // demarcado (step opcional, não bloqueia o submit).
      coordinates: data.coordinates ?? undefined,
      // GAP-FE-125 fechado (`TASK-BE-422`) — a edição envia a seleção
      // COMPLETA (o backend faz `sync()`, substitui o conjunto inteiro);
      // como `fillForm` agora pré-preenche `centers` a partir de
      // `data.centers` (vinculados reais), não há mais risco de apagar
      // silenciosamente associações que o usuário não via na tela.
      centers: data.centers ?? [],
      image: imageFile,
      remove_image: removeImage,
    };

    if (showTenantId && data.tenant_id) {
      payload.tenant_id = data.tenant_id;
    }

    if (isEditing && farmId) {
      return await updateFarm(farmId, payload);
    }
    return await createFarm(payload);
  }

  const isSubmitting = farmMutation.isPending;

  async function handleNext() {
    const fields = STEP_FIELDS[currentKey];
    const valid = await trigger(fields as any);

    if (currentKey === 'identificacao' && showTenantId) {
      const values = getValues();
      if (!values.tenant_id) {
        setError('tenant_id', { message: text.form.hints.tenantIdCreateOnly });
        return;
      }
    }

    if (!valid) return;

    if (isLast) {
      await onSubmit();
    } else {
      setCurrentKey(STEPS[idx + 1]);
    }
  }

  function handleBack() {
    if (idx > 0) setCurrentKey(STEPS[idx - 1]);
    else navigate(-1);
  }

  // Guard `onSubmit` — fórmula VERIFICADA (`!isEmpty(dirtyFields)`, ERRO-FE-001)
  // + fator adicional `!hasImageChange` (a imagem não é campo RHF, mirror
  // `CreateOrUpdateFamiliaBens.tsx`).
  async function onSubmit() {
    const data = getValues();
    const hasImageChange = !!imageFile || removeImage;
    if (isEditing && !isEmpty(dirtyFields) && !hasImageChange) {
      navigate(-1);
      return;
    }
    await farmMutation.mutateAsync(data);
  }

  const stepLabels: Record<StepKey, string> = {
    identificacao: text.form.steps.identificacao,
    documentacao: text.form.steps.documentacao,
    endereco: text.form.steps.endereco,
    demarcacao: text.form.steps.demarcacao,
    financeiro: text.form.steps.financeiro,
    configuracoes: text.form.steps.configuracoes,
  };

  const stepProps = {
    control,
    register,
    errors,
    disabled: !canSave || isSubmitting,
    loading: isLoading,
  };

  function renderStep() {
    switch (currentKey) {
      case 'identificacao':
        return (
          <StepIdentificacao
            {...stepProps}
            showTenantId={showTenantId}
            imageFile={imageFile}
            currentImageUrl={currentImageUrl}
            onFileSelected={handleFileSelected}
            onRemoveImage={handleRemoveImage}
          />
        );
      case 'documentacao':
        return <StepDocumentacao {...stepProps} />;
      case 'endereco':
        return <StepEndereco {...stepProps} />;
      case 'demarcacao':
        return <StepDemarcacao {...stepProps} getValues={getValues} setValue={setValue} />;
      case 'financeiro':
        return <StepFinanceiro {...stepProps} />;
      case 'configuracoes':
        return (
          <StepConfiguracoes
            {...stepProps}
            centerItems={centerOptionsQuery.data ?? []}
            centerSearch={centerSearch}
            onCenterSearchChange={setCenterSearch}
            isLoadingCenters={centerOptionsQuery.isLoading}
            isErrorCenters={centerOptionsQuery.isError}
            onRetryCenters={() => centerOptionsQuery.refetch()}
          />
        );
      default:
        return null;
    }
  }

  // Contador "Etapa X de Y" — texto vem do i18n; o rodapé é o `StepFooter` do kit (DS).
  const stepCounterLabel = `${text.form.footer.stepCounter.label} ${idx + 1} ${text.form.footer.stepCounter.of} ${STEPS.length}`;

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
      subtitle={isEditing ? text.form.subtitle.edit : text.form.subtitle.create}
      footer={
        <div data-tour="wizard-footer" style={{ width: "100%" }}>
        <StepFooter
          stepLabel={stepCounterLabel}
          backLabel={text.form.footer.back}
          nextLabel={isLast ? text.form.footer.save : text.form.footer.next}
          onBack={handleBack}
          onNext={handleNext}
          backDisabled={isSubmitting}
          nextLoading={isSubmitting}
          nextDisabled={isSubmitting || isLoading}
          hideNext={!canSave}
        />
        </div>
      }
    >
      {/* `<Form>` só como wrapper de padding — a navegação/salvamento do
          wizard é 100% via `onClick={handleNext}` no rodapé do
          `StepFooter`, nunca via submit nativo (mesmo padrão de
          `CreateOrUpdatePessoa.tsx`). */}
      <Form noPadding onSubmit={(e) => e.preventDefault()}>
        <StepsRoot step={idx} count={STEPS.length} data-tour="wizard" data-tour-step={STEPS[idx]}>
          <StepsList>
            {STEPS.map((key, i) => (
              <Steps.Item key={key} index={i} title={stepLabels[key]} />
            ))}
          </StepsList>

          <Steps.Content index={idx}>{renderStep()}</Steps.Content>
        </StepsRoot>
      </Form>
    </FormContainer>
  );
}
