// src/pages/Relatorios/Estoque/RequisicaoSaida/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Estoque > Requisição/Saída" (F-312, execução
// 97-Esteiras/078, TASK-F312-F03). Rota
// `/relatorios/estoque/requisicao-saida`, materializa o item de menu FILHO
// `rel-est-requisicao-saida`, filho do grupo `rel-est` ("Estoque",
// `navigationTree.ts`).
//
// Mirror EXATO de `Relatorios/Estoque/SaidasCentroCusto/index.tsx` (F-301)
// MENOS o select `center` — 4 campos de filtro fiéis ao legado:
// `start_date`/`end_date` OBRIGATÓRIOS, `warehouse`/`product` opcionais.
// `report_type` NÃO é um campo do form — os 2 botões do footer fixam o
// literal `pdf`/`excel` (FRONT-06, decisão já resolvida: 2 botões).
//
// Endpoint DELIVERED (path FLAT, NÃO `/reports/...`):
// `GET /requisitions-report`. Nome do arquivo Excel FIXO do legado:
// `relatorio_requisicao_saida.xlsx`.
//
// `warehouse` — `Select` (não `SelectAsyncPaginate`) alimentado por
// `useQuery` sobre o endpoint `-options` já existente (farm-scoped via
// header `X-Farm-Id`, resetado na troca de fazenda ativa, FRONT-16).
// `product` — `SelectAsyncPaginate service={listProductOptions}` SINGLE
// (tenant-wide, `isMulti` ausente) — mesma assimetria FIEL ao legado.
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

import { requisitionsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/requisitions-report-filter-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  downloadRequisitionsReportExcel,
  downloadRequisitionsReportPdf,
  toRequisitionsReportParams,
} from '@/services/v2/Relatorios/requisitions-report-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { ProductOption } from '@/@types/v2/Products';
import type { RequisitionsReportFormValues } from '@/@types/v2/Relatorios/requisitions-report';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

const pristineValues: RequisitionsReportFormValues = {
  start_date: null,
  end_date: null,
  warehouse: null,
  product: null,
};

function mapWarehouseOption(item: WarehouseOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

function mapProductOption(item: ProductOption) {
  return { label: item.description, value: item.uuid };
}

export default function RequisicaoSaidaRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.requisitionsReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RequisitionsReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: requisitionsReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // `warehouse` — lookup `-options` (farm-scoped via `X-Farm-Id`, resposta
  // FLAT sem paginação real, mirror `warehouse-service.ts` comentário).
  const warehouseQuery = useQuery({
    queryKey: [queryKey.relatorios.requisitionsReport, 'warehouses', activeFarmUuid],
    queryFn: () => listWarehouseOptions({}),
  });
  useQueryError([warehouseQuery]);
  const warehouseOptions: Option<string>[] = (warehouseQuery.data?.data.items ?? []).map(
    mapWarehouseOption
  );

  // Guardrail farm-scoped (FRONT-16) — `warehouse`/`product` são resetados
  // na troca de fazenda ativa (mirror
  // `filtro_farm_scoped_reset_na_troca_de_fazenda`): a seleção anterior
  // deixaria de existir no universo da nova fazenda e causaria 422/lista
  // estagnada. `product` é tenant-scoped, mas o reset é feito mesmo assim
  // (assimetria não isenta o reset, FID-G3F FRONT-16).
  useEffect(() => {
    setValue('warehouse', null, { shouldDirty: false });
    setValue('product', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `SaidasCentroCusto`).
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

  async function handleDownloadPdf(values: RequisitionsReportFormValues) {
    const params = toRequisitionsReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadRequisitionsReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `SaidasCentroCusto`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: RequisitionsReportFormValues) {
    const params = toRequisitionsReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadRequisitionsReportExcel(params);
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
