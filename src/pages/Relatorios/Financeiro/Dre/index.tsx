// src/pages/Relatorios/Financeiro/Dre/index.tsx
// -----------------------------------------------------------------------------
// Tela "DRE — Relatório" (F-259, TASK-DRE-FE-02, esteira 049). Rota
// `/relatorios/financeiro/dre`, materializa o item de menu FILHO
// `rel-fin-dre`, sob o grupo/submenu `rel-fin` ("Financeiro",
// `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/GestaoFiscal/PartidaDobrada/index.tsx`
// (FormContainer + footer, sem prévia, download via Blob + `downloadBlob`,
// erro 422-como-Blob tratado via `parseBlobError`, `@/utils/parseBlobError` —
// AJUSTE HOMOLOGAÇÃO 049 item 2: prioriza a mensagem específica de
// `errors` por campo sobre o `message` genérico) — SEM cascata
// entre campos (os 4 campos desta tela são independentes, diferente do
// `report_type→plan_account_uuid` da tela espelhada) e SEM campo "Fazenda"
// (contrato-tela-dre-fe.md §2 LC-FE-04 — a fazenda ativa vem do header
// `X-Farm-Id` automático do client, DEC-208 correção #4; NUNCA reintroduzir
// um seletor de fazenda aqui).
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Baixar PDF"
// (contrato de API expõe só o binário, sem Resource de prévia).
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

import { dreReportFilterSchemaResolver } from '@/validations/schemas/Dre/dre-report-filter-schema';

import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { downloadDreReport } from '@/services/v2/Dre/dre-report-service';
import type { DreTypeReport } from '@/services/v2/Dre/dre-report-service';

import type { Option } from '@/@types/option';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

interface DreReportFilterForm {
  type_report: DreTypeReport | null;
  start_date: string | null;
  end_date: string | null;
  center_id: Option<string> | null;
}

// AJUSTE HOMOLOGAÇÃO 049 (item 1): Visão parte com "Sintético" (`type_report:
// 1`) pré-selecionado — a tela não abre mais com o Select vazio.
const pristineValues: DreReportFilterForm = {
  type_report: 1,
  start_date: null,
  end_date: null,
  center_id: null,
};

export default function DreRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.dre.report;

  const typeReportOptions: Option<DreTypeReport>[] = [
    { value: 1, label: text.typeReportOptions.synthetic },
    { value: 2, label: text.typeReportOptions.analytical },
  ];

  const { control, handleSubmit, watch } = useForm<DreReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: dreReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: DreReportFilterForm) {
    return {
      type_report: data.type_report as DreTypeReport,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      // Defesa em profundidade: nunca envia `center_id` quando o campo está
      // vazio (`undefined`, não `''`), mesmo que o estado local ainda
      // contenha um objeto `Option` residual de uma seleção anterior.
      center_id: data.center_id?.value || undefined,
    };
  }

  async function handleDownload(data: DreReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadDreReport(buildParams(data));
      downloadBlob(blob, 'dre-relatorio.pdf');
    } catch (error) {
      // AJUSTE HOMOLOGAÇÃO 049 (item 2): `responseType:'blob'` entrega o
      // corpo do erro 422 como `Blob` — `parseBlobError` extrai o envelope
      // real `{message, errors}`. Prioridade: 1ª mensagem ESPECÍFICA de
      // `errors` (ex.: `errors.end_date[0]`, "período > 12 meses"); só cai
      // para o `message` genérico ("Os dados informados são inválidos.")
      // quando não há erro de campo.
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
              name="type_report"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.typeReport}
                  name={name}
                  isRequired
                  value={typeReportOptions.find((option) => option.value === value) ?? null}
                  onChange={(option: Option<DreTypeReport> | null) =>
                    onChange(option?.value ?? null)
                  }
                  options={typeReportOptions}
                  noClearable
                />
              )}
            />

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
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.centerId}
                  placeholder={text.centerIdPlaceholder}
                  service={listCostCenterOptions}
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    is_enabled: 'true',
                  })}
                  value={field.value ?? undefined}
                  onChange={(option: any) => field.onChange(option ?? null)}
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
