// src/pages/Incomes/IncomeApportionmentTab.tsx
// -----------------------------------------------------------------------------
// Aba "Rateio" do form de Income — TASK-FE-036-315, GAP-FE-036-301. Visível em
// create e em update (quando `!isLocked`). Mirror parcial de
// `InvoiceApportionmentTab.tsx` (validação de soma=100%) e
// `ExpenseApportionmentTab.tsx` (Conta Contábil como select pesquisável), COM
// a cascata Categoria→Conta Contábil→Centro de Custo.
//
// Cascata (ao escolher Categoria):
//   1. `getPlanAccountByCategory(categoryUuid)` → autofill "Conta Contábil"
//      (campo EDITÁVEL/pesquisável — achado da auditoria de fidelidade
//      2026-08, item D-7/B-06: o legado permite sobrescrever manualmente a
//      conta derivada via `select-plan-accounts`/`.plan-accounts`; a versão
//      anterior desta Tarefa tinha virado `InputReadOnly` "por simplificação",
//      divergindo do legado).
//   2. `listCostCentersByCategory(categoryUuid)` → devolve os centros
//      VINCULADOS à categoria; se houver ao menos 1 resultado E o campo
//      ainda não foi tocado pelo usuário nesta sessão, pré-seleciona o
//      PRIMEIRO item (mirror exato do legado — o "primeiro selecionado" é
//      comportamento de CLIENTE, o servidor devolve todos). NÃO restringe as
//      OPÇÕES do select (fix BLOQUEADOR 036fix3, ver bloco dedicado abaixo)
//      — só decide o default.
//   3. Ambas as chamadas em `Promise.all` (paralelo).
//
// Reidratação na edição (`!isLocked`) — para cada linha já populada
// (`category_uuid` vindo do servidor), a MESMA cascata dispara ao montar,
// re-derivando "Conta Contábil" por melhor esforço (o Resource não devolve
// `plan_account_uuid` — GAP-FE-036-301/305). O rótulo do `center_uuid` já
// salvo vem de `IncomeCategoryDetail.center_description` (ver bloco dedicado
// abaixo), não mais da cascata.
//
// Valor do rateio — achado D-B (auditoria de fidelidade 2026-08): o legado
// permite editar o VALOR da linha e recalcula o percentual no blur
// (`_forms.blade.php` cálculo bidirecional %↔valor); a versão anterior desta
// Tarefa tinha virado o valor `InputReadOnly` "por simplificação". Aqui:
// `percentage` continua sendo o campo FONTE DA VERDADE do payload (RHF), o
// valor é um `MoneyInput` com buffer local — digitar não mexe no percentual
// (evita flicker), só o BLUR recalcula `percentage` a partir do valor
// digitado (mirror exato "blur recalcula"). Editar o percentual direto
// (campo já existente) invalida o buffer local da MESMA linha, voltando a
// espelhar o preview derivado — mantém o dado sempre consistente.
//
// Adicionar/remover linha — achado C (auditoria de fidelidade 2026-08):
// legado bloqueia "adicionar" se a linha anterior tem campo vazio
// (`.btn-add-item`) e pede confirmação + nunca deixa zero linhas ao remover
// (`handleDelete`/`var_pelo_menos_um`). Ambos reproduzidos aqui.
//
// Centro de Custo (fix BLOQUEADOR 036fix3) — o select NÃO lista só os
// centros "vinculados à categoria" (`listCostCentersByCategory`/
// `/cost-centers/by-category/{uuid}`, que devolvia "Sem opções" sempre que a
// categoria não tinha vínculo prévio, mirror `Select` estático). O legado
// pré-carrega o select do Cabeçalho com TODOS os Centros de Custo
// ANALÍTICOS+ATIVOS da fazenda (`IncomeController::create/edit`,
// `CostCenter::where('is_enabled', true)->whereIn('id', $farms_centers)
// ->where('class', 2)`, `_forms.blade.php:186`) — a chamada AJAX
// `get-cost-centers-by-category` só reseleciona o PRIMEIRO item já presente
// na lista (`$select.val(data[0].id)`, `_forms.blade.php:628-636`), nunca
// reconstrói as opções. Mirror exato de `ExpenseApportionmentTab.tsx`
// (`listCostCenterOptions` + `only_analytic: true` para o select completo,
// `listCostCentersByCategory` só para o default da cascata).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { MoneyInput } from '@/components/Form/MoneyInput';
import { NumberInput } from '@/components/Form/NumberInput';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { IconButtonTable } from '@/components/IconButtonTable';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import {
  listCostCenterOptions,
  listCostCentersByCategory,
} from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  getPlanAccountByCategory,
  listPlanAccountOptions,
} from '@/services/v2/PlanAccounts/plan-account-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { IncomeDetail, IncomeForm as IncomeFormType } from '@/@types/v2/Incomes';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

