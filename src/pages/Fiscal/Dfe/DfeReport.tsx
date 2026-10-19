// src/pages/Fiscal/Dfe/DfeReport.tsx
// -----------------------------------------------------------------------------
// Tela de Relatório "DFe/Lançadas" (Dfe — domínio Fiscal, execução 044,
// TASK-DFE-FE-10; refatoração de casco na execução 061, ROTEIRO-061 — F-255
// ficou órfã da padronização de relatórios da execução 060). Filtros
// (Emissor OBRIGATÓRIO — diferente do index, `FIL-10`) + geração síncrona
// (`GET /dfes-report`, `GAP-DFE-02` opção A, `DECISOES-DONO.md`). PDF abre em
// nova aba (blob URL); Excel dispara download nomeado (`downloadBlob`,
// mirror `NfseRecebidas`). Cast de `launched` para '1'/'0' PRESERVADO
// (fix 5d625d9a — nunca enviar boolean cru nem 'true'/'false').
//
// Casco-padrão de relatório (execução 061, mirror ESTRUTURAL de
// `Relatorios/Financeiro/ContasTributarias/index.tsx` e
// `Relatorios/Estoque/WeighingStockClientReport/index.tsx`): `FormContainer`
// (título+subtítulo+ação no header) + `Form` (onSubmit preventDefault) +
// `SimpleGrid columns={columnsForm.default}` para os filtros — em vez da
// antiga coluna única `VStack maxW="640px"`.
//
// DIFERENÇA MANTIDA vs os 2 mirrors acima: esta tela usa `useMutation`
// (resposta binária síncrona), NÃO o padrão `useState isDownloading` deles —
// preservação deliberada do comportamento já aprovado (PDF abre em nova aba
// via blob URL; Excel via `downloadBlob`), não um novo "download simples".
//
// Sem grid/tabela nesta tela: PDF/Excel são artefatos externos gerados pelo
// backend (`LST-17..28` do legado descrevem colunas DO ARQUIVO, não uma
// tabela React) — `CONTRATO-TELA-DFE-FE.md` "Estados de UI".
// -----------------------------------------------------------------------------

import { Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { columnsForm } from '@/constants/coluns-form';
import { boolean } from '@/constants/options/boolean';
import { queryKey } from '@/constants/query-key';

import { listDfesForReport } from '@/services/v2/Fiscal/dfe-service';
import { getIssuerReportOptions } from '@/services/v2/Issuers/issuer-service';

import type { Option } from '@/@types/option';
import type { DfeReportFilterForm } from '@/@types/v2/Fiscal/dfe';
import type { NfeIssuerOption } from '@/@types/v2/Nfes';

// Mirror EXATO `GestaoFiscal/Faturamento/index.tsx::issuerOptionLabel` —
// mesma prioridade de campo (razão social → nome fantasia → uuid).
function issuerOptionLabel(issuer: NfeIssuerOption): string {
  return issuer.razao_social ?? issuer.nome_fantasia ?? issuer.uuid;
}

interface DfeReportFormValues {
  issue_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  launch_start_date: string | null;
  launch_end_date: string | null;
  launched: Option<boolean> | null;
  type: Option<0 | 1>;
}

export default function DfeReport() {
  const { languageGB } = useLanguage();
  const text = languageGB.dfes.dfe.report;

  const reportTypeOptions: Option<0 | 1>[] = [
    { label: text.reportTypeOptions.pdf, value: 0 },
    { label: text.reportTypeOptions.excel, value: 1 },
  ];
  const launchedOptions = boolean.options(languageGB);

  const { control, handleSubmit, watch } = useForm<DfeReportFormValues>({
    defaultValues: {
      issue_uuid: null,
      start_date: null,
      end_date: null,
      launch_start_date: null,
      launch_end_date: null,
      launched: null,
      type: reportTypeOptions[0],
    },
  });

  const issuerOption = watch('issue_uuid');

  // Emissor — PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.7/§3 F-255 — troca
  // `listIssuers` (`/issuers`, CRUD paginado, vê TODOS os emissores do
  // tenant sem elegibilidade por fazenda) por `/issuers/report-options`
  // (tenant + `is_enabled` + pivot farm, SEM `issues_nfe`), mesmo lookup
  // convergente de `GestaoFiscal/Faturamento` — `useOptionsSelectQuery` +
  // `Select` estático (universo pequeno, busca client-side no componente).
  const issuerQuery = useOptionsSelectQuery({
    asyncFunction: () => getIssuerReportOptions().then((response) => response.data),
    queryKey: queryKey.issuers.reportOptions,
    mapOption: (issuer: NfeIssuerOption) => ({
      value: issuer.uuid,
      label: issuerOptionLabel(issuer),
    }),
  });

  // `useMutation` direto — resposta binária (pdf|xlsx conforme `type`),
  // síncrona (GAP-DFE-02 opção A). TODO GAP-DFE-02: se o dono decidir
  // assíncrono (opção B/C), o endpoint passa a devolver 202 + uuid de job —
  // trocar este ponto por polling (`get_spa_api_client_pattern §4`,
  // `refetchInterval` até `is_terminal`) sem reescrever o resto da tela.
  const reportMutation = useMutation({
    mutationFn: (params: DfeReportFilterForm) => listDfesForReport(params),
    onSuccess: (blob, variables) => {
      if (variables.type === 0) {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, `dfe-relatorio-${variables.issue_uuid}.xlsx`);
      }

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.errorToast,
      });
    },
  });

  function onSubmit(data: DfeReportFormValues) {
    if (!data.issue_uuid?.value) {
      toaster.warning({ title: text.pageTitle, description: text.issuerRequiredError });
      return;
    }

    reportMutation.mutate({
      issue_uuid: data.issue_uuid.value,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      launch_start_date: data.launch_start_date || undefined,
      launch_end_date: data.launch_end_date || undefined,
      // '1'/'0' — NUNCA o boolean cru nem a string 'true'/'false' (axios
      // serializa a query com essa string literal, que a regra Laravel
      // `boolean` rejeita com 422 — mesmo bug já corrigido em F-240).
      launched: data.launched ? (data.launched.value ? '1' : '0') : undefined,
      type: data.type.value,
    });
  }

  const isGenerating = reportMutation.isPending;

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={!issuerOption?.value || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Controller
              name="issue_uuid"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  label={text.fields.issuer}
                  placeholder={text.fields.issuerPlaceholder}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={issuerQuery.options}
                  loading={issuerQuery.isLoading}
                  isRequired
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.dateEmissionFrom}
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isGenerating}
                />
              )}
            />

            <Controller
              name="end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.dateEmissionTo}
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isGenerating}
                />
              )}
            />

            <Controller
              name="launch_start_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.dateLaunchFrom}
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isGenerating}
                />
              )}
            />

            <Controller
              name="launch_end_date"
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateInput
                  label={text.fields.dateLaunchTo}
                  value={value ?? null}
                  onChange={onChange}
                  disabled={isGenerating}
                />
              )}
            />

            <Controller
              name="launched"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.launched}
                  placeholder={text.fields.launchedAll}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={launchedOptions}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.reportType}
                  name={name}
                  value={value}
                  onChange={onChange}
                  options={reportTypeOptions}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
          </SimpleGrid>

          {/* Lei de UX "nenhum estado silencioso" — chamada síncrona, pode demorar. */}
          {isGenerating && (
            <Text fontSize="sm" color="fg.muted">
              {text.loadingMessage}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
