// src/pages/Relatorios/Suprimentos/ProdutosPrevEntrega/index.tsx
// -----------------------------------------------------------------------------
// Tela "Produtos x Prev. Entrega — Relatório" (F-309, TASK-058-F309-FE-02,
// esteira 97-Esteiras/058). Rota
// `/relatorios/suprimentos/produtos-prev-entrega`, materializa o item de menu
// FILHO `rel-sup-produtos-prev-entrega`, 3º filho do grupo/submenu `rel-sup`
// ("Suprimentos", `navigationTree.ts`) — sibling de `rel-sup-sla`/
// `rel-sup-gerencial-solicitacoes` (F-326/F-310).
//
// Subpasta NOVA dentro de `Relatorios/Suprimentos/` (mirror do padrão já
// usado por `Relatorios/Suprimentos/GerencialSolicitacoes`) — os arquivos
// IRMÃOS (`Relatorios/Suprimentos/index.tsx`,
// `Relatorios/Suprimentos/GerencialSolicitacoes/index.tsx`) permanecem
// intocados.
//
// Casco mirror QUASE 1:1 de `GerencialSolicitacoes/index.tsx` (F-310 — 2
// botões de download independentes, `isDownloadingPdf`/`isDownloadingExcel`
// separados, `/options` combinado num único `useQuery`, SEM prévia — contrato
// de tela só expõe binário), com MAIS campos (10 vs 3) e MAIS um lookup
// EXTERNO (`product` via `listProductOptions`/`/products/options`, escopo
// TENANT, FORA do `/options` combinado — mirror C3 do contrato legado: o
// autocomplete quebrado do legado (`#inp-tenant_id` ausente) é corrigido
// justamente por consumir este endpoint tenant-scoped via `X-Farm-Id`, sem
// depender de nenhum campo hidden).
//
// SEM CASCATA: todos os 8 campos opcionais são filtros INDEPENDENTES entre si
// (plano §2.2). Botões de download `disabled` até `start_date`+`end_date`
// preenchidos (guarda client-side — o backend já valida via 422 de qualquer
// forma, mirror `GerencialSolicitacoes`/`ManejoLote`/`CentroCusto`).
//
// RISCO CRÍTICO (plano §"Leitura do dev" risco #1, FID-05): `priority`/
// `status` são numéricos e `0` é um valor VÁLIDO ("Alta"=0). `buildParams`
// usa `?? undefined`, NUNCA `|| undefined` — `0 || undefined` apagaria o
// filtro "Alta" (mirror EXATO de `GerencialSolicitacoes/index.tsx:118`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { requestPurchaseForecastReportFilterSchemaResolver } from '@/validations/schemas/RequestPurchaseForecastReport/request-purchase-forecast-report-filter-schema';

import { listProductOptions } from '@/services/v2/Products/product-service';
import type { ProductOptionItem } from '@/services/v2/Products/product-service';
import {
  downloadRequestPurchaseForecastReportExcel,
  downloadRequestPurchaseForecastReportPdf,
  getRequestPurchaseForecastReportOptions,
} from '@/services/v2/RequestPurchaseForecastReport/request-purchase-forecast-report-service';

import type { Option } from '@/@types/option';
import type {
  RequestPurchaseForecastReportFilterForm,
  RequestPurchaseForecastReportParams,
} from '@/@types/v2/RequestPurchaseForecastReport';

const pristineValues: RequestPurchaseForecastReportFilterForm = {
  start_date: null,
  end_date: null,
  farm_id: null,
  user_id: null,
  status: null,
  priority: null,
  authorizer_id: null,
  number: null,
  product: null,
  service: null,
};

export default function ProdutosPrevEntregaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.requestPurchaseForecastReport.report;

  const { control, register, handleSubmit, watch } =
    useForm<RequestPurchaseForecastReportFilterForm>({
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: requestPurchaseForecastReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.requestPurchaseForecastReportOptions],
    queryFn: getRequestPurchaseForecastReportOptions,
  });

  // `/options` combinado já devolve `Option<T>[]` prontos do servidor — SEM
  // mapeamento local (mirror do formato do plano §3, diferente do
  // `RequestPurchaseManagementReportFarmOption` cru do irmão F-310).
  const farmOptions = optionsQuery.data?.farms ?? [];
  const userOptions = optionsQuery.data?.users ?? [];
  const statusOptions = optionsQuery.data?.statuses ?? [];
  const priorityOptions = optionsQuery.data?.priorities ?? [];
  const authorizerOptions = optionsQuery.data?.authorizers ?? [];

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(
    data: RequestPurchaseForecastReportFilterForm
  ): RequestPurchaseForecastReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      farm_id: data.farm_id?.value || undefined,
      user_id: data.user_id?.value || undefined,
      // `status`/`priority` usam `??` (NUNCA `||`) — `0` ("Alta") é um valor
      // VÁLIDO; `0 || undefined` apagaria o filtro (risco #1 do plano).
      status: data.status?.value ?? undefined,
      priority: data.priority?.value ?? undefined,
      authorizer_id: data.authorizer_id?.value || undefined,
      number: data.number || undefined,
      product: data.product?.value || undefined,
      service: data.service || undefined,
    };
  }

  async function handleDownloadPdf(data: RequestPurchaseForecastReportFilterForm) {
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadRequestPurchaseForecastReportPdf(buildParams(data));
      downloadBlob(blob, 'produtos-previsao-de-entrega.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `GerencialSolicitacoes`/`ContasAPagar`/`CentroCusto`/`ManejoLote`).
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
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadExcel(data: RequestPurchaseForecastReportFilterForm) {
    setIsDownloadingExcel(true);
    try {
      const blob = await downloadRequestPurchaseForecastReportExcel(buildParams(data));
      downloadBlob(blob, 'produtos-previsao.xlsx');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
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
      setIsDownloadingExcel(false);
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
            variant="outline"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isDownloadingPdf}
            disabled={!hasValidRange || isDownloadingPdf || isDownloadingExcel}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isDownloadingExcel}
            disabled={!hasValidRange || isDownloadingPdf || isDownloadingExcel}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fiveColumns} gap={6}>
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
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={farmOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.user}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={userOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                  options={statusOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.priority}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                  options={priorityOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="authorizer_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.authorizer}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={authorizerOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Input
              label={text.fields.number}
              maxLength={14}
              inputMode="numeric"
              {...register('number')}
            />

            {/* Produto: `SelectAsyncPaginate` + `listProductOptions`
                (`/products/options`, escopo TENANT via `X-Farm-Id`) — NUNCA
                um Select síncrono com catálogo local (mirror C3 do contrato
                legado: o `/options` combinado acima NÃO inclui produto). */}
            <Controller
              name="product"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
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
                />
              )}
            />

            <Input label={text.fields.service} {...register('service')} />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
