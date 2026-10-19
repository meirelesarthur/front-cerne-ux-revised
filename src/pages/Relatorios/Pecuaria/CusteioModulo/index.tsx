// src/pages/Relatorios/Pecuaria/CusteioModulo/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) "Custeio/Módulo" — Relatórios > Pecuária
// (F-250, TASK-CM-FE-02, esteira 080, `Custeio-Modulo-Contrato-Front.md
// §3/§4/§5/§7`). Mirror ESTRUTURAL EXATO de
// `Relatorios/Pecuaria/CusteioLote/index.tsx` (mesma dupla de botões
// `Baixar PDF`/`Baixar Excel` via `downloadBlob`, loading POR BOTÃO
// independente, `try/catch/finally`, `hasValidRange` disable), trocando:
//
// 1. `batches` → `grazings` — reusa `listGrazings` DIRETO
//    (`@/services/v2/BaseRegistrations/grazings-service.ts`) como `service`
//    do `SelectAsyncPaginate`, `pageSize=50` (compensa a AUSÊNCIA de busca
//    server-side no índice `/grazings` — Doc Bruta §7 item 1, contrato de
//    tela §5/Riscos item 2), `mapOptions` usando `description`/`uuid` de
//    `GrazingListItem`. SEM `findParams` — `/grazings` não aceita `search`.
// 2. schema/service das versões `costing-grazing-report-*` (TASK-CM-FE-01).
// 3. `text = languageGB.costingGrazingReport.report`.
// 4. nomes de download `custeio-modulo.pdf` / `custeio-modulo.xlsx`.
// 5. **D3 — divergência DELIBERADA dos 2 mirrors (`CusteioLote`/
//    `CusteioAnimal`)**: ambos confiam SOMENTE em `hasValidRange` (disable de
//    botão) para impedir submit inválido; nenhum dos 2 implementa `onInvalid`
//    no `handleSubmit`. Esta tela ADICIONA `handleSubmit(handler, onInvalid)`
//    com toaster de erro (defesa em profundidade — checklist relatório #22,
//    "campo `.option()` nullable-sem-required bloqueia submit silencioso"),
//    SEM remover `hasValidRange` (guarda redundante, nunca contraditória).
//
// `report_type` (D2) é o NOME do parâmetro enviado pelo service — a UI
// continua sendo 2 botões distintos, cada um fixando o valor internamente
// (`'pdf' | 'excel'`); NÃO existe `<select>` no DOM.
//
// Usa `parseBlobError` (utilitário compartilhado, `@/utils/parseBlobError`),
// mirror exato dos 3 irmãos migrados da família "Custeio/*".
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { costingGrazingReportFilterSchema } from '@/validations/schemas/Relatorios/costing-grazing-report-filter-schema';

import { listGrazings } from '@/services/v2/BaseRegistrations/grazings-service';
import {
  downloadCostingGrazingReportPdf,
  downloadCostingGrazingReportXlsx,
} from '@/services/v2/Relatorios/costing-grazing-report-service';

import type { Option } from '@/@types/option';
import type { GrazingListItem } from '@/@types/v2/BaseRegistrations/grazings';

// Form values desta tela (page-scoped, não compartilhado). `grazings` é
// `Option<string>[] | null` (widget `SelectAsyncPaginate isMulti`); vira
// `grazings: string[]` no payload real do service
// (`CostingGrazingReportParams`).
interface CusteioModuloReportFilterForm {
  grazings: Option<string>[] | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineValues: CusteioModuloReportFilterForm = {
  grazings: [],
  start_date: null,
  end_date: null,
};

export default function CusteioModuloRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.costingGrazingReport.report;

  const { control, handleSubmit, watch } = useForm<CusteioModuloReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(costingGrazingReportFilterSchema(languageGB)) as any,
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até as 2 datas estarem preenchidas (mirror
  // `hasValidRange` de `CusteioLote`/`CusteioAnimal`) — `grazings` vazio NÃO
  // bloqueia (campo opcional). A validação `end_date >= start_date` fica a
  // cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  // D3 — defesa em profundidade ADICIONAL aos 2 mirrors: `onInvalid` nunca
  // fica silencioso. `hasValidRange` já desabilita o botão no caso comum;
  // este handler cobre o caso residual (ex.: estado do botão dessincronizado
  // do form) sem depender apenas do disable visual.
  function onInvalid() {
    toaster.error({ title: text.pageTitle, description: text.validation.formInvalid });
  }

  function buildParams(data: CusteioModuloReportFilterForm) {
    return {
      grazings: data.grazings?.map((option) => option.value) || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleExportPdf(data: CusteioModuloReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadCostingGrazingReportPdf(buildParams(data));
      downloadBlob(blob, 'custeio-modulo.pdf');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `CusteioLote/index.tsx`).
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
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: CusteioModuloReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadCostingGrazingReportXlsx(buildParams(data));
      downloadBlob(blob, 'custeio-modulo.xlsx');
      toaster.success({ title: text.pageTitle, description: text.successToast });
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
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.exportPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf, onInvalid)}
            loading={isExportingPdf}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx, onInvalid)}
            loading={isExportingXlsx}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Controller
              name="grazings"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.grazings}
                  placeholder={text.grazingsPlaceholder}
                  isMulti
                  closeMenuOnSelect={false}
                  service={listGrazings}
                  pageSize={50}
                  mapOptions={(item: GrazingListItem) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  value={field.value ?? []}
                  onChange={(options: any) => field.onChange(options ?? [])}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
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
