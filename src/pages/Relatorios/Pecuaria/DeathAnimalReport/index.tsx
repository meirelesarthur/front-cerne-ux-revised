// src/pages/Relatorios/Pecuaria/DeathAnimalReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Mortes — Relatório" (F-254, esteira 97-Esteiras/077,
// CONTRATOS/front/F-254-plano-front.md). Rota
// `/relatorios/pecuaria/mortes`, materializa o item de menu FILHO
// `rel-pec-mor`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`) — logo após `rel-pec-mortes-sisbov`.
//
// Mirror ESTRUTURAL EXATO de `Relatorios/Estoque/StockAbcReport/index.tsx`
// (F-322, mesma esteira 077) — mesma casca `FormContainer`+footer, mesmo
// `SimpleGrid columns={columnsForm.default}`, 2 `DateInput` via `Controller`
// ambas REQUIRED, `Select` de formato `noClearable`, 1 botão único via
// `downloadBlob`, `useState` local `isDownloading`.
//
// NÃO o mirror de domínio "Mortes/SISBOV" (`MortesSisbov`/F-253, mesmo grupo
// de menu) — esse irmão é SÓ PDF (sem Select de formato) e tem AMBAS as datas
// OPCIONAIS; esta tela diverge nos dois pontos (fiel ao próprio legado
// C-005: datas `required` no HTML5, `type` PDF/Excel presente).
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
import { deathAnimalReportFormatOptions } from '@/constants/Relatorios/death-animal-report/options/death-animal-report-format-options';

import { deathAnimalReportFilterSchemaResolver } from '@/validations/schemas/DeathAnimalReport/death-animal-report-filter-schema';

import { downloadDeathAnimalReport } from '@/services/v2/DeathAnimalReport/death-animal-report-service';

import type {
  DeathAnimalReportFilterForm,
  DeathAnimalReportParams,
} from '@/@types/v2/DeathAnimalReport';

export default function DeathAnimalReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.deathAnimalReport.report;

  const buildPristineValues = (): DeathAnimalReportFilterForm => ({
    start_date: null,
    end_date: null,
    format: deathAnimalReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit } = useForm<DeathAnimalReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: deathAnimalReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: DeathAnimalReportFilterForm): DeathAnimalReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      report_type: data.format!.value,
    };
  }

  async function handleDownload(data: DeathAnimalReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadDeathAnimalReport(params);
      const extension = params.report_type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `relatorio-mortes.${extension}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `StockAbcReport`/`MortesSisbov`).
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
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={deathAnimalReportFormatOptions.options(languageGB)}
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
