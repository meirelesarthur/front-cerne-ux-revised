// src/pages/Financeiro/BudgetPlanning/CreateOrUpdateBudgetPlanning.tsx
// -----------------------------------------------------------------------------
// Formulário único de CRIAÇÃO, EDIÇÃO e VISUALIZAÇÃO read-only de Prev.
// Orçamentária (BudgetPlanning — F-106, esteira 97-Esteiras/067,
// TASK-PO-FE-07, GAP-PO-08 resolvido). Cabeçalho (`date`/`year`, `code`/
// autor display-only) + grade mensal (`BudgetPlanningGrid.tsx`, categorias ×
// 12 meses). Casca `FormContainer` + footer (Pattern 15 — a grade pode ter
// dezenas de linhas, só o body rola) mirror
// `Financeiro/Congelamentos/CreateOrUpdateFinancialFreeze.tsx` (MESMO
// módulo). ⚠️ Este fork NÃO tem prop `fullHeight` no `FormContainer` — passar
// `footer` já ativa `PageCard fullHeight` internamente (armadilha #6 já
// documentada em `CreateOrUpdateFinancialFreeze.tsx`).
//
// 3 rotas apontam para este MESMO componente (`src/router/index.tsx`):
//   /financeiro/previsao/create                    (budget-plannings_create)
//   /financeiro/previsao/:budgetPlanningUuid        (budget-plannings_edit)
//   /financeiro/previsao/:budgetPlanningUuid/visualizar (budget-plannings_view)
//
// Composição de 2 fontes assíncronas independentes (RISCO ALTO já sinalizado
// na Tarefa): universo de categorias elegíveis (`listEligibleBudgetPlanning
// Categories`, SEM ID de contexto) + detalhe do plano (`getBudgetPlanning`,
// só em edição). NENHUM hook canônico único cobre essa forma de composição
// (2 fontes, 1 grid resultante) — `fillBudgetPlanningForm` é a função
// NOMEADA com guarda de `dirtyFields` (Lei 2), acionada por um `useEffect`
// que só observa as 2 flags de sucesso — os VALORES lidos dentro de
// `fillBudgetPlanningForm` já são os do MESMO render em que a flag mudou
// (nenhuma leitura stale; este repo não registra o plugin `react-hooks`
// no ESLint, `.eslintrc.json`, então o array de dependências reduzido é
// deliberado, não um lint bypass).
//
// Matriz FIXA (Roteiro da Tarefa) — `rows` é POPULADO 1x por
// `fillBudgetPlanningForm` (1 linha por categoria elegível, com ou sem
// valor) e NUNCA via `useFieldArray`/`append`/`remove` (diferente de
// `MovementAllocationEditor`/`AccountingEntryItemsEditor`, ambos dinâmicos).
//
// Guard de `onSubmit` (checklist da Tarefa) — não submete enquanto o
// universo de categorias elegíveis ainda está carregando (o botão já fica
// desabilitado, mas o guard é redundante e explícito, mirror do estilo de
// guarda já usado no `onSubmit` de `CreateOrUpdateFinancialFreeze.tsx`).
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { format } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ButtonSaveAndNext } from '@/components/ButtonSaveAndNext';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';
import { isEmpty } from '@/utils/isEmpty';

import { columnsForm } from '@/constants/coluns-form';
import { budgetPlanningFormDefaultValues } from '@/constants/financeiro/budgetPlanning/default-values';
import { queryKey } from '@/constants/query-key';

import { budgetPlanningSchemaResolver } from '@/validations/schemas/BudgetPlanning/budget-planning-schema';

import {
  createBudgetPlanning,
  getBudgetPlanning,
  listEligibleBudgetPlanningCategories,
  updateBudgetPlanning,
} from '@/services/v2/Financeiro/budget-planning-service';

import type {
  BudgetPlanningCategoryData,
  BudgetPlanningCategoryRequest,
  BudgetPlanningData,
  BudgetPlanningEligibleCategory,
  BudgetPlanningForm as BudgetPlanningFormType,
  BudgetPlanningGridRowForm,
  CreateOrUpdateBudgetPlanningRequest,
} from '@/@types/v2/Financeiro/budgetPlanning';

