// src/components/MovementAllocationEditor/MovementAllocationEditor.tsx
// -----------------------------------------------------------------------------
// Componente REUTILIZÁVEL de rateio do módulo "Mov. Caixa/Bancário" (Movement
// — Financeiro, TASK-MV-FE-03). Consumido pelo formulário completo
// create/edit (TASK-MV-FE-05, `allocations` dentro de `MovementForm`) E pela
// tela dedicada de edit-rateio (TASK-MV-FE-06, `MovementAllocationForm` — SEM
// campo `value` de cabeçalho editável, Movement-contrato-tela.md §4 "Reuso").
//
// Decisão estrutural (Movement-contrato-tela.md §4): NÃO instancia seu
// próprio `useFieldArray` — mirror exato da decisão de
// `CentroCusto/CreateOrUpdateCentroCusto.tsx` /
// `SaldoInicial/CreateSaldoInicial.tsx` (`ApportionmentsSection`),
// `fields`/`append`/`remove` chegam via props, o `useFieldArray({ name:
// 'allocations' })` vive no formulário PAI. Diferença destes dois siblings:
// aqui o componente precisa servir a DOIS shapes de formulário diferentes
// (`MovementForm` e `MovementAllocationForm`) — por isso é genérico sobre
// `TFieldValues extends { allocations: MovementAllocationItemForm[] }`, e
// não hard-coded a um único `*FormType` como os siblings. Internamente, os
// paths de `Controller`/`useWatch` são resolvidos contra o shape concreto
// `AllocationsFieldValues` (cast local, não vazado na API pública) — o
// gerador de `Path<T>` do react-hook-form não resolve template literals
// contra um `TFieldValues` ainda abstrato dentro do corpo genérico.
//
// SEM bug legado (Leitura do dev da Tarefa, itens do Documentor): nenhum
// `useEffect` global resetando todas as linhas ao mudar `type`/
// `type_category` do cabeçalho (UT-000796: a limpeza das categorias na
// troca do Tipo vive no PAI, em handler de ação do usuário), nenhum handler por `id`/seletor de classe —
// cada linha isolada por `index` do `useFieldArray` (React puro).
//
// Percentual de linha e total/diferença do rodapé são 100% cosméticos,
// client-side (`useWatch`) — NUNCA chegam ao payload (`allocations[].value`
// é o único campo numérico de linha enviado, Movement-contrato.md §2.1).
// Total/diferença do rodapé (badge/Alert) continuam SEM bloquear o submit
// por conta própria — quem bloqueia é a validação Yup/guarda manual do
// FORMULÁRIO PAI (TASK-MV-FE-08, Ajuste 2: `movement-schema.ts` `.test()`
// cross-field / `EditRateioMovimento.tsx` guarda manual em `onSubmit`).
// NUANCE (não remoção) — "nunca bloqueiam o submit" deixou de ser verdade NO
// NÍVEL DO FORM; este componente em si continua sem bloquear nada.
//
// TASK-MV-FE-08 (Ajuste 3) — Percentual passou de `<Text>` read-only para
// coluna editável (reusa `PercentInput` já existente), bidirecional: editar
// Valor recalcula % (já existia); editar % recalcula o Valor DA MESMA linha
// (mirror `calcValues` do legado, arredondado a 2 casas). Decisão de escopo
// DELIBERADA: SEM `distributeValues` (reconciliação cruzada entre TODAS as
// linhas) — o bloqueio de soma do Ajuste 2 já garante soma exata no submit,
// tornando a reconciliação automática de centavos redundante (ver Tarefa).
// -----------------------------------------------------------------------------

import { ElementType, useCallback, useMemo, useState } from 'react';

