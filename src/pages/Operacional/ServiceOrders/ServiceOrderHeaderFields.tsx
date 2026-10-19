// src/pages/Operacional/ServiceOrders/ServiceOrderHeaderFields.tsx
// -----------------------------------------------------------------------------
// Bloco de cabeçalho do form de Ordem de Serviço — TASK-FE-2005. 6 seções
// escalares em `CollapsibleSection` (D-FRONT-03 default): Identificação,
// Tipo de Serviço, Execução, Condições, Instruções, Segurança e
// Sustentabilidade — fiel ao agrupamento EXATO do accordion legado
// (`_forms.blade.php`, cards "Identificação da OS"/"Tipo de serviço"/
// "Execução"/"Condições e Restrições"/"Instruções Detalhadas"/"Segurança e
// Sustentabilidade"), mirror `AppropriationHeaderFields.tsx` (JSX extraído,
// reaproveitável).
//
// Correção pós-E2E (GAP-OS-02/03, execução 038, feedback do dono):
//   - GAP-OS-02: "Tipo de Serviço" estava com os 7 campos numa seção só —
//     separado em 2 seções mirror legado: "Tipo de serviço" (Uso/Operação/
//     Atividade) + "Execução" (Área/Cultura-Variedade/Lote/Categoria
//     Animal). Cascatas uuid (IG-01/02/03) preservadas 100% — só o
//     agrupamento visual mudou.
//   - GAP-OS-03: `environmental_restrictions` estava em "Condições"
//     (divergência do legado, onde só weather/temperatura/período moram
//     nesse card) — movido para dentro da seção "Segurança" (renomeada
//     "Segurança e Sustentabilidade", label EXATO do card legado), junto
//     de `legal_compliance`.
//
// exec-038 HOMOLOG R2 (R2-01, achado E2E do dono) — "Tipo de Serviço",
// "Execução", "Condições", "Instruções" e "Segurança e Sustentabilidade"
// (as 5 seções abaixo de "Identificação") passam a compartilhar UM ÚNICO
// `Accordion.Root` via `CollapsibleSectionGroup` — abrir uma FECHA as
// outras (antes, 3 delas nasciam abertas simultaneamente). "Identificação"
// permanece com seu próprio Root independente (sempre aberta, é a única
// seção 100% read-only do cabeçalho — mirror `_accordion.blade.php`, onde o
// card "Identificação da OS" é o único que nasce com `collapse show`).
// "Tipo de Serviço" é a seção do grupo que nasce aberta por padrão
// (`defaultOpenSectionId`), preservando o máximo de campos visíveis ao
// carregar sem violar a exclusividade mútua pedida pelo dono.
//
// R2-05 (bloco Insumos) — `area_uuid` embute `productive_area` na própria
// option (`AreaOptionResource`, aditivo exec-038 HOMOLOG R2) para o cálculo
// "Qtd Total = Qtd/ha × área produtiva" de `ServiceOrderProductTab.tsx` ler
// sem round-trip extra — mirror `quantity` embutido em `productOption` de
// `AppropriationStockTab.tsx`.
//
// Cascatas (comportamento extraído do legado, `_forms.blade.php:241-316` —
// NÃO palpite):
//   - IG-01: `category` → habilita/desabilita cultivo (2=Agricultura)/
//     lote+categoria animal (3=Pecuária); 1=Ambos habilita os 3. PRESERVE
//     as-is: o legado marca "readonly" (nunca "hidden") — os 3 campos ficam
//     sempre visíveis, só desabilitados quando não se aplicam.
//   - IG-02: `category` → recarrega Operações (`operations/options?category=`)
//     e invalida `operation_uuid`/`activity_uuid` selecionados.
//   - IG-03: `operation_uuid` → recarrega Atividades
//     (`activities/options?operation_uuid=`) e invalida `activity_uuid`.
//
// GAP-OS-01/04 (execução 038, decisão do dono resolve/supera a antiga
// `DECISAO_DE_ESCOPO` de `code` como Input manual — endpoint
// `GET /service-orders/next-code` confirmado):
//   - "Solicitante" — `InputReadOnly` NOVO, SEMPRE travado (usuário
//     autenticado na criação, `user` do detalhe na edição), NUNCA vai ao
//     payload (`user_id` resolvido no servidor, DEC-LOS-07). Orquestrado
//     pelo pai (`CreateOrUpdateServiceOrder.tsx`), recebido via prop
//     `requesterName` — mirror `responsibleName` de
//     `CreateOrUpdateEstacaoDeMonta.tsx`.
//   - "Código" — `InputReadOnly` (era `Input` editável): travado e
//     pré-preenchido na criação (`next-code`, prop `codeLoading`) e na
//     edição (valor do detalhe já populado por `watch('code')`). VAI no
//     payload como está (mirror `CreateOrUpdateEstacaoDeMonta.tsx`, `code`
//     read-only mas presente no payload).
// -----------------------------------------------------------------------------

