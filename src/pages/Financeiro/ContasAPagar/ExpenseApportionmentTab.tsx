// src/pages/Financeiro/ContasAPagar/ExpenseApportionmentTab.tsx
// -----------------------------------------------------------------------------
// Aba "Rateio" do formulário de Expense (Contas a Pagar, esteira 036) —
// TASK-FE-036-105. `useFieldArray('categories')` + cascata categoria→conta
// contábil (auto-fill, `getPlanAccountByCategory`) + categoria→centro de
// custo (auto-seleciona o PRIMEIRO retornado, editável depois,
// `listCostCentersByCategory`) + fechamento EXATO contra `amount`
// (tolerância 0, DIFERENTE do percentual do Invoice).
//
// Achados REAIS (GAP-FE-036-102/103) — NÃO copiar o mirror mecânico de
// `InvoiceApportionmentTab.tsx`:
//   - Inclui "Conta Contábil" (`plan_account_uuid`) — o Invoice omitiu por
//     falta de cascata na época; aqui a cascata JÁ EXISTE.
//   - EDITÁVEL em edição — bloqueada só quando `hasMoved` (baixa), nunca
//     "sempre desabilitada em edição" como o Invoice (que é write-only).
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { Controller, useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { PercentInput } from '@/components/Form/PercentInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import {
  expenseAppropriationIndex,
  expenseAppropriationTypeIndex,
} from '@/constants/financeiro/expense/options/appropriation-options';

