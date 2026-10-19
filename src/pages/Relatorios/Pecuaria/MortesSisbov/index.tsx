// src/pages/Relatorios/Pecuaria/MortesSisbov/index.tsx
// -----------------------------------------------------------------------------
// Tela "Mortes/SISBOV — Relatório" (F-253, TASK-054-253-FE-02, esteira
// 97-Esteiras/054). Rota `/relatorios/pecuaria/mortes-sisbov`, materializa
// o item de menu FILHO `rel-pec-mortes-sisbov`, sob o grupo/submenu
// `rel-pec` ("Pecuária", `navigationTree.ts`).
//
// Mirror ESTRUTURAL EXATO de `Relatorios/Pecuaria/NascimentosSisbov/
// index.tsx` (irmão F-235) — FormContainer + footer, sem grid/prévia,
// download via Blob + `downloadBlob`, erro 422-como-Blob tratado via
// `parseBlobError`, prioriza a mensagem específica de `errors` por campo
// sobre o `message` genérico — divergindo DE PROPÓSITO só em:
//   (a) SÓ PDF — 1 botão, SEM Select de formato (roteiro-front-F253-
//       mortes-sisbov.md §"Contrato de tela": endpoint sempre PDF, sem
//       parâmetro `format`).
//   (b) AMBAS as datas são OPCIONAIS (mirror F-235/DEC-225 §7.3) — o
//       botão fica SEMPRE habilitado (exceto durante o próprio download).
//
// Diferente do irmão F-235 (sempre vazio), este endpoint retorna dados
// reais (21 mortes SISBOV) — mas essa divergência é 100% do backend; o
// front nunca lê o corpo do PDF, então o código é idêntico nos dois casos.
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

import { deathAnimalSisbovReportFilterSchemaResolver } from '@/validations/schemas/DeathAnimalSisbovReport/death-animal-sisbov-report-filter-schema';

import { downloadDeathAnimalSisbovReport } from '@/services/v2/DeathAnimalSisbovReport/death-animal-sisbov-report-service';

import type {
  DeathAnimalSisbovReportFilterForm,
  DeathAnimalSisbovReportParams,
} from '@/@types/v2/DeathAnimalSisbovReport';

const pristineValues: DeathAnimalSisbovReportFilterForm = {
  start_date: null,
  end_date: null,
};

export default function MortesSisbovRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.deathAnimalSisbovReport.report;

  const { control, handleSubmit } = useForm<DeathAnimalSisbovReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: deathAnimalSisbovReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: DeathAnimalSisbovReportFilterForm): DeathAnimalSisbovReportParams {
    return {
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    };
  }

  async function handleDownload(data: DeathAnimalSisbovReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadDeathAnimalSisbovReport(buildParams(data));
      downloadBlob(blob, 'relatorio-mortes-sisbov.pdf');
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror F-235/DRE).
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
