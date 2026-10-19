// src/pages/Administrativo/SaldoEstoque/SaldoEstoqueRelatorio.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO/EXPORT (somente leitura) de SALDO DE ESTOQUE (Stock,
// TASK-STK-FE-03) — mesmos filtros da Listagem (`search`/`product_uuid`/
// `warehouse_uuid`, `StockFilterForm`) e 2 exports SEMPRE habilitados
// (fiel ao legado — sem filtro preenchido, exporta TODOS os saldos da
// fazenda): "Gerar PDF" (`GET /stocks/report`) e "Exportar XLSX"
// (`GET /stocks/export`). Rota `/administrativo/saldo-estoque/relatorio`,
// guardada por `stocks_view`.
//
// Prévia REMOVIDA (decisão do dono) — o botão "Gerar prévia" (`GET /stocks`)
// causava crash de runtime ("reading '0'") e não era pré-requisito dos
// exports; a tela ficou só com filtros + os 2 botões de export.
//
// Filtro: os 3 campos (`search`, `product_uuid`, `warehouse_uuid`) são o
// mesmo JSX de `FilterSideSaldoEstoque.tsx` (TASK-STK-FE-01) — cópia direta
// autorizada pela própria Tarefa (duplicação de só 3 campos), NUNCA
// redefinição de tipos (`StockFilterForm`/`ExportStocksParams` importados de
// `@types/v2/Stocks`/`stock-service.ts`). O componente de origem é um
// `<FilterSide>` (drawer lateral, `Form.BodyFilter` fixo em 1 coluna, altura
// capada) — não serve à composição de página cheia desta tela; os campos
// são recompostos aqui dentro de `<Form>` (sem `formFilter`) +
// `SimpleGrid columns={columnsForm.threeColumns}`, mesmo padrão de
// `CreateOrUpdateProduto.tsx` para formulário de página cheia.
//
// Export — PRIMEIRO download de PDF do projeto (`Stock-contrato.md ## 5.2`
// da ficha, `DA-STK-07`) — mesmo padrão de blob já usado por XLSX
// (`downloadBlob` + `responseType: 'blob'`, `src/utils/downloadBlob.ts`,
// molde `EstoqueInicial/HeaderTable.tsx::handleExport`), só muda o
// `filename`/serviço consumido.
//
// Os 2 exports usam os FILTROS AO VIVO do formulário (`getValues()`) —
// exportar nunca depende de um estado "aplicado"; reflete o que está
// preenchido no formulário no momento do clique (vazio = exporta tudo).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { exportStocks, exportStocksReport } from '@/services/v2/Stocks/stock-service';
import type { ExportStocksParams } from '@/services/v2/Stocks/stock-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { Option } from '@/@types/option';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

// Forma INTERNA do form — os 2 Selects trabalham com `Option`, o submit
// converte para `ExportStocksParams` (strings cruas), mesmo padrão de
// `FilterSideSaldoEstoque.tsx`.
interface ReportFilterFormValues {
  search: string;
  product_uuid: Option<string> | null;
  warehouse_uuid: Option<string> | null;
}

const pristineFilterValues: ReportFilterFormValues = {
  search: '',
  product_uuid: null,
  warehouse_uuid: null,
};

function toExportParams(data: ReportFilterFormValues): ExportStocksParams {
  return {
    search: data.search?.trim() || undefined,
    product_uuid: data.product_uuid?.value || undefined,
    warehouse_uuid: data.warehouse_uuid?.value || undefined,
  };
}

export default function SaldoEstoqueRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.stocks.stock;

  const { control, register, getValues } = useForm<ReportFilterFormValues>({
    defaultValues: pristineFilterValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      const blob = await exportStocksReport(toExportParams(getValues()));
      downloadBlob(blob, 'saldo-estoque.pdf');
    } catch {
      toaster.error({
        title: text.report.exportPdfError.title,
        description: text.report.exportPdfError.description,
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx() {
    setIsExportingXlsx(true);
    try {
      const blob = await exportStocks(toExportParams(getValues()));
      downloadBlob(blob, 'saldo-estoque.xlsx');
    } catch {
      toaster.error({
        title: text.report.exportXlsxError.title,
        description: text.report.exportXlsxError.description,
      });
    } finally {
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer title={text.report.title} subtitle={text.report.subtitle}>
      {/* ---- Gutter do card — `FormContainer` (fora do escopo editável desta
          Tarefa) não aplica padding no corpo fora do modo `footer`; `PAD = 5`
          replica o mesmo token já usado no header/footer do próprio
          `FormContainer`, evitando labels/campos colados na borda ---- */}
      <Box px={5} py={5}>
        <VStack align="stretch" gap={6}>
          {/* ---- Filtro — mesmos campos/tipos de FilterSideSaldoEstoque.tsx,
              recompostos em `SimpleGrid` larga (a página não é um drawer —
              `Form.BodyFilter` fixa grid de 1 coluna com altura capada,
              pensada para o `<FilterSide>`; mesmo padrão de composição de
              `CreateOrUpdateProduto.tsx`: `<Form>` (sem `formFilter`) +
              `SimpleGrid columns={columnsForm.*}` para formulário de página
              cheia). Sem submit próprio — os exports leem `getValues()` ao
              vivo, não um estado "aplicado" pelo form ---- */}
          <Form onSubmit={(event) => event.preventDefault()} noPadding>
            <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
              <Input
                label={text.filter.search}
                placeholder={text.filter.searchPlaceholder}
                {...register('search')}
              />

              <Controller
                name="product_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filter.product}
                    placeholder={text.filter.productPlaceholder}
                    service={listProductOptions}
                    mapOptions={(item: ProductOptionItem) => ({
                      label: `${item.code} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="warehouse_uuid"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filter.warehouse}
                    placeholder={text.filter.warehousePlaceholder}
                    service={listWarehouseOptions}
                    mapOptions={(item: WarehouseOption) => ({
                      label: `${item.initials} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </SimpleGrid>

            <Flex justify="flex-end" gap={3} mt={4}>
              <Button
                title={text.report.exportPdf}
                icon={Download as any}
                type="button"
                variant="secondary"
                disabled={isExportingPdf || isExportingXlsx}
                loading={isExportingPdf}
                onClick={handleExportPdf}
              />
              <Button
                title={text.report.exportXlsx}
                icon={FileSpreadsheet as any}
                type="button"
                variant="secondary"
                disabled={isExportingPdf || isExportingXlsx}
                loading={isExportingXlsx}
                onClick={handleExportXlsx}
              />
            </Flex>
          </Form>
        </VStack>
      </Box>
    </FormContainer>
  );
}
