// src/pages/Relatorios/Financeiro/CustoProducao/index.tsx
// -----------------------------------------------------------------------------
// Tela "Custo de Produção — Relatório" (F-272, `IncomeStatementController` do
// legado — NÃO confundir com a tela "DRE", já migrada e distinta). Rota
// `/relatorios/financeiro/custo-de-producao`, materializa o item de menu
// FILHO `rel-fin-custo-producao`, sob o grupo/submenu `rel-fin` ("Financeiro",
// `navigationTree.ts`). Esteira 97-Esteiras/073, TASK-272-FE-02 (casco +
// filtro + PDF) + TASK-272-FE-03 (tabela de prévia hierárquica + os 3
// drill-downs), materializadas juntas nesta execução.
//
// Casco mirror `Financeiro/CashFlow/index.tsx` (F-107) — form separado de
// `appliedFilters`, fetch MANUAL via `enabled:false`+`refetch()` dentro de um
// `useEffect` reagindo a `appliedFilters` — MAIS os campos/Selects mirror
// `Relatorios/Financeiro/ApuracaoCusto/index.tsx` (F-245) para os 4 lookups
// já existentes (`listFarms`/`listProprietaryOptions`/`listHarvestOptions`/
// `listCostCenterOptions`). A tabela hierárquica + o modal de drill-down
// compartilhado reaproveitam o MESMO padrão de `CashFlow/index.tsx`
// (`Table.Root` + `useDisclosure` + `CustomDialog`) — UX-GAP do `ux_root`
// resolvido "seguir-pelo-padrão" (contrato de tela §1, autorização do dono).
//
// RISCOS DE FIDELIDADE (contrato de tela §2/§3, ver `F-272-front-contrato-tela.md`):
// 1. Nomes de campo LITERAIS da API: `farm_id`/`proprietary_id`/`harvest_id`/
//    `cost_center_ids` — DIVERGEM da convenção `_uuid` das telas-irmãs
//    (Dre/JurosPagos/ApuracaoCusto). NÃO renomear "por consistência".
// 2. "Baixar PDF" só aparece DEPOIS do 1º "Filtrar" bem-sucedido
//    (`appliedFilters !== null`) — AUSENTE do footer, não só `disabled`
//    (mirror ACT-02 do legado, DIVERGE do padrão sempre-visível de
//    Dre/JurosPagos/ApuracaoCusto).
// 3. 4 conceitos de "fazenda" distintos: `farm_id` (sub-filtro OPCIONAL
//    tenant-wide, o campo "Fazenda" do próprio form) vs. `proprietary_id`
//    (farm-scoped pela fazenda ATIVA, reseta) vs. `cost_center_ids[]`
//    (também farm-scoped pela fazenda ATIVA, também reseta) vs. `harvest_id`
//    (tenant-wide, NÃO reseta). Os lookups de `proprietary_id`/
//    `cost_center_ids` usam SEMPRE `activeFarmUuid` do `useAuth()`, NUNCA o
//    valor do campo "Fazenda".
// 4. A API já entrega a árvore ACHATADA (`level`/`variant`/`drill_down`
//    prontos por linha) — SEM recursão/accordion no cliente, só indentação
//    por `level`.
// 5. `category_id` do drill-down é `int` interno, não uuid (exceção
//    documentada, `IncomeStatementRowResource.php`).
// 6. [CORRIGIDO — homologação, execução 073] `group`/`type` agora abrem
//    PRÉ-SELECIONADOS ("Caixa"/`group='C'` e "Sintético"/`type=1`, valores
//    EXATOS de `IncomeStatementGroup`/`FinancialCategoryClass` no backend) e
//    `has_stock` abre pré-selecionado "Não" (`false`) — mirror do padrão da
//    tela DRE. `calculation_module` também abre PRÉ-SELECIONADO "Financeiro"
//    (`value: 'F'`, valor EXATO de `IncomeStatementCalculationModule::Financial`
//    em `GB.Cerne.Api/app/Enums/Reports/IncomeStatementCalculationModule.php`
//    — pedido pontual do dono, ajuste de homologação, execução 073).
//
// CAUSA-RAIZ DO BUG "Filtrar não faz nada" (correção #1, homologação): os 3
// `Select` obrigatórios (`group`/`type`/`calculation_module`) e os 2
// `DateInput` obrigatórios (`start_date`/`end_date`) NUNCA recebiam a prop
// `error`/mensagem de validação — `handleSubmit(handleFiltrar)` RODAVA a
// validação do Yup normalmente (a fiação botão→`onFilter`→`setAppliedFilters`
// sempre esteve correta), mas com os 3 selects vazios por padrão o resolver
// barrava o submit SILENCIOSAMENTE: nenhum erro aparecia na tela, o clique
// simplesmente "não fazia nada" aos olhos do usuário. Corrigido nesta
// execução: `formState.errors` agora é lido e ligado a cada campo obrigatório
// (`error={errors.campo?.message}` nos `Select`, `Text` de erro abaixo dos
// `DateInput`) — ver `get_pwa_form_query_pattern` regra `ligacao-field-erro`
// (MANDATORY). Combinado com os defaults do item acima, o caso comum
// (usuário só ajusta datas) agora filtra de primeira; o caso residual (datas
// vazias/invertidas) mostra o erro em vez de falhar em silêncio.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import {
  Box,
  Flex,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { CustomDialog } from '@/components/CustomDialog';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { incomeStatementReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/income-statement-report-filter-schema';

import {
  listProprietaryOptions,
  type ProprietaryOption,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';
import {
  downloadIncomeStatementReportExcel,
  downloadIncomeStatementReportPdf,
  getIncomeStatementApportionmentDetails,
  getIncomeStatementCategoryDetails,
  getIncomeStatementDepreciationDetails,
  getIncomeStatementPreview,
} from '@/services/v2/Relatorios/income-statement-report-service';

import type { ModuleIncomeStatementReport } from '@/@types/language/module-income-statement-report';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FarmRef } from '@/@types/v2/Farms';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  IncomeStatementApportionmentDetail,
  IncomeStatementCategoryDetail,
  IncomeStatementDepreciationDetail,
  IncomeStatementDrillDown,
  IncomeStatementFilterParams,
  IncomeStatementRow,
} from '@/@types/v2/Relatorios/income-statement';

