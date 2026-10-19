// src/pages/Relatorios/Financeiro/MovimentoBancario/index.tsx
// -----------------------------------------------------------------------------
// Tela "Movimento Bancário — Relatório" (F-264, TASK-058-F264-FE-02, esteira
// 97-Esteiras/058). Rota `/relatorios/financeiro/movimento-bancario`,
// materializa o item de menu FILHO `rel-fin-movimento-bancario`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/ContasAPagar/index.tsx`
// (FormContainer + footer, sem grid/prévia, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError`, prioriza a
// mensagem específica de `errors` por campo sobre o `message` genérico) — SEM
// `columns`/`order` (colunas fixas no servidor, plano §"Leitura do dev") e SEM
// saldo inicial/final (contrato legado CL-09, PRESERVAR — resumo agregado de
// 6 métricas + linha "Total:" existem SÓ dentro do PDF gerado, nunca
// on-screen, CL-12).
//
// Campos (plano §2.2):
//   accounts     CheckboxListField REMOTO sobre `listAccounts` (`/accounts`,
//                tenant-scoped) — NUNCA `getAccountOptions` (esse endpoint só
//                devolve enums estáticos `{types,cnab_types}`, formato
//                incompatível com o lookup paginado do checklist).
//   proprietary  Select estático sobre `listProprietaryOptions(undefined,
//                'farm')` — escopo FAZENDA ATIVA (pivot `farm_proprietary`),
//                fidelidade ao legado (esteira 060, ROTEIRO-FILT-01, achado
//                C-P1-02).
//   types        CheckboxListField LOCAL/estático sobre a lista
//                REPORT-SCOPED `financialMovementReportTypeOptions`
//                (E/S/T/F/I, `constants/relatorios/financial-movement-report/
//                options/type-options.ts`) — ESTEIRA 060/ROTEIRO-FILT-02
//                (achado C-P1-03) corrigiu o GAP anterior (só 4 valores)
//                somando o 5º valor `I`/"Saldo Inicial" SEM mutar a lista
//                compartilhada `movementTypeCategoryOptions` (consumida por
//                `NewMovementModal`/`CreateOrUpdateMovimento`, onde Saldo
//                Inicial não pode virar selecionável). `type_category` (NÃO
//                `type`) continua a coluna filtrada no servidor (FID-01/CL-08).
//   center_id    SelectAsyncPaginate sobre `listCostCenterOptions` — escopado
//                pela fazenda ATIVA (`farm_uuid`) + só Analíticos
//                (`only_analytic`), mirror `FluxoCaixaMensal` (esteira 060,
//                ROTEIRO-FILT-03, achado C-P1-04).
//   categories   CheckboxListField REMOTO sobre `listFinancialCategoryOptions`
//                — só ANALÍTICAS (`class: 2`), fidelidade legado (esteira 060,
//                ROTEIRO-FILT-04, achado C-P1-05).
//   farm_id      Select estático sobre `listEnabledFarms()` — TENANT-SCOPED
//                (`GET /farms/current-tenant?only_enabled=true`), NUNCA
//                `getMyFarms` (regra dura do task-packet original) — esconde
//                fazenda desabilitada (esteira 060, ROTEIRO-FILT-05, achado
//                C-P1-06, função dedicada, ~15 outras telas inalteradas).
//   condition    Select noClearable, default 'S' (Sem Categoria).
//   start_date/end_date  DateInput, ambos OBRIGATÓRIOS (`end >= start`) —
//                CORRIGE a ausência de validação server-side do legado
//                (CL-18/FID-13).
//   format       Select noClearable, default 'pdf' — dispatch PDF×Excel no
//                MESMO endpoint (`format=pdf|xlsx`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField, type CheckboxListItem } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import {
  financialMovementConditionOptions,
  financialMovementReportFormatOptions,
  financialMovementReportTypeOptions,
} from '@/constants/Relatorios/financial-movement-report/options';

import { financialMovementReportFilterSchemaResolver } from '@/validations/schemas/FinancialMovementReport/financial-movement-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listEnabledFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { downloadFinancialMovementReport } from '@/services/v2/FinancialMovementReport/financial-movement-report-service';

import type { LanguageDate } from '@/@types/language';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type {
  FinancialMovementReportFilterForm,
  FinancialMovementReportParams,
} from '@/@types/v2/FinancialMovementReport';

