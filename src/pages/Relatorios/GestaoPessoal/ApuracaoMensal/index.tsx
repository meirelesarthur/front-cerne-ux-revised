// src/pages/Relatorios/GestaoPessoal/ApuracaoMensal/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (form de filtro → PDF em nova aba) de
// Apuração Mensal — Relatórios > Gestão Pessoal (TASK-07-57, feature F-285,
// `97-Esteiras/007`). Consome `GET /api/v1/monthly-calculation-report` (já
// pronto, TASK-07-34, DEC-DOM-19: SEM enforcement de permissão no servidor —
// fidelidade estrita ao legado `monthlycalculation.report`).
//
// PDF-ONLY — não confundir com Vacas Prenhas/Apontamento Máquina (aquelas
// features têm variante Excel; esta não tem, TASK-07-34 confirmou). "4
// variantes de layout" (Sintético/Analítico/Remessa Folha/Remessa Cheque)
// são inteiramente server-side, dentro do PDF — não há grid on-screen.
//
// SÍNTESE de precedentes (Referência UX, TASK-07-57):
//   - Casca visual: mirror `Relatorios/Pecuaria/{SanitarioLote,
//     EvolucaoRebanho}/index.tsx` (`FormContainer` + `footer` + `SimpleGrid`
//     de campos).
//   - Comportamento de export: mirror `Relatorios/Pecuaria/VacasPrenhas/
//     index.tsx` (ramo PDF) — UM ÚNICO botão "Gerar Relatório", `useMutation`
//     (TanStack), `URL.createObjectURL(blob)` + `window.open` (NUNCA
//     `downloadBlob`, que forçaria download e quebraria a fidelidade ao
//     `Content-Disposition: inline` do legado).
//   - Campos `month`/`year`/`type`: mirror EXATO de
//     `Administrativo/Earning/FilterSideEarning.tsx` (`MONTH_OPTIONS`,
//     `Input type="number"` para `year`, `TYPE_OPTIONS` — mesmos 3 labels,
//     não reinventar wording).
//   - `employees` (plural/multi, diferente do singular do CRUD de Earning):
//     mirror `Operacional/Separations/CreateOrUpdateSeparation.tsx::batches`
//     (`SelectAsyncPaginate isMulti` sobre `listEmployeeOptions`,
//     `value={field.value ?? []}` + `onChange={(options) => field.onChange(
//     options ?? [])}`).
//
// Botão habilitado só com os 3 campos obrigatórios preenchidos (`month`/
// `year`/`report_type`) — mirror `hasValidRange` de `VacasPrenhas`, adaptado
// para 3 campos em vez de intervalo de datas.
//
// Sem `RequirePermission` na ROTA (ver `router/index.tsx`, mirror
// `GAP-EVO-01`) — só o item de MENU é gateado (`earnings_view`,
// `navigationPermissions.ts`).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { columnsForm } from '@/constants/coluns-form';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import {
  downloadMonthlyCalculationReport,
  type MonthlyCalculationReportFilterParams,
} from '@/services/v2/Earnings/monthly-calculation-report-service';

import type { Option } from '@/@types/option';
import type { EmployeeOption } from '@/@types/v2/CadastrosBase/employee';

type ReportTypeValue = 1 | 2 | 3 | 4;
type EarningTypeValue = 'N' | 'A' | 'D';

// Form values desta tela (page-scoped) — `month`/`report_type`/`type` viram
// `Option<...>|null` (widgets Chakra), `employees` vira `Option<string>[]`
// (multi) e `year` fica número|string vazia do `<Input type="number">`
// (mirror EXATO `EarningImportModal.tsx::year`, `Number(event.target.value)
// || ''`) — todos convertidos para o payload flat
// `MonthlyCalculationReportFilterParams` no submit.
interface ApuracaoMensalReportFormValues {
  month: Option<number> | null;
  year: number | '';
  report_type: Option<ReportTypeValue> | null;
  type: Option<EarningTypeValue> | null;
  employees: Option<string>[];
}

