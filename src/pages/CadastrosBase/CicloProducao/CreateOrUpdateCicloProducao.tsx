// src/pages/CadastrosBase/CicloProducao/CreateOrUpdateCicloProducao.tsx
// -----------------------------------------------------------------------------
// Tela ÚNICA de CRIAÇÃO e EDIÇÃO de CICLO DE PRODUÇÃO — Cadastros Base /
// Agrícola. TASK-FE-02 (97-Esteiras/033). Rotas: /cadastros-base/ciclo-
// producao/novo (create, guarda `production-cycles_create`) e /cadastros-
// base/ciclo-producao/:productionCycleUuid (edit, guarda `production-cycles_
// edit`) — registradas em src/router/index.tsx.
//
// Mirror ESTRUTURAL de `Safra/CreateOrUpdateSafra.tsx` (tela-espelho, FID-G3F
// §1.3): um único `useForm`, `isEditing = isValidGuid(productionCycleUuid)`,
// `fillForm` nomeada com guarda de `dirtyFields` (Lei 2), `useRequest` para a
// mutação. Painéis visuais ("Dados Gerais"/"Áreas") mirror
// `CicloProducaoDetalhe.tsx` (D-FE-5, mesmo idioma visual entre Form e
// Detalhe desta MESMA feature).
//
// UX-GAP declarado (FID-G3F §1): sem tela desenhada no `ux_root` — decisão do
// dono = seguir-pelo-padrão. NADA aqui reproduz o mock de outra tela; layout
// derivado de Safra + primitivos do `cerne`.
//
// ---- De-para dos 4 selects relacionais (harvest/cultivation/center/employee)
// Todos seguem o MESMO racional: `ProductionCycleForm` guarda só o uuid CRU
// (`string`), e um estado local "picked option" (`useState<Option | null>`)
// guarda o par {label,value} para EXIBIÇÃO — semeado por `fillForm` a partir
// da relação já resolvida pelo `show` (`harvest`/`culture`/`center`/
// `employee`), e atualizado no `onChange` de cada Select quando o usuário
// escolhe outra opção. Faz o RHF continuar guardando só uuid (payload trivial,
// sem `.value` unwrap no submit) e a label sobreviver mesmo que a relação não
// esteja mais no catálogo "ativo"/paginado carregado no momento da edição
// (ex.: Safra desabilitada depois que o Ciclo foi criado) — mesmo racional já
// em produção em `CreateOrUpdateCentroCusto.tsx` (`parentPreview`) e
// `ExpenseApportionmentTab.tsx` (`pickedCenterOptions`).
//   - harvest_uuid    → `Select` nativo (Chakra, coleção fechada) sobre
//     `GET /harvests/active` (universo pequeno, sem busca/paginação real —
//     `listActiveHarvests` não serve ao contrato do `SelectAsyncPaginate`,
//     decisão já documentada em `harvest-service.ts`). Como o componente é
//     COLLECTION-BASED (só exibe rótulo de valores presentes em `options`),
//     a opção hidratada é MESCLADA na lista de opções quando ausente (edge
//     case: Safra inativa numa edição antiga) — nunca perdida.
//   - cultivation_uuid → `SelectCultivation` (react-select, controlado por
//     valor externo — não exige que a opção exista na árvore carregada).
//   - center_uuid      → `SelectAsyncPaginate` sobre `/cost-centers/options
//     ?only_analytic=true` (L4).
//   - employee_uuid    → `SelectAsyncPaginate` sobre `/employees` (opcional,
//     nullable — D-FE-6).
//
// ---- Áreas (multiselect, D-FE-2/D-FE-3) ----
// `CheckboxListField` alimentado pelo catálogo COMPLETO de Áreas ativas da
// fazenda (`useProductionCycleAreasCatalog`, MESMO hook/loop paginado já
// materializado pela TASK-FE-01 para a tela de Detalhe — reuso, não
// duplicação). Busca é client-side (universo já carregado por inteiro, sem
// paginação real aqui). "Total ha" (Σ `productive_area`, D-FE-3) e "Qtd
// Áreas" são derivados REATIVAMENTE de `watch('areas')` contra o catálogo.
//
// ---- 422 por campo + R6 (D-FE-1) ----
// `tryPersistProductionCycle` mapeia `error.response.data.errors → setError`
// LOCALMENTE (mesmo padrão de `tryPersistHarvest`, este projeto não tem
// mecanismo compartilhado de `setError`) e RELANÇA — o toast genérico de
// `useRequest` cobre a `message` de nível superior, incluindo o conflito R6
// (BusinessRuleException 422, SEM `errors` por campo — `extractApiFieldError
// Message` retorna `undefined` nesse caso e `useRequest` cai no fallback
// `resData.message`, ver `utils/extractApiErrorMessage.ts`). NUNCA chamar
// `check-period` — não existe na API (FID-G3F §2.2).
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Box, SimpleGrid, Text } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useContextSelector } from 'use-context-selector';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { SelectCultivation } from '@/components/Form/SelectCultivation';
import { FormContainer } from '@/components/Layout/FormContainer';

