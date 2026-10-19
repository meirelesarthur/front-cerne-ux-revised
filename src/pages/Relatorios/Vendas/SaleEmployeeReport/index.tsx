// src/pages/Relatorios/Vendas/SaleEmployeeReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Vendas/Funcionário — Relatório" (F-314, esteira
// CORE_WORKSPACE/97-Esteiras/079, F-314-plano-frontend.md). Rota
// `/relatorios/vendas/funcionario`, 4º filho do grupo `rel-ven` ("Vendas").
//
// Casco mirror EXATO de `Relatorios/Vendas/index.tsx` (F-315, "Vendas/
// Produto") — `FormContainer` + footer com 1 botão "Baixar Relatório", SEM
// prévia (o contrato de API só expõe binário), download via Blob +
// `downloadBlob` + `parseBlobError` (prioriza mensagem específica de
// `errors` por campo sobre `message` genérico) + toast de sucesso E erro.
//
// Referência UX: mesma âncora dos irmãos F-315/F-317
// (`EstoqueConsolidadoReportPage.tsx`) — sem UX-GAP novo, sem drift desde o
// canário F-298 (plano-frontend §3).
//
// DECISÃO DE TIPO (mirror F-315): `type` é `Option<0|1>[]` construído INLINE
// no componente. Default `0` (PDF) pré-selecionado — Select nunca abre vazio.
//
// SEM CASCATA (contrato legado §screen_contract.dimensions.cascatas =
// `NAO_APLICAVEL`): os 4 campos (`start_date`/`end_date`, `user_uuid`,
// `type`) são 100% independentes, nenhum `useEffect` de preenchimento
// cruzado nesta tela.
//
// `user_uuid` — `SelectAsyncPaginate` sobre `listSaleEmployeeReportUserOptions`
// (`@/services/v2/Relatorios/sale-employee-report-service.ts`, mirror
// `listServiceOrderExecutorOptions` sobre `GET /users/options`, mesmo
// endpoint já em produção). Filtro FUNCIONAL na API (lote 079 corrigiu o
// filtro morto do legado) — o front só precisa propagar `user_uuid` no
// payload, sem lógica adicional.
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

import { saleEmployeeReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/sale-employee-report-filter-schema';

import {
  downloadSaleEmployeeReport,
  listSaleEmployeeReportUserOptions,
} from '@/services/v2/Relatorios/sale-employee-report-service';
import type { SaleEmployeeReportUserOption } from '@/services/v2/Relatorios/sale-employee-report-service';

import type { Option } from '@/@types/option';
import type {
  SaleEmployeeReportFilterForm,
  SaleEmployeeReportParams,
} from '@/@types/v2/Relatorios/sale-employee-report';

const pristineValues: SaleEmployeeReportFilterForm = {
  start_date: null,
  end_date: null,
  user_uuid: null,
  type: 0,
};

export default function VendasFuncionarioRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.saleEmployeeReport.report;

  const typeOptions: Option<0 | 1>[] = [
    { value: 0, label: text.typeOptions.pdf },
    { value: 1, label: text.typeOptions.excel },
  ];

  const { control, handleSubmit, watch } = useForm<SaleEmployeeReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: saleEmployeeReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: SaleEmployeeReportFilterForm): SaleEmployeeReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      user_uuid: data.user_uuid?.value || undefined,
      type: data.type,
    };
  }

  async function handleDownload(data: SaleEmployeeReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadSaleEmployeeReport(buildParams(data));
      downloadBlob(blob, `vendas-funcionario.${data.type === 1 ? 'xlsx' : 'pdf'}`);
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
              name="user_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.user}
                  placeholder={text.userPlaceholder}
                  service={listSaleEmployeeReportUserOptions}
                  mapOptions={(item: SaleEmployeeReportUserOption) => ({
                    label: item.name ?? '—',
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
