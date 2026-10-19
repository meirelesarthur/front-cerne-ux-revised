// src/pages/Operacional/Appropriations/CreateOrUpdateAppropriation.tsx
// -----------------------------------------------------------------------------
// Formulário único de criação/edição de Apontamento (Appropriation) —
// TASK-FE-2707 (cabeçalho + casca de abas) + TASK-FE-2710 (rodapé com as 3
// ações de transição de máquina de estados). 1 `useForm` RAIZ
// (`AppropriationForm`) com o resolver ÚNICO (`appropriationSchemaResolver`),
// casca de `Tabs.Root` (variant `outline`/`secondary`, mirror
// `CreateOrUpdateEquipamento.tsx`/`CreateOrUpdateInvoice.tsx`) — cada aba de
// item é um arquivo próprio, recebendo `control`/`errors`/`watch`/`setValue`
// do MESMO form raiz (nunca `useForm` local por aba).
//
// "Área Total" (readonly) — RÓTULO fiel ao legado, mas o VALOR é
// `AreaResource.productive_area`, NUNCA `total_area` (o legado exibia
// productive_area sob esse rótulo, `appropriations/_forms.blade.php`, e o
// backend valida `used_area ≤ productive_area`, `AppropriationRequest::
// rules()` — alinhamento de fidelidade, não é o mesmo dado de
// `AreaResource.total_area` consumido por outras telas como Pastejo).
// `AppropriationDetail.area` NÃO traz productive_area (só `{uuid,
// description}`, ver `AppropriationResource::toArray()`); em CRIAÇÃO,
// resolvido direto da opção do `SelectAsyncPaginate` (`AreaListItem.
// productive_area`, já presente na resposta de `listAreas`, sem round-trip
// extra). Em EDIÇÃO, sem um `getArea` de detalhe disponível no service
// mínimo (`areas-service.ts` só tem `listAreas`/`validateAreaInsert`),
// resolvido por um lookup best-effort no MESMO catálogo já usado pelo
// Select (`listAreas` com `search` pela descrição da Área, sem endpoint
// novo) — decisão documentada aqui, não é round-trip a um endpoint que não
// existe.
//
// "Responsável" — mirror EXATO do precedente já em produção
// (`BaseRegistrations/ParameterWeights/CreateOrUpdateParameterWeights.tsx`):
// CREATE = usuário logado (`useAuth().user?.username`, sem chamada de API);
// EDIT = `employee.name` (Solicitante) ou, na ausência, `user.name` (quem
// cadastrou) do detalhe já carregado. 100% readonly, nunca um Select — o
// campo RHF `employee_uuid` só CARREGA o vínculo já existente (edição, para
// não apagá-lo no PUT por D2/simetria) e nunca é setado a partir do usuário
// autenticado (sem ligação Auth↔Employee pronta na SPA hoje — divergência
// documentada, reportada ao Tester, não bloqueia create/update).
//
// "≥1 item para Salvar" — INVESTIGADO (correção de E2E do dono) e depois
// REVERTIDO por decisão explícita do dono (desvio consciente do legado): o
// legado (`AppropriationController@store`/`@update`, `rules()`) só valida
// `date`/`employee_id` e o submit JS de `_forms.blade.php` só checa
// `[required]` HTML5 por aba, salvando Apontamento com as 5 listas vazias.
// O dono decidiu não replicar essa lacuna — o Apontamento só pode ser CRIADO
// com ao menos 1 item PREENCHIDO em pelo menos UMA das 5 coleções
// (`labor_items`/`equipment_items`/`stock_items`/`occurrences`/
// `production_items`).
//
// TASK-FE-610/AP-09 (execução 034, 2ª leva, correção pós-E2E): a guarda
// DEIXOU de viver no schema Yup — com `mode: 'onChange'`, um `.test()` no
// array era reavaliado a CADA `onChange` de QUALQUER campo do formulário
// inteiro, acendendo o banner "Inclua ao menos 1 lançamento…" nas 5 abas
// antes do usuário tentar Salvar (comportamento "persistente" reprovado na
// re-E2E). Agora é um gate explícito dentro de `onSubmit`, com estado local
// (`itemsError`) setado SÓ ali e limpo reativamente por um `useEffect` que
// observa as 5 coleções via `watch` — desaparece sozinho assim que qualquer
// uma ganha 1 item preenchido, sem exigir novo clique em Salvar. Mesma regra
// de negócio (`hasAtLeastOneAppropriationItem`, importada de
// `appropriation-schema.ts`), mirror EXATO do backend real
// (`AppropriationRequest::rules()`) — que exige ≥1 item SÓ no `POST`; o
// `PUT` preserva edição parcial (D7) — `isEditing` desliga o gate por
// completo, nunca bloqueia salvar um Apontamento existente sem itens.
// Client-side é UX antecipada, autoridade final é o 422.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Flex, Icon, Tabs, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { FiAlertTriangle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { queryKey } from '@/constants/query-key';