// Mirror EXATO das constantes já usadas por `InvoiceApportionmentTab.tsx`
// (contrato §4.2) — tolerância ZERO do RATEIO (não confundir com a
// tolerância do parcelamento, GAP-FE-036-302).
const APPORTIONMENT_SUM_TOLERANCE = 0.01;
const APPORTIONMENT_SUM_TARGET = 100;

export interface IncomeApportionmentTabProps {
  control: Control<IncomeFormType>;
  errors: FieldErrors<IncomeFormType>;
  watch: UseFormWatch<IncomeFormType>;
  setValue: UseFormSetValue<IncomeFormType>;
  isLoading: boolean;
  canSave: boolean;
  isLocked: boolean;
  totalAmount: number;
  incomeData?: IncomeDetail;
}

export function IncomeApportionmentTab({
  control,
  errors,
  watch,
  setValue,
  isLoading,
  canSave,
  isLocked,
  totalAmount,
  incomeData,
}: IncomeApportionmentTabProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.incomes.income.form.apportionmentTab;

  const { fields, append, remove } = useFieldArray({ control, name: 'categories' });

  const isDisabled = !canSave || isLoading || isLocked;

  // Cache de RÓTULOS `{label, value}` do select de Categoria — mesma mecânica
  // de `apportionmentOptionsCache` de CostCenter.
  const [categoryOptionsCache, setCategoryOptionsCache] = useState<Record<string, Option<string>>>(
    {}
  );

  function handlePickCategoryOption(option: Option<string>) {
    setCategoryOptionsCache((prev) => ({ ...prev, [option.value]: option }));
  }

  // Cache de RÓTULOS `{label, value}` do select de Centro de Custo — fix
  // BLOQUEADOR 036fix3: o select passou a ser `SelectAsyncPaginate` sobre
  // `/cost-centers/options` (TODOS os analíticos/ativos da fazenda, mirror
  // `ExpenseApportionmentTab.tsx`), então precisa do MESMO mecanismo de cache
  // de rótulo dos selects de Categoria/Conta Contábil acima (o valor salvo é
  // só o `uuid`, `SelectAsyncPaginate` precisa do `{label, value}` para
  // exibir sem depender da paginação já ter carregado aquela opção).
  const [centerOptionsCache, setCenterOptionsCache] = useState<Record<string, Option<string>>>({});
  const [planAccountOptionsCache, setPlanAccountOptionsCache] = useState<
    Record<string, Option<string>>
  >({});
  const [touchedCenterByRow, setTouchedCenterByRow] = useState<Record<string, boolean>>({});

  // Buffer LOCAL do valor do rateio por linha — só existe enquanto o usuário
  // está digitando no `MoneyInput`; o BLUR recalcula `percentage` (fonte da
  // verdade do payload) e limpa o buffer, voltando a espelhar o preview
  // derivado do percentual (mirror "blur recalcula" do legado).
  const [valueDraftByRow, setValueDraftByRow] = useState<Record<string, number>>({});

  // `listCostCentersByCategory` (`/cost-centers/by-category/{uuid}`) NÃO
  // alimenta mais as OPÇÕES do select (fix BLOQUEADOR 036fix3) — só serve
  // para descobrir o(s) centro(s) vinculados à categoria e cachear seus
  // rótulos (usado para decidir o DEFAULT da linha, mirror
  // `ExpenseApportionmentTab.handleCategoryChange`).
  async function runCascade(categoryUuid: string) {
    const [planAccountResponse, costCentersResponse] = await Promise.all([
      getPlanAccountByCategory(categoryUuid),
      listCostCentersByCategory(categoryUuid),
    ]);

    const planAccount = planAccountResponse.data;
    if (planAccount) {
      setPlanAccountOptionsCache((prev) => ({
        ...prev,
        [planAccount.uuid]: {
          label: `${planAccount.code} — ${planAccount.description}`,
          value: planAccount.uuid,
        },
      }));
    }

    const centers = costCentersResponse.data ?? [];
    if (centers.length > 0) {
      setCenterOptionsCache((prev) => {
        const next = { ...prev };
        centers.forEach((center) => {
          next[center.uuid] = {
            label: `${center.code} — ${center.description}`,
            value: center.uuid,
          };
        });
        return next;
      });
    }

    return { planAccount, centers };
  }

  function handleCategoryChange(index: number, rowId: string, option: Option<string> | null) {
    setValue(`categories.${index}.category_uuid`, option?.value ?? null, { shouldDirty: true });
    setValue(`categories.${index}.plan_account_uuid`, null);

    if (option) {
      handlePickCategoryOption(option);
      runCascade(option.value).then(({ planAccount, centers }) => {
        setValue(`categories.${index}.plan_account_uuid`, planAccount?.uuid ?? null, {
          shouldDirty: true,
        });
        if (!touchedCenterByRow[rowId] && centers.length > 0) {
          setValue(`categories.${index}.center_uuid`, centers[0].uuid, { shouldDirty: true });
        }
      });
    }
  }

  function handlePlanAccountChange(index: number, option: Option<string> | null) {
    if (option) {
      setPlanAccountOptionsCache((prev) => ({ ...prev, [option.value]: option }));
    }
    setValue(`categories.${index}.plan_account_uuid`, option?.value ?? null, {
      shouldDirty: true,
    });
  }

  // Reidratação na edição — para cada linha já populada ao montar, dispara a
  // MESMA cascata (só para recachear o rótulo da Conta Contábil/possível
  // default de Centro; NUNCA sobrescreve `center_uuid` já salvo). Dispara 1x
  // ao montar (dependências vazias de propósito).
  useEffect(() => {
    fields.forEach((field) => {
      const categoryUuid = (field as any).category_uuid as string | null;
      if (categoryUuid && !isLocked) {
        void runCascade(categoryUuid);
      }
    });
    // Roda só ao montar — mesmo racional documentado acima; dependências
    // vazias de propósito.
  }, []);

  // Reidratação do RÓTULO do Centro de Custo já salvo (fix BLOQUEADOR
  // 036fix3) — `IncomeCategoryDetail.center_description` (contrato §3.3,
  // GAP-API 036fix/INC-R17) já devolve a descrição pronta; usada AQUI em vez
  // de depender só da cascata por categoria acima (que só cobre centros
  // vinculados à categoria — o usuário pode ter escolhido, em outra sessão,
  // qualquer centro analítico/ativo da lista completa).
  useEffect(() => {
    const rows = incomeData?.categories ?? [];
    if (rows.length === 0) return;
    setCenterOptionsCache((prev) => {
      let changed = false;
      const next = { ...prev };
      rows.forEach((row) => {
        if (row.center_uuid && row.center_description && !(row.center_uuid in next)) {
          next[row.center_uuid] = { label: row.center_description, value: row.center_uuid };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [incomeData]);

  // Reidratação do RÓTULO da Categoria já salva — mirror EXATO do efeito de
  // Centro de Custo acima (fix F-118): o cache `categoryOptionsCache` só era
  // populado por INTERAÇÃO do usuário (`handlePickCategoryOption`), então o
  // select de Categoria aparecia VAZIO ao editar uma Conta a Receber, mesmo
  // com o `category_uuid` corretamente salvo — `IncomeCategoryDetail.description`
  // (contrato já devolvido pelo `show`) resolve o rótulo sem depender da
  // cascata/paginação já ter carregado aquela opção.
  useEffect(() => {
    const rows = incomeData?.categories ?? [];
    if (rows.length === 0) return;
    setCategoryOptionsCache((prev) => {
      let changed = false;
      const next = { ...prev };
      rows.forEach((row) => {
        if (row.category_uuid && row.description && !(row.category_uuid in next)) {
          next[row.category_uuid] = { label: row.description, value: row.category_uuid };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [incomeData]);

  const watchedCategories = watch('categories') ?? [];
  const totalPercentage = watchedCategories.reduce(
    (sum, item) => sum + (Number(item?.percentage) || 0),
    0
  );
  const isSumComplete =
    Math.abs(totalPercentage - APPORTIONMENT_SUM_TARGET) <= APPORTIONMENT_SUM_TOLERANCE;
  const arrayError = (errors.categories as any)?.message as string | undefined;

  // Gate "adicionar linha só com a anterior preenchida" (mirror legado
  // `.btn-add-item` — percorre inputs/selects da última linha e bloqueia com
  // aviso se algum estiver vazio). `plan_account_uuid` fica de fora do gate
  // — é legitimamente opcional (pode não haver conta vinculada à categoria,
  // mirror legado `option = new Option('-', '', true)`).
  function canAddRow(): boolean {
    if (watchedCategories.length === 0) return true;
    const last = watchedCategories[watchedCategories.length - 1];
    return (
      !!last?.category_uuid &&
      !!last?.center_uuid &&
      last?.percentage !== null &&
      last?.percentage !== undefined
    );
  }

  function handleAddRow() {
    if (!canAddRow()) {
      toaster.warning({ description: text.addRowBlockedMessage });
      return;
    }
    append({
      category_uuid: null,
      plan_account_uuid: null,
      center_uuid: null,
      percentage: null,
    });
  }

  // Remoção — confirmação + "não remover última linha" (mirror legado
  // `handleDelete`/`swal`/`var_pelo_menos_um`).
  const [rowIndexToRemove, setRowIndexToRemove] = useState<number | null>(null);

  function handleRequestRemove(index: number) {
    if (fields.length <= 1) {
      toaster.warning({ description: text.removeRowBlockedMessage });
      return;
    }
    setRowIndexToRemove(index);
  }

  function handleConfirmRemove() {
    if (rowIndexToRemove !== null) {
      remove(rowIndexToRemove);
      setRowIndexToRemove(null);
    }
  }

  if (isLocked) {
    return (
      <Box pt={4}>
        <Text fontSize="sm" color="fg.muted">
          {languageGB.incomes.income.form.lockedBanner.description}
        </Text>
      </Box>
    );
  }

  return (
    <Box pt={4}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
        <Text fontSize="sm" color="fg.muted">
          {text.sectionHint}
        </Text>
        {fields.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="sm" color="fg.muted">
              {text.sumLabel}:
            </Text>
            <Badge colorPalette={isSumComplete ? 'green' : 'orange'} variant="subtle">
              {totalPercentage.toFixed(2)}%
            </Badge>
            {!isSumComplete && (
              <Text fontSize="xs" color="fg.muted">
                ({text.sumHint})
              </Text>
            )}
          </Flex>
        )}
      </Flex>

      {arrayError && (
        <Text fontSize="xs" color="fg.error" mb={4}>
          {arrayError}
        </Text>
      )}

      {fields.length === 0 ? (
        <Box py={2}>
          <Text fontSize="sm" color="fg.muted">
            {text.emptyLabel}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap={4} mb={4}>
          {fields.map((field, index) => {
            const rowId = field.id;
            const percentage = watchedCategories[index]?.percentage ?? 0;
            const previewValue = (Number(percentage) / 100) * Number(totalAmount || 0);
            const displayedValue = valueDraftByRow[rowId] ?? previewValue;
            const planAccountUuid = watchedCategories[index]?.plan_account_uuid ?? null;

            return (
              <Flex key={rowId} gap={3} align="flex-end" wrap="wrap">
                <Box flex="1" minW="220px">
                  <Controller
                    name={`categories.${index}.category_uuid`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <SelectAsyncPaginate
                        name={rowField.name}
                        label={text.fields.category}
                        placeholder={text.placeholders.category}
                        service={listFinancialCategoryOptions}
                        mapOptions={(item: FinancialCategoryOption) => ({
                          label: item.description,
                          value: item.uuid,
                        })}
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                        })}
                        value={rowField.value ? categoryOptionsCache[rowField.value] : undefined}
                        onChange={(option: any) => handleCategoryChange(index, rowId, option)}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <Box flex="1" minW="200px">
                  {/* Centro de Custo — fix BLOQUEADOR 036fix3: select
                      independente sobre `/cost-centers/options`
                      (analítico+ativo, TODOS os da fazenda), mirror
                      `ExpenseApportionmentTab.tsx`. A cascata por categoria
                      (`runCascade`) só decide o DEFAULT (1º vinculado),
                      nunca mais restringe as opções listadas — antes disso
                      o select ficava "Sem opções" sempre que a categoria não
                      tinha centro vinculado.

                      Fix (036fix5, item 3) — reordenado para ficar ANTES de
                      "Conta Contábil" (ordem alvo: Categoria → Centro de
                      Custo → Conta Contábil → Percentual → Valor). */}
                  <Controller
                    name={`categories.${index}.center_uuid`}
                    control={control}
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
                        findParams={(search: string | { search: string }) => ({
                          search: typeof search === 'string' ? search : search.search,
                          only_analytic: true,
                        })}
                        value={rowField.value ? centerOptionsCache[rowField.value] : undefined}
                        onChange={(option: any) => {
                          setTouchedCenterByRow((prev) => ({ ...prev, [rowId]: true }));
                          if (option) {
                            setCenterOptionsCache((prev) => ({ ...prev, [option.value]: option }));
                          }
                          rowField.onChange(option?.value ?? null);
                        }}
                        error={fieldState.error?.message}
                        isRequired
                        isDisabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <Box flex="1" minW="200px">
                  {/* Conta Contábil — achado D-7/B-06 (auditoria de
                      fidelidade 2026-08): volta a ser um select
                      editável/pesquisável (`/plan-accounts/options`, sem
                      gate de permissão), não mais `InputReadOnly`. A cascata
                      continua autopreenchendo ao trocar a Categoria; o
                      usuário pode sobrescrever a qualquer momento (mirror
                      legado `.plan-accounts`). */}
                  <SelectAsyncPaginate
                    name={`categories.${index}.plan_account_uuid`}
                    label={text.fields.planAccount}
                    placeholder={text.placeholders.planAccount}
                    service={listPlanAccountOptions}
                    mapOptions={(item: PlanAccountRef) => ({
                      label: `${item.code} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={planAccountUuid ? planAccountOptionsCache[planAccountUuid] : undefined}
                    onChange={(option: any) => handlePlanAccountChange(index, option ?? null)}
                    isDisabled={isDisabled}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '140px' }}>
                  <Controller
                    name={`categories.${index}.percentage`}
                    control={control}
                    render={({ field: rowField, fieldState }) => (
                      <NumberInput
                        name={rowField.name}
                        label={text.fields.percentage}
                        value={rowField.value ?? null}
                        onValueChange={(value) => {
                          rowField.onChange(value);
                          // Percentual editado diretamente — descarta o
                          // buffer de valor da linha, volta a espelhar o
                          // preview derivado do novo percentual.
                          setValueDraftByRow((prev) => {
                            if (!(rowId in prev)) return prev;
                            const next = { ...prev };
                            delete next[rowId];
                            return next;
                          });
                        }}
                        min={0}
                        max={100}
                        allowDot
                        decimalPlaces={2}
                        error={fieldState.error?.message}
                        isRequired
                        disabled={isDisabled}
                      />
                    )}
                  />
                </Box>

                <Box w={{ base: 'full', sm: '160px' }}>
                  {/* Valor do rateio — achado D-B (auditoria de fidelidade
                      2026-08): volta a ser editável; o BLUR recalcula o
                      percentual (fonte da verdade do payload), mirror
                      "blur recalcula" do legado. Digitar só atualiza o
                      buffer local — não mexe no percentual a cada tecla. */}
                  <MoneyInput
                    name={`categories.${index}.value`}
                    label={text.fields.valuePreview}
                    value={displayedValue}
                    onValueChange={(value) =>
                      setValueDraftByRow((prev) => ({ ...prev, [rowId]: value }))
                    }
                    onBlur={() => {
                      if (!(rowId in valueDraftByRow)) return;
                      const draftValue = valueDraftByRow[rowId];
                      const nextPercentage =
                        Number(totalAmount || 0) > 0
                          ? Math.round((draftValue / Number(totalAmount)) * 10000) / 100
                          : 0;
                      setValue(`categories.${index}.percentage`, nextPercentage, {
                        shouldDirty: true,
                      });
                      setValueDraftByRow((prev) => {
                        const next = { ...prev };
                        delete next[rowId];
                        return next;
                      });
                    }}
                    disabled={isDisabled}
                  />
                </Box>

                <IconButtonTable
                  aria-label={text.removeRowLabel}
                  mensegerTooltip={text.removeRowLabel}
                  size="sm"
                  color="red.500"
                  variant="ghost"
                  disabled={isDisabled}
                  onClick={() => handleRequestRemove(index)}
                >
                  <Icon as={FiTrash2} />
                </IconButtonTable>
              </Flex>
            );
          })}
        </Flex>
      )}

      <Button
        title={text.addRowLabel}
        icon={FiPlus as ElementType}
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        disabled={isDisabled}
      />

      <DeleteConfirmDialog
        isOpen={rowIndexToRemove !== null}
        onClose={() => setRowIndexToRemove(null)}
        onConfirm={handleConfirmRemove}
        title={text.removeRowConfirmTitle}
        confirmButtonText={text.removeRowLabel}
        tone="warning"
        colorPalette="orange"
      />
    </Box>
  );
}
