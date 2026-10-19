// src/pages/Relatorios/Vendas/ClienteProduto/index.tsx
// -----------------------------------------------------------------------------
// Tela "Cliente/Produto — Relatório" (F-313, esteira
// CORE_WORKSPACE/97-Esteiras/054, roteiro-front-F313-cliente-produto.md).
// Rota nova `/relatorios/vendas/cliente-produto`, filho novo do item de menu
// "Vendas" (`rel-ven`, restruturado de FOLHA para GRUPO — ver §5.2 do
// roteiro; NENHUMA edição nesta pasta toca `navigationTree.ts`/
// `navigationPermissions.ts`/`router/index.tsx`, que são wiring serializado
// reportado à parte).
//
// Mirror 1:1 ESTRUTURAL do irmão F-315 (`src/pages/Relatorios/Vendas/
// index.tsx`, produção) — MESMO casco `FormContainer` + footer com 1 botão
// "Baixar Relatório", SEM prévia (o contrato de API só expõe binário),
// download via Blob + `downloadBlob` + `parseBlobError` (prioriza a mensagem
// específica de `errors` por campo sobre o `message` genérico) + toast de
// sucesso E erro. NENHUM arquivo do F-315 é tocado — este namespace é
// próprio (`SaleClientReport`/`ClienteProduto`).
//
// Referência UX: reuse declarado (roteiro-front-F313 §2) — mirror 1:1 da
// forma já provada em produção pelo F-315, que por sua vez mapeou
// `EstoqueConsolidadoReportPage.tsx` (commit `86634905`, sem drift).
//
// DECISÃO DE TIPO (mirror roteiro-front-F315 §"Decisão de tipo"): `type` é
// `Option<0|1>[]` construído INLINE no componente. Default `0` (PDF)
// pré-selecionado — o Select nunca abre vazio.
//
// SEM CASCATA (roteiro-front-F313 §3 FID-G3F, dimensão "cascatas" =
// `NAO_APLICAVEL`): os 5 campos (`start_date`/`end_date`, `client_uuid`,
// `product_uuid`, `type`) são 100% independentes, nenhum `useEffect` de
// preenchimento cruzado nesta tela.
//
// `client_uuid` — `SelectAsyncPaginate` sobre `listClientOptions`
// (`@/services/v2/CadastrosBase/Client/client-service.ts`), mapOptions
// `item.name`/`item.uuid` (SEM nif — convenção já vigente em 4 telas de
// relatório da base, mirror EXATO `PesagensColheita/index.tsx:114-116`,
// decisão não-bloqueante do roteiro-front-F313 §3 "selects").
//
// `product_uuid` — `SelectAsyncPaginate` sobre `listProductOptions`
// (`@/services/v2/Products/product-service.ts`), reuso IDÊNTICO ao F-315.
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

import { saleClientReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/sale-client-report-filter-schema';

import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { downloadSaleClientReport } from '@/services/v2/Relatorios/sale-client-report-service';

import type { Option } from '@/@types/option';
import type {
  SaleClientReportFilterForm,
  SaleClientReportParams,
} from '@/@types/v2/Relatorios/sale-client-report';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `PesagensColheita`/`JurosPagos`/`LoteFornecedor`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapClientOption(item: ClientOptionItem) {
  return { label: item.name ?? '', value: item.uuid };
}

const pristineValues: SaleClientReportFilterForm = {
  start_date: null,
  end_date: null,
  client_uuid: null,
  product_uuid: null,
  type: 0,
};

export default function ClienteProdutoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.saleClientReport.report;

  const typeOptions: Option<0 | 1>[] = [
    { value: 0, label: text.typeOptions.pdf },
    { value: 1, label: text.typeOptions.excel },
  ];

  const { control, handleSubmit, watch } = useForm<SaleClientReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: saleClientReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: SaleClientReportFilterForm): SaleClientReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      client_uuid: data.client_uuid?.value || undefined,
      product_uuid: data.product_uuid?.value || undefined,
      type: data.type,
    };
  }

  async function handleDownload(data: SaleClientReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadSaleClientReport(buildParams(data));
      downloadBlob(blob, `relatorio-vendas-cliente-produto.${data.type === 1 ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror F-315).
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
              name="client_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.client}
                  placeholder={text.clientPlaceholder}
                  service={listClientOptions}
                  mapOptions={mapClientOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                    has: 'sales',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

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
                    search: searchOf(search),
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