import { Alert, Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  useWatch,
} from 'react-hook-form';
import { FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { usePermissions } from '@/hooks/usePermissions';

import { openFinancialCategoryReport } from '@/utils/financialCategoryReport';
import type { MovementAllocationReportRow } from '@/utils/movementAllocationReport';
import { openMovementAllocationReport } from '@/utils/movementAllocationReport';
import { openPlanAccountReport } from '@/utils/planAccountReport';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import {
  listAllFinancialCategoriesForReport,
  listFinancialCategoryOptions,
} from '@/services/v2/FinancialCategories/financial-category-service';
import type { ListFinancialCategoryOptionsParams } from '@/services/v2/FinancialCategories/financial-category-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';
// `listPlanAccountOptions` — TASK-MV-FE-02 (camada de serviço, em execução
// paralela) adiciona esta função em `plan-account-service.ts`
// (Movement-contrato-tela.md §1, Risco 3: endpoint `GET /plan-accounts/options`
// já existe no backend, só a função do service front estava faltando).
// Import literal do nome real esperado — NUNCA mockado aqui (SEM MOCK); se a
// função ainda não existir no momento da estática, o `tsc` reporta a lacuna
// honestamente (dependência declarada na Tarefa, não decisão desta camada).
// TASK-MV-FE-07 (addendum §8) — `listAllPlanAccountsForReport` reaproveitada
// 100% (zero lógica nova de relatório), mirror `PlanAccount/HeaderTable.tsx`.
import {
  listAllPlanAccountsForReport,
  listPlanAccountOptions,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { LanguageDate } from '@/@types/language';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { Harvest } from '@/@types/v2/Harvests';
import type { MovementAllocationItemForm } from '@/@types/v2/Movements';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

// Shape concreto mínimo que este componente precisa do formulário pai —
// tanto `MovementForm` (form completo) quanto `MovementAllocationForm` (form
// dedicado de edit-rateio) satisfazem esta interface (ambos têm
// `allocations: MovementAllocationItemForm[]`, Movement-contrato-tela.md §4).
export interface AllocationsFieldValues {
  allocations: MovementAllocationItemForm[];
}

export interface MovementAllocationEditorProps<
  TFieldValues extends AllocationsFieldValues = AllocationsFieldValues,
> {
  /** `control` do `useForm` do formulário PAI (`MovementForm` ou `MovementAllocationForm`). */
  control: Control<TFieldValues>;
  // `fields`/`append` fixados ao shape concreto `AllocationsFieldValues` (não
  // genéricos sobre `TFieldValues`) — o gerador `ArrayPath<T>` do
  // react-hook-form não prova, dentro de um corpo ainda genérico/abstrato,
  // que `'allocations'` é um `ArrayPath<TFieldValues>` válido (TS2344),
  // mesmo com a constraint `extends AllocationsFieldValues`. Estruturalmente
  // idêntico ao que `useFieldArray<MovementForm | MovementAllocationForm>({
  // name: 'allocations' })` do PAI de fato devolve (mesmo elemento de array,
  // `MovementAllocationItemForm`), então a atribuição no call site é segura.
  /** `fields` do `useFieldArray({ control, name: 'allocations' })` do PAI. */
  fields: FieldArrayWithId<AllocationsFieldValues, 'allocations', 'id'>[];
  /** `append` do mesmo `useFieldArray` do PAI. */
  append: UseFieldArrayAppend<AllocationsFieldValues, 'allocations'>;
  /** `remove` do mesmo `useFieldArray` do PAI. */
  remove: UseFieldArrayRemove;
  /** Valor do cabeçalho do movimento — só para o cálculo cosmético de percentual/total (nunca editável aqui). */
  headerValue: number;
  /** `formState.errors` do formulário PAI. */
  errors: FieldErrors<TFieldValues>;
  languageGB: LanguageDate;
  /** Gate de permissão do formulário PAI (`canSave`/`canEdit`) — opcional, default habilitado. */
  disabled?: boolean;
  /**
   * Exibe a coluna Safra (`allocations[].harvest_uuid`) por linha —
   * default `true` (comportamento inalterado para os consumidores
   * existentes: tela cheia `CreateOrUpdateMovimento.tsx`/
   * `MovementAllocationForm`). `false` some com o `Select` da UI (mirror
   * `NewMovementModal.tsx`/SURF-066 — o modal legado de Novo Movimento da
   * Conciliação OFX nunca teve campo Safra), mas o valor da linha continua
   * `harvest_uuid: null` no form (`handleAdd` abaixo) — a API valida
   * `present, nullable`, a CHAVE precisa sobreviver no payload do
   * formulário pai, só a UI é condicional aqui.
   */
  showHarvest?: boolean;
  /**
   * UT-000796 (D-102-07) — filtro OPCIONAL das categorias do rateio (ex.:
   * derivado de Tipo/Tp. Categoria pelo form pai). Ausente = comportamento
   * idêntico ao anterior (protege `EditRateioMovimento`/`BulkInvestmentBanner`).
   * A limpeza de categorias na troca de Tipo vive no PAI (handler), nunca
   * aqui (este componente segue sem `useEffect` de reset).
   */
  categoryOptionsParams?: Partial<ListFinancialCategoryOptionsParams>;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

// UT-000753 (b) — o select de Centro de Custo do rateio de Movimento NUNCA
// pode listar Centros SINTÉTICOS (class=1) nem desativados: mirror do
// legado (`agro365 Admin/MovementController.php:147-151`), que filtra
// `class=2` (Analítico) + ativos no mesmo combo. `only_analytic`/
// `is_enabled` já são aceitos por `listCostCenterOptions`
// (`cost-center-service.ts`) — mesmo padrão de
// `ExpenseApportionmentTab.tsx:405-408`. Função DEDICADA (não a genérica
// `findParamsFromSearch` acima, reutilizada pelos demais selects desta
// linha — Categoria/Conta Contábil/Safra — que não têm este filtro).
const findCostCenterParams = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
  only_analytic: true,
  is_enabled: 'true' as const,
});

export function MovementAllocationEditor<
  TFieldValues extends AllocationsFieldValues = AllocationsFieldValues,
>({
  control,
  fields,
  append,
  remove,
  headerValue,
  errors,
  languageGB,
  disabled = false,
  showHarvest = true,
  categoryOptionsParams,
}: MovementAllocationEditorProps<TFieldValues>) {
  const categoryFilterKey = JSON.stringify(categoryOptionsParams ?? {});
  const findCategoryParams = useCallback(
    (search: string | { search: string }) => ({
      ...findParamsFromSearch(search),
      ...(categoryOptionsParams ?? {}),
    }),
    // A chave serializada é a identidade estável do filtro.
    [categoryFilterKey]
  );
  const categoryCacheUniqs = useMemo(() => [categoryFilterKey], [categoryFilterKey]);
  const text = languageGB.movements.movement.form.allocations;
  const headerValueLabel = languageGB.movements.movement.allocation.headerValueLabel;

  // TASK-MV-FE-07 (addendum §8) — 3 ícones de impressão no header do card de
  // Rateio. `reportsText` = textos PRÓPRIOS deste bloco (tooltip dos botões +
  // colunas/rodapé do relatório de Rateio, sem precedente no legado). Os
  // outros 2 relatórios (Categoria/Conta Contábil) reaproveitam o `report`
  // dos seus próprios módulos (mirror `PlanAccount/HeaderTable.tsx`), não
  // duplicado aqui.
  const { can } = usePermissions();
  const reportsText = text.reports;
  const categoryReportText = languageGB.financialCategories.financialCategory.report;
  const planAccountReportText = languageGB.planAccounts.planAccount.report;
  const planAccountTableText = languageGB.planAccounts.planAccount.list.table;

  // 3 estados de loading INDEPENDENTES (não 1 compartilhado) — cada botão
  // reflete só o próprio laço/print, mirror `isGeneratingReport` de
  // `PlanAccount/HeaderTable.tsx`.
  const [isPrintingCategoryReport, setIsPrintingCategoryReport] = useState(false);
  const [isPrintingPlanAccountReport, setIsPrintingPlanAccountReport] = useState(false);
  const [isPrintingAllocationReport, setIsPrintingAllocationReport] = useState(false);

  // Categoria — catálogo completo do tenant, SEM filtro pelo movimento
  // (decisão do dono, Movement-contrato-tela.md §8.3/2). Gate:
  // `financialcategories_view`.
  async function handlePrintCategoryReport() {
    setIsPrintingCategoryReport(true);
    try {
      const items = await listAllFinancialCategoriesForReport();
      const opened = openFinancialCategoryReport(items, {
        documentTitle: categoryReportText.documentTitle,
        columnCode: categoryReportText.columnCode,
        columnClass: categoryReportText.columnClass,
        columnType: categoryReportText.columnType,
        columnDescription: categoryReportText.columnDescription,
        metaCountSingular: categoryReportText.metaCountSingular,
        metaCountPlural: categoryReportText.metaCountPlural,
      });
      if (!opened) {
        toaster.error({
          title: languageGB.financialCategories.financialCategory.singularLabel,
          description: categoryReportText.popupBlockedToast,
        });
      }
    } catch {
      toaster.error({
        title: languageGB.financialCategories.financialCategory.singularLabel,
        description: categoryReportText.errorToast,
      });
    } finally {
      setIsPrintingCategoryReport(false);
    }
  }

  // Conta Contábil — reuso 100% de `listAllPlanAccountsForReport`/
  // `openPlanAccountReport` já existentes (TASK-PA-12) — zero lógica nova de
  // relatório, só wiring do botão. Gate: `plan-accounts_view`.
  async function handlePrintPlanAccountReport() {
    setIsPrintingPlanAccountReport(true);
    try {
      const items = await listAllPlanAccountsForReport();
      const opened = openPlanAccountReport(items, {
        documentTitle: planAccountReportText.documentTitle,
        columnCode: planAccountTableText.code,
        columnClass: planAccountTableText.class,
        columnCondition: planAccountTableText.condition,
        columnDescription: planAccountTableText.description,
        metaCountSingular: planAccountReportText.metaCountSingular,
        metaCountPlural: planAccountReportText.metaCountPlural,
      });
      if (!opened) {
        toaster.error({
          title: languageGB.planAccounts.planAccount.singularLabel,
          description: planAccountReportText.popupBlockedToast,
        });
      }
    } catch {
      toaster.error({
        title: languageGB.planAccounts.planAccount.singularLabel,
        description: planAccountReportText.errorToast,
      });
    } finally {
      setIsPrintingPlanAccountReport(false);
    }
  }

  // Rateio — SEM chamada de API, nenhuma permissão extra (herda
  // `movements_view`/`movements_create` da própria rota). Fonte 100%
  // client-side: `watchedAllocations`/`headerValue` já em scope (calculados
  // abaixo). Reflete o estado NÃO SALVO do form nas telas de create/edit —
  // intencional (Movement-contrato-tela.md §8, "Riscos" item 2).
  function handlePrintAllocationReport() {
    setIsPrintingAllocationReport(true);
    try {
      const rows: MovementAllocationReportRow[] = watchedAllocations.map((item) => ({
        categoryLabel: item?.category_uuid?.label ?? '',
        planAccountLabel: item?.plan_account_uuid?.label ?? null,
        centerLabel: item?.center_uuid?.label ?? '',
        value: Number(item?.value) || 0,
      }));
      const opened = openMovementAllocationReport(rows, headerValue, {
        documentTitle: reportsText.allocationDocumentTitle,
        columnCategory: reportsText.allocationColumnCategory,
        columnPlanAccount: reportsText.allocationColumnPlanAccount,
        columnCenter: reportsText.allocationColumnCenter,
        columnValue: reportsText.allocationColumnValue,
        columnPercent: reportsText.allocationColumnPercent,
        totalLabel: reportsText.allocationTotalLabel,
        planAccountEmpty: reportsText.allocationPlanAccountEmpty,
      });
      if (!opened) {
        toaster.error({
          title: languageGB.movements.movement.singularLabel,
          description: reportsText.popupBlockedToast,
        });
      }
    } catch {
      toaster.error({
        title: languageGB.movements.movement.singularLabel,
        description: reportsText.errorToast,
      });
    } finally {
      setIsPrintingAllocationReport(false);
    }
  }

  // Cast local (não vaza na API pública) — resolve os paths concretos de
  // `Controller`/`useWatch` contra `AllocationsFieldValues`, evitando o
  // problema conhecido de `Path<T>` do react-hook-form não reduzir template
  // literals contra um `TFieldValues` ainda genérico/abstrato neste ponto.
  // `fields`/`append` já chegam concretamente tipados (`AllocationsFieldValues`,
  // ver comentário na interface de props), não precisam de cast aqui.
  const genericControl = control as unknown as Control<AllocationsFieldValues>;
  // Erro de nível de ARRAY (`.min(1)` do Yup) — `errors.allocations` é
  // `Merge<FieldError, FieldErrorsImpl<...>[]>` no react-hook-form: tem
  // `.message` próprio E é indexável por linha (mesmo cast pragmático já
  // usado por `ApportionmentsSection` de `CreateSaldoInicial.tsx`/
  // `CreateOrUpdateCentroCusto.tsx` para o mesmo cenário).
  const arrayError = (errors as any)?.allocations?.message as string | undefined;

  // Total rateado — 100% client-side/cosmético (`useWatch`, nunca chega ao
  // payload). Reativo a cada mudança de linha, sem depender de `watch()`
  // completo do formulário pai (este componente só recebe `control`).
  const watchedAllocations = useWatch({ control: genericControl, name: 'allocations' }) ?? [];
  const totalAllocated = watchedAllocations.reduce(
    (sum, item) => sum + (Number(item?.value) || 0),
    0
  );
  const difference = totalAllocated - headerValue;
  const isBalanced = Math.abs(difference) < 0.01;

  function handleAdd() {
    append({
      category_uuid: null,
      center_uuid: null,
      plan_account_uuid: null,
      harvest_uuid: null,
      value: null,
    });
  }

  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            {text.sectionTitle}
          </Text>
          <Text fontSize="xs" color="fg.muted" mt={0.5}>
            {text.sectionHint}
          </Text>
        </Box>

        {/* TASK-MV-FE-07 (addendum §8) — 3 ícones de impressão. Ordem:
            Categoria → Conta Contábil → Rateio. Categoria/Conta Contábil
            somem (não ficam disabled) sem a respectiva permissão; Rateio
            nunca é gated por permissão extra. */}
        <Flex align="center" gap={2} wrap="wrap">
          {can('financialcategories_view') && (
            <IconButtonTable
              aria-label={reportsText.categoryTooltip}
              mensegerTooltip={reportsText.categoryTooltip}
              variant="outline"
              loading={isPrintingCategoryReport}
              onClick={handlePrintCategoryReport}
            >
              <Icon as={FiPrinter} />
            </IconButtonTable>
          )}
          {can('plan-accounts_view') && (
            <IconButtonTable
              aria-label={reportsText.planAccountTooltip}
              mensegerTooltip={reportsText.planAccountTooltip}
              variant="outline"
              loading={isPrintingPlanAccountReport}
              onClick={handlePrintPlanAccountReport}
            >
              <Icon as={FiPrinter} />
            </IconButtonTable>
          )}
          <IconButtonTable
            aria-label={reportsText.allocationTooltip}
            mensegerTooltip={reportsText.allocationTooltip}
            variant="outline"
            loading={isPrintingAllocationReport}
            onClick={handlePrintAllocationReport}
          >
            <Icon as={FiPrinter} />
          </IconButtonTable>
        </Flex>

        <Flex align="center" gap={2} wrap="wrap">
          <Text fontSize="sm" color="fg.muted">
            {headerValueLabel}:
          </Text>
          <Badge colorPalette="gray" variant="outline">
            {formatCurrencyBRL(headerValue)}
          </Badge>
          <Text fontSize="sm" color="fg.muted">
            {text.sumLabel}:
          </Text>
          <Badge colorPalette={isBalanced ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalAllocated)}
          </Badge>
        </Flex>
      </Flex>

      {!isBalanced && (
        <Alert.Root status="warning" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{text.sumHint}</Alert.Title>
            <Alert.Description>{formatCurrencyBRL(difference)}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* TASK-MV-FE-08 (Ajuste 2) — `arrayError` já era lido mas só era
          renderizado quando `fields.length === 0` (`.min(1)`). Precisa
          aparecer também com linhas presentes — é o caso do bug relatado
          (linhas existem, a soma diverge). Mensagem EXATA vinda do Yup
          (`.test('sum-matches-header', ...)`) ou do `setError` manual do
          form dedicado de edit-rateio. */}
      {arrayError && fields.length > 0 && (
        <Alert.Root status="error" borderRadius="md" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{arrayError}</Alert.Title>
          </Alert.Content>
        </Alert.Root>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color={arrayError ? 'fg.error' : 'fg.muted'}>
            {arrayError || text.emptyTitle}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`allocations.${index}.category_uuid`}
                  control={genericControl}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.category}
                      placeholder={text.placeholders.category}
                      service={listFinancialCategoryOptions}
                      mapOptions={(item: FinancialCategoryOption) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={findCategoryParams}
                      cacheUniqs={categoryOptionsParams ? categoryCacheUniqs : undefined}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={disabled}
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`allocations.${index}.center_uuid`}
                  control={genericControl}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.center}
                      placeholder={text.placeholders.center}
                      service={listCostCenterOptions}
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={findCostCenterParams}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={disabled}
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`allocations.${index}.plan_account_uuid`}
                  control={genericControl}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={text.fields.planAccount}
                      placeholder={text.placeholders.planAccount}
                      service={listPlanAccountOptions}
                      mapOptions={(item: PlanAccountRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={findParamsFromSearch}
                      value={rowField.value ?? undefined}
                      onChange={(option: any) => rowField.onChange(option ?? null)}
                      error={fieldState.error?.message}
                      isDisabled={disabled}
                    />
                  )}
                />
              </Box>

              {showHarvest && (
                <Box flex="1" minW="220px">
                  <Controller
                    name={`allocations.${index}.harvest_uuid`}
                    control={genericControl}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={text.fields.harvest}
                        placeholder={text.placeholders.harvest}
                        service={listHarvestOptions}
                        mapOptions={(item: Harvest) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={findParamsFromSearch}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isDisabled={disabled}
                      />
                    )}
                  />
                </Box>
              )}

              {/* Valor — inalterado, exceto o `<Text>` de percentual
                  cosmético que migrou para a coluna editável abaixo
                  (TASK-MV-FE-08, Ajuste 3). */}
              <Box w={{ base: 'full', sm: '160px' }}>
                <Controller
                  name={`allocations.${index}.value`}
                  control={genericControl}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={text.fields.value}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={disabled}
                    />
                  )}
                />
              </Box>

              {/* Percentual — NOVA coluna editável (TASK-MV-FE-08, Ajuste
                  3). Mesmo `name` do Valor — 2 `Controller` independentes
                  lendo/escrevendo o MESMO campo RHF, sem introduzir
                  `percent` no schema/tipo/payload (mirror da decisão já
                  registrada de `allocations[].value` como único campo
                  numérico de linha, Movement-contrato.md §2.1). Editar o %
                  recalcula o Valor DESTA linha (mirror `calcValues` do
                  legado); editar o Valor já recalcula o % (Controller
                  acima, cosmético). */}
              <Box w={{ base: 'full', sm: '140px' }}>
                <Controller
                  name={`allocations.${index}.value`}
                  control={genericControl}
                  render={({ field: rowField }) => {
                    const rowValue = Number(rowField.value) || 0;
                    const rowPercent = headerValue > 0 ? (rowValue / headerValue) * 100 : 0;
                    return (
                      <PercentInput
                        name={`${rowField.name}-percent`}
                        label={text.fields.percent}
                        value={rowPercent}
                        maxValue={100}
                        disabled={disabled || headerValue <= 0}
                        onValueChange={(percent) => {
                          // Mirror `calcValues` do legado — arredondamento a
                          // 2 casas (precisão monetária), SEM o
                          // `distributeValues` cruzado entre linhas (decisão
                          // de escopo, TASK-MV-FE-08, Ajuste 3).
                          const newValue =
                            headerValue > 0
                              ? Number(((percent / 100) * headerValue).toFixed(2))
                              : 0;
                          rowField.onChange(newValue);
                        }}
                      />
                    );
                  }}
                />
              </Box>

              <Flex direction="column" gap="1.5">
                {/* Spacer invisível — reserva a mesma altura de label das
                    demais colunas (mirror `ApportionmentsSection` de
                    `CreateSaldoInicial.tsx`), sem entrar no fluxo de
                    acessibilidade (`aria-label` real vem do botão abaixo). */}
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {text.removeRowLabel}
                </Flex>
                <IconButtonTable
                  aria-label={text.removeRowLabel}
                  mensegerTooltip={text.removeRowLabel}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={text.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
      />
    </Box>
  );
}

export default MovementAllocationEditor;
