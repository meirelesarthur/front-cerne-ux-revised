// src/pages/Relatorios/Estoque/SaidasCentroCusto/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Estoque > Saídas x Centro Custo" (F-301, execução
// 97-Esteiras/078, TASK-F301-F03). Rota
// `/relatorios/estoque/saidas-centro-custo`, materializa o item de menu FILHO
// `rel-est-saidas-centro-custo`, filho do grupo `rel-est` ("Estoque",
// `navigationTree.ts`).
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/Consolidado/index.tsx` (casca
// `FormContainer` + footer, 2 botões PDF/Excel via `SimpleGrid`,
// `SelectAsyncPaginate` para lookups) e `Relatorios/Estoque/
// MovimentacaoEstoque/index.tsx` (2 ações de export independentes com
// `isExportingPdf`/`isExportingXlsx` separados, `SelectAsyncPaginate` de
// produto single). `DateInput` via `Controller` mirror
// `Relatorios/Suprimentos/Savings/index.tsx`.
//
// 5 campos de filtro fiéis ao legado (contrato §Filtro): `start_date`/
// `end_date` OBRIGATÓRIOS (LAC-01), `center`/`warehouse`/`product` opcionais.
// `center` usa `listCostCenterOptions({ only_analytic: true, is_enabled:
// 'true' })` — `class=2` do legado (centros-folha) mapeia para
// `only_analytic=true` no endpoint novo (FRONT-04). `report_type` NÃO é um
// campo do form — os 2 botões do footer fixam o literal `pdf`/`excel`
// (FRONT-07, decisão já resolvida: 2 botões, não um Select "Tipo de
// Relatório").
//
// Endpoint DELIVERED (evidência viva `routes/api.php:2255`, reconciliação
// obrigatória do plano): `GET /products-exit-cost-center` (raiz, NÃO
// `/reports/...`). Nome do arquivo Excel FIXO do legado:
// `relatorio_saida_prod_x_centro_custo.xlsx`.
//
// `center`/`warehouse` — `Select` (não `SelectAsyncPaginate`) alimentado por
// `useQuery` sobre os endpoints `-options` já existentes (farm-scoped via
// header `X-Farm-Id`, resetados na troca de fazenda ativa, FRONT-17).
// `product` — `SelectAsyncPaginate service={listProductOptions}` SINGLE
// (tenant-wide, `isMulti` ausente).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
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
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { productsExitCostCenterReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/products-exit-cost-center-report-filter-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  downloadProductsExitCostCenterExcel,
  downloadProductsExitCostCenterPdf,
  toProductsExitCostCenterReportParams,
} from '@/services/v2/Relatorios/products-exit-cost-center-report-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { ProductOption } from '@/@types/v2/Products';
import type { ProductsExitCostCenterReportFormValues } from '@/@types/v2/Relatorios/products-exit-cost-center';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

const pristineValues: ProductsExitCostCenterReportFormValues = {
  start_date: null,
  end_date: null,
  center: null,
  warehouse: null,
  product: null,
};

function mapCostCenterOption(item: CostCenterRef): Option<string> {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

function mapProductOption(item: ProductOption) {
  return { label: item.description, value: item.uuid };
}

export default function SaidasCentroCustoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.productsExitCostCenterReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductsExitCostCenterReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: productsExitCostCenterReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // `center` — lookup `-options` (farm-scoped via `X-Farm-Id`), FLAT o
  // suficiente para um `Select` simples (`only_analytic=true` = `class=2` do
  // legado, `is_enabled='true'` mirror `Consolidado`/`CentroCusto`).
  const costCenterQuery = useQuery({
    queryKey: [queryKey.relatorios.productsExitCostCenterReport, 'cost-centers', activeFarmUuid],
    queryFn: () => listCostCenterOptions({ only_analytic: true, is_enabled: 'true' }),
  });
  useQueryError([costCenterQuery]);
  const costCenterOptions: Option<string>[] = (costCenterQuery.data?.data.items ?? []).map(
    mapCostCenterOption
  );

  // `warehouse` — lookup `-options` (farm-scoped via `X-Farm-Id`, resposta
  // FLAT sem paginação real, mirror `warehouse-service.ts` comentário).
  const warehouseQuery = useQuery({
    queryKey: [queryKey.relatorios.productsExitCostCenterReport, 'warehouses', activeFarmUuid],
    queryFn: () => listWarehouseOptions({}),
  });
  useQueryError([warehouseQuery]);
  const warehouseOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    mapWarehouseOption
  );

  // Guardrail farm-scoped (FRONT-17) — `center`/`warehouse`/`product` são
  // resetados na troca de fazenda ativa (mirror
  // `filtro_farm_scoped_reset_na_troca_de_fazenda`): a seleção anterior
  // deixaria de existir no universo da nova fazenda e causaria 422/lista
  // estagnada.
  useEffect(() => {
    setValue('center', null, { shouldDirty: false });
    setValue('warehouse', null, { shouldDirty: false });
    setValue('product', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `Savings`/`MovimentacaoEstoque`).
  async function notifyDownloadError(error: unknown) {
    const parsed = await parseBlobError(error);
    const fieldMessage = parsed.errors
      ? Object.values(parsed.errors)
          .flat()
          .find((message): message is string => typeof message === 'string')
      : undefined;
    toaster.error({
      title: text.pageTitle,
      description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
    });
  }

  async function handleDownloadPdf(values: ProductsExitCostCenterReportFormValues) {
    const params = toProductsExitCostCenterReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadProductsExitCostCenterPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `Savings`/`HorasLogadas`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: ProductsExitCostCenterReportFormValues) {
    const params = toProductsExitCostCenterReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadProductsExitCostCenterExcel(params);
      downloadBlob(blob, `${text.exportFileName}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
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
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
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
              name="center"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.center}
                  placeholder={text.centerPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={costCenterOptions}
                  loading={costCenterQuery.isFetching}
                />
              )}
            />

            <Controller
              name="warehouse"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.warehouse}
                  placeholder={text.warehousePlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={warehouseOptions}
                  loading={warehouseQuery.isFetching}
                />
              )}
            />

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
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