import { BudgetPlanningGrid } from './BudgetPlanningGrid';

// Hidratação — mescla universo elegível (novo endpoint, GAP-PO-08) + valores
// já salvos (`data.categories`, só existe em edição, só cobre pivots
// existentes). Categoria elegível sem pivot entra com `amount: null` em
// todos os 12 meses (linha vazia, mas PRESENTE — prova do gap corrigido).
function buildGridRows(
  eligible: BudgetPlanningEligibleCategory[],
  saved?: BudgetPlanningCategoryData[]
): BudgetPlanningGridRowForm[] {
  return eligible.map((category) => {
    const savedRow = saved?.find((item) => item.financial_category.uuid === category.uuid);
    return {
      financial_category: category,
      last_year_value: savedRow?.last_year_value ?? 0,
      months: Array.from({ length: 12 }, (_, month) => ({
        financial_category_uuid: category.uuid,
        amount: savedRow?.months.find((item) => item.month === month)?.amount ?? null,
      })),
    };
  });
}

interface FlatCategoryEntry {
  rowIndex: number;
  month: number;
  payload: BudgetPlanningCategoryRequest;
}

// Payload: só células preenchidas (regra #4 do contrato legado — filtro
// client antes do submit); `rowIndex`/`month` preservados para remapear 422
// por linha/célula de volta à grade (`categories.{i}.*` do servidor não
// corresponde ao índice da LINHA da grade, só ao índice desta lista achatada).
function buildCategoriesPayload(rows: BudgetPlanningGridRowForm[]): FlatCategoryEntry[] {
  const entries: FlatCategoryEntry[] = [];
  rows.forEach((row, rowIndex) => {
    row.months.forEach((cell, month) => {
      if (cell.amount != null) {
        entries.push({
          rowIndex,
          month,
          payload: {
            financial_category_uuid: row.financial_category.uuid,
            month,
            amount: Number(cell.amount),
          },
        });
      }
    });
  });
  return entries;
}