import {
  appropriationSchemaResolver,
  hasAtLeastOneAppropriationItem,
} from '@/validations/schemas/Appropriations/appropriation-schema';

import {
  createAppropriation,
  updateAppropriation,
} from '@/services/v2/Appropriations/appropriation-service';
import { listAreas } from '@/services/v2/BaseRegistrations/areas-service';
import { listStockAvailability } from '@/services/v2/Stocks/stock-service';

import type { Option } from '@/@types/option';
import type {
  AppropriationDetail,
  AppropriationForm as AppropriationFormType,
  AppropriationPayload,
} from '@/@types/v2/Appropriations';

import { mapAppropriationDetailToFormValues } from './appropriation-form-mapper';
import { AppropriationHeaderFields } from './AppropriationHeaderFields';
import {
  APPROPRIATION_STATUS_META,
  getAppropriationStatusLegend,
  isAppropriationEditable,
} from './appropriationStatus';
import { RevertAppropriationStatusModal } from './RevertAppropriationStatusModal';
import { AppropriationEquipmentTab } from './tabs/AppropriationEquipmentTab';
import { AppropriationLaborTab } from './tabs/AppropriationLaborTab';
import { AppropriationOccurrencesTab } from './tabs/AppropriationOccurrencesTab';
import { AppropriationProductionTab } from './tabs/AppropriationProductionTab';
import { AppropriationStockTab } from './tabs/AppropriationStockTab';
import { useAppropriationForm } from './useAppropriations';

type AppropriationTabKey = '0' | '1' | '2' | '3' | '4' | '5';

