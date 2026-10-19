// src/pages/Relatorios/Pecuaria/AnimalsSaleReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Vendas/Animais — Relatório" (F-227, esteira 97-Esteiras/077,
// CONTRATOS/front/F-227-plano-front.md). Rota
// `/relatorios/pecuaria/vendas-animais`, materializa o item de menu FILHO
// `rel-pec-vda`, sob o grupo/submenu `rel-pec` ("Pecuária", `navigationTree.ts`).
//
// Mirror ESTRUTURAL EXATO de
// `Relatorios/Pecuaria/CategoryAnimalReport/index.tsx`/`Relatorios/Estoque/
// LoteFornecedor/index.tsx` — mesma casca `FormContainer` + footer + `<Form
// onSubmit={preventDefault}>` + `SimpleGrid columns={columnsForm.sixColumns}`,
// mesmo padrão de `Select` de formato `noClearable` + download síncrono por
// blob via `useState` local `isDownloading` (NUNCA `useMutation` para
// binário). Fiação de `SelectAsyncPaginate` sobre `listBillableMovementSaleOptions`/
// `listBatchOptionsForForm` copiada de `Relatorios/Pecuaria/PerformanceAnimal/
// index.tsx` — **SEM** a cascata `IG-01` daquela tela (`sale ↔ (batch,
// datas)`), que não existe no legado desta feature (contrato legado F-227,
// `cascatas: NAO_APLICAVEL`).
//
// 6 campos: `sale_id`/`batch_id`/`client_uuid` TODOS OPCIONAIS e SEM cascata
// entre si + `start_date`/`end_date` DECORATIVOS (OPCIONAIS) + `format`
// (PDF/Excel, default `pdf` pré-selecionado, `noClearable`). Botão "Gerar
// relatório" SEMPRE habilitado (`disabled={isDownloading}` apenas — BR-01/
// CLM-04, nenhum campo é obrigatório).
//
// `batch_id` usa `listBatchOptionsForForm` (NUNCA `listBatchOptions`) —
// `batch_id` é validado como `sometimes|uuid|exists`, nunca aceita a
// sentinela `"0"` de "Sem lote" (mesma decisão já fixada no plano F-242).
//
// `client_uuid` usa `listClientOptions` (`ClientOptionItem{uuid, name}`) —
// mapeado para o parâmetro `client_uuid` da API (NUNCA `client_id`).
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
import { animalsSaleReportFormatOptions } from '@/constants/Relatorios/animals-sale-report/options/animals-sale-report-format-options';

import { animalsSaleReportFilterSchemaResolver } from '@/validations/schemas/AnimalsSaleReport/animals-sale-report-filter-schema';

import { downloadAnimalsSaleReport } from '@/services/v2/AnimalsSaleReport/animals-sale-report-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listBillableMovementSaleOptions } from '@/services/v2/BatchProfitability/batch-profitability-report-service';
import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';

import type { Option } from '@/@types/option';
import type {
  AnimalsSaleReportFilterForm,
  AnimalsSaleReportParams,
} from '@/@types/v2/AnimalsSaleReport';
import type { BatchOption } from '@/@types/v2/Batches';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado em `LoteFornecedor`/`CategoryAnimalReport`/`PerformanceAnimal`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function AnimalsSaleReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalsSaleReport.report;

  const buildPristineValues = (): AnimalsSaleReportFilterForm => ({
    sale_id: null,
    batch_id: null,
    client_uuid: null,
    start_date: null,
    end_date: null,
    format: animalsSaleReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit } = useForm<AnimalsSaleReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: animalsSaleReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: AnimalsSaleReportFilterForm): AnimalsSaleReportParams {
    return {
      sale_id: data.sale_id?.value || undefined,
      batch_id: data.batch_id?.value || undefined,
      client_uuid: data.client_uuid?.value || undefined,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      report_type: data.format!.value,
    };
  }

  async function handleDownload(data: AnimalsSaleReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadAnimalsSaleReport(params);
      const extension = params.report_type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `vendas-de-animais.${extension}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `LoteFornecedor`/`CategoryAnimalReport`).
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
          <SimpleGrid columns={columnsForm.sixColumns} gap={6}>
            <Controller
              name="sale_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.sale}
                  placeholder={text.salePlaceholder}
                  service={listBillableMovementSaleOptions}
                  mapOptions={(item: Option<string>) => ({
                    label: item.label,
                    value: item.value,
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
              name="batch_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="client_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.client}
                  placeholder={text.clientPlaceholder}
                  service={listClientOptions}
                  mapOptions={(item: ClientOptionItem) => ({
                    label: item.name,
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
                  options={animalsSaleReportFormatOptions.options(languageGB)}
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
