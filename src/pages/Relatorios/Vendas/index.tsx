// src/pages/Relatorios/Vendas/index.tsx
// -----------------------------------------------------------------------------
// Tela "Vendas/Produto — Relatório" (F-315, esteira
// CORE_WORKSPACE/97-Esteiras/051, TASK-315-FE-02). Rota `/relatorios/vendas`,
// materializa o item de menu FOLHA `rel-ven` ("Vendas", já existente em
// `navigationTree.ts` — nenhuma edição lá, ver TASK-315-FE-03).
//
// Casco mirror `Relatorios/Financeiro/Dre/index.tsx` (F-259, esteira 049) /
// `Relatorios/Pecuaria/ManejoLote/index.tsx` (F-279, esteira 051) —
// `FormContainer` + `footer` com 1 botão "Baixar Relatório", SEM prévia (o
// contrato de API só expõe binário — nenhum endpoint `/preview` para F-315),
// download via Blob + `downloadBlob` + `parseBlobError` (AJUSTE HOMOLOGAÇÃO
// 049 item 2: prioriza a mensagem específica de `errors` por campo sobre o
// `message` genérico) + toast de sucesso E erro (mirror `ContasAPagar`).
//
// Referência UX: `EstoqueConsolidadoReportPage.tsx` (commit `86634905`,
// roteiro-front-F315 §"Passo UX obrigatório" — mesmo commit do canário
// F-298, sem drift).
//
// DECISÃO DE TIPO (roteiro-front-F315 §"Decisão de tipo"): `type` é
// `Option<0|1>[]` construído INLINE no componente (mirror EXATO de
// `typeReportOptions` em `Dre/index.tsx`) — NÃO reaproveita
// `reportFormatOptions` (`AccountsReports`, domínio `string 'pdf'|'xlsx'`).
// Default `0` (PDF) pré-selecionado — AJUSTE HOMOLOGAÇÃO 049: o Select
// nunca abre vazio.
//
// SEM CASCATA (contrato legado §6, dimensão "cascatas" = `NAO_APLICAVEL`,
// prova de ausência dupla — legado E contrato de API novo): os 3 campos
// (`start_date`/`end_date`, `product_uuid`, `type`) são 100% independentes,
// nenhum `useEffect` de preenchimento cruzado nesta tela.
//
// `product_uuid` — `SelectAsyncPaginate` sobre `listProductOptions`
// (`@/services/v2/Products/product-service.ts`, JÁ CONSUMIDO em 5+ telas,
// ex.: `SaldoEstoqueRelatorio`/`FilterSideSaldoEstoque`), REUSO TOTAL, sem
// `menuPortalTarget` — esta tela não é drawer.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
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

import { saleProductReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/sale-product-report-filter-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { downloadSaleProductReport } from '@/services/v2/Relatorios/sale-product-report-service';

import type { Option } from '@/@types/option';
import type {
  SaleProductReportFilterForm,
  SaleProductReportParams,
} from '@/@types/v2/Relatorios/sale-product-report';

const pristineValues: SaleProductReportFilterForm = {
  start_date: null,
  end_date: null,
  product_uuid: null,
  type: 0,
};

export default function VendasProdutoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.saleProductReport.report;

  const typeOptions: Option<0 | 1>[] = [
    { value: 0, label: text.typeOptions.pdf },
    { value: 1, label: text.typeOptions.excel },
  ];

  const { control, handleSubmit, watch } = useForm<SaleProductReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: saleProductReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: SaleProductReportFilterForm): SaleProductReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      product_uuid: data.product_uuid?.value || undefined,
      type: data.type,
    };
  }

  async function handleDownload(data: SaleProductReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadSaleProductReport(buildParams(data));
      downloadBlob(blob, `vendas-produto.${data.type === 1 ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror Dre/ContasAPagar).
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
            disabled={!hasValidRange || isDownloading}
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
            </Box>

            <Controller
              name="product_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  placeholder={text.productPlaceholder}
                  service={listProductOptions}
                  mapOptions={(item: ProductOptionItem) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    // PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.2/§3 F-315,
                    // DECISÃO DE ESCOPO #6 — `has:'sales'` estreita o
                    // universo do options ao recorte de fato (venda), o
                    // mesmo escopo que o submit já exige (evita opção
                    // escolhida no lookup que o backend rejeitaria com 422).
                    has: 'sales',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.type}
                  name={name}
                  isRequired
                  value={typeOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<0 | 1> | null) => onChange(option?.value ?? 0)}
                  options={typeOptions}
                  noClearable
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