import {
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listHarvests } from '@/services/v2/Harvests/harvest-service';
import {
  getPlanAccountByCategory,
  listPlanAccountOptions,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { Option } from '@/@types/option';
import type { ResponsePagination } from '@/@types/response-api';
import type { AreaListItem } from '@/@types/v2/BaseRegistrations/areas';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { ExpenseForm } from '@/@types/v2/Financeiro/expense';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { Harvest } from '@/@types/v2/Harvests';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';

export interface ExpenseApportionmentTabProps {
  control: Control<ExpenseForm>;
  errors: FieldErrors<ExpenseForm>;
  watch: UseFormWatch<ExpenseForm>;
  /** `setValue` do form RAIZ — usado pela cascata categoria→conta/centro
   *  (auto-fill da MESMA linha, `handleCategoryChange`). */
  setValue: UseFormSetValue<ExpenseForm>;
  isLoading: boolean;
  canSave: boolean;
  /** Bloqueio condicional — SÓ quando o título já tem baixa
   *  (`hasExpenseMoved`, GAP-FE-036-103/106). NUNCA "sempre em edição". */
  hasMoved: boolean;
  /** BUGFIX P0 (esteira 036, homologação) — o sync "linha 0 = valor do
   *  título" só é válido na CRIAÇÃO. Sem esta flag, o `useEffect` de sync
   *  detectava a HIDRATAÇÃO do `amount` (0 → valor real, via
   *  `fillExpenseForm`/`reset`) como uma "mudança do usuário" e forçava a
   *  1ª linha do rateio já carregado para 100% do título, sobrescrevendo os
   *  percentuais reais vindos da API. */
  isEditing: boolean;
  /** UT-000765 (FE-765-D, D-101-06) — coluna "Safra" do Rateio só em EDIÇÃO
   *  (na criação a Safra vive no Cabeçalho e vale para todas as linhas). */
  showHarvestColumn: boolean;
  /** TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — wrapper de
   *  `listAreas` já injetando `farm_uuid` (`useAuth().activeFarmUuid`),
   *  mirror EXATO `CreateOrUpdateAppropriation.tsx:392-394`/
   *  `InvoiceItemsTab.tsx:432-434`. Reaproveitada a MESMA função também pelo
   *  bloco Agricultura da Tarefa irmã (`TASK-FE-036-124`) — nunca duplicada. */
  listAreasForActiveFarm: (params: {
    search?: string;
    page?: number;
    per_page?: number;
  }) => Promise<ResponsePagination<AreaListItem[]>>;
}

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function ExpenseApportionmentTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  hasMoved,
  isEditing,
  showHarvestColumn,
  listAreasForActiveFarm,
}: ExpenseApportionmentTabProps) {
  const { languageGB } = useLanguage();
  const formText = languageGB.financial.expense.form;

  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });

  const isDisabled = !canSave || isLoading || hasMoved;

  const amount = Number(watch('amount')) || 0;

  // TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) — Coluna "Área"
  // visível/obrigatória só quando Direta+Tipo=Área, lida do form RAIZ (`watch`
  // já injetado via props, mirror do padrão já usado para `hasMoved`/
  // bloqueio de edição no mesmo arquivo).
  const appropriationValue = watch('appropriation')?.value;
  const appropriationTypeValue = watch('appropriation_type')?.value;
  const showAreaColumn =
    appropriationValue === expenseAppropriationIndex.DIRETA &&
    appropriationTypeValue === expenseAppropriationTypeIndex.AREA;

  const [pickedCategoryOptions, setPickedCategoryOptions] = useState<
    Record<string, Option<string>>
  >({});
  const [pickedCenterOptions, setPickedCenterOptions] = useState<Record<string, Option<string>>>(
    {}
  );
  const [pickedPlanAccountOptions, setPickedPlanAccountOptions] = useState<
    Record<string, Option<string>>
  >({});

  const watchedCategories = watch('categories') ?? [];
  const totalValue = watchedCategories.reduce((sum, row) => sum + (Number(row?.value) || 0), 0);
  const isSumExact = Math.round(totalValue * 100) === Math.round(amount * 100);
  // Audit "soma > título alerta" — distinto de "não bate exato" (que
  // também cobre soma MENOR, ainda incompleta): mirror legado
  // `checkTotals()`/`calcValues()` (`_forms.blade.php:650-657,608-611`,
  // "A soma dos valores do Rateio ultrapassam o valor do título.").
  const isSumOverAmount = Math.round(totalValue * 100) > Math.round(amount * 100);

  const sumError = errors.categories?.message as string | undefined;

  // EXP-R18 (P1) — mirror legado (`_forms.blade.php:383-387`/
  // `edit.blade.php:391-393`, handler de `#inp-amount` que SEMPRE
  // sobrescreve a 1ª linha do rateio com o novo valor do título — mesmo
  // truque de id duplicado do jQuery original — e recalcula o percentual
  // de TODAS as linhas contra o novo valor, `calcCategoryRateio()`). O
  // Cerne não sincronizava nada ao editar "Valor" no Cabeçalho; o rateio
  // ficava desalinhado do título sem o usuário reabrir/reeditar cada linha
  // manualmente.
  //
  // BUGFIX P0 (esteira 036, homologação, root cause confirmado) — este sync
  // SÓ é válido na CRIAÇÃO (mirror `_forms.blade.php`, tela sem reidratação
  // nenhuma). Em EDIÇÃO, `isEditing` bloqueia o effect inteiro: sem o guard,
  // a HIDRATAÇÃO do `amount` por `fillExpenseForm`/`reset` (0 → valor real)
  // era lida pelo `previousAmountRef` como "o usuário mudou o Valor" e
  // forçava a 1ª linha do rateio JÁ CARREGADO da API para 100% do título,
  // destruindo os percentuais/valores reais de cada linha antes mesmo de o
  // usuário abrir a aba Rateio. `hasMoved` continua como segunda trava
  // (defesa em profundidade) para o caso raro de o título entrar em edição
  // sem baixa e o dev decidir reabilitar o sync futuramente.
  const previousAmountRef = useRef(amount);
  useEffect(() => {
    if (isEditing) return;
    if (previousAmountRef.current === amount) return;
    previousAmountRef.current = amount;
    if (hasMoved) return;

    const rows = watch('categories') ?? [];
    if (rows.length === 0) return;

    setValue('categories.0.value', amount || null, { shouldDirty: true, shouldValidate: true });
    rows.forEach((row, index) => {
      const rowValue = index === 0 ? amount : Number(row?.value) || 0;
      const percent = amount ? Math.round((rowValue / amount) * 10000) / 100 : null;
      setValue(`categories.${index}.percent`, percent);
    });
  }, [amount, hasMoved, isEditing]);

  // Percentual do rateio (esteira 036fix) — cálculo bidirecional %↔valor,
  // recalculado SÓ no `onBlur` (mirror legado `calcPercents()`/
  // `calcValues()`, `_forms.blade.php:588-643`), nunca a cada tecla.
  //
  // CV03 (esteira 036, TASK-FE-036-117) — quando a EDIÇÃO da linha (por
  // valor OU percentual) faz a soma do rateio ultrapassar o valor do
  // título, o legado reseta a MESMA linha alterada para zero (além do
  // banner de aviso já existente, `isSumOverAmount`, que PERMANECE
  // intocado — cálculo reativo sobre `watch('categories')`). Checagem feita
  // aqui (não num `useEffect` global sobre a soma) para resetar só a linha
  // que o usuário acabou de editar, nunca uma linha diferente — e para não
  // conflitar com o `useEffect` de sincronização da linha 0 com "Valor" do
  // Cabeçalho (que só dispara quando `amount` muda, não quando uma linha é
  // editada).
  function resetRowIfSumExceedsAmount(index: number, rows: unknown[]): boolean {
    if (!amount) return false;
    const total = (rows as { value?: number | null }[]).reduce(
      (sum, row) => sum + (Number(row?.value) || 0),
      0
    );
    if (Math.round(total * 100) <= Math.round(amount * 100)) return false;

    setValue(`categories.${index}.value`, 0, { shouldValidate: true, shouldDirty: true });
    setValue(`categories.${index}.percent`, 0);
    return true;
  }

  function recalcPercentFromValue(index: number) {
    if (!amount) return;
    const rows = watch('categories') ?? [];
    if (resetRowIfSumExceedsAmount(index, rows)) return;
    const row = rows[index];
    const percent = Math.round(((Number(row?.value) || 0) / amount) * 10000) / 100;
    setValue(`categories.${index}.percent`, percent);
  }

  function recalcValueFromPercent(index: number) {
    if (!amount) return;
    const rows = watch('categories') ?? [];
    const row = rows[index];
    const value = Math.round(((Number(row?.percent) || 0) / 100) * amount * 100) / 100;
    setValue(`categories.${index}.value`, value, { shouldValidate: true, shouldDirty: true });

    const rowsAfterValue = rows.map((r, i) => (i === index ? { ...r, value } : r));
    resetRowIfSumExceedsAmount(index, rowsAfterValue);
  }

  // Guarda "não remover última linha" (esteira 036fix, mirror legado
  // `_forms.blade.php:766-791`, swal "Pelo menos uma..." quando só resta 1
  // linha) — nunca deixa o rateio ficar vazio por remoção.
  function handleRemoveRow(index: number) {
    if (fields.length <= 1) {
      toaster.warning({
        title: formText.apportionmentRow.removeButton,
        description: formText.hints.apportionmentMinOneRow,
      });
      return;
    }
    remove(index);
  }

  // Cascata categoria→conta contábil+centro (contrato §5.1) — disparada só
  // no onChange do Controller da linha, nunca num useEffect global sobre
  // `watch('categories')` (evita disparo em loop, risco registrado na
  // Tarefa).
  async function handleCategoryChange(index: number, option: Option<string> | null) {
    setValue(`categories.${index}.category_uuid`, option as any);
    if (!option) {
      setValue(`categories.${index}.plan_account_uuid`, null);
      return;
    }
    setPickedCategoryOptions((prev) => ({ ...prev, [option.value]: option }));

    try {
      const planAccountResponse = await getPlanAccountByCategory(option.value);
      const planAccount = planAccountResponse.data as PlanAccountRef | null;
      const planAccountOption: Option<string> | null = planAccount
        ? { label: planAccount.description, value: planAccount.uuid }
        : null;
      setValue(`categories.${index}.plan_account_uuid`, planAccountOption as any);
      if (planAccountOption) {
        setPickedPlanAccountOptions((prev) => ({
          ...prev,
          [planAccountOption.value]: planAccountOption,
        }));
      }
    } catch {
      // Erro na cascata NUNCA bloqueia o formulário (mirror legado).
      setValue(`categories.${index}.plan_account_uuid`, null);
    }

    try {
      const costCentersResponse = await listCostCentersByCategory(option.value);
      const costCenters = costCentersResponse.data as CostCenterRef[];
      const firstCenter = costCenters[0];
      const centerOption: Option<string> | null = firstCenter
        ? { label: `${firstCenter.code} — ${firstCenter.description}`, value: firstCenter.uuid }
        : null;
      setValue(`categories.${index}.center_uuid`, centerOption as any);
      if (centerOption) {
        setPickedCenterOptions((prev) => ({ ...prev, [centerOption.value]: centerOption }));
      }
    } catch {
      setValue(`categories.${index}.center_uuid`, null);
    }
  }

  if (fields.length === 0 && isDisabled) {
    return (
      <Box pt={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.apportionmentRow.emptyLabel}
        </Text>
      </Box>
    );
  }

  return (
    <Box pt={4}>
      {hasMoved && (
        <Text fontSize="sm" color="fg.muted" mb={4}>
          {formText.hints.apportionmentReadonlyWhenMoved}
        </Text>
      )}

      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {formText.apportionmentRow.sumBadgeLabel}
        </Text>
        {fields.length > 0 && (
          <Badge colorPalette={isSumExact ? 'green' : 'orange'} variant="subtle">
            {formatCurrencyBRL(totalValue)} / {formatCurrencyBRL(amount)}
          </Badge>
        )}
      </Flex>

      {sumError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {sumError}
        </Text>
      )}

      {isSumOverAmount && (
        <Text fontSize="xs" color="orange.600" mb={4}>
          {formText.hints.apportionmentSumExceedsAmount}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {formText.apportionmentRow.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => (
            <Flex key={field.id} gap={3} align="flex-start" wrap="wrap">
              <Box flex="1" minW="220px">
                <Controller
                  name={`categories.${index}.category_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={formText.fields.financialCategory}
                      placeholder={formText.placeholders.financialCategory}
                      service={listFinancialCategoryOptions}
                      mapOptions={(item: FinancialCategoryOption) => ({
                        label: item.description,
                        value: item.uuid,
                      })}
                      // Homologação 036fix3 ("Categoria Financeira do
                      // rateio lista itens errados/inativos") — mirror
                      // EXATO do legado `_forms.blade.php` (`.select-
                      // categories`, AJAX `/api/v1/financialcategoriesFilter`
                      // enviando `type: 1`), confirmado em
                      // `FinancialCategoryRepository::getActiveAndAvailable
                      // Filter()` (agro365): `type_id IN [1, 3]` (1=Saídas/
                      // Despesa, 3=Ambas — sempre incluída) + `is_enabled=
                      // true` (sempre aplicado no legado, mas o backend
                      // NOVO de `/financial-categories/options` não filtrava
                      // nada disso antes desta correção). NÃO envia `class`
                      // — o legado NÃO filtra por Sintética/Analítica neste
                      // select (achado verificado no código real, distinto
                      // do recorte de `CreateOrUpdateCategoriaProduto.tsx`,
                      // que é outra tela/uso).
                      // UT-000765 (FE-765-C) — filtro do legado no servidor
                      // (`cost_center_scoped`, ordenado por code, busca por
                      // code com/sem pontos); `is_enabled` e redundante no
                      // modo escopado. `pageSize={20}` alinha `hasMore` ao
                      // `per_page` real (sem mexer no default global).
                      pageSize={20}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        cost_center_scoped: true,
                        type_id: 1,
                      })}
                      value={
                        rowField.value
                          ? (pickedCategoryOptions[rowField.value.value] ?? rowField.value)
                          : undefined
                      }
                      onChange={(option: any) => handleCategoryChange(index, option ?? null)}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`categories.${index}.center_uuid`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={formText.fields.costCenter}
                      placeholder={formText.placeholders.costCenter}
                      service={listCostCenterOptions}
                      mapOptions={(item: { uuid: string; code: string; description: string }) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        only_analytic: true,
                      })}
                      value={
                        rowField.value
                          ? (pickedCenterOptions[rowField.value.value] ?? rowField.value)
                          : undefined
                      }
                      onChange={(option: any) => {
                        rowField.onChange(option ?? null);
                        if (option)
                          setPickedCenterOptions((prev) => ({ ...prev, [option.value]: option }));
                      }}
                      error={fieldState.error?.message}
                      isRequired
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              <Box flex="1" minW="220px">
                <Controller
                  name={`categories.${index}.plan_account_uuid`}
                  control={control}
                  render={({ field: rowField }) => (
                    <SelectAsyncPaginate
                      name={rowField.name}
                      label={formText.fields.planAccount}
                      placeholder={formText.placeholders.planAccount}
                      service={listPlanAccountOptions}
                      mapOptions={(item: PlanAccountRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      // Homologação 036fix3 ("Conta Contábil do rateio
                      // lista itens errados/inativos") — mirror EXATO do
                      // legado `_forms.blade.php` (`.plan-accounts`, AJAX
                      // `/api/v1/plan-accounts-filter` enviando `type: 1`),
                      // confirmado em `PlanAccountController::filter()`
                      // (agro365, linhas 190-202): `is_enabled=1` FIXO +
                      // `class=2` FIXO (Analítica — só contas-folha, sem
                      // filhas) + `condition IN [$type, 3]` (1=Débito,
                      // 3=Ambos — sempre incluída). O parâmetro `type` do
                      // legado filtra a coluna `condition` (não a coluna
                      // `type`/CAPEX-OPEX da tabela NOVA — nomes colidem,
                      // por isso nomeado `condition` aqui, não `type`).
                      findParams={(search: string | { search: string }) => ({
                        search: typeof search === 'string' ? search : search.search,
                        is_enabled: 'true' as const,
                        class: 2 as const,
                        condition: '1' as const,
                      })}
                      value={
                        rowField.value
                          ? (pickedPlanAccountOptions[rowField.value.value] ?? rowField.value)
                          : undefined
                      }
                      onChange={(option: any) => {
                        rowField.onChange(option ?? null);
                        if (option)
                          setPickedPlanAccountOptions((prev) => ({
                            ...prev,
                            [option.value]: option,
                          }));
                      }}
                      isDisabled={isDisabled}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  )}
                />
              </Box>

              {/* UT-000717 — coluna "Safra" do Rateio (mirror legado): o
                  campo saiu do Cabeçalho (`CreateOrUpdateExpense.tsx`) e
                  passou a ser preenchido POR LINHA aqui
                  (`categories.*.harvest_uuid`), SEMPRE visível (coluna
                  padrão do rateio, NÃO condicionada a `showAreaColumn` —
                  diferente da coluna "Área" abaixo, que é exclusiva de
                  Direta+Tipo=Área). Backend já aceita/persiste nullable por
                  linha (`ExpenseRequest.php:165`, `pivot.harvest_id`) e
                  devolve `row.harvest` na hidratação (`ExpenseResource`),
                  já consumido por `fillExpenseForm`. Mirror estrutural do
                  padrão `SelectAsyncPaginate` desta MESMA aba (categoria/
                  centro/conta contábil acima). */}
              {showHarvestColumn && (
                <Box flex="1" minW="220px">
                  <Controller
                    name={`categories.${index}.harvest_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={formText.fields.apportionmentHarvest}
                        placeholder={formText.placeholders.apportionmentHarvest}
                        service={listHarvests}
                        mapOptions={(item: Harvest) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isDisabled={isDisabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />
                </Box>
              )}

              {/* TASK-FE-036-123 (B-09 Opção C parcial, `GAP-036-115`) —
                  coluna "Área" visível/obrigatória só quando Direta+Tipo=
                  Área (`showAreaColumn`), mirror EXATO do padrão das outras
                  colunas `SelectAsyncPaginate` desta MESMA aba (categoria/
                  centro/conta contábil acima) — `listAreasForActiveFarm`
                  (prop nova, `farm_uuid` via `useAuth`, ver `CreateOrUpdate
                  Expense.tsx`). */}
              {showAreaColumn && (
                <Box flex="1" minW="220px">
                  <Controller
                    name={`categories.${index}.area_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={formText.fields.apportionmentArea}
                        placeholder={formText.placeholders.apportionmentArea}
                        service={listAreasForActiveFarm}
                        mapOptions={(item: AreaListItem) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={rowField.value ?? undefined}
                        onChange={(option: any) => rowField.onChange(option ?? null)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    )}
                  />
                </Box>
              )}

              <Box w={{ base: 'full', sm: '160px' }}>
                <Controller
                  name={`categories.${index}.percent`}
                  control={control}
                  render={({ field: rowField }) => (
                    <PercentInput
                      name={rowField.name}
                      label={formText.fields.apportionmentPercent}
                      maxValue={100}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      onBlur={() => recalcValueFromPercent(index)}
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Box w={{ base: 'full', sm: '180px' }}>
                <Controller
                  name={`categories.${index}.value`}
                  control={control}
                  render={({ field: rowField, fieldState }) => (
                    <MoneyInput
                      name={rowField.name}
                      label={formText.fields.apportionmentValue}
                      value={rowField.value ?? null}
                      onValueChange={(value) => rowField.onChange(value)}
                      onBlur={() => recalcPercentFromValue(index)}
                      error={fieldState.error?.message}
                      isRequired
                      disabled={isDisabled}
                    />
                  )}
                />
              </Box>

              <Flex direction="column" gap="1.5">
                <Flex alignItems="center" fontSize="14px" visibility="hidden">
                  {formText.apportionmentRow.removeButton}
                </Flex>
                <IconButtonTable
                  aria-label={formText.apportionmentRow.removeButton}
                  mensegerTooltip={formText.apportionmentRow.removeButton}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled || fields.length <= 1}
                  onClick={() => handleRemoveRow(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            </Flex>
          ))}
        </Flex>
      )}

      <Button
        title={formText.apportionmentRow.addButton}
        icon={FiPlus as any}
        variant="outline"
        size="sm"
        onClick={() =>
          append({
            category_uuid: null,
            center_uuid: null,
            value: null,
            plan_account_uuid: null,
            percent: null,
            area_uuid: null,
            harvest_uuid: null,
          })
        }
        disabled={isDisabled}
      />
    </Box>
  );
}
