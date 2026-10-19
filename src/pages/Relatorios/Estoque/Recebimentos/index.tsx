// src/pages/Relatorios/Estoque/Recebimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Recebimentos — Relatório" (F-305, TASK-RCB-FE-01, esteira 074). Rota
// `/relatorios/estoque/recebimentos`, materializa o item de menu FILHO
// `rel-est-recebimentos`, sob o grupo/submenu `rel-est` ("Estoque",
// `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Estoque/CustoProducaoBatida/index.tsx`
// (mesmo grupo de menu `rel-est`, casca `FormContainer`+footer, submit
// externo via `handleSubmit`) combinado com o dispatch PDF/Excel por `type`
// de `Fiscal/Dfe/DfeReport.tsx` (`useMutation`, `onSuccess(blob, variables)`
// decide `URL.createObjectURL`+`window.open('_blank')` para PDF vs
// `downloadBlob` para Excel).
//
// 6 campos de filtro, ORDEM fiel ao legado (FM-01..FM-06, contrato de tela
// §5): Produto (AJAX), Centro de Custo (estático fetch-once, CLM-16 — SEM
// busca remota, fiel ao legado), Categoria (AJAX), Data Início, Data Fim,
// Tipo (`pdf`/`excel`, enum string — decisão de interface já tomada na API,
// contrato API §7.3, NÃO o índice numérico `0/1` do precedente `DfeReport`).
//
// Services 100% REUSADOS — nenhum lookup novo (contrato front §4/§1):
// `listProductOptions`, `listCostCenterOptions`, `listFinancialCategoryOptions`.
//
// Resposta é SEMPRE `responseType:'blob'`, inclusive erro 422 — tratado via
// `parseBlobError` (NUNCA `extractApiErrorMessage`, que não sabe ler `Blob`).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { receiptsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/receipts-report-filter-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  downloadReceiptsReport,
  type ReceiptsReportParams,
} from '@/services/v2/Relatorios/receipts-report-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';
import type { ProductOption } from '@/@types/v2/Products';

interface RecebimentosReportFormValues {
  product: Option<string> | null;
  center: Option<string> | null;
  category: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  type: Option<'pdf' | 'excel'>;
}

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `CustoProducaoBatida/index.tsx`/`JurosPagos/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapProductOption(item: ProductOption) {
  return { label: item.description, value: item.uuid };
}

function mapCategoryOption(item: FinancialCategoryOption) {
  return { label: item.description, value: item.uuid };
}

export default function RecebimentosRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.receiptsReport.report;

  const reportTypeOptions: Option<'pdf' | 'excel'>[] = [
    { label: text.reportTypeOptions.pdf, value: 'pdf' },
    { label: text.reportTypeOptions.excel, value: 'excel' },
  ];

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<RecebimentosReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: receiptsReportFilterSchemaResolver(languageGB),
    defaultValues: {
      product: null,
      center: null,
      category: null,
      start_date: null,
      end_date: null,
      type: reportTypeOptions[0],
    },
  });

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // "Centro de Custo" (CLM-16, fiel ao legado) — lista ESTÁTICA fetch-once,
  // SEM busca remota. `Select` + `useQuery` único, NÃO `SelectAsyncPaginate`
  // (mirror `JurosPagos` campo "Fazenda", contrato front §1/§3).
  const costCentersQuery = useQuery({
    queryKey: ['receipts-report', 'cost-centers'],
    queryFn: () =>
      listCostCenterOptions({ only_analytic: true, is_enabled: 'true', per_page: 100 }),
  });
  const centerOptions: Option<string>[] = (costCentersQuery.data?.data.items ?? []).map(
    (item: CostCenterRef) => ({ label: item.description, value: item.uuid })
  );

  const reportMutation = useMutation({
    mutationFn: (params: ReceiptsReportParams) => downloadReceiptsReport(params),
    onSuccess: (blob, variables) => {
      if (variables.type === 'pdf') {
        // PDF abre INLINE em nova aba — NUNCA `downloadBlob`, que forçaria
        // download e quebraria a fidelidade `inline` do legado.
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'relatorio-recebimentos.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `CustoProducaoBatida/index.tsx`/`JurosPagos/index.tsx`).
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

  function buildParams(data: RecebimentosReportFormValues): ReceiptsReportParams {
    return {
      product_uuid: data.product?.value || undefined,
      center_uuid: data.center?.value || undefined,
      category_uuid: data.category?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      type: data.type.value,
    };
  }

  function onSubmit(data: RecebimentosReportFormValues) {
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
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={!isValid || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="product"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  placeholder={text.productPlaceholder}
                  service={listProductOptions}
                  mapOptions={mapProductOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  isReadOnly={isGenerating}
                />
              )}
            />

            <Controller
              name="center"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.center}
                  placeholder={text.centerPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option ?? null)}
                  options={centerOptions}
                  loading={costCentersQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.category}
                  placeholder={text.categoryPlaceholder}
                  service={listFinancialCategoryOptions}
                  mapOptions={mapCategoryOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                  isReadOnly={isGenerating}
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                    disabled={isGenerating}
                  />
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                    disabled={isGenerating}
                  />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.reportType}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={reportTypeOptions}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
          </SimpleGrid>

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.periodRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
