// src/pages/Relatorios/Agricultura/DescarteRomaneio/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Agricultura > Descarte Romaneio" (F-256, execução
// 97-Esteiras/078, TASK-F256-F03). Rota
// `/relatorios/agricultura/descarte-romaneio`, materializa o item de menu
// FILHO `rel-agr-descarte-romaneio`, filho do grupo `rel-agr` ("Agricultura",
// `navigationTree.ts`) — irmão de "Pesagem Rodoviária" (fiel ao legado
// `#productionReport`/`sidebar.blade.php:2202`), NÃO Estoque.
//
// Mirror ESTRUTURAL de `Relatorios/Estoque/SaidasCentroCusto/index.tsx`
// (F-301) — casca `FormContainer` + footer, 2 botões PDF/Excel via
// `SimpleGrid`, `DateInput` via `Controller`. DIFERENÇA: apenas 1 select
// opcional (Área), não 3 (`center`/`warehouse`/`product`).
//
// 3 campos de filtro fiéis ao legado (contrato §Filtro): `start_date`/
// `end_date` OBRIGATÓRIOS, `area` opcional. `report_type` NÃO é um campo do
// form — os 2 botões do footer fixam o literal `pdf`/`excel` (FRONT-05,
// decisão já resolvida: 2 botões, não um Select "Tipo de Relatório").
//
// Endpoint DELIVERED (evidência viva `routes/api.php:2304`, reconciliação
// obrigatória do plano): `GET /discards-report` (raiz, NÃO `/reports/...`).
// Nome do arquivo Excel FIXO do legado: `relatorio_descarte_romaneio.xlsx`.
//
// `area` — `Select` (não `SelectAsyncPaginate`) alimentado por `useQuery`
// sobre `getAreasOptions()` (mirror EXATO `rainfall-service.ts`, endpoint
// genérico `GET /areas/options`, farm-scoped via header `X-Farm-Id`,
// resetado na troca de fazenda ativa, FRONT-15).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { discardsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/discards-report-filter-schema';

import { getAreasOptions } from '@/services/v2/Rainfalls/rainfall-service';
import {
  downloadDiscardsReportExcel,
  downloadDiscardsReportPdf,
  toDiscardsReportParams,
} from '@/services/v2/Relatorios/discards-report-service';

import type { Option } from '@/@types/option';
import type { AreaOptionItem } from '@/@types/v2/Rainfalls';
import type { DiscardsReportFormValues } from '@/@types/v2/Relatorios/discards-report';

const pristineValues: DiscardsReportFormValues = {
  start_date: null,
  end_date: null,
  area: null,
};

function mapAreaOption(item: AreaOptionItem): Option<string> {
  return { label: item.description, value: item.uuid };
}

export default function DescarteRomaneioRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.discardsReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DiscardsReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: discardsReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // `area` — lookup `-options` (farm-scoped via `X-Farm-Id`), mirror EXATO
  // `getAreasOptions()` já vivo em `rainfall-service.ts`.
  const areaQuery = useQuery({
    queryKey: [queryKey.relatorios.discardsReport, 'areas', activeFarmUuid],
    queryFn: () => getAreasOptions(),
  });
  useQueryError([areaQuery]);
  const areaOptions: Option<string>[] = (areaQuery.data ?? []).map(mapAreaOption);

  // Guardrail farm-scoped (FRONT-15) — `area` é resetada na troca de fazenda
  // ativa (mirror `filtro_farm_scoped_reset_na_troca_de_fazenda`): a seleção
  // anterior deixaria de existir no universo da nova fazenda e causaria
  // 422/lista estagnada.
  useEffect(() => {
    setValue('area', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `SaidasCentroCusto`).
  async function notifyDownloadError(error: unknown) {
    const parsed = await parseBlobError(error);
    const fieldMessage = parsed.errors
      ? Object.values(parsed.errors)
          .flat()
          .find((message): message is string => typeof message === 'string')
      : undefined;
    toaster.error({
      title: text.pageTitle,
      description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
    });
  }

  async function handleDownloadPdf(values: DiscardsReportFormValues) {
    const params = toDiscardsReportParams(values, 'pdf');
    setIsExportingPdf(true);
    try {
      const blob = await downloadDiscardsReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `SaidasCentroCusto`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: DiscardsReportFormValues) {
    const params = toDiscardsReportParams(values, 'excel');
    setIsExportingXlsx(true);
    try {
      const blob = await downloadDiscardsReportExcel(params);
      downloadBlob(blob, `${text.exportFileName}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
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
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
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

            <Controller
              name="area"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.area}
                  placeholder={text.areaPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={areaOptions}
                  loading={areaQuery.isFetching}
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
