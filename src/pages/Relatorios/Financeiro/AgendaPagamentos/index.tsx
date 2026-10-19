// src/pages/Relatorios/Financeiro/AgendaPagamentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Agenda/Pagamentos — Relatório" (F-294, CONTRATO-F294-agenda-
// pagamentos.md, esteira 97-Esteiras/059). Rota-alvo
// `/relatorios/financeiro/agenda-pagamentos` (BLOCO DE FIAÇÃO, ver relatório
// de entrega), materializaria o item de menu FILHO `rel-fin-agenda-
// pagamentos`, sob o grupo/submenu `rel-fin` ("Financeiro", `navigationTree.
// ts`) — permissão `payment-schedule_view` JÁ está no `anyOf` do pai
// `rel-fin` (`navigationPermissions.ts:1255`/`permissionsCatalog.json:704`).
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/AgendaRecebimentos/index.tsx`
// (F-304, sibling mais próximo: casca `FormContainer`+footer, submit externo
// via `handleSubmit`, `useMutation` + `onSuccess(blob, variables)` decide
// `URL.createObjectURL`+`window.open('_blank')` para PDF (mirror
// `PaymentScheduleReportController::__invoke()` → `GbCerneSnappyReport::
// inline()`) vs `downloadBlob` para Excel (`GbCerneReportExcel::download()`).
//
// Divergências adjudicadas (CONTRATO §"Contrato legado — síntese", NÃO
// inventar):
//   1. SEM campo `clients` — `PaymentScheduleReportFilterData` não tem
//      filtro de fornecedor/cliente algum (diferente de AgendaRecebimentos,
//      que filtra por `clients`).
//   2. Campo `number` (texto livre, `ILIKE` no backend) — filtro pelo nº do
//      título, ausente no irmão de recebimentos.
//   3. Campo `status` ESCALAR (`Select` único, `paymentScheduleReportStatusOptions`
//      — A vencer/Vencido/Parcial/Quitado, mirror `PaymentScheduleReportStatusEnum`)
//      — DIVERGÊNCIA registrada no contrato/`PaymentScheduleReportFilterData`
//      (NÃO `status[]` do consolidado F-214, universo de valores diferente).
//   4. Categorias financeiras aproximam `type_id != 2` (backend) via
//      `type_id: 1` (Saídas) + `class: 2` — mesma convenção JÁ usada por
//      `ContasAPagar/index.tsx` (categorias de despesa). O serviço
//      compartilhado `listFinancialCategoryOptions` não expõe um filtro de
//      EXCLUSÃO (`type_id_not`), só igualdade/`type_ids[]` — reproduzir a
//      regra exata do backend (qualquer tipo exceto Entradas) exigiria
//      estender esse service compartilhado, fora do escopo desta entrega
//      (paths exclusivos, modo paralelo). Registrado como divergência —
//      Gap candidato se categorias `type_id=3` ("Ambas", se existir)
//      precisarem aparecer no dropdown.
//   5. Proprietário/Centro de Custo restritos à FAZENDA ATIVA (`scope:
//      'farm'`/`farm_uuid: activeFarmUuid`), Farm/Categorias = TENANT
//      INTEIRO — mirror EXATO da divergência preservada no contrato
//      ("dropdowns farm/categories = tenant inteiro; proprietary/center =
//      só fazenda ativa").
//
// SEM seletor de colunas — as 11 colunas + 2 consolidados do relatório são
// FIXOS e renderizados 100% no servidor (mesmo padrão de AgendaRecebimentos).
//
// Resposta é SEMPRE `responseType:'blob'`, inclusive erro 422 — tratado via
// `parseBlobError` (NUNCA `extractApiErrorMessage`, que não sabe ler `Blob`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Input } from '@/components/Form/Input';
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
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import {
  paymentScheduleReportStatusOptions,
  type PaymentScheduleReportStatus,
} from '@/constants/Relatorios/payment-schedule-report/options/status-options';

import { paymentScheduleReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/payment-schedule-report-filter-schema';

import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import {
  downloadPaymentScheduleReport,
  type PaymentScheduleReportParams,
} from '@/services/v2/Relatorios/payment-schedule-report-service';

import type { Option } from '@/@types/option';
import type { LanguageDate } from '@/@types/language';
import type { ReportFormat } from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

interface AgendaPagamentosFormValues {
  number: string | null;
  farm: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  proprietary_id: Option<string> | null;
  status: Option<PaymentScheduleReportStatus> | null;
  center_id: Option<string> | null;
  categories: string[];
  format: Option<ReportFormat> | null;
}

function buildPristineValues(languageGB: LanguageDate): AgendaPagamentosFormValues {
  return {
    number: null,
    farm: null,
    start_date: null,
    end_date: null,
    proprietary_id: null,
    status: null,
    center_id: null,
    categories: [],
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function AgendaPagamentosRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.paymentScheduleReport.report;

  const { control, handleSubmit } = useForm<AgendaPagamentosFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: paymentScheduleReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  // ---- Categorias Financeiras (CheckboxListField remoto). Aproxima o
  // `type_id != 2` do backend (`PaymentScheduleReportRequest`) via
  // `type_id: 1` (Saídas) + `class: 2` — mesma convenção de `ContasAPagar/
  // index.tsx` (divergência 4 do cabeçalho, registrada). ---------------------
  const [categoriesSearch, setCategoriesSearch] = useState('');
  const categoriesQuery = useOptionsChecklistQuery({
    asyncFunction: listFinancialCategoryOptions,
    queryKey: queryKey.financialCategories.list,
    search: categoriesSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    // ERRO-05 — decisão do dono: espelhar o legado incluindo categorias
    // "Ambas" (type 3), não só Saídas (type 1) — `type_ids[]` (whereIn),
    // não `type_id` escalar.
    extraParams: { type_ids: [1, 3], class: 2, is_enabled: 'true' },
  });

  // ---- Proprietário (Select estático, lookup SEM paginação, restrito à
  // FAZENDA ATIVA — `scope:'farm'`, mirror AgendaRecebimentos/divergência 5). --
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(undefined, 'farm'),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });

  // ---- Fazenda (Select estático, TENANT INTEIRO — mirror AgendaRecebimentos/
  // ContasAPagar, filtro OPCIONAL distinto da fazenda ativa do header
  // `X-Farm-Id`). ----------------------------------------------------------
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.list,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  const reportMutation = useMutation({
    mutationFn: (params: PaymentScheduleReportParams) => downloadPaymentScheduleReport(params),
    onSuccess: (blob, variables) => {
      if (variables.format === 'pdf') {
        // PDF abre INLINE em nova aba — mirror `GbCerneSnappyReport::inline()`
        // do backend, NUNCA `downloadBlob` (que forçaria download e quebraria
        // a fidelidade `inline`).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'agenda-de-pagamentos.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `AgendaRecebimentos/index.tsx`).
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
    },
  });

  const isGenerating = reportMutation.isPending;

  function buildParams(data: AgendaPagamentosFormValues): PaymentScheduleReportParams {
    return {
      number: data.number?.trim() || undefined,
      farm: data.farm?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      status: data.status?.value ?? undefined,
      center_id: data.center_id?.value || undefined,
      categories: data.categories.length > 0 ? data.categories : undefined,
      format: data.format!.value,
    };
  }

  function onSubmit(data: AgendaPagamentosFormValues) {
    reportMutation.mutate(buildParams(data));
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="number"
              control={control}
              render={({ field }) => (
                <Input
                  label={text.fields.number}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                  disabled={isGenerating}
                />
              )}
            />

            <Controller
              name="farm"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startDate}
              </Text>
              <Controller
                name="start_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endDate}
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
            </Box>

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={paymentScheduleReportStatusOptions.options(languageGB)}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.costCenter}
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
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
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
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
          </SimpleGrid>

          {/* Categorias Financeiras — CheckboxListField REMOTO, aproxima
              `type_id != 2` do backend (divergência 4 do cabeçalho). */}
          <Box>
            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.category}
                  items={categoriesQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={categoriesSearch}
                  onSearchChange={setCategoriesSearch}
                  searchPlaceholder={text.searchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.category}
                  emptyLabel={text.empty}
                  errorLabel={text.error}
                  retryLabel={text.retry}
                  isLoading={categoriesQuery.isLoading}
                  isError={categoriesQuery.isError}
                  onRetry={categoriesQuery.refetch}
                  columns={columnsForm.threeColumns}
                  isDisabled={isGenerating}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
