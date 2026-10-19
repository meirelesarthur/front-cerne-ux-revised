// src/pages/Administrativo/BaixaEstoque/BaixaEstoqueReport.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (somente leitura) de Baixa de Estoque — TASK-FE-3005.
// Rota `/administrativo/baixa-estoque/relatorio`, guardada por
// `<RequirePermission permission="stock_writeoffs_report">` (nome com
// underscore, distinto das demais permissões `stock-writeoffs_*` —
// contrato de tela §2.1).
//
// Molde ESTRUTURAL de `SaldoEstoqueRelatorio.tsx` (`FormContainer` +
// `<Form>` sem `formFilter` + `SimpleGrid` de filtros + submit) — mas
// DIVERGE no destino do PDF (contrato de tela §3.5/D6): `SaldoEstoqueRelatorio`
// FORÇA download (`downloadBlob`, `<a download>`); a Baixa abre o PDF
// INLINE em nova aba (`window.open(URL.createObjectURL(blob), '_blank')`,
// fiel ao legado `report-generated.blade.php`/`Content-Disposition: inline`
// do backend) — `URL.revokeObjectURL` adiado (a nova aba precisa de tempo
// para carregar o blob antes da URL ser revogada).
//
// `warehouse` é REQUIRED (FM-003) — diferente do Saldo de Estoque (onde
// todos os filtros são opcionais); `product`/datas são opcionais
// (FM-004..006, sobre `date`, não `created_at`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import { FileText } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Field } from '@/components/Form/Field';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { columnsForm } from '@/constants/coluns-form';

import { stockWriteoffReportSchemaResolver } from '@/validations/schemas/StockWriteoffs/stock-writeoff-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { getStockWriteoffReport } from '@/services/v2/StockWriteoffs/stock-writeoff-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';

import type { StockWriteoffReportFilterForm } from '@/@types/v2/StockWriteoffs';
import type { WarehouseOption } from '@/@types/v2/Warehouses';

const findParamsFromSearch = (search: string | { search: string }) => ({
  search: typeof search === 'string' ? search : search.search,
});

const pristineFilterValues: StockWriteoffReportFilterForm = {
  warehouse: null,
  product: null,
  start_date: null,
  end_date: null,
};

export default function BaixaEstoqueReport() {
  const { languageGB } = useLanguage();
  const text = languageGB.stockWriteoffs.stockWriteoff.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StockWriteoffReportFilterForm>({
    mode: 'onChange',
    resolver: stockWriteoffReportSchemaResolver(languageGB) as any,
    defaultValues: pristineFilterValues,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  async function onSubmit(data: StockWriteoffReportFilterForm) {
    setIsGenerating(true);
    try {
      const blob = await getStockWriteoffReport({
        warehouse_uuid: data.warehouse!.value,
        product_uuid: data.product?.value || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
      });

      // D6 — PDF INLINE em nova aba (fiel ao legado, `Content-Disposition:
      // inline`), NUNCA download forçado. `revokeObjectURL` adiado — a nova
      // aba precisa de tempo para carregar o blob antes da URL ser revogada
      // (mirror de práticas comuns para `window.open` + blob URL).
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toaster.error({
        title: text.title,
        description: text.openError,
      });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <FormContainer title={text.title} subtitle={text.subtitle}>
      <Box px={5} py={5}>
        <VStack align="stretch" gap={6}>
          <Form onSubmit={handleSubmit(onSubmit)} noPadding>
            <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
              <Controller
                name="warehouse"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.warehouse}
                    placeholder={text.filters.warehousePlaceholder}
                    service={listWarehouseOptions}
                    mapOptions={(item: WarehouseOption) => ({
                      label: `${item.initials} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={(search) => ({ ...findParamsFromSearch(search), type: 'insumos' })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    error={(errors.warehouse as any)?.message}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isRequired
                  />
                )}
              />

              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.product}
                    placeholder={text.filters.productPlaceholder}
                    service={listProductOptions}
                    mapOptions={(item: ProductOptionItem) => ({
                      label: `${item.code} — ${item.description}`,
                      value: item.uuid,
                    })}
                    findParams={findParamsFromSearch}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />

              <Controller
                name="start_date"
                control={control}
                render={({ field }) => (
                  <Field label={text.filters.startDate}>
                    <DateInput value={field.value ?? null} onChange={field.onChange} />
                  </Field>
                )}
              />

              <Controller
                name="end_date"
                control={control}
                render={({ field }) => (
                  <Field label={text.filters.endDate}>
                    <DateInput value={field.value ?? null} onChange={field.onChange} />
                  </Field>
                )}
              />
            </SimpleGrid>

            <Flex justify="flex-end" gap={3} mt={4}>
              <Button
                title={text.submit}
                icon={FileText as any}
                type="submit"
                loading={isGenerating}
                disabled={isGenerating}
              />
            </Flex>
          </Form>
        </VStack>
      </Box>
    </FormContainer>
  );
}