interface CustoProducaoFilterForm {
  group: Option<'C' | 'O'> | null;
  type: Option<1 | 2> | null;
  start_date: string | null;
  end_date: string | null;
  calculation_module: Option<'F' | 'A'> | null;
  farm_id: Option<string> | null;
  proprietary_id: Option<string> | null;
  has_stock: Option<boolean> | null;
  harvest_id: Option<string> | null;
  cost_center_ids: Option<string>[] | null;
  /** Campo 100% CLIENT-SIDE — nunca vai para `IncomeStatementFilterParams`
   *  (não existe na API). Só decide qual dos 2 endpoints de binário
   *  (`/pdf`/`/excel`) o botão "Baixar" chama (correção #3, homologação). */
  report_type: Option<'pdf' | 'excel'>;
}

// Função (não constante) porque os 3 defaults pré-selecionados (correção #2/
// #3/#4, homologação) precisam do `label` traduzido — `text` só existe depois
// de `useLanguage()` dentro do componente.
function buildPristineValues(text: ModuleIncomeStatementReport['report']): CustoProducaoFilterForm {
  return {
    group: { value: 'C', label: text.groupOptions.cash },
    type: { value: 1, label: text.typeOptions.synthetic },
    start_date: null,
    end_date: null,
    // `value: 'F'` = `IncomeStatementCalculationModule::Financial` (backend,
    // ver header) — label reaproveitado de `calculationModuleOptions` abaixo
    // (mesma chave i18n, 3 idiomas), nunca uma string nova.
    calculation_module: { value: 'F', label: text.calculationModuleOptions.financial },
    farm_id: null,
    proprietary_id: null,
    has_stock: { value: false, label: text.hasStockOptions.no },
    harvest_id: null,
    cost_center_ids: [],
    report_type: { value: 'pdf', label: text.reportTypeOptions.pdf },
  };
}

