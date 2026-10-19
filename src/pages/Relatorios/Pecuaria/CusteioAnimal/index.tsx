// src/pages/Relatorios/Pecuaria/CusteioAnimal/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) "Custeio/Animal" — Relatórios > Pecuária
// (F-248, TASK-CA-FE-01, esteira 075, `CusteioAnimal-contrato-front.md
// §4/§5`). Mirror ESTRUTURAL EXATO de `Relatorios/Pecuaria/CusteioLote/
// index.tsx` (mesma dupla de botões `Baixar PDF`/`Baixar Excel` via
// `downloadBlob`, loading POR BOTÃO independente, `try/catch/finally`,
// casca `FormContainer` + `<Form>` cru + `SimpleGrid`, `D-FE-14` — SEM
// `<Form formFilter>`, esse modo é do drawer de filtro de GRID), trocando o
// campo `batches` (multiselect de Lote, OPCIONAL) por `animal` (single-
// select, OBRIGATÓRIO).
//
// `animal` reusa `listAnimalOptions` (`@/services/v2/Animals/animal-service`)
// DIRETO — já é PAGINADO de verdade, sem precisar do wrapper `ForForm` que
// `batches` usa (`listBatchOptionsForForm`, que adapta um endpoint flat).
//
// `type` vai como STRING (`'pdf'`/`'excel'`) implícito por botão — mirror
// exato do irmão, NÃO reproduz índice numérico legado.
//
// Nome de arquivo do PDF/Excel CORRIGIDO em relação ao legado
// (`custeio_area.pdf`): aqui é `custeio-animal.pdf`/`custeio-animal.xlsx`
// (contrato de tela §4, "Riscos" item 2) — NÃO copiar `custeio-lote.*` do
// irmão.
//
// `hasValidRange` aqui inclui `animal` (diferente do irmão, onde `batches`
// é opcional e não entra no gate) — os 2 botões só habilitam com
// animal+start_date+end_date preenchidos.
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

import { costingAnimalReportFilterSchema } from '@/validations/schemas/Relatorios/costing-animal-report-filter-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import {
  downloadCusteioAnimalReportPdf,
  downloadCusteioAnimalReportXlsx,
} from '@/services/v2/Relatorios/costing-animal-report-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';

// Form values desta tela (page-scoped, não compartilhado). `animal` é
// `Option<string> | null` (widget `SelectAsyncPaginate` SINGLE, sem
// `isMulti`); vira `animal: string` no payload real do service
// (`CusteioAnimalReportParams`).
interface CusteioAnimalReportFilterForm {
  animal: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
}

const pristineValues: CusteioAnimalReportFilterForm = {
  animal: null,
  start_date: null,
  end_date: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado em `CusteioLote/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function CusteioAnimalRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.costingAnimalReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CusteioAnimalReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(costingAnimalReportFilterSchema(languageGB)) as any,
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const animalValue = watch('animal');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até animal+as 2 datas estarem preenchidos (mirror
  // `hasValidRange` de `CusteioLote`, ESTENDIDO com `animal` porque aqui o
  // campo é obrigatório — diferente do irmão, onde `batches` é opcional e
  // não entra no gate). A validação `end_date >= start_date` e a presença
  // de `animal` ficam a cargo do schema Yup no submit.
  const hasValidRange = !!animalValue && !!startDateValue && !!endDateValue;

  function buildParams(data: CusteioAnimalReportFilterForm) {
    return {
      animal: data.animal?.value as string,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleExportPdf(data: CusteioAnimalReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadCusteioAnimalReportPdf(buildParams(data));
      downloadBlob(blob, 'custeio-animal.pdf');
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

  async function handleExportXlsx(data: CusteioAnimalReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadCusteioAnimalReportXlsx(buildParams(data));
      downloadBlob(blob, 'custeio-animal.xlsx');
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
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
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
              name="animal"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.animal}
                  placeholder={text.animalPlaceholder}
                  service={listAnimalOptions}
                  mapOptions={(item: AnimalOptionListItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  error={errors.animal?.message as string | undefined}
                  isRequired
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
