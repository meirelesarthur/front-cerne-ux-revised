// src/pages/Relatorios/Financeiro/LivroRazao/index.tsx
// -----------------------------------------------------------------------------
// Tela "Livro Razão — Relatório" (F-274, TASK-FE-LR-02, esteira
// 97-Esteiras/008). Rota `/relatorios/financeiro/livro-razao`, materializa o
// item de menu FILHO `rel-fin-livro-razao`, sob o grupo/submenu `rel-fin`
// ("Financeiro", `navigationTree.ts` — TASK-FE-LR-03).
//
// Contrato de tela: `contrato-tela-livro-razao-frontend.md` §5.
//
// CORREÇÃO PÓS-ENTREGA (2026-09-09, achado do dono em teste manual): o legado
// (`agro365/app/Http/Controllers/Admin/LedgerController.php`, Doc Bruta
// `doc-bruta-livro-razao.md`) NUNCA teve prévia em tela — só formulário →
// gerar PDF/Excel. A prévia on-screen (JSON `/ledger-report/preview`
// renderizado em tabela) foi "adoção" indevida do arquiteto, sem precedente
// no legado, e foi REMOVIDA por completo. A tela agora é fiel ao legado E às
// 2 telas irmãs desta MESMA esteira que não têm prévia: formulário de
// filtros + 2 botões de download, sem seção de resultado em tela. Mirror
// ESTRUTURAL: `Relatorios/Pecuaria/CustoTotalReproducao/index.tsx` (F-328) e
// `Relatorios/Agricultura/RomaneioVendasContrato/index.tsx` — mesma casca
// `FormContainer`+`Form`+`SimpleGrid`+`VStack`, mesmo par PDF/Excel.
// `getLedgerReportPreview` permanece disponível em
// `services/v2/LedgerReport/ledger-report-service.ts` (endpoint não foi
// removido do backend), mas NÃO é mais consumido por esta tela.
//
// Fidelidade deliberada (decisão do dono, contrato-api §7 + decisão de lote
// 2026-09-09): `cost_center_uuid`/`plan_account_uuid`/`proprietary_uuid` são
// filtros quebrados/inertes no legado (GAP-LR-02/GAP-LR-03) — expostos como
// Select opcional simples, SEM validação cruzada, SEM `disabled`, SEM hint.
// `end_date` NÃO recebe `maxDate` (atributo inerte do legado, sem efeito
// observável). PDF aberto em nova aba (`window.open(URL.createObjectURL(...))`,
// NUNCA `downloadBlob`) — a API responde `Content-Disposition: inline` para
// o PDF do Livro Razão (confirmado na Doc Bruta), mesmo padrão de
// `CustoTotalReproducao`/`RomaneioVendasContrato` desta esteira. Excel
// continua via `downloadBlob` (força download, correto para `.xlsx`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { configureSpacing } from '@/utils/config-padding';
import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { ledgerReportConditionOptions } from '@/constants/Relatorios/ledger-report/options/condition-options';

import { ledgerReportFilterSchemaResolver } from '@/validations/schemas/LedgerReport/ledger-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  downloadLedgerReportExcel,
  downloadLedgerReportPdf,
} from '@/services/v2/LedgerReport/ledger-report-service';
import { listPlanAccountOptions } from '@/services/v2/PlanAccounts/plan-account-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type {
  LedgerReportCondition,
  LedgerReportFilterForm,
  LedgerReportParams,
} from '@/@types/v2/LedgerReport';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

function buildPristineValues(languageGB: LanguageDate): LedgerReportFilterForm {
  return {
    account_uuid: null,
    start_date: null,
    end_date: null,
    // Default 'S' do legado (FL-07/FM-05) — nasce pré-selecionado no form.
    condition: ledgerReportConditionOptions.getOption('S', languageGB),
    proprietary_uuid: null,
    cost_center_uuid: null,
    plan_account_uuid: null,
    category_uuids: [],
  };
}