const MONTH_OPTIONS: Option<number>[] = Array.from({ length: 12 }, (_, index) => ({
  label: String(index + 1).padStart(2, '0'),
  value: index + 1,
}));

const pristineFormValues: ApuracaoMensalReportFormValues = {
  month: null,
  year: '',
  report_type: null,
  type: null,
  employees: [],
};

export default function ApuracaoMensalRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.monthlyCalculationReport.report;

  const reportTypeOptions: Option<ReportTypeValue>[] = [
    { label: text.reportTypeOptions[1], value: 1 },
    { label: text.reportTypeOptions[2], value: 2 },
    { label: text.reportTypeOptions[3], value: 3 },
    { label: text.reportTypeOptions[4], value: 4 },
  ];

  const typeOptions: Option<EarningTypeValue>[] = [
    { label: text.typeOptions.N, value: 'N' },
    { label: text.typeOptions.A, value: 'A' },
    { label: text.typeOptions.D, value: 'D' },
  ];

  const { control, handleSubmit, watch } = useForm<ApuracaoMensalReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: pristineFormValues,
  });

  const monthValue = watch('month');
  const yearValue = watch('year');
  const reportTypeValue = watch('report_type');

  // Botão desabilitado até os 3 campos obrigatórios estarem preenchidos
  // (mirror `hasValidRange` de `VacasPrenhas`, adaptado para
  // month/year/report_type em vez de intervalo de datas).
  const hasRequiredFields = !!monthValue && !!yearValue && !!reportTypeValue;

  // `useMutation` direto (mirror `VacasPrenhas::reportMutation`) — resposta
  // binária PDF, síncrona, único formato (sem `type` decidindo formato como
  // em Vacas Prenhas — aqui `type` é só filtro de cálculo).
  const reportMutation = useMutation({
    mutationFn: (params: MonthlyCalculationReportFilterParams) =>
      downloadMonthlyCalculationReport(params),
    onSuccess: () => {
      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.errorToast,
      });
    },
  });

  function onSubmit(data: ApuracaoMensalReportFormValues) {
    downloadReport(data);
  }

  async function downloadReport(data: ApuracaoMensalReportFormValues) {
    const blob = await reportMutation.mutateAsync({
      month: data.month?.value as number,
      year: data.year as number,
      report_type: data.report_type?.value as ReportTypeValue,
      type: data.type?.value ?? undefined,
      employee_uuids: data.employees.length
        ? data.employees.map((employee) => employee.value)
        : undefined,
    });

    // Resposta `Content-Disposition: inline` — abre em nova aba, NUNCA
    // downloadBlob (forçaria download, quebrando a fidelidade ao
    // `target=_blank` do legado).
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
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
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={!hasRequiredFields || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Box>
              <Controller
                name="month"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filters.month}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={MONTH_OPTIONS}
                    isRequired
                    isDisabled={isGenerating}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Input
                    type="number"
                    name={field.name}
                    label={text.filters.year}
                    value={field.value}
                    onChange={(event) => field.onChange(Number(event.target.value) || '')}
                    isRequired
                    disabled={isGenerating}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="report_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filters.reportType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={reportTypeOptions}
                    isRequired
                    isDisabled={isGenerating}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.filters.type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    options={typeOptions}
                    isDisabled={isGenerating}
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="employees"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.employees}
                    service={listEmployeeOptions}
                    mapOptions={(item: EmployeeOption) => ({
                      label: item.name,
                      value: item.uuid,
                    })}
                    findParams={(search: string | { search: string }) => ({
                      search: typeof search === 'string' ? search : search.search,
                    })}
                    value={field.value ?? []}
                    onChange={(options: any) => field.onChange(options ?? [])}
                    isMulti
                    isReadOnly={isGenerating}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>
          </SimpleGrid>

          {!hasRequiredFields && (
            <Text fontSize="sm" color="fg.muted">
              {text.hint.requiredFieldsMissing}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