interface ListProprietaryOptionsParams extends PaginationQueryParams {
  search?: string;
}

// Adapta `listProprietaryOptions` (array direto, sem paginação real) ao
// contrato `service` de `SelectAsyncPaginate` (`ResponsePagination<T>`) —
// mesma técnica de `JurosPagos/index.tsx::listProprietaryOptionsFarmScoped`,
// reproduzida aqui (não importada de lá, mirror da instrução explícita da
// Tarefa). `scope: 'farm'` OBRIGATÓRIO — filtra pela fazenda ATIVA, não pelo
// tenant inteiro.
async function listProprietaryOptionsFarmScoped(
  params: ListProprietaryOptionsParams
): Promise<ResponsePagination<ProprietaryOption[]>> {
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

// `buildParams` — extrai `Option`→valor cru, NOMES EXATOS da API (risco #1 do
// cabeçalho: `farm_id`/`proprietary_id`/`harvest_id`/`cost_center_ids`, NÃO a
// variante `_uuid`).
function buildParams(data: CustoProducaoFilterForm): IncomeStatementFilterParams {
  return {
    group: data.group!.value,
    type: data.type!.value,
    start_date: data.start_date as string,
    end_date: data.end_date as string,
    calculation_module: data.calculation_module!.value,
    farm_id: data.farm_id?.value || undefined,
    proprietary_id: data.proprietary_id?.value || undefined,
    has_stock: data.has_stock?.value ?? undefined,
    harvest_id: data.harvest_id?.value || undefined,
    cost_center_ids: data.cost_center_ids?.length
      ? data.cost_center_ids.map((option) => option.value)
      : undefined,
  };
}

// Drill-down (TASK-272-FE-03 §"fetchDrillDown") — os 3 endpoints SEMPRE
// recebem os 9 campos de `appliedFilters` + o campo próprio de
// `row.drill_down.params`, repassado CRU (nunca reconstruído). `default`
// cobre `'apportionment'` explicitamente (switch exaustivo, sem depender de
// inferência de retorno implícito).
function fetchDrillDown(
  drillDown: IncomeStatementDrillDown,
  filters: IncomeStatementFilterParams
): Promise<
  | IncomeStatementCategoryDetail[]
  | IncomeStatementDepreciationDetail[]
  | IncomeStatementApportionmentDetail[]
> {
  switch (drillDown.type) {
    case 'category':
      return getIncomeStatementCategoryDetails(filters, drillDown.params.category_id as number);
    case 'depreciation':
      return getIncomeStatementDepreciationDetails(
        filters,
        (drillDown.params.family_description as string | null) ?? null
      );
    case 'apportionment':
    default:
      return getIncomeStatementApportionmentDetails(
        filters,
        (drillDown.params.center_description as string | null) ?? null
      );
  }
}

function drillDownTitleFor(
  type: IncomeStatementDrillDown['type'] | undefined,
  text: ModuleIncomeStatementReport['report']
): string | undefined {
  if (type === 'category') return text.drilldown.category.title;
  if (type === 'depreciation') return text.drilldown.depreciation.title;
  if (type === 'apportionment') return text.drilldown.apportionment.title;
  return undefined;
}

// 3 sub-tabelas do drill-down (TASK-272-FE-03 §3) — funções internas do
// mesmo arquivo (não reutilizadas em outro lugar, mirror da nota da Tarefa).

function CategoryDrillDownTable({
  rows,
  text,
}: {
  rows: IncomeStatementCategoryDetail[];
  text: ModuleIncomeStatementReport['report'];
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{text.drilldown.category.dateColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.category.personColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.category.categoryColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.category.noteColumn}</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">
            {text.drilldown.category.valueColumn}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key -- payload sem id próprio por linha
          <Table.Row key={index}>
            <Table.Cell>{row.date}</Table.Cell>
            <Table.Cell>{row.person ?? '—'}</Table.Cell>
            <Table.Cell>{row.category}</Table.Cell>
            <Table.Cell>{row.note ?? '—'}</Table.Cell>
            <Table.Cell textAlign="end">{formatCurrencyBRL(row.value)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row fontWeight="bold">
          <Table.Cell colSpan={4}>{text.drilldown.totalRowLabel}</Table.Cell>
          <Table.Cell textAlign="end">{formatCurrencyBRL(total)}</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  );
}

function DepreciationDrillDownTable({
  rows,
  text,
}: {
  rows: IncomeStatementDepreciationDetail[];
  text: ModuleIncomeStatementReport['report'];
}) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{text.drilldown.depreciation.yearMonthColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.depreciation.familyColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.depreciation.equipmentColumn}</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">
            {text.drilldown.depreciation.valueColumn}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key -- payload sem id próprio por linha
          <Table.Row key={index}>
            <Table.Cell>{`${row.year}/${String(row.month).padStart(2, '0')}`}</Table.Cell>
            <Table.Cell>{row.family}</Table.Cell>
            <Table.Cell>{row.equipment}</Table.Cell>
            <Table.Cell textAlign="end">{formatCurrencyBRL(row.value)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row fontWeight="bold">
          <Table.Cell colSpan={3}>{text.drilldown.totalRowLabel}</Table.Cell>
          <Table.Cell textAlign="end">{formatCurrencyBRL(total)}</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  );
}

function ApportionmentDrillDownTable({
  rows,
  text,
}: {
  rows: IncomeStatementApportionmentDetail[];
  text: ModuleIncomeStatementReport['report'];
}) {
  const total = rows.reduce((sum, row) => sum + row.apportioned_value, 0);
  return (
    <Table.Root size="sm" variant="outline">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{text.drilldown.apportionment.dateColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.apportionment.personColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.apportionment.centerColumn}</Table.ColumnHeader>
          <Table.ColumnHeader>{text.drilldown.apportionment.noteColumn}</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">
            {text.drilldown.apportionment.originalValueColumn}
          </Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">
            {text.drilldown.apportionment.percentageColumn}
          </Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">
            {text.drilldown.apportionment.apportionedValueColumn}
          </Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {rows.map((row, index) => (
          // eslint-disable-next-line react/no-array-index-key -- payload sem id próprio por linha
          <Table.Row key={index}>
            <Table.Cell>{row.date}</Table.Cell>
            <Table.Cell>{row.person ?? '—'}</Table.Cell>
            <Table.Cell>{row.center}</Table.Cell>
            <Table.Cell>{row.note ?? '—'}</Table.Cell>
            <Table.Cell textAlign="end">{formatCurrencyBRL(row.original_value)}</Table.Cell>
            <Table.Cell textAlign="end">{`${row.percentage.toFixed(2)}%`}</Table.Cell>
            <Table.Cell textAlign="end">{formatCurrencyBRL(row.apportioned_value)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
      <Table.Footer>
        <Table.Row fontWeight="bold">
          <Table.Cell colSpan={6}>{text.drilldown.totalRowLabel}</Table.Cell>
          <Table.Cell textAlign="end">{formatCurrencyBRL(total)}</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>
  );
}

export default function CustoProducaoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.incomeStatementReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<CustoProducaoFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: incomeStatementReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(text),
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<IncomeStatementFilterParams | null>(null);

  // Reset por fazenda ativa (contrato §2/risco #3) — SÓ `proprietary_id` E
  // `cost_center_ids` (farm-scoped pela fazenda ATIVA); `harvest_id`
  // (tenant-wide) e `farm_id` (sub-filtro opcional tenant-wide) NÃO são
  // apagados na troca de fazenda.
  useEffect(() => {
    setValue('proprietary_id', null);
    setValue('cost_center_ids', []);
  }, [activeFarmUuid, setValue]);

  // "Fazenda" (campo 6) — `listFarms()` devolve array FLAT sem paginação real
  // (mirror `ApuracaoCusto`/`JurosPagos`); `Select` estático + `useQuery`,
  // NÃO `SelectAsyncPaginate`.
  const farmsQuery = useQuery({
    queryKey: ['income-statement-report', 'farms'],
    queryFn: listFarms,
  });
  const farmOptions: Option<string>[] = (farmsQuery.data ?? []).map((farm: FarmRef) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  const groupOptions: Option<'C' | 'O'>[] = [
    { value: 'C', label: text.groupOptions.cash },
    { value: 'O', label: text.groupOptions.accrual },
  ];
  const typeOptions: Option<1 | 2>[] = [
    { value: 1, label: text.typeOptions.synthetic },
    { value: 2, label: text.typeOptions.analytical },
  ];
  const calculationModuleOptions: Option<'F' | 'A'>[] = [
    { value: 'F', label: text.calculationModuleOptions.financial },
    { value: 'A', label: text.calculationModuleOptions.appropriation },
  ];
  const hasStockOptions: Option<boolean>[] = [
    { value: false, label: text.hasStockOptions.no },
    { value: true, label: text.hasStockOptions.yes },
  ];
  // "Tipo de Relatório" (correção #3, homologação) — client-side, roteia
  // `handleDownload` para `/pdf` ou `/excel`; mirror do padrão
  // `Fiscal/Dfe/DfeReport.tsx::reportTypeOptions`.
  const reportTypeOptions: Option<'pdf' | 'excel'>[] = [
    { value: 'pdf', label: text.reportTypeOptions.pdf },
    { value: 'excel', label: text.reportTypeOptions.excel },
  ];

  // Preview — fetch MANUAL (`enabled:false`+`refetch()`), mirror EXATO
  // `CashFlow/index.tsx` — só busca ao clicar "Filtrar".
  const previewQuery = useQuery({
    queryKey: [queryKey.relatorios.incomeStatementPreview, appliedFilters],
    queryFn: () => getIncomeStatementPreview(appliedFilters!),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useQueryError([previewQuery]);

  useEffect(() => {
    if (appliedFilters) previewQuery.refetch();
    // Disparo manual controlado só por `appliedFilters` (mirror `CashFlow`) —
    // `previewQuery`/`previewQuery.refetch` deliberadamente fora do array de
    // dependências (nenhuma regra `exhaustive-deps` ativa neste projeto).
  }, [appliedFilters]);

  function handleFiltrar(data: CustoProducaoFilterForm) {
    setAppliedFilters(buildParams(data));
  }

  const hasBeenFiltered = appliedFilters !== null;
  const isReportEmpty =
    hasBeenFiltered && !previewQuery.isError && (previewQuery.data?.length ?? 0) === 0;

  // "Baixar" (risco #2, PDF ou Excel conforme `report_type` — correção #3) —
  // visível SÓ quando `appliedFilters !== null` (AUSENTE do footer, não só
  // `disabled`), usa `appliedFilters` (não o form ao vivo, mirror C027
  // "reenvia TODOS os parâmetros atuais"). `report_type` é lido ao vivo do
  // form (`watch`) porque é client-side puro, fora de `appliedFilters`/
  // `IncomeStatementFilterParams` (nunca vai para a API).
  const reportTypeValue = watch('report_type');

  async function handleDownload() {
    if (!appliedFilters) return;
    setIsDownloading(true);
    const isExcel = reportTypeValue?.value === 'excel';
    try {
      const blob = isExcel
        ? await downloadIncomeStatementReportExcel(appliedFilters)
        : await downloadIncomeStatementReportPdf(appliedFilters);
      downloadBlob(
        blob,
        isExcel ? 'custo-de-producao-relatorio.xlsx' : 'custo-de-producao-relatorio.pdf'
      );
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? text.downloadError,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  // Drill-down (TASK-272-FE-03 §5) — 1 modal compartilhado pelos 3 tipos
  // (mirror `#analyticsModal` único do legado, C050).
  const drillDownDisclosure = useDisclosure();
  const [selectedDrillDown, setSelectedDrillDown] = useState<IncomeStatementDrillDown | null>(null);

  function handleRowClick(row: IncomeStatementRow) {
    if (!row.drill_down) return;
    setSelectedDrillDown(row.drill_down);
    drillDownDisclosure.onOpen();
  }

  const drillDownQuery = useQuery({
    queryKey: [queryKey.relatorios.incomeStatementDrillDown, selectedDrillDown, appliedFilters],
    queryFn: () => fetchDrillDown(selectedDrillDown!, appliedFilters!),
    enabled: !!selectedDrillDown && drillDownDisclosure.open,
    refetchOnWindowFocus: false,
  });

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.filterButton}
            type="button"
            onClick={handleSubmit(handleFiltrar)}
            loading={previewQuery.isFetching}
            disabled={!isValid || previewQuery.isFetching}
          />
          {appliedFilters && (
            <Button
              title={text.downloadButton}
              icon={Download as any}
              type="button"
              onClick={handleDownload}
              loading={isDownloading}
            />
          )}
        </Flex>
      }
    >
      <VStack align="stretch" gap={6}>
        <Form onSubmit={(event) => event.preventDefault()}>
          <VStack align="stretch" gap={6}>
            {/* Layout reorganizado (correção #5, homologação): 1 único grid de 4
                colunas (`columnsForm.fourColumns`) — 4 selects na 1ª linha, 4
                na 2ª, e a 3ª fecha com `harvest_id` + `report_type` (normais)
                + `cost_center_ids` MAIOR (`gridColumn` span 2, ocupa o espaço
                restante da linha). Ordem dos 10 campos ORIGINAIS preservada
                fielmente ao legado — só `report_type` (campo NOVO, correção
                #3, sem equivalente no legado/contrato de API) foi inserido
                antes de `cost_center_ids` para fechar a 3ª linha. */}
            <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
              {/* Campo 1 — Regime (`group`), pré-selecionado "Caixa" (correção #2). */}
              <Controller
                name="group"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.group}
                    name={name}
                    value={value}
                    onChange={(option: Option<'C' | 'O'> | null) => onChange(option ?? null)}
                    options={groupOptions}
                    error={errors.group?.message}
                  />
                )}
              />

              {/* Campo 2 — Tipo (`type`), pré-selecionado "Sintético" (correção #2). */}
              <Controller
                name="type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.type}
                    name={name}
                    value={value}
                    onChange={(option: Option<1 | 2> | null) => onChange(option ?? null)}
                    options={typeOptions}
                    error={errors.type?.message}
                  />
                )}
              />

              {/* Campo 3 — Dt. Início (`start_date`), obrigatório. Erro exibido
                  abaixo (correção #1 — causa-raiz do "Filtrar não faz nada"):
                  `DateInput` não tem prop `error` própria, então a mensagem
                  vem como `Text` própria, mesmo padrão visual do asterisco
                  acima. */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.fields.startDate}
                  <Text as="span" color="fg.error">
                    {' '}
                    *
                  </Text>
                </Text>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={(v) => {
                        onChange(v);
                        trigger(['start_date', 'end_date']);
                      }}
                    />
                  )}
                />
                {errors.start_date?.message && (
                  <Text fontSize="xs" color="fg.error" mt={1}>
                    {errors.start_date?.message}
                  </Text>
                )}
              </Box>

              {/* Campo 4 — Dt. Fim (`end_date`), obrigatório, `>= start_date`. */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>
                  {text.fields.endDate}
                  <Text as="span" color="fg.error">
                    {' '}
                    *
                  </Text>
                </Text>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <DateInput
                      value={value ?? null}
                      onChange={(v) => {
                        onChange(v);
                        trigger(['start_date', 'end_date']);
                      }}
                    />
                  )}
                />
                {errors.end_date?.message && (
                  <Text fontSize="xs" color="fg.error" mt={1}>
                    {errors.end_date?.message}
                  </Text>
                )}
              </Box>

              {/* Campo 5 — Módulo de Cálculo (`calculation_module`) + tooltip,
                  pré-selecionado "Financeiro" (correção #6, homologação). */}
              <Controller
                name="calculation_module"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.calculationModule}
                    tooltip={text.calculationModuleTooltip}
                    name={name}
                    value={value}
                    onChange={(option: Option<'F' | 'A'> | null) => onChange(option ?? null)}
                    options={calculationModuleOptions}
                    error={errors.calculation_module?.message}
                  />
                )}
              />

              {/* Campo 6 — Fazenda (`farm_id`), sub-filtro OPCIONAL tenant-wide
                  (`listFarms`, NÃO `SelectAsyncPaginate`), placeholder "Todas". */}
              <Controller
                name="farm_id"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.farm}
                    placeholder={text.farmPlaceholder}
                    name={name}
                    value={value}
                    onChange={(option: Option<string> | null) => onChange(option ?? null)}
                    options={farmOptions}
                    loading={farmsQuery.isLoading}
                  />
                )}
              />

              {/* Campo 7 — Proprietário (`proprietary_id`), farm-scoped pela
                  fazenda ATIVA (`activeFarmUuid`), NUNCA pelo campo "Fazenda"
                  acima (risco #3). */}
              <Controller
                name="proprietary_id"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.proprietary}
                    placeholder={text.proprietaryPlaceholder}
                    cacheUniqs={[activeFarmUuid]}
                    service={listProprietaryOptionsFarmScoped}
                    mapOptions={(item: ProprietaryOption) => ({
                      label: item.label,
                      value: item.uuid,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                  />
                )}
              />

              {/* Campo 8 — Mostra Estoque? (`has_stock`), pré-selecionado "Não"
                  (correção #4) + tooltip. */}
              <Controller
                name="has_stock"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.hasStock}
                    tooltip={text.hasStockTooltip}
                    name={name}
                    value={value}
                    onChange={(option: Option<boolean> | null) => onChange(option ?? null)}
                    options={hasStockOptions}
                  />
                )}
              />

              {/* Campo 9 — Safra (`harvest_id`), tenant-wide (SEM `cacheUniqs`,
                  mirror `account_uuids` da F-245). Abre a 3ª linha. */}
              <Controller
                name="harvest_id"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.harvest}
                    placeholder={text.harvestPlaceholder}
                    service={(params) => listHarvestOptions(params)}
                    mapOptions={(item: Harvest) => ({
                      label: item.description,
                      value: item.uuid,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                  />
                )}
              />

              {/* Campo NOVO — Tipo de Relatório (`report_type`), correção #3.
                  100% client-side (roteia `handleDownload`, nunca vai para a
                  API) — pré-selecionado "PDF". Fecha a 3ª linha junto de
                  `cost_center_ids` (abaixo), que ocupa o espaço restante. */}
              <Controller
                name="report_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.reportType}
                    name={name}
                    value={value}
                    onChange={(option: Option<'pdf' | 'excel'> | null) =>
                      onChange(option ?? reportTypeOptions[0])
                    }
                    options={reportTypeOptions}
                    noClearable
                  />
                )}
              />

              {/* Campo 10 — Centro de Custo (`cost_center_ids[]`), farm-scoped
                  pela fazenda ATIVA — mirror EXATO campo 4 de `ApuracaoCusto`.
                  MAIOR (correção #5): `gridColumn` span 2 ocupa o restante da
                  3ª linha (`harvest_id` + `report_type`, 1 coluna cada, já
                  tomaram 2 das 4 colunas de `columnsForm.fourColumns` no
                  breakpoint `lg`). */}
              <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 2' }}>
                <Controller
                  name="cost_center_ids"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={text.fields.costCenters}
                      placeholder={text.costCentersPlaceholder}
                      isMulti
                      cacheUniqs={[activeFarmUuid]}
                      service={(params) =>
                        listCostCenterOptions({
                          ...params,
                          only_analytic: true,
                          is_enabled: 'true',
                          farm_uuid: activeFarmUuid ?? undefined,
                        })
                      }
                      mapOptions={(item: CostCenterRef) => ({
                        label: `${item.code} — ${item.description}`,
                        value: item.uuid,
                      })}
                      value={field.value ?? []}
                      onChange={(options: any) => field.onChange(options ?? [])}
                    />
                  )}
                />
              </Box>
            </SimpleGrid>
          </VStack>
        </Form>

        {/* Estados obrigatórios da área de resultado (`get_spa_ux_fidelity_pattern
            §3`, mirror `CashFlow`): loading / empty (pré-filtro) / error /
            empty (relatório vazio) / success (tabela hierárquica real,
            TASK-272-FE-03 §4). */}
        <Skeleton loading={previewQuery.isFetching}>
          {!hasBeenFiltered && !previewQuery.isFetching && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyBeforeFilter}</Text>
            </Box>
          )}

          {hasBeenFiltered && previewQuery.isError && (
            <Box py={10} textAlign="center">
              <Text color="fg.error" mb={3}>
                {text.previewError}
              </Text>
              <Button
                title={text.retryButton}
                type="button"
                variant="outline"
                onClick={() => previewQuery.refetch()}
              />
            </Box>
          )}

          {isReportEmpty && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyReport}</Text>
            </Box>
          )}

          {hasBeenFiltered && !previewQuery.isError && (previewQuery.data?.length ?? 0) > 0 && (
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{text.table.descriptionColumn}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">{text.table.valueColumn}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {text.table.percentColumn}
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {previewQuery.data!.map((row, index) => {
                  const isClickable = row.drill_down !== null;
                  return (
                    // eslint-disable-next-line react/no-array-index-key -- array achatado sem id próprio por linha
                    <Table.Row
                      key={index}
                      onClick={() => isClickable && handleRowClick(row)}
                      cursor={isClickable ? 'pointer' : 'default'}
                      _hover={isClickable ? { bg: 'bg.muted' } : undefined}
                      fontWeight={
                        row.variant === 'total'
                          ? 'bold'
                          : row.variant === 'group'
                            ? 'semibold'
                            : 'normal'
                      }
                    >
                      <Table.Cell paddingLeft={`${row.level * 1.5}rem`}>
                        {row.description}
                      </Table.Cell>
                      <Table.Cell textAlign="end">{formatCurrencyBRL(row.value)}</Table.Cell>
                      <Table.Cell textAlign="end">{row.percent.toFixed(2)}%</Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          )}
        </Skeleton>
      </VStack>

      {/* Modal de drill-down compartilhado (TASK-272-FE-03 §5) — 1 único
          `CustomDialog` para os 3 tipos, conteúdo trocado conforme
          `selectedDrillDown.type`. */}
      <CustomDialog
        isOpen={drillDownDisclosure.open}
        onClose={() => {
          drillDownDisclosure.onClose();
          setSelectedDrillDown(null);
        }}
        title={drillDownTitleFor(selectedDrillDown?.type, text)}
        scrollableBody
      >
        {drillDownQuery.isFetching ? (
          <Skeleton height="120px" />
        ) : !drillDownQuery.data || drillDownQuery.data.length === 0 ? (
          <Box py={6} textAlign="center">
            <Text color="fg.muted">{text.emptyReport}</Text>
          </Box>
        ) : selectedDrillDown?.type === 'category' ? (
          <CategoryDrillDownTable
            rows={drillDownQuery.data as IncomeStatementCategoryDetail[]}
            text={text}
          />
        ) : selectedDrillDown?.type === 'depreciation' ? (
          <DepreciationDrillDownTable
            rows={drillDownQuery.data as IncomeStatementDepreciationDetail[]}
            text={text}
          />
        ) : (
          <ApportionmentDrillDownTable
            rows={drillDownQuery.data as IncomeStatementApportionmentDetail[]}
            text={text}
          />
        )}
      </CustomDialog>
    </FormContainer>
  );
}