export default function LivroRazaoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.ledgerReport.report;
  const shared = languageGB.accountsReports.shared;
  // Mesmo token de espaçamento horizontal que `<Form>` já aplica internamente
  // — reaproveitado no `VStack` externo (mirror `CentroCusto`/`ApuracaoCusto`).
  const { formSpacing } = configureSpacing();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LedgerReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: ledgerReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // ---- Proprietário Gestor (Select estático, lookup SEM paginação) -------
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });

  // ---- Categorias Financeiras (CheckboxListField remoto) ------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item: FinancialCategoryOption) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    extraParams: { is_enabled: 'true', class: 2 },
  });

  const conditionOptions = ledgerReportConditionOptions.options(languageGB);

  function buildParams(data: LedgerReportFilterForm): LedgerReportParams | null {
    if (!data.account_uuid || !data.start_date || !data.end_date) return null;
    return {
      account_uuid: data.account_uuid.value,
      start_date: data.start_date,
      end_date: data.end_date,
      condition: data.condition?.value || undefined,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      cost_center_uuid: data.cost_center_uuid?.value || undefined,
      plan_account_uuid: data.plan_account_uuid?.value || undefined,
      category_uuids: data.category_uuids.length ? data.category_uuids : undefined,
    };
  }

  // Forma achatada dos filtros — recalculada a cada render a partir do
  // `watch()`. `null` enquanto os 3 obrigatórios (`account_uuid`+período)
  // não estão preenchidos — guarda os 2 botões de download (sem prévia,
  // não há query nem estado de servidor para derivar disto).
  const watchedValues = watch();
  const hasRequiredFilled = buildParams(watchedValues) !== null;

  async function handleDownloadPdf(data: LedgerReportFilterForm) {
    const params = buildParams(data);
    if (!params) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadLedgerReportPdf(params);
      // PDF `Content-Disposition: inline` (Doc Bruta) — abre em nova aba,
      // NUNCA `downloadBlob` (forçaria download, quebrando a fidelidade ao
      // legado e divergindo das telas irmãs desta esteira).
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `CentroCusto:211-229`).
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
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadExcel(data: LedgerReportFilterForm) {
    const params = buildParams(data);
    if (!params) return;
    setIsDownloadingExcel(true);
    try {
      const blob = await downloadLedgerReportExcel(params);
      downloadBlob(blob, 'livro-razao.xlsx');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
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
      setIsDownloadingExcel(false);
    }
  }

  return (
    <FormContainer title={text.pageTitle} subtitle={text.pageSubtitle}>
      <VStack align="stretch" gap={6} paddingX={formSpacing.paddingX} minW={0}>
        <Form noPadding onSubmit={(event) => event.preventDefault()}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="account_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.account}
                  placeholder={text.accountPlaceholder}
                  isRequired
                  service={listAccounts}
                  mapOptions={(item: AccountListItem) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.account_uuid?.message}
                />
              )}
            />

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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.start_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_date?.message}
                </Text>
              )}
            </Box>

            {/* `end_date` NÃO recebe `maxDate` — o legado tinha `max=hoje`
                num `<input type="text">` (FM-04), atributo inerte. */}
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.condition}
                  placeholder={text.conditionPlaceholder}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option: Option<LedgerReportCondition> | null) =>
                    field.onChange(option ?? null)
                  }
                  options={conditionOptions}
                  noClearable
                  error={errors.condition?.message}
                />
              )}
            />

            <Controller
              name="proprietary_uuid"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            {/* Quebrado/inerte isolado (GAP-LR-02) — exposto como Select
                opcional simples, sem validação cruzada, sem `disabled`, sem
                hint. `only_analytic:true` reproduz o `class=2` legado
                (LK-03); SEM `farm_uuid` — universo mais amplo que o legado,
                decisão do dono (mirror `CentroCusto:339-365`). */}
            <Controller
              name="cost_center_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.costCenter}
                  placeholder={text.costCenterPlaceholder}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                    only_analytic: true,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            {/* Inerte isolado (GAP-LR-02) — mesma exposição sem compensação. */}
            <Controller
              name="plan_account_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.planAccount}
                  placeholder={text.planAccountPlaceholder}
                  service={listPlanAccountOptions}
                  mapOptions={(item: PlanAccountRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                    class: 2,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            {/* Categorias Financeiras — `CheckboxListField` REMOTO, ocupa o
                resto da linha (mirror técnica `accounts` de `CentroCusto`). */}
            <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 3' }}>
              <Controller
                name="category_uuids"
                control={control}
                render={({ field }) => (
                  <CheckboxListField
                    label={text.fields.categories}
                    items={categoriesQuery.items}
                    selectedValues={field.value}
                    onChange={field.onChange}
                    searchValue={categoriesSearch}
                    onSearchChange={setCategoriesSearch}
                    searchPlaceholder={shared.lookupSearchPlaceholder}
                    selectAllLabel={shared.selectAll}
                    deselectAllLabel={shared.deselectAll}
                    selectedCountLabel={text.fields.categories}
                    emptyLabel={shared.lookupEmptyMessage}
                    isLoading={categoriesQuery.isLoading}
                    isError={categoriesQuery.isError}
                    onRetry={categoriesQuery.refetch}
                    columns={columnsForm.threeColumns}
                  />
                )}
              />
            </Box>
          </SimpleGrid>
        </Form>

        {/* 2 downloads diretos — bloqueados até `account_uuid`+período
            preenchidos (`hasRequiredFilled`). `useState` local, NUNCA
            `useMutation` para binário. Sem prévia/resultado em tela — mirror
            `CustoTotalReproducao`/`RomaneioVendasContrato` (correção
            pós-entrega 2026-09-09, prévia removida por não existir no
            legado). */}
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            variant="outline"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isDownloadingPdf}
            disabled={!hasRequiredFilled || isDownloadingPdf || isDownloadingExcel}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isDownloadingExcel}
            disabled={!hasRequiredFilled || isDownloadingPdf || isDownloadingExcel}
          />
        </Flex>

        {!hasRequiredFilled && (
          <Text fontSize="sm" color="fg.muted">
            {text.emptyBeforeFilter}
          </Text>
        )}
      </VStack>
    </FormContainer>
  );
}