import { SimpleGrid } from '@chakra-ui/react';
import { Controller } from 'react-hook-form';

import { DateInput } from '@/components/DateInput';
import { CollapsibleSection } from '@/components/Form/CollapsibleSection';
import { CollapsibleSectionGroup } from '@/components/Form/CollapsibleSectionGroup';
import { Field } from '@/components/Form/Field';
import { Input } from '@/components/Form/Input';
import { InputReadOnly } from '@/components/Form/InputReadOnly';
import { NumberInput } from '@/components/Form/NumberInput';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { Textarea } from '@/components/Form/Textarea';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';
import { getServiceOrderCategoryOptions } from '@/constants/serviceOrders/options/service-order-category-options';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import {
  listServiceOrderActivityOptions,
  listServiceOrderAreaOptions,
  listServiceOrderExecutorOptions,
  listServiceOrderOperationOptions,
} from '@/services/v2/ServiceOrders/service-order-service';

import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { CultivationOption } from '@/@types/v2/Cultivation/cultivation';
import type {
  ServiceOrderActivityOption,
  ServiceOrderAreaOption,
  ServiceOrderExecutorOption,
  ServiceOrderForm as ServiceOrderFormType,
  ServiceOrderOperationOption,
} from '@/@types/v2/ServiceOrders';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

const CATEGORY_AGRICULTURE = 2;
const CATEGORY_LIVESTOCK = 3;

export interface ServiceOrderHeaderFieldsProps {
  control: Control<ServiceOrderFormType>;
  errors: FieldErrors<ServiceOrderFormType>;
  watch: UseFormWatch<ServiceOrderFormType>;
  setValue: UseFormSetValue<ServiceOrderFormType>;
  canSave: boolean;
  isLoading: boolean;
  /** GAP-OS-01 — nome do "Solicitante" (usuário logado na criação, `user`
   *  do detalhe na edição), orquestrado pelo pai. SEMPRE read-only. */
  requesterName: string;
  /** GAP-OS-04 — `true` enquanto `GET /service-orders/next-code` está em
   *  voo (só em modo criação). Alimenta o `Skeleton` do `InputReadOnly`
   *  de "Código". */
  codeLoading: boolean;
}

