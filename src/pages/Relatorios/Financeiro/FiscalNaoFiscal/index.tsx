// src/pages/Relatorios/Financeiro/FiscalNaoFiscal/index.tsx
// -----------------------------------------------------------------------------
// Tela "Fiscal/Não Fiscal — Relatório" (F-266, lote 076,
// `FiscalDifferenceReport-contrato.md` §4/§5). Rota
// `/relatorios/financeiro/fiscal-nao-fiscal`, materializa o item de menu
// FILHO `rel-fin-fiscal-nao-fiscal`, sob o grupo/submenu `rel-fin`
// ("Financeiro", `navigationTree.ts`).
//
// Mirror ESTRUTURAL EXATO de `Relatorios/Financeiro/FluxoCaixaMensal/index.tsx`
// (casca `FormContainer` + footer, `Form` cru + `SimpleGrid`, `accounts[]`
// via `CheckboxListField` remoto sobre `listAccounts`, `proprietary`/
// `center_id` via `Select`/`SelectAsyncPaginate`, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError` — prioriza
// a mensagem específica de `errors` por campo sobre o `message` genérico)
// MAIS `categories[]` via `CheckboxListField` remoto (mirror `ContasAPagar`)
// MAIS 2 botões "Baixar PDF"/"Baixar Excel" independentes (mirror
// `Relatorios/Pecuaria/CusteioAnimal/index.tsx` — loading POR BOTÃO,
// `format` decidido pelo botão clicado, NÃO um campo `format` do form).
//
// `proprietary` (SEM `_id` no nome, divergente dos irmãos `proprietary_id` —
// confirmado por leitura direta de `FiscalDifferenceReportRequest::rules()`
// antes de escrever esta tela).
//
// `is_fiscal`/`condition` são `Select` `noClearable` com default de UI
// sempre selecionado ("Ambos"/"Sem Categoria") — `buildParams` converte
// `is_fiscal==='ambos'` para `undefined` no payload real (C-09 do contrato,
// ausência = Ambos no servidor).
//
// Sem grid/tabela de prévia — só o form de parâmetros + 2 botões (o binário
// é gerado 100% no servidor, `responseType:'blob'` obrigatório).
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

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { fiscalDifferenceReportConditionOptions } from '@/constants/Relatorios/fiscal-difference-report/options/condition-options';
import { fiscalDifferenceReportIsFiscalOptions } from '@/constants/Relatorios/fiscal-difference-report/options/is-fiscal-options';

import { fiscalDifferenceReportFilterSchemaResolver } from '@/validations/schemas/FiscalDifferenceReport/fiscal-difference-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  downloadFiscalDifferenceReportPdf,
  downloadFiscalDifferenceReportXlsx,
} from '@/services/v2/FiscalDifferenceReport/fiscal-difference-report-service';

import type { LanguageDate } from '@/@types/language';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  FiscalDifferenceReportFilterForm,
  FiscalDifferenceReportParams,
} from '@/@types/v2/FiscalDifferenceReport';

function buildPristineValues(languageGB: LanguageDate): FiscalDifferenceReportFilterForm {
  return {
    accounts: [],
    proprietary: null,
    start_date: null,
    end_date: null,
    center_id: null,
    categories: [],
    is_fiscal: fiscalDifferenceReportIsFiscalOptions.getOption('ambos', languageGB),
    condition: fiscalDifferenceReportConditionOptions.getOption('S', languageGB),
  };
}

export default function FiscalNaoFiscalRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.fiscalDifferenceReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FiscalDifferenceReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: fiscalDifferenceReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // ---- Contas (CheckboxListField remoto — `listAccounts`, mirror
  // `FluxoCaixaMensal`) — tenant inteiro, sem cascata por fazenda ativa. ----
  const [accountsSearch, setAccountsSearch] = useState('');
  const accountsQuery = useOptionsChecklistQuery({
    asyncFunction: listAccounts,
    queryKey: queryKey.cadastrosBase.accounts,
    search: accountsSearch,
    mapItem: (item: AccountListItem) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    extraParams: { is_enabled: 'true' },
  });

  // ---- Categorias (CheckboxListField remoto — só analíticas habilitadas,
  // `class: 2`, mirror contrato §2/`ContasAPagar`). Sem `type_id` — o
  // relatório cobre movimentações de Entrada E Saída, diferente de
  // `ContasAPagar` (só Saídas). ----------------------------------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { class: 2, is_enabled: 'true' },
  });

  // ---- Proprietário (Select estático, lookup SEM paginação, mirror
  // `ContasAPagar`/`FluxoCaixaMensal`) ----------------------------------------
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });

  const isFiscalSelectOptions = fiscalDifferenceReportIsFiscalOptions.options(languageGB);
  const conditionSelectOptions = fiscalDifferenceReportConditionOptions.options(languageGB);

  function buildParams(data: FiscalDifferenceReportFilterForm): FiscalDifferenceReportParams {
    return {
      accounts: data.accounts.length > 0 ? data.accounts : undefined,
      proprietary: data.proprietary?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      // `'ambos'` é valor SÓ DE UI — vira `undefined` no payload real (C-09
      // do contrato, ausência = Ambos no servidor).
      is_fiscal: data.is_fiscal?.value === 'ambos' ? undefined : data.is_fiscal?.value,
      condition: data.condition!.value as 'S' | 'C',
    };
  }

  async function handleExportPdf(data: FiscalDifferenceReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadFiscalDifferenceReportPdf(buildParams(data));
      downloadBlob(blob, 'fiscal-nao-fiscal.pdf');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `FluxoCaixaMensal`/`CusteioAnimal`).
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
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: FiscalDifferenceReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadFiscalDifferenceReportXlsx(buildParams(data));
      downloadBlob(blob, 'fiscal-nao-fiscal.xlsx');
      toaster.success({ title: text.pageTitle, description: text.successToast });
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
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.exportPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="proprietary"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
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

            {/* Centro de Custo — aceita centro GLOBAL (tenant nulo) OU do
                tenant (o backend resolve os dois universos em
                `/cost-centers/options`, mirror `ContasAPagar`/
                `FluxoCaixaMensal`). */}
            <Controller
              name="center_id"
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
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="is_fiscal"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.isFiscal}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={isFiscalSelectOptions}
                  noClearable
                  error={errors.is_fiscal?.message}
                />
              )}
            />

            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.condition}
                  name={field.name}
                  isRequired
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={conditionSelectOptions}
                  noClearable
                  error={errors.condition?.message}
                />
              )}
            />
          </SimpleGrid>

          {/* Contas — `CheckboxListField` REMOTO (`useOptionsChecklistQuery`
              sobre `listAccounts`, busca server-side, mirror
              `FluxoCaixaMensal`). */}
          <Box>
            <Controller
              name="accounts"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.accounts}
                  items={accountsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={accountsSearch}
                  onSearchChange={setAccountsSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.accounts}
                  emptyLabel={text.lookupEmptyMessage}
                  isLoading={accountsQuery.isLoading}
                  isError={accountsQuery.isError}
                  onRetry={accountsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias Financeiras — `CheckboxListField` REMOTO, só
              analíticas habilitadas (`class: 2`, mirror `ContasAPagar`, sem
              `type_id` — cobre Entrada E Saída). */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.categories}
                  items={categoriesQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.categories}
                  emptyLabel={text.lookupEmptyMessage}
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  onRetry={categoriesQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
