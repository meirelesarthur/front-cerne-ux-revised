// src/pages/Relatorios/Estoque/MovimentacaoEstoque/index.tsx
// -----------------------------------------------------------------------------
// Tela "Movimentação de Estoque — Relatório" (F-1f1d23e3, TASK-MOV-FE-01,
// esteira 074). Rota `/relatorios/estoque/movimentacao-estoque`, materializa
// o item de menu FILHO `rel-est-mov-estoque`, sob o grupo/submenu `rel-est`
// ("Estoque", `navigationTree.ts`) — item 21 na `TASK-MOV-FE-02` seguinte.
//
// Mirror ESTRUTURAL DUPLO (contrato front §1):
//   - `Relatorios/Estoque/CustoProducaoBatida/index.tsx` — MESMO submenu
//     `rel-est`, mesma casca `FormContainer` + footer + `<Form
//     onSubmit={preventDefault}>` + `SimpleGrid columns={columnsForm.default}`.
//   - `Relatorios/Pecuaria/EvolucaoRebanho/index.tsx` — ÚNICO precedente vivo
//     com 2 botões de export DISTINTOS (`Download`/`FileSpreadsheet`),
//     `isExportingPdf`/`isExportingXlsx` em `useState` separados, `disabled`
//     cruzado entre os 2 enquanto qualquer um baixa. NUNCA um `Select` de
//     "Tipo de Relatório" — a API já decidiu (contrato API §2.4/§7.2) dividir
//     em 2 rotas REST, decisão fechada, sem gate no front.
//
// 5 campos de filtro fiéis ao legado: `warehouse` (ÚNICO obrigatório —
// diferente dos siblings `JurosPagos`/`ApuracaoCusto`/`EvolucaoRebanho`, que
// exigem o par de datas), `start_date`/`end_date` (opcionais, mirror do
// `nullable` do contrato API `PASSO 3`), `products[]` (multiselect opcional,
// tenant-wide). Botões habilitam/desabilitam por `!!warehouse`, não por
// `hasValidRange`.
//
// `warehouse`/`products` REUSAM services já existentes (`listWarehouseOptions`,
// `listProductOptions`) — NENHUM service novo de lookup (contrato front §1).
// `warehouse` é farm-scoped (via header `X-Farm-Id`, sem `farm_uuid` no
// payload) — `cacheUniqs={[activeFarmUuid]}` + `useEffect` limpando o valor
// selecionado na troca da fazenda ativa (mirror `ApuracaoCusto::cost_center_uuids`).
// `products` é tenant-wide — NÃO reseta por fazenda ativa (contrato front §5).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { stockMovementReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/stock-movement-report-filter-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  downloadStockMovementReportExcel,
  downloadStockMovementReportPdf,
  type StockMovementReportParams,
} from '@/services/v2/Relatorios/stock-movement-report-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

interface MovimentacaoEstoqueFilterForm {
  warehouse: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  products: Option<string>[] | null;
}

const pristineValues: MovimentacaoEstoqueFilterForm = {
  warehouse: null,
  start_date: null,
  end_date: null,
  products: null,
};

function mapWarehouseOption(item: WarehouseOption) {
  return { label: item.description, value: item.uuid };
}

function mapProductOption(item: ProductOption) {
  return { label: item.description, value: item.uuid };
}

export default function MovimentacaoEstoqueRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.stockMovementReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<MovimentacaoEstoqueFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: stockMovementReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const warehouseValue = watch('warehouse');

  // Reset por fazenda ativa (contrato front §5) — `warehouse` é farm-scoped
  // (via `listWarehouseOptions` sem `farm_uuid`, resolvido pelo header
  // `X-Farm-Id`); `products` é tenant-wide e NÃO reseta (mirror
  // `ApuracaoCusto::cost_center_uuids`).
  useEffect(() => {
    setValue('warehouse', null);
  }, [activeFarmUuid, setValue]);

  function buildParams(data: MovimentacaoEstoqueFilterForm): StockMovementReportParams {
    return {
      warehouse_uuid: data.warehouse!.value,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      product_uuids: data.products?.length
        ? data.products.map((option) => option.value)
        : undefined,
    };
  }

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO
  // `EvolucaoRebanho::parseDownloadError`/`extractErrorMessage`,
  // `ApuracaoCusto`/`CustoProducaoBatida::handleDownload`).
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

  async function handleDownloadPdf(data: MovimentacaoEstoqueFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadStockMovementReportPdf(buildParams(data));
      downloadBlob(blob, 'movimentacao-estoque.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(data: MovimentacaoEstoqueFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadStockMovementReportExcel(buildParams(data));
      downloadBlob(blob, 'movimentacao-estoque.xlsx');
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
            disabled={!warehouseValue || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={!warehouseValue || isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="warehouse"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.warehouse}
                  placeholder={text.warehousePlaceholder}
                  isRequired
                  cacheUniqs={[activeFarmUuid]}
                  service={listWarehouseOptions}
                  mapOptions={mapWarehouseOption}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
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
                  <DateInput value={value ?? null} onChange={onChange} />
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Controller
              name="products"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.products}
                  placeholder={text.productsPlaceholder}
                  isMulti
                  closeMenuOnSelect={false}
                  service={listProductOptions}
                  mapOptions={mapProductOption}
                  value={field.value ?? []}
                  onChange={(options: any) => field.onChange(options ?? [])}
                />
              )}
            />
          </SimpleGrid>

          {!warehouseValue && (
            <Text fontSize="sm" color="fg.muted">
              {text.warehouseRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