export function ServiceOrderHeaderFields({
  control,
  errors,
  watch,
  setValue,
  canSave,
  isLoading,
  requesterName,
  codeLoading,
}: ServiceOrderHeaderFieldsProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.serviceOrders.serviceOrder.form;

  const isDisabled = !canSave || isLoading;
  const categoryOptions = getServiceOrderCategoryOptions(languageGB);
  const categoryValue = watch('category')?.value;

  return (
    <>
      {/* ── Identificação ────────────────────────────────────────────── */}
      <CollapsibleSection title={formText.sections.identification} fieldCount={6} defaultOpen>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          {/* GAP-OS-04 — "Código" SEMPRE read-only (criação: prévia
              `next-code`; edição: valor do detalhe). VAI ao payload como
              está — mirror `CreateOrUpdateEstacaoDeMonta.tsx`. */}
          <InputReadOnly
            name="code"
            label={formText.fields.code}
            value={watch('code') || '—'}
            error={errors.code?.message as string | undefined}
            loading={codeLoading}
          />

          {/* GAP-OS-01 — "Solicitante" NOVO, SEMPRE read-only, NUNCA vai ao
              payload (`user_id` resolvido no servidor, DEC-LOS-07). */}
          <InputReadOnly
            name="requester"
            label={formText.fields.requester}
            value={requesterName}
            loading={isLoading}
          />

          <Controller
            name="executor_uuid"
            control={control}
            render={({ field }) => (
              <SelectAsyncPaginate
                name={field.name}
                label={formText.fields.executor}
                placeholder={formText.placeholders.executor}
                error={errors.executor_uuid?.message as string | undefined}
                service={listServiceOrderExecutorOptions}
                mapOptions={(item: ServiceOrderExecutorOption) => ({
                  label: item.name ?? '—',
                  value: item.uuid,
                })}
                findParams={(search: string | { search: string }) => ({
                  search: typeof search === 'string' ? search : search.search,
                })}
                value={field.value ?? undefined}
                onChange={(option: any) => field.onChange(option ?? null)}
                isRequired
                isDisabled={isDisabled}
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            )}
          />

          <Controller
            name="dt_emission"
            control={control}
            render={({ field }) => (
              <Field
                label={formText.fields.dtEmission}
                isRequired
                errorText={errors.dt_emission?.message as string | undefined}
              >
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />

          <Controller
            name="execution_date"
            control={control}
            render={({ field }) => (
              <Field
                label={formText.fields.executionDate}
                isRequired
                errorText={errors.execution_date?.message as string | undefined}
              >
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />

          <Controller
            name="deadline"
            control={control}
            render={({ field }) => (
              <Field
                label={formText.fields.deadline}
                isRequired
                errorText={errors.deadline?.message as string | undefined}
              >
                <DateInput value={field.value} onChange={field.onChange} disabled={isDisabled} />
              </Field>
            )}
          />
        </SimpleGrid>
      </CollapsibleSection>

      {/* ── R2-01: accordion single-open — Tipo de Serviço/Execução/
          Condições/Instruções/Segurança compartilham 1 Root (ver cabeçalho
          do arquivo); "Identificação" acima fica FORA do grupo. ────────── */}
      <CollapsibleSectionGroup defaultOpenSectionId="service-type">
        {/* ── Tipo de Serviço ──────────────────────────────────────────── */}
        {/* GAP-OS-02 — card legado "Tipo de serviço": Uso/Operação/Atividade,
          SEM os campos de Execução (mirror `_forms.blade.php`, card
          separado). */}
        <CollapsibleSection
          sectionId="service-type"
          title={formText.sections.serviceType}
          fieldCount={3}
        >
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  label={formText.fields.category}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => {
                    field.onChange(option ?? null);
                    // IG-02 — troca de `category` invalida a cascata inteira
                    // (Operação depende de `category`, Atividade depende de
                    // Operação).
                    setValue('operation_uuid', null);
                    setValue('activity_uuid', null);
                  }}
                  options={categoryOptions}
                  error={errors.category?.message as string | undefined}
                  isRequired
                  isDisabled={isDisabled}
                />
              )}
            />

            <Controller
              name="operation_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.operation}
                  placeholder={formText.placeholders.operation}
                  error={errors.operation_uuid?.message as string | undefined}
                  service={listServiceOrderOperationOptions}
                  mapOptions={(item: ServiceOrderOperationOption) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    category: categoryValue,
                  })}
                  cacheUniqs={[categoryValue]}
                  value={field.value ?? undefined}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    // IG-03 — troca de Operação invalida a Atividade escolhida.
                    setValue('activity_uuid', null);
                  }}
                  isRequired
                  isDisabled={isDisabled || !categoryValue}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="activity_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.activity}
                  placeholder={formText.placeholders.activity}
                  error={errors.activity_uuid?.message as string | undefined}
                  service={listServiceOrderActivityOptions}
                  mapOptions={(item: ServiceOrderActivityOption) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    operation_uuid: watch('operation_uuid')?.value,
                  })}
                  cacheUniqs={[watch('operation_uuid')?.value]}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={isDisabled || !watch('operation_uuid')}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ── Execução ─────────────────────────────────────────────────── */}
        {/* GAP-OS-02 — card legado "Execução": Área/Cultura-Variedade/Lote/
          Categoria Animal (mirror `_forms.blade.php`, card separado de
          "Tipo de serviço"). Cascatas uuid preservadas 100%. */}
        <CollapsibleSection
          sectionId="execution"
          title={formText.sections.execution}
          fieldCount={4}
        >
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="area_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.area}
                  placeholder={formText.placeholders.area}
                  error={errors.area_uuid?.message as string | undefined}
                  service={listServiceOrderAreaOptions}
                  mapOptions={(item: ServiceOrderAreaOption) => ({
                    label: item.description,
                    value: item.uuid,
                    // R2-05 (bloco Insumos) — embutida sem round-trip extra,
                    // ver nota de topo do arquivo.
                    productive_area: item.productive_area,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isRequired
                  isDisabled={isDisabled}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            {/* IG-01 — PRESERVE as-is: os 3 campos ficam sempre visíveis,
              desabilitados conforme `category` (2=Agricultura desabilita
              lote/categoria animal; 3=Pecuária desabilita cultivo; 1=Ambos
              habilita os 3). */}
            <Controller
              name="cultivation_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.cultivation}
                  placeholder={formText.placeholders.cultivation}
                  service={listCultivationOptions}
                  mapOptions={(item: CultivationOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={isDisabled || categoryValue === CATEGORY_LIVESTOCK}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="batch_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.batch}
                  placeholder={formText.placeholders.batch}
                  // R4-FE-02 (P1) — `batch_uuid` de formulário, sem "Sem lote".
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={isDisabled || categoryValue === CATEGORY_AGRICULTURE}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />

            <Controller
              name="category_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={formText.fields.categoryAnimal}
                  placeholder={formText.placeholders.categoryAnimal}
                  service={listCategoryAnimalOptions}
                  mapOptions={(item: CategoryAnimalOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    // `is_enabled` (GAP-BE-687/TASK-BE-1088, absorvido por
                    // 063-est03-9-reprovacoes/TASK-FE-063-12) — Select de
                    // Categoria de Ordens de Serviço só oferece categorias
                    // habilitadas.
                    is_enabled: true,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={isDisabled || categoryValue === CATEGORY_AGRICULTURE}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ── Condições ────────────────────────────────────────────────── */}
        {/* GAP-OS-03 — `environmental_restrictions` REMOVIDO daqui (mirror
          legado, card "Condições e Restrições" só tem os 5 campos abaixo)
          e movido para a seção "Segurança e Sustentabilidade" abaixo. */}
        <CollapsibleSection
          sectionId="conditions"
          title={formText.sections.conditions}
          fieldCount={5}
        >
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="weather_requirements"
              control={control}
              render={({ field }) => (
                <Input
                  label={formText.fields.weatherRequirements}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="minimum_temperature"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.minimumTemperature}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={errors.minimum_temperature?.message as string | undefined}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="maximum_temperature"
              control={control}
              render={({ field }) => (
                <NumberInput
                  name={field.name}
                  label={formText.fields.maximumTemperature}
                  value={field.value ?? null}
                  onValueChange={(value) => field.onChange(value)}
                  error={errors.maximum_temperature?.message as string | undefined}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="allowed_working_period_start"
              control={control}
              render={({ field }) => (
                <Input
                  type="time"
                  label={formText.fields.allowedWorkingPeriodStart}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  error={errors.allowed_working_period_start?.message as string | undefined}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="allowed_working_period_end"
              control={control}
              render={({ field }) => (
                <Input
                  type="time"
                  label={formText.fields.allowedWorkingPeriodEnd}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  error={errors.allowed_working_period_end?.message as string | undefined}
                  disabled={isDisabled}
                />
              )}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ── Instruções ───────────────────────────────────────────────── */}
        <CollapsibleSection
          sectionId="instructions"
          title={formText.sections.instructions}
          fieldCount={4}
        >
          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
            <Controller
              name="service_description"
              control={control}
              render={({ field }) => (
                <Textarea
                  label={formText.fields.serviceDescription}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="expected_result_description"
              control={control}
              render={({ field }) => (
                <Textarea
                  label={formText.fields.expectedResultDescription}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="success_criteria_description"
              control={control}
              render={({ field }) => (
                <Textarea
                  label={formText.fields.successCriteriaDescription}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="roadmap_description"
              control={control}
              render={({ field }) => (
                <Textarea
                  label={formText.fields.roadmapDescription}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ── Segurança e Sustentabilidade ────────────────────────────────
          GAP-OS-03 — renomeada (era "Segurança") + `environmental_restrictions`
          movido para dentro, mirror EXATO do card legado
          "Segurança e Sustentabilidade" (`_forms.blade.php`: restrições
          ambientais + conformidade legal, nesta ordem). ─────────────── */}
        <CollapsibleSection sectionId="security" title={formText.sections.security} fieldCount={2}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="environmental_restrictions"
              control={control}
              render={({ field }) => (
                <Input
                  label={formText.fields.environmentalRestrictions}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />

            <Controller
              name="legal_compliance"
              control={control}
              render={({ field }) => (
                <Input
                  label={formText.fields.legalCompliance}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isDisabled}
                />
              )}
            />
          </SimpleGrid>
        </CollapsibleSection>
      </CollapsibleSectionGroup>
    </>
  );
}
