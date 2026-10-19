// src/pages/Relatorios/Pecuaria/Desmamas/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatório de Desmamas" (F-333, esteira 97-Esteiras/060,
// ROTEIRO-F333-FRONT-desmamas-tela.md §3/§6). Relocação de navegação: o
// relatório de Desmama deixa de existir SÓ como modal em Operacional >
// Manejo > Desmama (`WeaningReportModal.tsx`, preservado intacto) e ganha
// tela dedicada em Relatórios > Pecuária, mirror EXATO dos demais
// relatórios download-only da família (molde de casca:
// `Relatorios/Pecuaria/AnaliseMovimentacaoLote/index.tsx`).
//
// Consome `GET /api/v1/weanings/report` via `downloadWeaningReport`
// (`@/services/v2/Weaning/weaning-service.ts` — SEM MUDANÇA), permissão
// `weaning-report_view` (rota + menu — o `anyOf` do nó pai `rel-pec` em
// `navigationPermissions.ts` já contém esse slug desde sempre; só o filho
// novo precisa do próprio gate).
//
// 3 campos, todos OBRIGATÓRIOS (mirror `WeaningController::report()`):
// `start_date`/`end_date`/`format` (`weaningReportFormatOptions`, enum
// explícito `'pdf'|'xlsx'`, NUNCA índice de array). SEM grid/prévia — só
// envia filtros e recebe o binário, sempre via download forçado (PDF e
// XLSX, mirror EXATO do modal atual — diferente de `AnaliseMovimentacaoLote`,
// que abre o PDF inline em nova aba).
//
// Erro tratado via `parseBlobError` (NÃO `extractApiErrorMessage`, que o
// modal usa hoje) — `responseType:'blob'` entrega o corpo do erro 422 como
// `Blob`, e `extractApiErrorMessage` não desempacota `Blob` (landmine
// conhecida do modal, ver §3.B do roteiro). Prioridade: 1ª mensagem
// ESPECÍFICA de `errors` por campo; só cai para `message` genérico quando
// não há erro de campo, mirror `AnaliseMovimentacaoLote`/`ContasTributarias`.
//
// `HeaderTable.tsx`/`WeaningReportModal.tsx` (Operacional > Desmama)
// permanecem INTOCADOS — o atalho por modal continua funcionando (decisão
// §5 do roteiro, default MANTER os dois caminhos).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, VStack } from '@chakra-ui/react';
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
import { weaningReportFormatOptions } from '@/constants/weaning/options/weaning-report-format-options';
import type { WeaningReportFormatValue } from '@/constants/weaning/options/weaning-report-format-options';

import { downloadWeaningReport } from '@/services/v2/Weaning/weaning-service';

import type { Option } from '@/@types/option';

interface DesmamasReportFormValues {
  start_date: string | null;
  end_date: string | null;
  format: Option<WeaningReportFormatValue> | null;
}

// Helper de extensão de arquivo — mirror `extensionFor` de
// `WeaningReportModal.tsx` (2 linhas, reaproveitado sem extrair util
// compartilhado, conforme §3.B do roteiro).
function extensionFor(format: WeaningReportFormatValue): string {
  return format === 'xlsx' ? 'xlsx' : 'pdf';
}

export default function DesmamasRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.weaning.weaning.report;

  // Ajuste UX (esteira 060): Formato já abre com "PDF" pré-selecionado, em
  // vez de "Selecione uma opção" — mirror `ContasTributarias`/
  // `AnaliseMovimentacaoLote` (`format`/`type` default `'pdf'`).
  const buildPristineValues = (): DesmamasReportFormValues => ({
    start_date: null,
    end_date: null,
    format: weaningReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit, watch } = useForm<DesmamasReportFormValues>({
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const format = watch('format');

  // Botão Download desabilitado até os 3 campos obrigatórios estarem
  // preenchidos, mesmo cálculo do modal atual (§3.D do roteiro — sem schema
  // Yup dedicado nesta tarefa cirúrgica).
  const canSubmit = !!startDate && !!endDate && !!format;

  async function handleDownload(data: DesmamasReportFormValues) {
    if (!data.start_date || !data.end_date || !data.format) return;

    setIsDownloading(true);
    try {
      const blob = await downloadWeaningReport({
        start_date: data.start_date,
        end_date: data.end_date,
        format: data.format.value,
      });

      // Sempre força download (PDF e XLSX) — pós-migração F-333, nunca abre
      // em nova aba, mirror EXATO do modal atual (§3.A do roteiro).
      downloadBlob(blob, `relatorio-desmama.${extensionFor(data.format.value)}`);

      toaster.success({ title: text.title, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro como `Blob` —
      // `parseBlobError` desempacota o envelope real `{message, errors}`
      // (mirror `AnaliseMovimentacaoLote`/`ContasTributarias`; NÃO
      // `extractApiErrorMessage`, landmine do modal que não lê `Blob`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.title,
        description: fieldMessage ?? parsed.message ?? text.errorToast,
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <FormContainer
      title={text.title}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={isDownloading || !canSubmit}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.startDate}
                  isRequired
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isDownloading}
                />
              )}
            />

            <Controller
              name="end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.endDate}
                  isRequired
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isDownloading}
                />
              )}
            />

            <Box>
              <Controller
                name="format"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.format}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={weaningReportFormatOptions.options(languageGB)}
                    noClearable
                    isDisabled={isDownloading}
                  />
                )}
              />
            </Box>
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
