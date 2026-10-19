// src/pages/Relatorios/Estoque/LoteFornecedor/index.tsx
// -----------------------------------------------------------------------------
// Tela "Lote/Fornecedor — Relatório" (F-324, TASK-052-324-FE-02, esteira
// 97-Esteiras/052). Rota `/relatorios/estoque/lote-fornecedor`, materializa
// o item de menu FILHO `rel-est-lote-fornecedor`, sob o grupo/submenu
// `rel-est` ("Estoque", `navigationTree.ts`) — 4º filho, ao lado de
// `rel-est-custo-batida`/`rel-est-recebimentos`/`rel-est-mov-estoque`.
//
// Mirror ESTRUTURAL DUPLO (roteiro-front-F324-lote-fornecedor.md
// §"Passo UX"):
//   - `Relatorios/Estoque/MovimentacaoEstoque/index.tsx` — MESMO submenu
//     `rel-est`, mesma casca `FormContainer` + footer + `<Form
//     onSubmit={preventDefault}>` + `SimpleGrid columns={columnsForm.default}`,
//     mesmo padrão de campo obrigatório único via `SelectAsyncPaginate
//     isRequired` (lá `warehouse`, aqui `provider_uuid`).
//   - `Relatorios/Financeiro/ContasAPagar/index.tsx` — mesmo padrão de
//     campo `format` (PDF+Excel) reusando `reportFormatOptions`
//     (`@/constants/Relatorios/accounts-reports/options/report-format-options`,
//     `ReportFormat` de `@/@types/v2/AccountsReports`) e único botão
//     "Gerar relatório" (SEM 2 botões de export distintos — a API decide o
//     binário pelo parâmetro `format`, não por 2 rotas REST, diferente de
//     `MovimentacaoEstoque`).
//
// Esta é a tela DOWNLOAD-ONLY mais enxuta do lote 052: 1 fornecedor
// OBRIGATÓRIO (`provider_uuid`, `SelectAsyncPaginate` sobre
// `listProviderOptions`/`provider-service.ts`, tenant-scoped via pivot
// `provider_tenant` — NÃO farm-scoped, então SEM reset por fazenda ativa,
// diferente de `MovimentacaoEstoque::warehouse`) + período DECORATIVO
// (`start_date`/`end_date` só rotulam o cabeçalho do PDF, NUNCA filtram
// linhas — fidelidade adjudicada DEC-225, CLM-010/DIV-001) + `format`
// (default `pdf`, `noClearable`). Botão desabilitado até `provider_uuid`
// selecionado — `useState` local `isDownloading` (NUNCA `useMutation` para
// binário).
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
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { stockProviderLotReportFilterSchemaResolver } from '@/validations/schemas/StockProviderLotReport/stock-provider-lot-report-filter-schema';

import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { downloadStockProviderLotReport } from '@/services/v2/StockProviderLotReport/stock-provider-lot-report-service';

import type {
  StockProviderLotReportFilterForm,
  StockProviderLotReportParams,
} from '@/@types/v2/StockProviderLotReport';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado em `MovimentacaoEstoque`/`CustoProducaoBatida`/`JurosPagos`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapProviderOption(item: { uuid: string; label: string }) {
  return { label: item.label, value: item.uuid };
}

export default function LoteFornecedorRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.stockProviderLotReport.report;

  const buildPristineValues = (): StockProviderLotReportFilterForm => ({
    provider_uuid: null,
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch } = useForm<StockProviderLotReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: stockProviderLotReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const providerValue = watch('provider_uuid');

  function buildParams(data: StockProviderLotReportFilterForm): StockProviderLotReportParams {
    return {
      provider_uuid: data.provider_uuid!.value,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: StockProviderLotReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadStockProviderLotReport(params);
      downloadBlob(blob, `relatorio-lote-fornecedor.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `ContasAPagar`/`MovimentacaoEstoque`).
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
            disabled={isDownloading || !providerValue}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="provider_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.provider}
                  placeholder={text.providerPlaceholder}
                  isRequired
                  service={listProviderOptions}
                  mapOptions={mapProviderOption}
                  findParams={(search) => ({ search: searchOf(search) })}
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
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
