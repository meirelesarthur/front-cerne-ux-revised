// src/pages/Relatorios/GestaoFiscal/PartidaDobrada/index.tsx
// -----------------------------------------------------------------------------
// Tela "Partida Dobrada — Relatório" (F-257, TASK-PDR-FE-04, esteira 069).
// Rota `/relatorios/gestao-fiscal/partida-dobrada` (ajuste de navegação
// pedido pelo dono, 2026-09-01 — antes `/relatorios/gestao-fiscal`, quando
// "Gestão Fiscal" era item-folha único). Materializa o item de menu FILHO
// `rel-gfi-partida-dobrada`, sob o grupo/submenu `rel-gfi` ("Gestão Fiscal",
// `navigationTree.ts`), reservado para futuros relatórios de NF-e.
//
// Mirror estrutural de `Financeiro/Conciliacao/RelatorioConsolidado/index.tsx`
// (FormContainer + filtro + botão de export, sem prévia, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseDownloadErrorMessage`)
// — MENOS o botão Excel (esta feature é PDF-only, contrato-tela §3/§6,
// `LACUNA-05` já reconciliada), MAIS a cascata `report_type→
// plan_account_uuid` (contrato-tela §4, `IG-01`).
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Baixar PDF"
// (contrato de API expõe só o binário, sem Resource de prévia).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Download } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';

import { doubleEntryAccountingReportFilterSchemaResolver } from '@/validations/schemas/DoubleEntryAccountingReports/double-entry-accounting-report-filter-schema';

import { downloadDoubleEntryAccountingReport } from '@/services/v2/DoubleEntryAccountingReports/double-entry-accounting-report-service';
import type { DoubleEntryAccountingReportType } from '@/services/v2/DoubleEntryAccountingReports/double-entry-accounting-report-service';
import { listPlanAccountOptions } from '@/services/v2/PlanAccounts/plan-account-service';

import type { Option } from '@/@types/option';
import type { PlanAccountRef } from '@/@types/v2/PlanAccounts';

interface DoubleEntryAccountingReportFilterForm {
  report_type: DoubleEntryAccountingReportType | null;
  plan_account_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  order_by: 'asc' | 'desc';
}

const pristineValues: DoubleEntryAccountingReportFilterForm = {
  report_type: null,
  plan_account_uuid: null,
  start_date: null,
  end_date: null,
  order_by: 'desc',
};

// Mirror `RelatorioConsolidado/index.tsx::parseDownloadErrorMessage` — erro
// 422 chega como `Blob` quando `responseType:'blob'`, nunca lido diretamente
// como objeto de `error.response.data`.
async function parseDownloadErrorMessage(error: unknown): Promise<string | null> {
  if (!isAxiosError(error)) return error instanceof Error ? error.message : null;
  const data = error.response?.data as unknown;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text()) as { message?: string };
      return parsed.message ?? null;
    } catch {
      return null;
    }
  }
  return (data as { message?: string })?.message ?? null;
}

export default function PartidaDobradaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.accountingEntries.accountingEntry.report;

  const reportTypeOptions: Option<DoubleEntryAccountingReportType>[] = [
    { value: 'journal', label: text.reportTypeOptions.journal },
    { value: 'general_ledger', label: text.reportTypeOptions.generalLedger },
    { value: 'trial_balance', label: text.reportTypeOptions.trialBalance },
    { value: 'balance_sheet', label: text.reportTypeOptions.balanceSheet },
  ];

  const orderByOptions: Option<'asc' | 'desc'>[] = [
    { value: 'desc', label: text.orderByOptions.recent },
    { value: 'asc', label: text.orderByOptions.oldest },
  ];

  const { control, handleSubmit, watch, setValue } = useForm<DoubleEntryAccountingReportFilterForm>(
    {
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: doubleEntryAccountingReportFilterSchemaResolver(languageGB),
      defaultValues: pristineValues,
    }
  );

  const [isDownloading, setIsDownloading] = useState(false);

  const reportType = useWatch({ control, name: 'report_type' });
  const isBalanceSheet = reportType === 'balance_sheet';

  // Cascata `report_type→plan_account_uuid` (contrato-tela §4, `IG-01`):
  // ao entrar em `balance_sheet`, limpa o campo — mirror exato do legado
  // (disable+clear via JS), agora em React controlado.
  useEffect(() => {
    if (isBalanceSheet) {
      setValue('plan_account_uuid', null);
    }
  }, [isBalanceSheet, setValue]);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: DoubleEntryAccountingReportFilterForm) {
    return {
      report_type: data.report_type as DoubleEntryAccountingReportType,
      // Defesa em profundidade além do disable de UI: nunca envia
      // `plan_account_uuid` quando `report_type==='balance_sheet'`, mesmo
      // que o estado local ainda o contenha.
      plan_account_uuid:
        data.report_type === 'balance_sheet' ? undefined : data.plan_account_uuid?.value,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      order_by: data.order_by,
    };
  }

  async function handleDownload(data: DoubleEntryAccountingReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadDoubleEntryAccountingReport(buildParams(data));
      downloadBlob(blob, 'partida-dobrada-relatorio.pdf');
    } catch (error) {
      const message = await parseDownloadErrorMessage(error);
      toaster.error({ title: text.pageTitle, description: message || text.downloadError });
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
            title={text.downloadPdfButton}
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
            <Controller
              name="report_type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.reportTypeLabel}
                  name={name}
                  value={reportTypeOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<DoubleEntryAccountingReportType> | null) =>
                    onChange(option?.value ?? null)
                  }
                  options={reportTypeOptions}
                  noClearable
                />
              )}
            />

            <Controller
              name="plan_account_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.planAccountLabel}
                  placeholder={text.planAccountPlaceholder}
                  service={(params) =>
                    listPlanAccountOptions({ ...params, class: 2, is_enabled: 'true' })
                  }
                  mapOptions={(item: PlanAccountRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isDisabled={isBalanceSheet}
                />
              )}
            />

            <Controller
              name="order_by"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.orderByLabel}
                  name={name}
                  value={orderByOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<'asc' | 'desc'> | null) =>
                    onChange(option?.value ?? 'desc')
                  }
                  options={orderByOptions}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.startDate}
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
                {text.endDate}
              </Text>
              <Controller
                name="end_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>
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
