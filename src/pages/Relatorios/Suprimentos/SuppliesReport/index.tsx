// src/pages/Relatorios/Suprimentos/SuppliesReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Suprimentos > Suprimentos" (F-325, `supplies-report`,
// execução CORE_WORKSPACE/97-Esteiras/015, Tarefa 52). Rota
// `/relatorios/suprimentos/supplies-report`, materializa o item de menu FILHO
// `rel-sup-supplies-report`, 5º filho do grupo `rel-sup` ("Suprimentos",
// `navigationTree.ts`) — mesmo label do grupo pai por fidelidade EXATA ao
// legado (`trad.suprimentos`, item-folha original antes de F-310 promover
// `rel-sup` a grupo) — NÃO é bug, não inventar label alternativo.
//
// Composição direta de 2 precedentes reais já em produção no MESMO submenu
// `rel-sup`, sobre a MESMA entidade `RequestPurchase`:
//   - `GerencialSolicitacoesRelatorio` (F-310) — casca EXATA: `FormContainer`
//     + `Form` + `SimpleGrid` (`columnsForm.fourColumns`) + footer com 2
//     `Button` independentes, `isDownloadingPdf`/`isDownloadingExcel` via
//     `useState` (NUNCA `useMutation`/`useRequest` para download binário —
//     convenção desta família de telas), `/options` combinado num único
//     `useQuery`, `parseBlobError` com prioridade a mensagem de campo.
//   - `SavingsRelatorio` (F-319) — técnica EXATA do PDF INLINE:
//     `URL.createObjectURL(blob)` + `window.open(url, '_blank')` (SEM 3º
//     argumento `noopener,noreferrer` — `blob:` de mesma origem, tabnabbing
//     não se aplica) + `toaster.error` quando `window.open` retorna `null`.
//     Excel via `downloadBlob` (mirror `GerencialSolicitacoes`). Boundary
//     `toSuppliesReportParams()` dedicada — a página NUNCA remonta chaves
//     inline.
//
// DIFERENÇA DELIBERADA dos 2 precedentes: NENHUM dos 8 campos é obrigatório
// (Riscos #4 da Tarefa 52) — os 2 botões NÃO ficam `disabled` por falta de
// preenchimento, só enquanto uma das 2 mutações está em voo
// (`isDownloadingPdf || isDownloadingExcel`).
//
// `/options` combinado SUBSTITUI os catálogos locais de status/priority
// (Riscos #2) — `optionsQuery.data?.statuses`/`.priorities`, NUNCA
// `requestPurchaseStatusOptions`/`requestPurchasePriorityOptions`
// (`src/constants/RequestPurchases/options/*`, usados só pelo CRUD
// "Solicitação"). `number` é STRING crua sem máscara (Riscos #6) — `Input`
// puro, sem `InputMask` (CL-05, exact-match `where('code', $number)`).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { suppliesReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/supplies-report-filter-schema';

import {
  downloadSuppliesReportExcel,
  downloadSuppliesReportPdf,
  getSuppliesReportOptions,
  toSuppliesReportParams,
} from '@/services/v2/Relatorios/supplies-report-service';

import type { Option } from '@/@types/option';
import type { SuppliesReportFormValues } from '@/@types/v2/Relatorios/suppliesReport';

const pristineValues: SuppliesReportFormValues = {
  farm_uuid: null,
  user_uuid: null,
  authorizer_uuid: null,
  status: null,
  priority: null,
  number: null,
  start_date: null,
  end_date: null,
};

export default function SuppliesReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.suppliesReport.report;

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<SuppliesReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: suppliesReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Único `useQuery` para os 5 lookups combinados (farms/requesters/
  // authorizers/statuses/priorities) — mirror EXATO `GerencialSolicitacoesRelatorio`/
  // `SavingsRelatorio`. NUNCA 5 chamadas separadas.
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.suppliesReportOptions],
    queryFn: getSuppliesReportOptions,
  });

  const farmOptions: Option<string>[] = (optionsQuery.data?.farms ?? []).map((farm) => ({
    value: farm.uuid,
    label: farm.description,
  }));
  const requesterOptions: Option<string>[] = (optionsQuery.data?.requesters ?? []).map(
    (requester) => ({ value: requester.uuid, label: requester.name })
  );
  const authorizerOptions: Option<string>[] = (optionsQuery.data?.authorizers ?? []).map(
    (authorizer) => ({ value: authorizer.uuid, label: authorizer.name })
  );
  const statusOptions = optionsQuery.data?.statuses ?? [];
  const priorityOptions = optionsQuery.data?.priorities ?? [];

  // `responseType:'blob'` entrega o corpo do erro 422/403 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `GerencialSolicitacoes`/
  // `Savings`).
  async function notifyDownloadError(error: unknown) {
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
  }

  // `toSuppliesReportParams()` é SEMPRE a 1ª linha do corpo dos 2 handlers —
  // a página NUNCA repassa os valores crus do form nem remonta chaves inline.
  async function handleDownloadPdf(values: SuppliesReportFormValues) {
    const params = toSuppliesReportParams(values);
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadSuppliesReportPdf(params);
      // PDF é INLINE (`GbCerneSnappyReport::inline(...)` na API) — NUNCA
      // `downloadBlob`, mirror `Savings`. SEM 3º argumento em `window.open`
      // — `blob:` é mesma origem, tabnabbing não se aplica.
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  async function handleDownloadExcel(values: SuppliesReportFormValues) {
    const params = toSuppliesReportParams(values);
    setIsDownloadingExcel(true);
    try {
      const blob = await downloadSuppliesReportExcel(params);
      downloadBlob(blob, `${text.pageTitle.toLowerCase()}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsDownloadingExcel(false);
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
            variant="outline"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isDownloadingPdf}
            disabled={isDownloadingPdf || isDownloadingExcel}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isDownloadingExcel}
            disabled={isDownloadingPdf || isDownloadingExcel}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="farm_uuid"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farmUuid}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={farmOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="user_uuid"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.userUuid}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={requesterOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="authorizer_uuid"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.authorizerUuid}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={authorizerOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  placeholder={text.statusPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                  options={statusOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.priority}
                  placeholder={text.priorityPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                  options={priorityOptions}
                  loading={optionsQuery.isPending}
                />
              )}
            />

            {/* `number` — STRING crua, SEM máscara (Riscos #6/CL-05):
                exact-match contra `code` no backend. `Input` puro, nunca
                `InputMask`. */}
            <Input label={text.fields.number} {...register('number')} />

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