function buildPristineValues(languageGB: LanguageDate): FinancialMovementReportFilterForm {
  return {
    accounts: [],
    proprietary: null,
    types: [],
    center_id: null,
    categories: [],
    farm_id: null,
    condition: financialMovementConditionOptions.getOption('S', languageGB),
    start_date: null,
    end_date: null,
    format: financialMovementReportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function MovimentoBancarioRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.financialMovementReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FinancialMovementReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: financialMovementReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Contas (CheckboxListField remoto — `listAccounts`, mirror
  // `ContasAPagar`/`CentroCusto`) — tenant inteiro, sem cascata por fazenda
  // ativa. ------------------------------------------------------------------
  const [accountsSearch, setAccountsSearch] = useState('');
  const accountsQuery = useOptionsChecklistQuery({
    asyncFunction: listAccounts,
    queryKey: queryKey.cadastrosBase.accounts,
    search: accountsSearch,
    mapItem: (item: AccountListItem) => ({
      value: item.uuid,
      label: `${item.bank} — ${item.agency}/${item.account}`,
    }),
    extraParams: { is_enabled: 'true' },
  });

  // ---- Categorias (CheckboxListField remoto — `listFinancialCategoryOptions`,
  // mirror `ContasAPagar`) — só ANALÍTICAS (`class: 2`, fidelidade legado,
  // ROTEIRO-FILT-04/achado C-P1-05) — SEM filtro de `type_id` (contrato de
  // tela não restringe por tipo, diferente de `ContasAPagar` que também
  // recorta `type_id`). -------------------------------------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { class: 2, is_enabled: 'true' },
  });

  // ---- Tipo de Movimento (CheckboxListField LOCAL/estático — lista
  // REPORT-SCOPED `financialMovementReportTypeOptions`, E/S/T/F/I,
  // ROTEIRO-FILT-02/achado C-P1-03 — NÃO reaproveita/edita a lista
  // compartilhada `movementTypeCategoryOptions`, consumida por
  // `NewMovementModal`/`CreateOrUpdateMovimento`). Busca client-side (lista
  // pequena, sem paginação). ------------------------------------------------
  const [typesSearch, setTypesSearch] = useState('');
  // Anotação explícita `CheckboxListItem<string>` — widen do domínio literal
  // `FinancialMovementReportTypeCode` para `string`, coerente com
  // `types: string[]` de `FinancialMovementReportFilterForm` (evita
  // inferência de generics estreita demais no `CheckboxListField`).
  const allTypeItems: CheckboxListItem<string>[] = financialMovementReportTypeOptions
    .options(languageGB)
    .map((option) => ({ value: option.value, label: option.label }));
  const typeItems = allTypeItems.filter((item) =>
    item.label.toLowerCase().includes(typesSearch.trim().toLowerCase())
  );

  // ---- Proprietário (Select estático, lookup SEM paginação, mirror
  // `FluxoCaixaMensal`) — escopo FAZENDA ATIVA (`scope='farm'`, pivot
  // `farm_proprietary`), fidelidade ao legado (ROTEIRO-FILT-01, esteira 060,
  // achado C-P1-02 — endpoint já validava/roteava `scope=farm`, só o front
  // pedia `tenant` por omissão). ---------------------------------------------
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(undefined, 'farm'),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });
  // ---- Fazenda (Select estático, lookup SEM paginação) — `listEnabledFarms()`
  // TENANT-SCOPED (`/farms/current-tenant?only_enabled=true`), NUNCA
  // `getMyFarms` (regra dura do task-packet original) — esconde fazenda
  // desabilitada (ROTEIRO-FILT-05, esteira 060, achado C-P1-06). Função
  // DEDICADA (não um parâmetro em `listFarms`, ver comentário em
  // `farm-service.ts`) — as ~15 outras telas que chamam `listFarms()`
  // continuam idênticas. `queryKey.farms.listEnabled` é uma chave DEDICADA
  // (NÃO `queryKey.farms.list`) para não colidir no cache do TanStack Query
  // com as telas que consomem o universo sem filtro. -------------------------
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listEnabledFarms,
    queryKey: queryKey.farms.listEnabled,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  // Onda K/FIX 2 — único gap desta tela: faltava `onInvalid` no `handleSubmit`
  // (o erro por campo + asteriscos das datas já existia). 100% data-driven —
  // a 1ª mensagem sai de `formState.errors` (schema Yup i18n), nunca string
  // literal (mirror `Adiantamento`/`CusteioModulo`).
  function onInvalid(formErrors: FieldErrors<FinancialMovementReportFilterForm>) {
    const firstMessage = Object.values(formErrors)
      .map((error) => error?.message)
      .find((message): message is string => typeof message === 'string');
    toaster.error({ title: text.pageTitle, description: firstMessage ?? text.downloadError });
  }

  function buildParams(data: FinancialMovementReportFilterForm): FinancialMovementReportParams {
    return {
      accounts: data.accounts.length > 0 ? data.accounts : undefined,
      proprietary: data.proprietary?.value || undefined,
      types: data.types.length > 0 ? data.types : undefined,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      farm_id: data.farm_id?.value || undefined,
      condition: data.condition?.value || undefined,
      start_date: data.start_date!,
      end_date: data.end_date!,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: FinancialMovementReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadFinancialMovementReport(buildParams(data));
      downloadBlob(blob, `movimento-bancario.${data.format!.value === 'xlsx' ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror `ContasAPagar`/
      // `CentroCusto`).
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

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload, onInvalid)}
            loading={isDownloading}
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
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

            {/* Centro de Custo — escopado pela fazenda ATIVA (`farm_uuid`,
                `useAuth().activeFarmUuid`) + só Analíticos (`only_analytic`),
                mirror `FluxoCaixaMensal` (ROTEIRO-FILT-03, esteira 060,
                achado C-P1-04). `cacheUniqs` invalida o cache ao trocar de
                fazenda ativa. */}
            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.centerId}
                  placeholder={text.centerIdPlaceholder}
                  cacheUniqs={[activeFarmUuid]}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                    only_analytic: true,
                    farm_uuid: activeFarmUuid ?? undefined,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  placeholder={text.farmPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
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
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={financialMovementConditionOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={financialMovementReportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Contas — CheckboxListField REMOTO (`useOptionsChecklistQuery`
              sobre `listAccounts`, busca server-side), mirror `ContasAPagar`/
              `CentroCusto`. */}
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

          {/* Tipo de Movimento — CheckboxListField LOCAL/estático (E/S/T/F/I,
              `financialMovementReportTypeOptions` report-scoped). */}
          <Box>
            <Controller
              name="types"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.types}
                  items={typeItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={typesSearch}
                  onSearchChange={setTypesSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.types}
                  emptyLabel={text.lookupEmptyMessage}
                  isLoading={false}
                  isError={false}
                  onRetry={() => {}}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Categorias — CheckboxListField REMOTO, mirror `ContasAPagar`. */}
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
