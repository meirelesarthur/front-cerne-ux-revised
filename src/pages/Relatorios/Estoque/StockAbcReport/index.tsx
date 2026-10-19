// src/pages/Relatorios/Estoque/StockAbcReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Curva ABC/Estoque — Relatório" (F-322, esteira 97-Esteiras/077,
// CONTRATOS/front/F-322-plano-front.md). Rota
// `/relatorios/estoque/curva-abc`, materializa o item de menu FILHO
// `rel-est-curva-abc`, sob o grupo/submenu `rel-est` ("Estoque",
// `navigationTree.ts`) — 6º filho, ao lado de `rel-est-baixa-estoque`.
//
// Mirror ESTRUTURAL DUPLO (plano front §1):
//   - `Relatorios/Estoque/LoteFornecedor/index.tsx` — MESMA casca
//     `FormContainer` + footer + `<Form onSubmit={preventDefault}>` +
//     `SimpleGrid columns={columnsForm.default}`, mesmo submenu `rel-est`,
//     mesmo padrão de download síncrono por blob via `useState` local
//     `isDownloading` (NUNCA `useMutation` para binário).
//   - `Relatorios/Estoque/MovimentacaoEstoque/index.tsx` — mesmo domínio
//     Stock, para o padrão de `DateInput` OBRIGATÓRIO via
//     `fieldValidationSchema(languageGB).date()`, que `LoteFornecedor` não
//     ilustra (lá as datas são decorativas/opcionais).
//
// 3 campos, todos OBRIGATÓRIOS: `start_date`, `end_date`, `format`
// (PDF/Excel, default `pdf` pré-selecionado, `noClearable`). SEM
// `SelectAsyncPaginate` de entidade (não existe aqui, diferente de
// `LoteFornecedor::provider_uuid`) — botão sempre habilitado (os 3 campos já
// têm default/validação própria via `handleSubmit`), diferente do `disabled
// ={!providerValue}` do mirror.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { stockAbcReportFormatOptions } from '@/constants/Relatorios/stock-abc-report/options/stock-abc-report-format-options';

import { stockAbcReportFilterSchemaResolver } from '@/validations/schemas/StockAbcReport/stock-abc-report-filter-schema';

import { downloadStockAbcReport } from '@/services/v2/StockAbcReport/stock-abc-report-service';

import type { StockAbcReportFilterForm, StockAbcReportParams } from '@/@types/v2/StockAbcReport';

export default function StockAbcReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.stockAbcReport.report;

  const buildPristineValues = (): StockAbcReportFilterForm => ({
    start_date: null,
    end_date: null,
    format: stockAbcReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit } = useForm<StockAbcReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: stockAbcReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: StockAbcReportFilterForm): StockAbcReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      report_type: data.format!.value,
    };
  }

  async function handleDownload(data: StockAbcReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadStockAbcReport(params);
      const extension = params.report_type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `curva-abc-estoque.${extension}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `LoteFornecedor`/`MovimentacaoEstoque`).
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
            disabled={isDownloading}
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
                  options={stockAbcReportFormatOptions.options(languageGB)}
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
