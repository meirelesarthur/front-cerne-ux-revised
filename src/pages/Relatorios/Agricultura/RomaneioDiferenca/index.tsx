// src/pages/Relatorios/Agricultura/RomaneioDiferenca/index.tsx
// -----------------------------------------------------------------------------
// Tela "Romaneio/Diferença — Relatório" (Tarefa 49, esteira 97-Esteiras/014,
// feature_id c0b2369d-44ed-4018-bbeb-38b1f7d7c650). Rota
// `/relatorios/agricultura/romaneio-diferenca`, materializa o item de menu
// FILHO `rel-agr-rom-dif`, sob o grupo `rel-agr` ("Agricultura",
// `navigationTree.ts`).
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/Consolidado/index.tsx`
// (`FormContainer` + footer com 1 único botão "Gerar relatório", SEM
// grid/prévia — `DEC-043`, mirror do legado `CLAIM-009`: a tela nunca
// renderiza a grid no navegador, só dentro do PDF gerado). `client` é
// SINGLE-select (`SelectAsyncPaginate`, uuid opcional) — CONFIRMADO pelo
// dono (`front-architecture-romaneio-diferenca.md` §1.4): "multiselect" no
// pedido original foi engano de memória solta, não veio do contrato real
// (`FM-001` do legado já era `select2` single).
//
// Defeitos preservados AS-IS (DEC-043) — NÃO "conserte":
//   - `GAP-RMD-01` (camada `api`): o `.xlsx` baixado tem as colunas de OUTRO
//     relatório (Export bespoke que preserva o partial errado do legado).
//   - `GAP-RMD-02` (camada `api`/`router/index.tsx`): a ROTA da API não exige
//     permissão de negócio — só o item de MENU é gateado
//     (`transfer_difference_report`, visibilidade apenas, mirror `SR-008`).
//
// Loading via `isGenerating` (`useState` local + try/catch/finally) — NUNCA
// mutation TanStack para binário (convenção do fork, mirror `Consolidado`).
// `parseBlobError` (`@/utils/parseBlobError`) extrai `{message, errors}` do
// `Blob` de erro (efeito colateral de `responseType:'blob'`) — toast mostra
// a 1ª mensagem de campo, senão o `message` genérico.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid } from '@chakra-ui/react';
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

import { transferDifferenceReportFilterSchemaResolver } from '@/validations/schemas/TransferDifferenceReport/transfer-difference-report-filter-schema';

import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import type { ClientOptionItem } from '@/services/v2/CadastrosBase/Client/client-service';
import { downloadTransferDifferenceReport } from '@/services/v2/TransferDifferenceReport/transfer-difference-report-service';

import type { LanguageDate } from '@/@types/language';
import type {
  TransferDifferenceReportFilterForm,
  TransferDifferenceReportParams,
} from '@/@types/v2/TransferDifferenceReport';

function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function buildPristineValues(languageGB: LanguageDate): TransferDifferenceReportFilterForm {
  return {
    client: null,
    start_date: null,
    end_date: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function RomaneioDiferencaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.transferDifferenceReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransferDifferenceReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: transferDifferenceReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasRequiredDates = !!startDateValue && !!endDateValue;

  function buildParams(data: TransferDifferenceReportFilterForm): TransferDifferenceReportParams {
    return {
      client: data.client?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      format: data.format!.value,
    };
  }

  async function handleGenerate(data: TransferDifferenceReportFilterForm) {
    setIsGenerating(true);
    try {
      const blob = await downloadTransferDifferenceReport(buildParams(data));
      downloadBlob(blob, `romaneios.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `Consolidado`/`ContasAPagar`/`CentroCusto`).
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
      setIsGenerating(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleGenerate)}
            loading={isGenerating}
            disabled={!hasRequiredDates || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={columnsForm.default} gap={6}>
          <Controller
            name="client"
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

          <Controller
            name="start_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                label={text.fields.startDate}
                value={value ?? null}
                onChange={onChange}
                error={errors.start_date?.message}
              />
            )}
          />

          <Controller
            name="end_date"
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                label={text.fields.endDate}
                value={value ?? null}
                onChange={onChange}
                error={errors.end_date?.message}
              />
            )}
          />

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
      </Form>
    </FormContainer>
  );
}
