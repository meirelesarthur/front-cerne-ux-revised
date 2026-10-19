// src/pages/Relatorios/Estoque/StockConsolidatedReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Estoque Consolidado — Relatório" (F-323, feature_id e70b8cad, esteira
// 97-Esteiras/079, F-323-plano-frontend.md). Rota
// `/relatorios/estoque/estoque-consolidado`, materializa o item de menu
// FILHO `rel-est-consolidado`, sob o grupo/submenu `rel-est` ("Estoque",
// `navigationTree.ts`) — 9º filho, após `rel-est-requisicao-saida`.
//
// Mirror ESTRUTURAL DUPLO (plano front §0):
//   - `Relatorios/Estoque/StockAbcReport/index.tsx` — MESMA casca
//     `FormContainer` + footer + `<Form onSubmit={preventDefault}>` +
//     `SimpleGrid columns={columnsForm.default}`, 1 endpoint único decidido
//     por `report_type`, `Select` de formato com default `'pdf'`
//     `noClearable`, download síncrono por blob via `useState` local
//     `isDownloading` (NUNCA `useMutation` para binário).
//   - `Relatorios/Estoque/MovimentacaoEstoque/index.tsx` — `warehouses`
//     multi farm-scoped (`cacheUniqs=[activeFarmUuid]`, reset no
//     `useEffect([activeFarmUuid])`), `product` tenant-wide (SEM reset por
//     fazenda), `parseBlobError`/`notifyDownloadError` para 422 em blob.
//   - `CadastrosBase/Produtos/Catalogo/ProductFormFields.tsx` — cascata
//     `group→category→kind` completa (`SelectAsyncPaginate` +
//     `cacheUniqs`/`findParams` reagindo ao pai + reset dos filhos no
//     `onChange`). Os 3 services JÁ EXISTEM — nenhum service novo de lookup.
//
// 8 campos de filtro (ordem do plano front §5): warehouses (OBRIGATÓRIO) →
// group → category → kind → search → product → date → format (default
// 'pdf'). SEM grid/listagem — o front nunca calcula saldo, só monta o filtro
// e baixa o arquivo binário (PDF ou Excel pelo MESMO endpoint).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { stockConsolidatedReportFormatOptions } from '@/constants/Relatorios/stock-consolidated-report/options/stock-consolidated-report-format-options';

import { stockConsolidatedReportFilterSchemaResolver } from '@/validations/schemas/StockConsolidatedReport/stock-consolidated-report-filter-schema';

import { listCategoryProductOptions } from '@/services/v2/CategoryProducts/category-product-service';
import { listKindOptions } from '@/services/v2/Kinds/kind-service';
import { listProductGroupOptions } from '@/services/v2/ProductGroups/product-group-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { downloadStockConsolidatedReport } from '@/services/v2/StockConsolidatedReport/stock-consolidated-report-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { CategoryProductOption } from '@/@types/v2/CategoryProducts';
import type { KindOption } from '@/@types/v2/Kinds';
import type { ProductGroupOption } from '@/@types/v2/ProductGroups/product-group';
import type { ProductOption } from '@/@types/v2/Products';
import type {
  StockConsolidatedReportFilterForm,
  StockConsolidatedReportParams,
} from '@/@types/v2/StockConsolidatedReport';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

function mapWarehouseOption(item: WarehouseOption) {
  return { label: item.description, value: item.uuid };
}

function mapProductGroupOption(item: ProductGroupOption) {
  return { label: item.label, value: item.uuid };
}

function mapCategoryProductOption(item: CategoryProductOption) {
  return { label: item.label, value: item.uuid };
}

function mapKindOption(item: KindOption) {
  return { label: item.label, value: item.uuid };
}

function mapProductOption(item: ProductOption) {
  return { label: item.description, value: item.uuid };
}

export default function StockConsolidatedReportRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.stockConsolidatedReport.report;

  const buildPristineValues = (): StockConsolidatedReportFilterForm => ({
    warehouses: [],
    group: null,
    category: null,
    kind: null,
    search: null,
    product: null,
    date: null,
    format: stockConsolidatedReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch, setValue, register } =
    useForm<StockConsolidatedReportFilterForm>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: stockConsolidatedReportFilterSchemaResolver(languageGB),
      defaultValues: buildPristineValues(),
    });

  const [isDownloading, setIsDownloading] = useState(false);

  const warehousesValue = watch('warehouses');
  const groupValue = watch('group');
  const categoryValue = watch('category');

  // Reset por fazenda ativa (mirror `MovimentacaoEstoque::warehouse`) —
  // `warehouses` é farm-scoped; `product`/`group`/`category`/`kind` são
  // catálogos tenant-wide/globais e NÃO resetam (contrato front §5).
  useEffect(() => {
    setValue('warehouses', []);
  }, [activeFarmUuid, setValue]);

  function buildParams(data: StockConsolidatedReportFilterForm): StockConsolidatedReportParams {
    return {
      warehouse_uuids: data.warehouses.map((option) => option.value),
      group_uuid: data.group?.value || undefined,
      category_uuid: data.category?.value || undefined,
      kind_uuid: data.kind?.value || undefined,
      search: data.search || undefined,
      product_uuid: data.product?.value || undefined,
      date: data.date || undefined,
      report_type: data.format!.value,
    };
  }

  async function handleDownload(data: StockConsolidatedReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadStockConsolidatedReport(params);
      const extension = params.report_type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `estoque-consolidado.${extension}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `StockAbcReport`/`MovimentacaoEstoque`).
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
            title={text.downloadButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={!warehousesValue?.length || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="warehouses"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.warehouses}
                  placeholder={text.placeholders.warehouses}
                  isMulti
                  closeMenuOnSelect={false}
                  isRequired
                  cacheUniqs={[activeFarmUuid]}
                  service={listWarehouseOptions}
                  mapOptions={mapWarehouseOption}
                  value={field.value ?? []}
                  onChange={(options: any) => field.onChange(options ?? [])}
                />
              )}
            />

            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.group}
                  placeholder={text.placeholders.group}
                  service={listProductGroupOptions}
                  mapOptions={mapProductGroupOption}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    setValue('category', null, { shouldDirty: true });
                    setValue('kind', null, { shouldDirty: true });
                  }}
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
                  placeholder={
                    groupValue ? text.placeholders.category : text.placeholders.categoryDisabledHint
                  }
                  isDisabled={!groupValue}
                  service={listCategoryProductOptions}
                  mapOptions={mapCategoryProductOption}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    group_uuid: groupValue?.value,
                  })}
                  cacheUniqs={[groupValue?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => {
                    field.onChange(option ?? null);
                    setValue('kind', null, { shouldDirty: true });
                  }}
                />
              )}
            />

            <Controller
              name="kind"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.kind}
                  placeholder={
                    categoryValue ? text.placeholders.kind : text.placeholders.kindDisabledHint
                  }
                  isDisabled={!categoryValue}
                  service={listKindOptions}
                  mapOptions={mapKindOption}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    category_uuid: categoryValue?.value,
                  })}
                  cacheUniqs={[categoryValue?.value]}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Input label={text.fields.search} {...register('search')} />

            <Controller
              name="product"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  placeholder={text.placeholders.product}
                  service={listProductOptions}
                  mapOptions={mapProductOption}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.date}
              </Text>
              <Controller
                name="date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={stockConsolidatedReportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {!warehousesValue?.length && (
            <Text fontSize="sm" color="fg.muted">
              {text.warehousesRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