export default function CreateOrUpdateBudgetPlanning() {
  const { budgetPlanningUuid } = useParams<{ budgetPlanningUuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.financial.budgetPlanning;
  const formText = text.form;

  // Rota "/visualizar" reaproveita o MESMO componente, forçada
  // somente-leitura independente de o usuário também ter
  // `budget-plannings_edit` (mirror `CreateOrUpdateFinancialFreeze.tsx`).
  const isViewOnlyRoute = location.pathname.endsWith('/visualizar');
  const isEditing = isValidGuid(budgetPlanningUuid);

  // Guard de uuid malformado — a rota TEM parâmetro mas ele não é um GUID
  // válido.
  useEffect(() => {
    if (budgetPlanningUuid && !isValidGuid(budgetPlanningUuid)) {
      navigate('/financeiro/previsao', { replace: true });
    }
  }, [budgetPlanningUuid, navigate]);

  const canSave =
    !isViewOnlyRoute && (isEditing ? can('budget-plannings_edit') : can('budget-plannings_create'));
  const readOnly = !canSave;

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, dirtyFields },
  } = useForm<BudgetPlanningFormType>({
    mode: 'onChange',
    resolver: budgetPlanningSchemaResolver(languageGB),
    defaultValues: budgetPlanningFormDefaultValues,
  });

  // ---- Fonte 1: universo de categorias elegíveis (GAP-PO-08, SEM ID de
  // contexto — `useQuery` direto, mirror `OfxImport/Report/index.tsx` para
  // GET puro sem parâmetro que não é "form por ID"). ----
  const eligibleCategoriesQuery = useQuery({
    queryKey: [queryKey.financial.budgetPlanningEligibleCategories],
    queryFn: async () => {
      const response = await listEligibleBudgetPlanningCategories();
      return response.data;
    },
    refetchOnWindowFocus: false,
    retry: false,
  });
  const eligibleCategories = eligibleCategoriesQuery.data ?? [];

  // ---- Fonte 2: detalhe do plano (só em edição/visualização). `fillForm`
  // no-op — a hidratação real acontece em `fillBudgetPlanningForm` abaixo,
  // que combina as 2 fontes (Lei 2 preservada: guarda de `dirtyFields` +
  // `resetForce`, só que acionada por um `useEffect` de composição, não
  // pelo `useEffect` interno do hook). ----
  const budgetPlanningQuery = useCustomFormQueryByGuid<BudgetPlanningData>({
    registrationId: isEditing ? budgetPlanningUuid : undefined,
    asyncFunction: getBudgetPlanning,
    queryKey: queryKey.financial.budgetPlanning,
    fillForm: () => {},
  });
  const budgetPlanningData = (budgetPlanningQuery as any)?.data as BudgetPlanningData | undefined;

  const isLoadingEligible = eligibleCategoriesQuery.isLoading;
  const isErrorEligible = eligibleCategoriesQuery.isError;
  const isLoadingBudgetPlanning = isEditing && checkLoadingStatus([budgetPlanningQuery as any]);

  const isEligibleReady = eligibleCategoriesQuery.isSuccess;
  const isBudgetPlanningReady = !isEditing || !!(budgetPlanningQuery as any)?.isSuccess;

  // Lei 2 — função NOMEADA com guarda de `dirtyFields`, `reset()` só aqui
  // dentro. `!isEmpty(dirtyFields) || resetForce`: `isEmpty` deste fork tem
  // semântica invertida ao nome (retorna `true` quando HÁ chaves) — mirror
  // EXATO do idioma já usado em `CreateOrUpdateFinancialFreeze.tsx`.
  function fillBudgetPlanningForm(resetForce?: boolean) {
    if (!isEmpty(dirtyFields) || resetForce) {
      reset({
        date: budgetPlanningData?.date ? new Date(`${budgetPlanningData.date}T00:00:00`) : null,
        year: budgetPlanningData?.year ?? new Date().getFullYear(),
        rows: buildGridRows(eligibleCategories, budgetPlanningData?.categories),
      });
    }
  }

  // Composição das 2 fontes — dispara 1x quando AMBAS resolvem (RISCO ALTO
  // da Tarefa). `fillBudgetPlanningForm` já lê `eligibleCategories`/
  // `budgetPlanningData` do MESMO render em que a flag virou `true` — sem
  // closure obsoleta.
  useEffect(() => {
    if (isEligibleReady && isBudgetPlanningReady) {
      fillBudgetPlanningForm(true);
    }
  }, [isEligibleReady, isBudgetPlanningReady]);

  async function tryPersistBudgetPlanning(data: BudgetPlanningFormType) {
    const entries = buildCategoriesPayload(data.rows);
    const payload: CreateOrUpdateBudgetPlanningRequest = {
      date: format(data.date as Date, 'yyyy-MM-dd'),
      year: data.year as number,
      categories: entries.map((entry) => entry.payload),
    };

    try {
      return isEditing && budgetPlanningUuid
        ? await updateBudgetPlanning(budgetPlanningUuid, payload)
        : await createBudgetPlanning(payload);
    } catch (error) {
      // 422 por campo (contrato de tela §2): `date`/`year` diretos;
      // `categories` (array-level, `min:1`) mapeado em `rows` (mesmo campo
      // que a Alert de array da grade lê); `categories.{i}.*` remapeado de
      // volta à célula `rows.{rowIndex}.months.{month}` via `entries`
      // (MESMA ordem determinística usada para montar o payload acima).
      if (isAxiosError(error) && error.response?.status === 422) {
        const fieldErrors = error.response.data?.errors as Record<string, string[]> | undefined;
        Object.entries(fieldErrors ?? {}).forEach(([field, messages]) => {
          const message = messages?.[0];
          if (!message) return;

          if (field === 'date') {
            setError('date', { type: 'server', message });
            return;
          }
          if (field === 'year') {
            setError('year', { type: 'server', message });
            return;
          }
          if (field === 'categories') {
            setError('rows' as any, { type: 'server', message });
            return;
          }

          const match = field.match(/^categories\.(\d+)\.(financial_category_uuid|month|amount)$/);
          if (match) {
            const entry = entries[Number(match[1])];
            if (entry) {
              setError(`rows.${entry.rowIndex}.months.${entry.month}.amount` as any, {
                type: 'server',
                message,
              });
            }
          }
        });
      }
      throw error;
    }
  }

  const budgetPlanningMutation = useRequest({
    asyncFunction: tryPersistBudgetPlanning,
    entityName: text.singularLabel,
    queryKey: queryKey.financial.budgetPlannings,
    queryKey2: queryKey.financial.budgetPlanning,
    typesRequest: isEditing ? 'update' : 'create',
    actionSuccess: (data) => {
      if (isEditing) {
        navigate(-1);
      } else {
        navigate(`/financeiro/previsao/${data.uuid}`, { replace: true });
      }
    },
  });

  const isSubmittingForm = budgetPlanningMutation.isPending;

  async function onSubmit(data: BudgetPlanningFormType) {
    // Guard de onSubmit (checklist da Tarefa) — não submete enquanto o
    // universo de categorias elegíveis ainda está carregando (defensivo —
    // o botão já fica desabilitado nesse estado).
    if (isLoadingEligible) return;
    // Guard de submit sem alteração — forma EXPLÍCITA
    // `Object.keys(dirtyFields).length === 0` (mirror
    // `CreateOrUpdateFinancialFreeze.tsx`, `isEmpty` tem semântica invertida
    // ao nome).
    if (isEditing && Object.keys(dirtyFields).length === 0) {
      navigate(-1);
      return;
    }
    await budgetPlanningMutation.mutateAsync(data);
  }

  const formTitle = isViewOnlyRoute
    ? text.viewTitle
    : isEditing
      ? text.editTitle
      : text.createTitle;

  return (
    <FormContainer
      title={formTitle}
      footer={
        <>
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canSave && (
            <ButtonSaveAndNext
              type="submit"
              form="budget-planning-form"
              create={!isEditing}
              dirtyFields={dirtyFields}
              languageGB={languageGB}
              loading={isSubmittingForm}
              disabled={isSubmittingForm || isLoadingEligible || isLoadingBudgetPlanning}
            />
          )}
        </>
      }
    >
      <Form id="budget-planning-form" noPadding onSubmit={handleSubmit(onSubmit)} minW={0}>
        <SimpleGrid columns={columnsForm.default} gap={6} mb={6}>
          <Box>
            <Flex as="label" alignItems="center" fontSize="14px" mb={1}>
              {formText.fields.dateLabel}
              <Text as="span" color="feedBack.errorMain" ml={1}>
                *
              </Text>
            </Flex>
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <>
                  <DateInput
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : null}
                    onChange={(iso) => field.onChange(iso ? new Date(`${iso}T00:00:00`) : null)}
                    disabled={readOnly}
                  />
                  {error?.message && (
                    <Text fontSize="xs" color="fg.error" mt={1}>
                      {error.message}
                    </Text>
                  )}
                </>
              )}
            />
          </Box>

          <Controller
            name="year"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                label={formText.fields.yearLabel}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={field.value ?? ''}
                onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                onBlur={field.onBlur}
                error={error?.message}
                isRequired
                disabled={readOnly}
              />
            )}
          />

          <Input
            label={text.list.table.code}
            value={budgetPlanningData?.code ?? ''}
            placeholder={formText.fields.codePlaceholder}
            readOnly
            disabled
            loading={isLoadingBudgetPlanning}
          />

          {isEditing && (
            <Input
              label={formText.fields.authorLabel}
              value={budgetPlanningData?.user?.name ?? '—'}
              readOnly
              disabled
              loading={isLoadingBudgetPlanning}
            />
          )}
        </SimpleGrid>

        <BudgetPlanningGrid
          control={control}
          errors={errors}
          languageGB={languageGB}
          disabled={readOnly}
          isLoadingEligible={isLoadingEligible || isLoadingBudgetPlanning}
          isErrorEligible={isErrorEligible}
          onRetryEligible={() => eligibleCategoriesQuery.refetch()}
        />
      </Form>
    </FormContainer>
  );
}