import { AuthContext } from '@/contexts/AuthContext';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { listEmployees } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import {
  createProductionCycle,
  updateProductionCycle,
} from '@/services/v2/ProductionCycles/production-cycle-service';

import type { Option } from '@/@types/option';
import type { EmployeeListItem } from '@/@types/v2/CadastrosBase/employee';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  ProductionCycle,
  ProductionCycleForm as ProductionCycleFormType,
  ProductionCyclePayload,
} from '@/@types/v2/ProductionCycles';

import { cicloProducaoSchemaResolver } from './ciclo-producao-schema';
import {
  useActiveHarvests,
  useProductionCycleAreasCatalog,
  useProductionCycleForm,
} from './useProductionCycles';

const PRODUCTION_CYCLES_LIST_ROUTE = '/cadastros-base/ciclo-producao';

export default function CreateOrUpdateCicloProducao() {
  const { productionCycleUuid } = useParams<{ productionCycleUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  // Mesmo seletor dedicado de `CicloProducaoDetalhe.tsx`/`GrazingMap.tsx` —
  // direto no `AuthContext`, sem passar por `useAuth()`.
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);

  // `/novo` NÃO tem `:productionCycleUuid` (rota própria, sem param — o
  // valor chega `undefined`); só a rota `/:productionCycleUuid` popula o
  // param. Guard de navegação: um uuid mal formado NA ROTA DE EDIÇÃO (param
  // PRESENTE, porém inválido) redireciona para o grid ANTES de renderizar —
  // nunca cai silenciosamente em modo "criar" (mirror do guard de
  // `CicloProducaoDetalhe.tsx`, adaptado: aqui `undefined` é um caso válido
  // — a própria rota `/novo`).
  const hasMalformedRouteParam =
    productionCycleUuid !== undefined && !isValidGuid(productionCycleUuid);

  // `navigate()` NUNCA é chamado direto no corpo de renderização (dispararia
  // "Cannot update a component while rendering a different component") —
  // mesmo padrão de efeito + guarda de `CicloProducaoDetalhe.tsx`.
  useEffect(() => {
    if (hasMalformedRouteParam) {
      navigate(PRODUCTION_CYCLES_LIST_ROUTE, { replace: true });
    }
  }, [hasMalformedRouteParam, navigate]);

  const isEditing = isValidGuid(productionCycleUuid);
  const text = languageGB.productionCycles.productionCycle;
  const canSave = isEditing ? can('production-cycles_edit') : can('production-cycles_create');

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<ProductionCycleFormType>({
    mode: 'onChange',
    resolver: cicloProducaoSchemaResolver(languageGB) as any,
    reValidateMode: 'onChange',
    defaultValues: {
      date: '',
      start_date: '',
      end_date: '',
      harvest_uuid: '',
      cultivation_uuid: '',
      center_uuid: '',
      description: '',
      areas: [],
      employee_uuid: null,
    },
  });

  // ---- "Picked options" de exibição dos 4 selects relacionais — ver nota
  // de cabeçalho. Semeados por `fillForm`; atualizados no `onChange` de cada
  // Select quando o usuário escolhe outra opção. `code` (server-generated,
  // R5) também vive aqui — NUNCA entra em `ProductionCycleFormType`/payload.
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [harvestOption, setHarvestOption] = useState<Option | null>(null);
  const [cultivationOption, setCultivationOption] = useState<Option | null>(null);
  const [centerOption, setCenterOption] = useState<Option | null>(null);
  const [employeeOption, setEmployeeOption] = useState<Option | null>(null);

  function fillForm(data: ProductionCycle, resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        uuid: data.uuid,
        date: data.date,
        start_date: data.start_date,
        end_date: data.end_date,
        harvest_uuid: data.harvest?.uuid ?? '',
        cultivation_uuid: data.culture?.uuid ?? '',
        center_uuid: data.center?.uuid ?? '',
        description: data.description,
        areas: (data.areas ?? []).map((area) => area.uuid),
        employee_uuid: data.employee?.uuid ?? null,
      });

      setCurrentCode(data.code);
      setHarvestOption(
        data.harvest ? { label: data.harvest.description, value: data.harvest.uuid } : null
      );
      setCultivationOption(
        data.culture ? { label: data.culture.name, value: data.culture.uuid } : null
      );
      // `ProductionCycleCenterRef` (relação do `show`) só expõe
      // `{uuid,description}` — SEM `code` — por isso o rótulo aqui é só a
      // descrição; uma vez que o usuário troque a seleção, `SelectAsync
      // Paginate` passa a exibir `${code} — ${description}` (`/cost-centers/
      // options`, que expõe os dois), pequena divergência cosmética entre
      // hidratação e nova escolha, sem impacto no payload (sempre uuid cru).
      setCenterOption(
        data.center ? { label: data.center.description, value: data.center.uuid } : null
      );
      setEmployeeOption(
        data.employee ? { label: data.employee.name, value: data.employee.uuid } : null
      );
    }
  }

  const productionCycleQuery = useProductionCycleForm({
    registrationId: isEditing ? productionCycleUuid : undefined,
    fillForm,
  });

  const isLoading = isEditing && checkLoadingStatus([productionCycleQuery as any]);

  // ---- Fontes dos selects -----------------------------------------------
  const activeHarvestsQuery = useActiveHarvests();
  const harvestOptions: Option[] = useMemo(() => {
    const base = (activeHarvestsQuery.data ?? []).map((harvest) => ({
      label: harvest.description,
      value: harvest.uuid,
    }));
    // Mescla a opção hidratada quando ausente do catálogo ATIVO (Safra
    // desabilitada após o Ciclo já existir) — `Select` nativo só exibe
    // rótulos de valores presentes em `options` (ver nota de cabeçalho).
    if (harvestOption && !base.some((option) => option.value === harvestOption.value)) {
      return [...base, harvestOption];
    }
    return base;
  }, [activeHarvestsQuery.data, harvestOption]);

  // ---- Áreas (D-FE-2/D-FE-3) — catálogo COMPLETO da fazenda ativa, MESMO
  // hook/loop paginado já materializado pela TASK-FE-01 para o Detalhe. -----
  const areasCatalogQuery = useProductionCycleAreasCatalog({ activeFarmUuid });
  const areasCatalog = areasCatalogQuery.data ?? [];
  const areaByUuid = useMemo(
    () => new Map(areasCatalog.map((area) => [area.uuid, area])),
    [areasCatalog]
  );

  const [areasSearch, setAreasSearch] = useState('');
  const areaItems = useMemo(() => {
    const search = areasSearch.trim().toLowerCase();
    return areasCatalog
      .filter((area) => !search || area.description.toLowerCase().includes(search))
      .map((area) => ({ value: area.uuid, label: area.description }));
  }, [areasCatalog, areasSearch]);

  const watchedAreas = watch('areas') ?? [];
  const totalHa = useMemo(
    () =>
      watchedAreas.reduce(
        (sum, areaUuid) => sum + (areaByUuid.get(areaUuid)?.productive_area ?? 0),
        0
      ),
    [watchedAreas, areaByUuid]
  );
  const areasCount = watchedAreas.length;

  const watchedDescription = watch('description');
  const descriptionLength = (watchedDescription ?? '').length;

  const watchedStartDate = watch('start_date');
  const watchedEndDate = watch('end_date');

  const productionCycleMutation = useRequest({
    asyncFunction: tryPersistProductionCycle,
    entityName: text.singularLabel,
    queryKey: queryKey.productionCycles.productionCycles,
    queryKey2: queryKey.productionCycles.productionCycle,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: () => {
      navigate(-1);
    },
  });

  async function tryPersistProductionCycle(data: ProductionCycleFormType) {
    const payload: ProductionCyclePayload = {
      date: data.date,
      start_date: data.start_date,
      end_date: data.end_date,
      harvest_uuid: data.harvest_uuid,
      cultivation_uuid: data.cultivation_uuid,
      center_uuid: data.center_uuid,
      description: data.description.trim(),
      areas: data.areas,
    };

    // Nullable de verdade (D-FE-6) — omitido quando vazio, NUNCA string vazia
    // ou `null` literal no payload.
    if (data.employee_uuid) payload.employee_uuid = data.employee_uuid;

    // NUNCA no payload: `code` (R5), `user_id`/criador (R7), `farm_id` (R4,
    // derivado do header `X-Farm-Id` pelo interceptor de `services/api.ts`).

    try {
      return isEditing && productionCycleUuid
        ? await updateProductionCycle(productionCycleUuid, payload)
        : await createProductionCycle(payload);
    } catch (error) {
      // 422 por campo mapeado LOCALMENTE (mesmo padrão de `tryPersistHarvest`,
      // Safra/CreateOrUpdateSafra.tsx — este projeto não tem `setError`
      // compartilhado). O conflito R6 (BusinessRuleException) chega SEM
      // `errors` por campo — nada aqui dispara, e o `throw` abaixo preserva
      // o toast genérico de `useRequest`, que cai no `message` de topo
      // (`extractApiErrorMessage`/`extractApiFieldErrorMessage` retornam
      // `undefined` quando `errors` está ausente/vazio).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          if (messages?.[0]) {
            setError(field as keyof ProductionCycleFormType, {
              type: 'server',
              message: messages[0],
            });
          }
        });
      }
      throw error;
    }
  }

  async function onSubmit(data: ProductionCycleFormType) {
    // `isEmpty` tem semântica INVERTIDA no projeto (`src/utils/isEmpty.ts`):
    // retorna `true` quando o objeto TEM chaves. Editar sem nenhum campo
    // "sujo" (`dirtyFields` vazio) não deve chamar a API — mesmo padrão
    // canônico de `CreateOrUpdateSafra.tsx`/~40 siblings.
    if (isEditing && !isEmpty(dirtyFields)) {
      navigate(-1);
    } else {
      await productionCycleMutation.mutateAsync(data);
    }
  }

  const isSubmitting = productionCycleMutation.isPending;

  // uuid mal formado na rota de EDIÇÃO — o efeito acima já está
  // redirecionando; nada a renderizar (nunca cai silenciosamente em modo
  // "criar"). `/novo` (sem param) NUNCA entra aqui.
  if (hasMalformedRouteParam) {
    return null;
  }

  return (
    <FormContainer
      title={isEditing ? text.form.title.edit : text.form.title.create}
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
        {/* Painel "Dados Gerais" — mesmo idioma visual de
            `CicloProducaoDetalhe.tsx` (D-FE-5). */}
        <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={4}
            pb={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            {text.detail.generalData.title}
          </Text>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            {/* `code` — SÓ na edição, server-generated (R5), NUNCA enviado. */}
            {isEditing && (
              <InputReadOnly
                label={text.form.fields.code}
                value={currentCode ?? '—'}
                helperText={text.form.hints.codeAutoGenerated}
                loading={!!isLoading}
              />
            )}

            {/* 3 datas DISTINTAS (L2) — nunca colapsar uma na outra (bug
                legado C49, já corrigido no contrato). */}
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.form.fields.date}
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={errors.date?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.form.fields.startDate}
                  maxDate={watchedEndDate ? new Date(`${watchedEndDate}T00:00:00`) : undefined}
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={errors.start_date?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <DateInput
                  label={text.form.fields.endDate}
                  minDate={watchedStartDate ? new Date(`${watchedStartDate}T00:00:00`) : undefined}
                  value={field.value ?? null}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={errors.end_date?.message}
                  isRequired
                  disabled={!canSave || !!isLoading}
                />
              )}
            />

            <Controller
              name="harvest_uuid"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Select
                  label={text.form.fields.harvest}
                  name={name}
                  value={harvestOptions.find((option) => option.value === value) ?? null}
                  onChange={(opt: Option | null) => {
                    setHarvestOption(opt);
                    onChange(opt?.value ?? '');
                  }}
                  options={harvestOptions}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave}
                  loading={!!isLoading || activeHarvestsQuery.isLoading}
                />
              )}
            />

            <Controller
              name="cultivation_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectCultivation
                  label={text.form.fields.cultivation}
                  name={name}
                  value={cultivationOption}
                  onChange={(opt) => {
                    setCultivationOption(opt);
                    onChange(opt?.value ?? '');
                  }}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            {/* Centro de Custo ANALÍTICO (L4) — `only_analytic:true` filtra
                só folhas; centro sintético dispara 422 no submit (backend). */}
            <Controller
              name="center_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.costCenter}
                  service={(params) => listCostCenterOptions({ ...params, only_analytic: true })}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={centerOption ?? undefined}
                  onChange={(opt: any) => {
                    setCenterOption(opt ?? null);
                    onChange(opt?.value ?? '');
                  }}
                  error={error?.message}
                  isRequired
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />

            <Input
              label={text.form.fields.description}
              placeholder={text.form.placeholders.description}
              helperText={errors.description?.message ? undefined : `${descriptionLength}/100`}
              {...register('description')}
              error={errors.description?.message}
              isRequired
              loading={!!isLoading}
              disabled={!canSave}
            />

            {/* Funcionário — opcional/nullable (D-FE-6). Criador ("Responsável"
                em `user`) NUNCA aparece aqui como campo editável (D-FE-4,
                R7 — server-derived). */}
            <Controller
              name="employee_uuid"
              control={control}
              render={({ field: { name, onChange }, fieldState: { error } }) => (
                <SelectAsyncPaginate
                  name={name}
                  label={text.form.fields.employee}
                  service={listEmployees}
                  mapOptions={(item: EmployeeListItem) => ({ label: item.name, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={employeeOption ?? undefined}
                  onChange={(opt: any) => {
                    setEmployeeOption(opt ?? null);
                    onChange(opt?.value ?? null);
                  }}
                  error={error?.message}
                  isDisabled={!canSave || !!isLoading}
                />
              )}
            />
          </SimpleGrid>
        </Box>

        {/* Painel "Áreas" (D-FE-2/D-FE-3) — mesmo idioma visual de
            `CicloProducaoDetalhe.tsx`. Multiselect PLANO sobre o catálogo
            COMPLETO da fazenda ativa (loop paginado, TASK-FE-01) — NUNCA o
            mapa Leaflet do Pastejo. */}
        <Box
          mt={6}
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="lg"
          p={4}
        >
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={4}
            pb={2}
            borderBottom="1px solid"
            borderColor="border.subtle"
          >
            {text.detail.areas.title}
          </Text>

          <SimpleGrid columns={columnsForm.twoColumns} gap={6} mb={4}>
            <InputReadOnly label={text.form.fields.totalHa} value={totalHa.toFixed(2)} />
            <InputReadOnly label={text.form.fields.areasCount} value={String(areasCount)} />
          </SimpleGrid>

          <Controller
            name="areas"
            control={control}
            render={({ field: { value, onChange } }) => (
              <CheckboxListField
                label={text.form.fields.areas}
                items={areaItems}
                selectedValues={value ?? []}
                onChange={onChange}
                searchValue={areasSearch}
                onSearchChange={setAreasSearch}
                searchPlaceholder={text.form.placeholders.areasSearch}
                selectedCountLabel={text.form.fields.areasCount}
                isLoading={areasCatalogQuery.isLoading}
                isError={areasCatalogQuery.isError}
                onRetry={() => areasCatalogQuery.refetch()}
                isDisabled={!canSave}
              />
            )}
          />
          {typeof errors.areas?.message === 'string' && (
            <Text fontSize="sm" color="fg.error" mt={2}>
              {errors.areas.message}
            </Text>
          )}
        </Box>
      </Form>
    </FormContainer>
  );
}