const TAB_FIELDS: Record<AppropriationTabKey, (keyof AppropriationFormType)[]> = {
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

const FIELD_TAB_MAP: Partial<Record<keyof AppropriationFormType, AppropriationTabKey>> =
  Object.fromEntries(
    (
      Object.entries(TAB_FIELDS) as [AppropriationTabKey, (keyof AppropriationFormType)[]][]
    ).flatMap(([tab, fields]) => fields.map((field) => [field, tab]))
  );

const APPROPRIATIONS_LIST_ROUTE = '/operacional/apontamentos';

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

export default function CreateOrUpdateAppropriation() {
  const { appropriationId } = useParams<{ appropriationId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const { user: authUser, activeFarmUuid } = useAuth();

  const isEditing = isValidGuid(appropriationId);

  const text = languageGB.appropriations.appropriation;
  const formText = text.form;

  // Decisão 096 (fidelidade ao legado): em edição só status Aberto (O) é editável;
  // F/A abrem em modo somente leitura (sem Salvar) — use "Voltar Status" para editar.
  // `detailStatus` ainda nulo (carregando) mantém o form desabilitado via `isLoading`.
  const [detailStatus, setDetailStatus] = useState<AppropriationDetail | null>(null);
  const isReadOnlyByStatus =
    isEditing && !!detailStatus && !isAppropriationEditable(detailStatus.status);
  const canSave =
    (isEditing ? can('appropriations_edit') : can('appropriations_create')) && !isReadOnlyByStatus;
  const canManageTransitions = can('appropriations_edit');

  useEffect(() => {
    if (appropriationId && !isValidGuid(appropriationId)) {
      navigate(APPROPRIATIONS_LIST_ROUTE, { replace: true });
    }
  }, [appropriationId, navigate]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields },
  } = useForm<AppropriationFormType>({
    mode: 'onChange',
    resolver: appropriationSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues,
  });

  const [tabValue, setTabValue] = useState<AppropriationTabKey>('0');
  const [existingEmployeeName, setExistingEmployeeName] = useState<string | null>(null);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  // TASK-FE-610/AP-09 — banner "≥1 item" setado só no `onSubmit`, limpo
  // reativamente pelo `useEffect` abaixo (ver cabeçalho do arquivo).
  const [itemsError, setItemsError] = useState<string | null>(null);

  function fillAppropriationForm(data: AppropriationDetail, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      setDetailStatus(data);
      setExistingEmployeeName(data.employee?.name ?? data.user?.name ?? null);
      // TASK-FE-737 (execução 034/035, GAP-BE-655) — hidratação extraída
      // para `appropriation-form-mapper.ts` (`mode: 'edit'`, default),
      // reaproveitada LITERALMENTE por `FinishAppropriation.tsx`
      // (`mode: 'finish'`) — mesma função, comportamento deste componente
      // 100% INALTERADO (mirror mecânico, mesmo objeto retornado de antes).
      reset(mapAppropriationDetailToFormValues(data, formText));
    }
  }

  const appropriationQuery = useAppropriationForm({
    registrationId: isEditing ? appropriationId : undefined,
    fillForm: fillAppropriationForm,
  });

  const isLoading = isEditing && checkLoadingStatus([appropriationQuery as any]);

  // "Área Total" em EDIÇÃO — lookup best-effort no catálogo `listAreas` (ver
  // cabeçalho do arquivo — o service mínimo não tem `search`/`getArea` de
  // detalhe, só `farm_uuid`+paginação; melhor esforço dentro do teto de 100
  // por página do backend, limitação documentada). Só dispara 1x por Área
  // carregada, nunca a cada render.
  const watchedArea = watch('area_uuid');
  const areaTotalQuery = useQuery({
    queryKey: ['appropriation-area-total', watchedArea?.value, activeFarmUuid],
    queryFn: async () => {
      if (!watchedArea?.value) return null;
      const response = await listAreas({
        farm_uuid: activeFarmUuid ?? '',
        per_page: 100,
      });
      const found = response.data.items.find((item) => item.uuid === watchedArea.value);
      return found?.productive_area ?? null;
    },
    enabled: isEditing && !!watchedArea?.value && watch('area_total') === null,
    staleTime: 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (areaTotalQuery.data !== undefined && areaTotalQuery.data !== null) {
      setValue('area_total', areaTotalQuery.data);
    }
  }, [areaTotalQuery.data]);

  // TASK-FE-610/AP-09 — limpa o banner "≥1 item" automaticamente assim que
  // qualquer uma das 5 coleções ganha 1 item preenchido, sem exigir novo
  // clique em Salvar. NUNCA seta o erro aqui — setar é exclusivo do
  // `onSubmit`; este efeito só reage para fazê-lo desaparecer.
  const watchedStockItems = watch('stock_items');
  const watchedEquipmentItems = watch('equipment_items');
  const watchedLaborItems = watch('labor_items');
  const watchedProductionItems = watch('production_items');
  const watchedOccurrences = watch('occurrences');
  useEffect(() => {
    if (
      itemsError &&
      hasAtLeastOneAppropriationItem({
        stock_items: watchedStockItems,
        equipment_items: watchedEquipmentItems,
        labor_items: watchedLaborItems,
        production_items: watchedProductionItems,
        occurrences: watchedOccurrences,
      })
    ) {
      setItemsError(null);
    }
  }, [
    itemsError,
    watchedStockItems,
    watchedEquipmentItems,
    watchedLaborItems,
    watchedProductionItems,
    watchedOccurrences,
  ]);

  // TASK-FE-753 (GAP-BE-600) — "Estoque" (saldo real de Insumos) só é
  // embutido na option de `product_uuid` pelo `mapOptions` do Select
  // INTERATIVO "Produto" (`AppropriationStockTab.tsx`, `listStockAvailability`)
  // — nunca pelo `reset()` de hidratação de um item JÁ PERSISTIDO. Lookup
  // best-effort pós-`reset()`, mirror EXATO `area_total` (ver `areaTotalQuery`
  // acima): agrupa por `warehouse_uuid` DISTINTO (no máximo 1 chamada por
  // armazém, não por item) e mescla `quantity`/`measurement`/
  // `measurementSecond`/`factor`/`factorType` na option já hidratada,
  // preservando `label` (que já veio certo do Response do item).
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
    enabled: isEditing && distinctStockWarehouseUuids.length > 0,
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

  const appropriationMutation = useRequest({
    asyncFunction: tryPersistAppropriation,
    entityName: text.singularLabel,
    queryKey: queryKey.appropriations.appropriations,
    queryKey2: queryKey.appropriations.appropriation,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      setDetailStatus(data as AppropriationDetail);
      navigate(-1);
    },
  });

  async function tryPersistAppropriation(data: AppropriationFormType) {
    const payload: AppropriationPayload = {
      date: data.date!,
      area_uuid: data.area_uuid!.value,
      activity_uuid: data.activity_uuid!.value,
      operation_uuid: data.operation_uuid?.value ?? undefined,
      warehouse_production_uuid: data.warehouse_production_uuid?.value ?? undefined,
      cultivation_uuid: data.cultivation_uuid?.value ?? undefined,
      harvest_uuid: data.harvest_uuid?.value ?? undefined,
      employee_uuid: data.employee_uuid?.value ?? undefined,
      used_area: data.used_area ?? undefined,
      description: data.description?.trim() || undefined,
      stock_items: data.stock_items
        .filter((item) => item.product_uuid && item.warehouse_uuid)
        .map((item) => ({
          product_uuid: item.product_uuid!.value,
          warehouse_uuid: item.warehouse_uuid!.value,
          quantity: Number(item.quantity ?? 0),
          measurement_uuid: item.measurement_uuid?.value ?? undefined,
          // GAP-BE-601/TASK-BE-1001 (execução 034) — "Qtd Total" real
          // (mesma fórmula ao vivo de TASK-FE-602/604: quantity × used_area
          // do cabeçalho), agora ENVIADA (deixou de ser só informativo).
          total_quantity: Number(item.quantity ?? 0) * Number(data.used_area ?? 0),
        })),
      equipment_items: data.equipment_items
        .filter((item) => item.equipment_uuid)
        .map((item) => ({
          equipment_uuid: item.equipment_uuid!.value,
          start_hour_meter: Number(item.start_hour_meter ?? 0),
          note: item.note?.trim() || undefined,
          measurement_uuid: item.measurement_uuid?.value ?? undefined,
          // GAP-BE-602/TASK-BE-1002 — `file` novo tem prioridade; sem `file`,
          // reenvia `existingUrl` (MANTÉM a foto); só fica `undefined`
          // quando nunca houve foto OU o usuário removeu explicitamente
          // (`onRemove` zera o campo, ver AppropriationEquipmentTab.tsx) —
          // omitir/`undefined` aqui APAGA a foto no backend (fidelidade ao
          // legado, TASK-FE-603), por isso o Front NUNCA omite por engano.
          start_hour_photo:
            item.start_hour_photo?.file ?? item.start_hour_photo?.existingUrl ?? undefined,
        })),
      labor_items: data.labor_items
        .filter((item) => item.type)
        .map((item) => {
          // GAP-BE-650/TASK-FE-686 (AP-30, execução 034, 5ª leva) — modo
          // "Valor" (`V`) é a única condição em que "Vl. Unitário"/"Vl.
          // Total" fazem sentido (mirror legado, `service-amount`/
          // `service-total-amount` só existem visíveis nesse modo); no modo
          // "Qtd/ha" nunca enviados, mesmo que a linha já tenha tido valores
          // de uma troca anterior de Tipo de Pagamento (DoD da Tarefa).
          const isValuePayment = item.type_payment?.value === 'V';

          return {
            type: item.type!.value,
            employee_uuid: item.employee_uuid?.value ?? undefined,
            function_uuid: item.function_uuid?.value ?? undefined,
            provider_uuid: item.provider_uuid?.value ?? undefined,
            quantity: Number(item.quantity ?? 0),
            type_payment: item.type_payment?.value ?? 'Q',
            // TASK-FE-664/AP-25 (GAP-BE-643) — mirror EXATO do payload de
            // `stock_items.measurement_uuid`/`production_items.
            // measurement_uuid` acima; opcional/aditivo.
            measurement_uuid: item.measurement_uuid?.value ?? undefined,
            // "Qtd Total" — agora EDITÁVEL real (default calculado em tela,
            // sobrescrevível, `AppropriationLaborTab.tsx`), enviada nos 2
            // modos (mirror legado, sempre visível/enviada).
            total_quantity: Number(item.total_quantity ?? 0) || undefined,
            // "Vl. Unitário" — só no modo Valor.
            amount: isValuePayment ? Number(item.amount ?? 0) || undefined : undefined,
            // "Vl. Total" — SEMPRE computado aqui no momento do submit
            // (`total_quantity × amount`), nunca lido de `item.total_amount`
            // (nunca é campo RHF editável, ficaria stale sem `Controller`) —
            // mirror EXATO do racional já usado para `production_items[].
            // total` (linha ~529, `amount × quantity`). Opção A do Gap: o
            // servidor grava este valor CRU, sem recomputar.
            total_amount: isValuePayment
              ? Number(item.total_quantity ?? 0) * Number(item.amount ?? 0) || undefined
              : undefined,
          };
        }),
      production_items: data.production_items
        .filter((item) => item.product_uuid)
        .map((item) => ({
          product_uuid: item.product_uuid!.value,
          // TASK-FE-645 (AP-16, execução 034) — mirror EXATO do payload de
          // `stock_items.measurement_uuid` acima; opcional/aditivo.
          measurement_uuid: item.measurement_uuid?.value ?? undefined,
          quantity: Number(item.quantity ?? 0),
          note: item.note?.trim() || undefined,
          amount: Number(item.amount ?? 0),
          // TASK-FE-660 (AP-19) — "V.Total" deixou de ser um campo RHF
          // editável (ver `AppropriationProductionTab.tsx`, agora
          // `InputReadOnly`) — o valor enviado é SEMPRE computado aqui no
          // momento do submit (`amount × quantity`), nunca lido de
          // `item.total` (ficaria stale sem `Controller`). Mirror EXATO do
          // racional já usado para `stock_items[].total_quantity` (linha
          // ~474 acima, `quantity × used_area`).
          total: Number(item.amount ?? 0) * Number(item.quantity ?? 0),
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
      occurrences: data.occurrences
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

    if (isEditing && appropriationId) {
      return await updateAppropriation(appropriationId, payload);
    }
    return await createAppropriation(payload);
  }

  const isSubmitting = appropriationMutation.isPending;

  async function onSubmit(data: AppropriationFormType) {
    // TASK-FE-610/AP-09 — gate "≥1 item" só é avaliado AQUI (clique em
    // Salvar), nunca a cada onChange. CREATE-only (D7): em EDIÇÃO o gate é
    // desligado por completo, mirror do backend (`AppropriationRequest::
    // rules()` exige ≥1 item só no `POST`).
    if (isReadOnlyByStatus) return;
    if (!isEditing && !hasAtLeastOneAppropriationItem(data)) {
      setItemsError(formText.errors.atLeastOneItemRequired);
      toaster.error({
        title: formText.title.create,
        description: formText.errors.atLeastOneItemRequired,
        duration: 6000,
      });
      return;
    }
    setItemsError(null);
    await appropriationMutation.mutateAsync(data);
  }

  function onInvalid(formErrors: FieldErrors<AppropriationFormType>) {
    const erroredFieldNames = Object.keys(formErrors) as (keyof AppropriationFormType)[];
    if (erroredFieldNames.length === 0) return;

    const erroredTab = erroredFieldNames
      .map((field) => FIELD_TAB_MAP[field])
      .find((tab): tab is AppropriationTabKey => !!tab && tab !== tabValue);

    if (erroredTab) {
      setTabValue(erroredTab);
    }

    toaster.error({
      title: isEditing ? formText.title.edit : formText.title.create,
      description: formText.errors.invalidFields,
      duration: 6000,
    });
  }

  const responsibleLabel = isEditing ? (existingEmployeeName ?? '—') : (authUser?.username ?? '—');

  const statusLegend = getAppropriationStatusLegend(languageGB);
  const currentStatusLabel = detailStatus
    ? statusLegend.find((item) => item.status === detailStatus.status)?.label
    : undefined;

  const showFinish = isEditing && canManageTransitions && detailStatus?.status === 'O';
  const showAppropriate = isEditing && canManageTransitions && detailStatus?.status === 'F';
  const showRevertStatus =
    isEditing &&
    canManageTransitions &&
    !!detailStatus &&
    !!APPROPRIATION_STATUS_META[detailStatus.status].nextStatusOnRevert;

  return (
    <FormContainer
      title={isEditing ? formText.title.edit : formText.title.create}
      subtitle={isEditing ? formText.subtitle.edit : formText.subtitle.create}
      showDivider
      headerActions={
        detailStatus && currentStatusLabel ? (
          <Status
            text={currentStatusLabel}
            backgroundColor={APPROPRIATION_STATUS_META[detailStatus.status].badgeColor}
          />
        ) : undefined
      }
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            onClick={() => navigate(-1)}
            type="button"
            disabled={isSubmitting}
          />

          {/* ---- Máquina de estados (TASK-FE-2710) — ações secundárias à
              esquerda, "Salvar" continua a ação primária à direita (regra 9
              do protocolo v2). Visíveis por status + permissão
              `appropriations_edit` (hardening client-side, D10 REVERTIDO no
              backend — decisão de UX própria, ver Histórico de Mudanças). */}
          {showRevertStatus && (
            <Button
              title={formText.footer.revertStatus}
              variant="outline"
              type="button"
              onClick={() => setIsRevertModalOpen(true)}
              disabled={isSubmitting}
            />
          )}
          {/* TASK-FE-715 — "Finalizar" deixou de abrir o dialog genérico de
              confirmação: navega para a tela dedicada de Finalização, que
              reabre as 5 categorias com os dados reais (mirror
              "Apropriar"). */}
          {showFinish && (
            <Button
              title={formText.footer.finish}
              variant="outline"
              type="button"
              onClick={() => navigate(`/operacional/apontamentos/${appropriationId}/finalizar`)}
              disabled={isSubmitting}
            />
          )}
          {showAppropriate && (
            <Button
              title={formText.footer.appropriate}
              variant="outline"
              type="button"
              onClick={() => navigate(`/operacional/apontamentos/${appropriationId}/apropriar`)}
              disabled={isSubmitting}
            />
          )}

          {canSave && (
            <Button
              title={languageGB.defaltStrings.save}
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              loading={isSubmitting}
              disabled={isSubmitting || isLoading}
            />
          )}
        </>
      }
    >
      <Form onSubmit={handleSubmit(onSubmit, onInvalid)} noPadding>
        {isReadOnlyByStatus && (
          <Flex
            align="center"
            gap={2}
            mb={4}
            px={4}
            py={3}
            bg="feedBack.warn"
            color="feedBack.warnMain"
            borderRadius="md"
          >
            <Icon as={FiAlertTriangle} boxSize={4} flexShrink={0} />
            <Text fontSize="sm">{formText.editWarningNotOpened}</Text>
          </Flex>
        )}

        {/* @ts-ignore - custom variant */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(details: { value: string }) =>
            setTabValue(details.value as AppropriationTabKey)
          }
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

          {/* ---- ABA 1: Identificação (TASK-FE-2707) ---- */}
          {/* TASK-FE-731 (execução 034/035) — JSX extraído para
              `AppropriationHeaderFields` (reaproveitado por
              `FinishAppropriation.tsx`, TASK-FE-737); `showCode` ausente
              (default `false`) preserva este formulário 100% idêntico ao
              comportamento anterior (create/edit nunca mostraram Código). */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            <AppropriationHeaderFields
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              register={register}
              canSave={canSave}
              isLoading={!!isLoading}
              isEditing={isEditing}
              responsibleLabel={responsibleLabel}
              listAreasForActiveFarm={listAreasForActiveFarm}
            />
          </Tabs.Content>

          {/* ---- ABA 2: MO/Serviços (TASK-FE-2708) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            <AppropriationLaborTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              itemsError={itemsError}
            />
          </Tabs.Content>

          {/* ---- ABA 3: Máq/Implementos (TASK-FE-2708) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            <AppropriationEquipmentTab
              control={control}
              errors={errors}
              watch={watch}
              isLoading={!!isLoading}
              canSave={canSave}
              itemsError={itemsError}
            />
          </Tabs.Content>

          {/* ---- ABA 4: Insumos (TASK-FE-2709) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="3">
            <AppropriationStockTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              itemsError={itemsError}
            />
          </Tabs.Content>

          {/* ---- ABA 5: Ocorrências (TASK-FE-2710) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="4">
            <AppropriationOccurrencesTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              itemsError={itemsError}
            />
          </Tabs.Content>

          {/* ---- ABA 6: Produção (TASK-FE-2709) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="5">
            <AppropriationProductionTab
              control={control}
              errors={errors}
              watch={watch}
              setValue={setValue}
              isLoading={!!isLoading}
              canSave={canSave}
              itemsError={itemsError}
            />
          </Tabs.Content>
        </Tabs.Root>
      </Form>

      <RevertAppropriationStatusModal
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        appropriationUuid={appropriationId}
        currentStatus={detailStatus?.status}
        onSuccess={() => (appropriationQuery as any)?.refetch?.()}
      />
    </FormContainer>
  );
}
