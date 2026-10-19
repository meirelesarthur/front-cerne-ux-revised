// src/pages/Relatorios/Vendas/SaleGeneralReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Vendas/Cliente — Relatório" (F-317, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-317-plano-front.md).
// Rota nova `/relatorios/vendas/cliente`, 3º filho do grupo "Vendas"
// (`rel-ven`) — mirror ESTRUTURAL QUASE 1:1 do irmão F-313
// (`src/pages/Relatorios/Vendas/ClienteProduto/index.tsx`): MESMO casco
// `FormContainer` + footer com 1 botão "Baixar Relatório", `useState` local
// `isDownloading` (NUNCA `useMutation` para binário), `parseBlobError`
// idêntico.
//
// Única divergência de comportamento: domínio do campo de formato
// (`report_type: 'pdf'|'excel'`, string) vs. `type: 0|1` (number) de F-313 —
// tratada como tipo/schema/service PRÓPRIOS (namespace `SaleGeneralReport`),
// isolando o domínio distinto do endpoint `/sales-report` (permissão
// `sales_report`) do endpoint irmão `/sales-client-report` (F-313,
// permissão `sale-clients_report`).
//
// DEPENDÊNCIA DE SEQUENCIAMENTO (risco 1 do plano de front): a camada de API
// ainda não executou a troca de motor (`F-317-plano-CIRURGICO.md`,
// PLANEJADO_AGUARDANDO_EXECUCAO) — hoje o endpoint responde no motor antigo
// com `type` (int), não `report_type` (string). Esta tela já materializa
// contra o CONTRATO-ALVO; o download só funciona de ponta a ponta depois da
// troca de motor ser executada (não é bloqueio de fatiamento do front).
//
// `client_uuid` — `SelectAsyncPaginate` sobre `listClientOptions`
// (`@/services/v2/CadastrosBase/Client/client-service.ts`), REUSO IDÊNTICO
// ao F-313 — zero service novo de lookup.
//
// `product_uuid` — `SelectAsyncPaginate` sobre `listProductOptions`
// (`@/services/v2/Products/product-service.ts`), REUSO IDÊNTICO ao F-313.
//
// SEM CASCATA: os 5 campos (`start_date`/`end_date`, `client_uuid`,
// `product_uuid`, `report_type`) são 100% independentes, nenhum `useEffect`
// de preenchimento cruzado nesta tela.
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

import { saleGeneralReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/sale-general-report-filter-schema';

import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import { downloadSaleGeneralReport } from '@/services/v2/Relatorios/sale-general-report-service';

import type { Option } from '@/@types/option';
import type {
  SaleGeneralReportFilterForm,
  SaleGeneralReportFormat,
  SaleGeneralReportParams,
} from '@/@types/v2/Relatorios/sale-general-report';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `ClienteProduto`/`PesagensColheita`/`JurosPagos`/`LoteFornecedor`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapClientOption(item: ClientOptionItem) {
  return { label: item.name ?? '', value: item.uuid };
}

const pristineValues: SaleGeneralReportFilterForm = {
  start_date: null,
  end_date: null,
  client_uuid: null,
  product_uuid: null,
  report_type: 'pdf',
};

export default function SaleGeneralReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.saleGeneralReport.report;

  const formatOptions: Option<SaleGeneralReportFormat>[] = [
    { value: 'pdf', label: text.formatOptions.pdf },
    { value: 'excel', label: text.formatOptions.excel },
  ];

  const { control, handleSubmit, watch } = useForm<SaleGeneralReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: saleGeneralReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: SaleGeneralReportFilterForm): SaleGeneralReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      client_uuid: data.client_uuid?.value || undefined,
      product_uuid: data.product_uuid?.value || undefined,
      report_type: data.report_type,
    };
  }

  async function handleDownload(data: SaleGeneralReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadSaleGeneralReport(buildParams(data));
      downloadBlob(
        blob,
        `relatorio-vendas-cliente.${data.report_type === 'excel' ? 'xlsx' : 'pdf'}`
      );
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror F-313).
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
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="report_type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.reportType}
                  name={name}
                  isRequired
                  value={formatOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<SaleGeneralReportFormat> | null) =>
                    onChange(option?.value ?? 'pdf')
                  }
                  options={formatOptions}
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
