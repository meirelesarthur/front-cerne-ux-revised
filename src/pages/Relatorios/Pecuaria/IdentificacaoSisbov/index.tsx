// src/pages/Relatorios/Pecuaria/IdentificacaoSisbov/index.tsx
// -----------------------------------------------------------------------------
// Tela "Identificação/SISBOV — Relatório" (F-270, esteira 97-Esteiras/078,
// TASK-F270-F03, CONTRATOS/F-270-contrato-legado.md). Rota
// `/relatorios/pecuaria/identificacao-sisbov`, materializa o item de menu
// FILHO `rel-pec-identificacao-sisbov`, sob o grupo/submenu `rel-pec`
// ("Pecuária", `navigationTree.ts`), ao lado dos irmãos
// `rel-pec-nascimentos-sisbov`/`rel-pec-mortes-sisbov`.
//
// Mirror ESTRUTURAL de `Relatorios/Pecuaria/NascimentosSisbov/index.tsx`
// (F-235, mesma família SISBOV) — mesma casca `FormContainer` + footer,
// `SimpleGrid columns={columnsForm.default}`, 2 `DateInput` via `Controller`,
// 1 botão único "Baixar PDF" (`downloadBlob`), erro 422-como-Blob tratado via
// `parseBlobError` (prioriza a mensagem específica de `errors` por campo
// sobre o `message` genérico). SEM `useQuery`/query-key — download puro com
// `useState` de loading (mirror EXATO do sibling SISBOV verificado).
//
// DIVERGE DE PROPÓSITO do sibling `NascimentosSisbov` em 1 ponto (contrato
// F-270 §Decisões — datas OBRIGATÓRIAS, FormRequest): AMBAS as datas exibem
// asterisco + erro por campo (`errors.start_date?.message` /
// `errors.end_date?.message`), mirror EXATO de
// `Relatorios/Pecuaria/DeathAnimalReport/index.tsx` /
// `Relatorios/Estoque/RequisicaoSaida/index.tsx` — NÃO copiar o
// comportamento "sempre habilitado, sem erro por campo" do irmão Nascimentos
// (que é fiel a datas opcionais, DEC-225 §7.3, caso distinto deste).
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

import { identificationAnimalSisbovReportFilterSchemaResolver } from '@/validations/schemas/IdentificationAnimalSisbovReport/identification-animal-sisbov-report-filter-schema';

import { downloadIdentificationAnimalSisbovReport } from '@/services/v2/IdentificationAnimalSisbovReport/identification-animal-sisbov-report-service';

import type {
  IdentificationAnimalSisbovReportFilterForm,
  IdentificationAnimalSisbovReportParams,
} from '@/@types/v2/IdentificationAnimalSisbovReport';

const pristineValues: IdentificationAnimalSisbovReportFilterForm = {
  start_date: null,
  end_date: null,
};

export default function IdentificacaoSisbovRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.identificationAnimalSisbovReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IdentificationAnimalSisbovReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: identificationAnimalSisbovReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(
    data: IdentificationAnimalSisbovReportFilterForm
  ): IdentificationAnimalSisbovReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
    };
  }

  async function handleDownload(data: IdentificationAnimalSisbovReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadIdentificationAnimalSisbovReport(buildParams(data));
      downloadBlob(blob, 'identificacao-sisbov.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `NascimentosSisbov`/`DeathAnimalReport`).
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
              {errors.start_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_date?.message}
                </Text>
              )}
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
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
