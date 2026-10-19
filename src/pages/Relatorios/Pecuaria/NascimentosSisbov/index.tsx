// src/pages/Relatorios/Pecuaria/NascimentosSisbov/index.tsx
// -----------------------------------------------------------------------------
// Tela "Nascimentos/SISBOV — Relatório" (F-235, TASK-052-235-FE-02, esteira
// 97-Esteiras/052). Rota `/relatorios/pecuaria/nascimentos-sisbov`,
// materializa o item de menu FILHO `rel-pec-nascimentos-sisbov`, sob o
// grupo/submenu `rel-pec` ("Pecuária", `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/Dre/index.tsx` (FormContainer
// + footer, sem grid/prévia, download via Blob + `downloadBlob`, erro
// 422-como-Blob tratado via `parseBlobError`, prioriza a mensagem
// específica de `errors` por campo sobre o `message` genérico) — divergindo
// DE PROPÓSITO em dois pontos:
//   (a) SÓ PDF — 1 botão, SEM Select de formato (roteiro-front-F235-
//       nascimentos-sisbov.md §"Contrato de tela": endpoint sempre PDF,
//       sem parâmetro `format`).
//   (b) AMBAS as datas são OPCIONAIS (fidelidade adjudicada DEC-225 §7.3) —
//       diferente da DRE (par sempre obrigatório). O botão fica SEMPRE
//       habilitado (exceto durante o próprio download); não há hint de
//       "período obrigatório".
//
// PDF vazio é resposta VÁLIDA (200 com corpo pequeno, período sem
// nascimentos) — `downloadBlob` roda normalmente, NUNCA é tratado como erro.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { birthAnimalSisbovReportFilterSchemaResolver } from '@/validations/schemas/BirthAnimalSisbovReport/birth-animal-sisbov-report-filter-schema';

import { downloadBirthAnimalSisbovReport } from '@/services/v2/BirthAnimalSisbovReport/birth-animal-sisbov-report-service';

import type {
  BirthAnimalSisbovReportFilterForm,
  BirthAnimalSisbovReportParams,
} from '@/@types/v2/BirthAnimalSisbovReport';

const pristineValues: BirthAnimalSisbovReportFilterForm = {
  start_date: null,
  end_date: null,
};

export default function NascimentosSisbovRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.birthAnimalSisbovReport.report;

  const { control, handleSubmit } = useForm<BirthAnimalSisbovReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: birthAnimalSisbovReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: BirthAnimalSisbovReportFilterForm): BirthAnimalSisbovReportParams {
    return {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
  }

  async function handleDownload(data: BirthAnimalSisbovReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadBirthAnimalSisbovReport(buildParams(data));
      // PDF pode vir vazio (período sem nascimentos) — isso é FIEL
      // (DEC-225), sempre baixa o Blob normalmente, nunca é erro.
      downloadBlob(blob, 'relatorio-nascimentos-sisbov.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror DRE).
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
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
