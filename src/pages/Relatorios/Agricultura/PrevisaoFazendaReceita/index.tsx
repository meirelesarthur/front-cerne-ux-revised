// src/pages/Relatorios/Agricultura/PrevisaoFazendaReceita/index.tsx
// -----------------------------------------------------------------------------
// Tela "Previsão Fazenda/Receita — Relatório" (F-281, execução 055, roteiro-
// front-F281-prev-fazenda-receita.md, TASK-055-F281-FRONT-02). Rota
// `/relatorios/agricultura/previsao-fazenda-receita`, item de menu FILHO
// `rel-agr-pfr` sob o grupo `rel-agr` ("Agricultura", navigationTree.ts).
//
// Molde ESTRUTURAL (roteiro §1 "Passo UX"): `PesagensColheita/index.tsx`
// (download-only agrícola, `useState(isDownloading)` + `downloadBlob`, NUNCA
// `useMutation` para binário) + `ContasAPagar/index.tsx` (tratamento de erro
// `parseBlobError`, prioridade à mensagem de campo sobre a genérica). DS
// `cerne` não tem página 1:1 desta feature nem molde download-only sem
// prévia/Excel (`ReportWorkspace` assume ambos) — UX-GAP-F281-01 registrado
// no roteiro, não trava; padrão governante é o exemplar SPA acima
// (precedência do task-packet).
//
// DIVERGE de `PesagensColheita`/`ContasAPagar` DE PROPÓSITO:
//   - **Sem campo `format`** (FID-G3F CL-031/RN-19) — endpoint é SÓ PDF; o
//     molde SPA hoje sempre expõe PDF×Excel, mas o legado desta tela nunca
//     ofereceu Excel. Divergência declarada, fiel ao legado.
//   - **Todos os 6 filtros são opcionais** (RN-01: submit vazio gera PDF) —
//     SEM `hasValidRange` bloqueando o botão (diferente de Pesagens/
//     Colheita, que exige o par de datas). Botão desabilitado só durante o
//     download.
//   - **`cultivation`** via `SelectCultivation` (grupo Cultura + folha
//     Variedade, componente já existente) — filtra por uuid da variedade.
//   - **`forecast`** ("Colheita 1ª/2ª/3ª") via fábrica local
//     `harvestOrderOptions`, CORRIGINDO o espanhol fixo do legado (FID-G3F
//     CL-016/RN-13) — traduzido nos 3 idiomas.
//   - **`week`/`year`** — `Input` numérico (`type="number"`), mirror
//     `FilterSideMarking.tsx::week` (mesmo domínio "Marcação"), D-FRONT-1
//     (campo `year` incluído, fiel ao form legado de 6 campos; `harvest` NÃO
//     vira campo — o form legado não o expõe).
//
// Sem grid/tabela de prévia — só o form de filtros + botão único "Gerar
// PDF" (o binário é gerado 100% no servidor, `responseType:'blob'`
// obrigatório). Nome do arquivo baixado: `previsao-fazenda-receita.pdf`
// (D-FRONT-2).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectCultivation } from '@/components/Form/SelectCultivation';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { harvestOrderOptions } from '@/constants/Relatorios/markings-farm-forecast-report/options/harvest-order-options';

import { markingsFarmForecastReportFilterSchemaResolver } from '@/validations/schemas/MarkingsFarmForecastReport/markings-farm-forecast-report-filter-schema';

import { downloadMarkingsFarmForecastReport } from '@/services/v2/MarkingsFarmForecastReport/markings-farm-forecast-report-service';

import type {
  MarkingsFarmForecastReportFilterForm,
  MarkingsFarmForecastReportParams,
} from '@/@types/v2/MarkingsFarmForecastReport';

const DOWNLOAD_FILENAME = 'previsao-fazenda-receita.pdf';

const pristineValues: MarkingsFarmForecastReportFilterForm = {
  start_date: null,
  end_date: null,
  cultivation: null,
  forecast: null,
  week: null,
  year: null,
};

function buildParams(data: MarkingsFarmForecastReportFilterForm): MarkingsFarmForecastReportParams {
  return {
    start_date: data.start_date || undefined,
    end_date: data.end_date || undefined,
    cultivation: data.cultivation?.value || undefined,
    forecast: data.forecast?.value ?? undefined,
    week: data.week ?? undefined,
    year: data.year ?? undefined,
  };
}

export default function PrevisaoFazendaReceitaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.markingsFarmForecastReport.report;

  const { control, handleSubmit } = useForm<MarkingsFarmForecastReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: markingsFarmForecastReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(data: MarkingsFarmForecastReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadMarkingsFarmForecastReport(params);
      downloadBlob(blob, DOWNLOAD_FILENAME);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO
      // `PesagensColheita`/`ContasAPagar`).
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
            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <DateInput
                  label={text.fields.startDate}
                  value={value ?? null}
                  onChange={onChange}
                  error={error?.message}
                />
              )}
            />

            <Controller
              name="end_date"
              control={control}
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <DateInput
                  label={text.fields.endDate}
                  value={value ?? null}
                  onChange={onChange}
                  error={error?.message}
                />
              )}
            />

            <Controller
              name="cultivation"
              control={control}
              render={({ field }) => (
                <SelectCultivation
                  name={field.name}
                  label={text.fields.cultivation}
                  placeholder={text.cultivationPlaceholder}
                  value={field.value ?? null}
                  onChange={(option) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="forecast"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.forecast}
                  placeholder={text.forecastPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={harvestOrderOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="week"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Input
                  type="number"
                  min={1}
                  max={53}
                  name={name}
                  label={text.fields.week}
                  error={error?.message}
                  value={value ?? ''}
                  onChange={(event) =>
                    onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              )}
            />

            <Controller
              name="year"
              control={control}
              render={({ field: { name, value, onChange }, fieldState: { error } }) => (
                <Input
                  type="number"
                  min={1000}
                  max={9999}
                  name={name}
                  label={text.fields.year}
                  error={error?.message}
                  value={value ?? ''}
                  onChange={(event) =>
                    onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
