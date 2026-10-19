// src/pages/Relatorios/Pecuaria/MovimentacaoRebanho/index.tsx
// -----------------------------------------------------------------------------
// Tela "Movimentação/Rebanho — Relatório" (F-224, lote 076,
// `AnimalMovementReport-contrato.md` §"Leitura do dev"/§4.6). Rota
// `/relatorios/pecuaria/movimentacao-rebanho`, materializa o item de menu
// FILHO `rel-pec-mov`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`).
//
// Mirror ESTRUTURAL EXATO de `Relatorios/Pecuaria/DesempenhoPesagemConfinamento/
// index.tsx` (F-263, lote 076) — `FormContainer` + `footer` com 2 botões
// "Baixar PDF"/"Baixar Excel" independentes (`format` decidido pelo BOTÃO
// clicado, NÃO um campo do form, mirror `FiscalNaoFiscal`), loading POR
// BOTÃO, `downloadBlob` + `parseBlobError`, `responseType:'blob'`.
//
// Campos (mirror CL-06/FM-01/FM-02 do contrato legado, 2 REAIS na tela — o
// 3º campo do legado, "Tipo de Relatório", virou os 2 botões PDF/Excel
// acima, mirror `FiscalNaoFiscal`/`DesempenhoPesagemConfinamento`, sem
// select de formato):
//   - `harvest_uuid` — `Select` (options via `GET /animal-movements-report/
//     options`, mirror `Nascimentos`), ÚNICO campo obrigatório (CL-16 — o
//     único caminho funcional; gate "Selecione uma safra ou um mês." é
//     satisfeito exclusivamente por este campo, AF-02).
//   - `month` — `MonthInput` ('YYYY-MM'), campo PRESENTE por fidelidade
//     visual ao legado (CL-09/CL-13), mas NUNCA bloqueia o submit nem é
//     validado (`AnimalMovementReportRequest`, AF-02 — REPLICAR-IGNORAR: o
//     servidor aceita o campo mas nunca o lê). `minMonth` bem no passado
//     (sem restrição prática) — o legado nunca limitou o mês selecionável.
//
// SEM CASCATA entre `harvest_uuid`/`month` nesta migração — o legado tinha
// uma limpeza mútua puramente client-side (IG-01/IG-02, JS inline) que NÃO
// se aplica aqui: como `month` nunca participa da regra de negócio (AF-02),
// replicar aquele reset seria comportamento morto sem função, mirror da
// mesma tolerância já registrada para os quirks de engine legados
// (`AnimalMovementReport-contrato.md §3`, linha CL-41/CL-42).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { MonthInput } from '@/components/Form/MonthInput';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { animalMovementsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/animal-movements-report-filter-schema';

import {
  downloadAnimalMovementsReportPdf,
  downloadAnimalMovementsReportXlsx,
  getAnimalMovementsReportOptions,
} from '@/services/v2/Relatorios/animal-movements-report-service';

import type { Option } from '@/@types/option';
import type {
  AnimalMovementsReportFilterForm,
  AnimalMovementsReportParams,
} from '@/@types/v2/Relatorios/animal-movements-report';

// Mês MÍNIMO selecionável no `MonthInput` — bem no passado, sem restrição
// prática (o legado nunca limitou o mês selecionável nesta tela; `month` é
// campo inerte, AF-02).
const MONTH_INPUT_MIN = new Date(2000, 0, 1);

const pristineValues: AnimalMovementsReportFilterForm = {
  harvest_uuid: null,
  month: null,
};

export default function MovimentacaoRebanhoRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalMovementsReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnimalMovementsReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: animalMovementsReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  // Safras — `useQuery` cru (mirror `Nascimentos`): 1 único lookup sem
  // paginação, sem hook orquestrador dedicado; não há ID de contexto/edição,
  // é filtro efêmero de tela de relatório.
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.animalMovementsReportOptions],
    queryFn: getAnimalMovementsReportOptions,
  });

  const harvests = optionsQuery.data?.harvests ?? [];
  const harvestOptions: Option<string>[] = harvests.map((harvest) => ({
    value: harvest.uuid,
    label: harvest.label,
  }));

  const harvestValue = watch('harvest_uuid');
  // Botões desabilitados até a Safra estar selecionada — ÚNICO caminho
  // funcional (CL-16); `month` NUNCA conta para este gate (AF-02).
  const hasValidHarvest = !!harvestValue;

  function buildParams(
    data: AnimalMovementsReportFilterForm
  ): Omit<AnimalMovementsReportParams, 'format'> {
    return {
      harvest_uuid: data.harvest_uuid!.value,
      month: data.month || undefined,
    };
  }

  async function handleExportPdf(data: AnimalMovementsReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadAnimalMovementsReportPdf(buildParams(data));
      downloadBlob(blob, 'movimentacao-rebanho.pdf');
      toaster.success({ title: text.pageTitle, description: text.successToast });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `DesempenhoPesagemConfinamento`/`FiscalNaoFiscal`).
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

  async function handleExportXlsx(data: AnimalMovementsReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadAnimalMovementsReportXlsx(buildParams(data));
      downloadBlob(blob, 'movimentacao-rebanho.xlsx');
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
            disabled={!hasValidHarvest || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsxButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
            loading={isExportingXlsx}
            disabled={!hasValidHarvest || isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.twoColumns} gap={6}>
            <Controller
              name="harvest_uuid"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.harvest}
                  placeholder={text.harvestPlaceholder}
                  name={name}
                  isRequired
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option)}
                  options={harvestOptions}
                  loading={optionsQuery.isPending}
                  error={errors.harvest_uuid?.message}
                />
              )}
            />

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.month}
              </Text>
              <Controller
                name="month"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <MonthInput
                    value={value}
                    onChange={onChange}
                    placeholder={text.monthPlaceholder}
                    minMonth={MONTH_INPUT_MIN}
                  />
                )}
              />
            </Box>
          </SimpleGrid>

          {!hasValidHarvest && (
            <Text fontSize="sm" color="fg.muted">
              {text.harvestRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
