// src/pages/Relatorios/Financeiro/JurosRecebidos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Juros Recebidos — Relatório" (esteira 97-Esteiras/014, Tarefa 49).
// Rota `/relatorios/financeiro/juros-recebidos`, materializa o item de menu
// FILHO NOVO `rel-fin-juros-recebidos`, sob o grupo/submenu `rel-fin`
// ("Financeiro", `navigationTree.ts`), logo após `rel-fin-juros-pagos`.
//
// Composição de 2 precedentes diretos já em produção (contrato de tela
// `frontend-contract-juros-recebidos.md §1/§3`, sem página-modelo dedicada
// no Storybook `cerne` — UX-GAP parcial, não bloqueante):
//   1. `Relatorios/Financeiro/JurosPagos/index.tsx` (F-290) — técnica do
//      campo Proprietário FARM-SCOPED (`SelectAsyncPaginate` +
//      `listProprietaryOptionsFarmScoped` local + `cacheUniqs={[activeFarmUuid]}`
//      + reset no `useEffect` de troca de fazenda ativa) e do campo Fazenda
//      (`Select` estático + `useQuery` sobre `listFarms()`, `/farms/current-
//      tenant`, NÃO `getMyFarms()`).
//   2. `Relatorios/Financeiro/AgendaRecebimentos/index.tsx` (F-304) — técnica
//      do campo Clientes (`CheckboxListField` remoto via
//      `useOptionsChecklistQuery` + `listClientOptions`), do campo Formato
//      (`Select` + `reportFormatOptions`, default `pdf`, `noClearable`) e do
//      dispatch de `useMutation` (`onSuccess(blob, variables)` decidindo
//      `window.open` inline para `pdf` vs `downloadBlob` para `xlsx`).
//
// Datas OBRIGATÓRIAS (`api-contract-juros-recebidos.md §3`) — diverge de
// `AgendaRecebimentos` (datas opcionais) e mirror `JurosPagos`
// (`hasValidRange` desabilita o botão "Gerar relatório").
//
// `proprietary_uuid` (DEC-043, `GAP-JR-01`): campo renderizado e wireado
// NORMALMENTE, enviado à API como qualquer outro filtro — a API o valida mas
// NUNCA o aplica à query (réplica intencional do defeito legado). Esta tela
// NÃO adiciona nenhum indicador visual de "filtro sem efeito" — fora do
// escopo desta Tarefa (contrato de tela §Pendências).
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Gerar
// relatório" (`SURF-GRID-001`, D1 do contrato de API: tabela só existe
// dentro do PDF/XLSX exportado).
//
// Resposta é SEMPRE `responseType:'blob'`, inclusive erro 422 — tratado via
// `parseBlobError` (NUNCA `extractApiErrorMessage`, que não sabe ler `Blob`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { receivedInterestReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/received-interest-report-filter-schema';

import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import {
  listProprietaryOptions,
  type ProprietaryOption,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  downloadReceivedInterestReport,
  type ReceivedInterestReportParams,
} from '@/services/v2/Relatorios/received-interest-report-service';

import type { LanguageDate } from '@/@types/language';
import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { ReportFormat } from '@/@types/v2/AccountsReports';
import type { FarmRef } from '@/@types/v2/Farms';

interface JurosRecebidosFilterForm {
  client_uuids: string[];
  proprietary_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  farm_uuid: Option<string> | null;
  format: Option<ReportFormat> | null;
}

function buildPristineValues(languageGB: LanguageDate): JurosRecebidosFilterForm {
  return {
    client_uuids: [],
    proprietary_uuid: null,
    start_date: null,
    end_date: null,
    farm_uuid: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `JurosPagos/index.tsx`/`ExportCPagarReceberDominio.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

interface ListProprietaryOptionsParams extends PaginationQueryParams {
  search?: string;
}

// Adapta `listProprietaryOptions` (array direto, sem paginação real) ao
// contrato `service` de `SelectAsyncPaginate` (`ResponsePagination<T>`) —
// mesma técnica de `JurosPagos/index.tsx::listProprietaryOptionsFarmScoped`.
// `scope: 'farm'` OBRIGATÓRIO (contrato de tela §3/§4, mirror `JurosPagos`,
// DIVERGE de `AgendaRecebimentos` que usa Proprietário tenant-wide) — filtra
// pela fazenda ATIVA, não pelo tenant inteiro.
async function listProprietaryOptionsFarmScoped(
  params: ListProprietaryOptionsParams
): Promise<ResponsePagination<ProprietaryOption[]>> {
  const items = await listProprietaryOptions(params.search, 'farm');
  return {
    success: true,
    data: {
      items,
      pagination: {
        total: items.length,
        count: items.length,
        per_page: items.length || 1,
        current_page: 1,
        total_pages: 1,
      },
    },
  };
}

export default function JurosRecebidosRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.receivedInterestReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<JurosRecebidosFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: receivedInterestReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // Reset por fazenda ativa (contrato de tela §4, mirror `JurosPagos`) — SÓ
  // `proprietary_uuid` (o único campo farm-scoped, `scope=farm`);
  // `client_uuids`/`farm_uuid` são tenant-wide e NÃO devem ser apagados na
  // troca de fazenda.
  useEffect(() => {
    setValue('proprietary_uuid', null);
  }, [activeFarmUuid, setValue]);

  // ---- Clientes (CheckboxListField remoto, mirror AgendaRecebimentos) —
  // `listClientOptions` devolve `{uuid, name}` (NÃO `{uuid, label}`). -------
  const [clientsSearch, setClientsSearch] = useState('');
  const clientsQuery = useOptionsChecklistQuery({
    asyncFunction: listClientOptions,
    queryKey: queryKey.cadastrosBase.clients,
    search: clientsSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.name }),
  });

  // "Fazenda" — `listFarms()` devolve array FLAT sem paginação real (mirror
  // `farm-service.ts`); `Select` estático + `useQuery`, NÃO
  // `SelectAsyncPaginate` (mesma técnica de `JurosPagos`). `/farms/current-
  // tenant`, NÃO `getMyFarms()`/`/me/farms` (contrato de tela §4, risco 2 da
  // Tarefa 49).
  const farmsQuery = useQuery({
    queryKey: ['received-interest-report', 'farms'],
    queryFn: listFarms,
  });
  const farmOptions: Option<string>[] = (farmsQuery.data ?? []).map((farm: FarmRef) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  const reportMutation = useMutation({
    mutationFn: (params: ReceivedInterestReportParams) => downloadReceivedInterestReport(params),
    onSuccess: (blob, variables) => {
      if (variables.format === 'pdf') {
        // PDF abre INLINE em nova aba — NUNCA `downloadBlob`, que forçaria
        // download e quebraria a fidelidade `inline` do legado (`CLM-017`).
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        downloadBlob(blob, 'juros-recebidos-relatorio.xlsx');
      }

      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `JurosPagos/index.tsx`/`AgendaRecebimentos/index.tsx`).
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
    },
  });

  const isGenerating = reportMutation.isPending;

  function buildParams(data: JurosRecebidosFilterForm): ReceivedInterestReportParams {
    return {
      client_uuids: data.client_uuids.length > 0 ? data.client_uuids : undefined,
      // DEC-043: enviado normalmente, como qualquer outro filtro — a API o
      // valida mas o ignora deliberadamente (réplica intencional do legado).
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      farm_uuid: data.farm_uuid?.value || undefined,
      format: data.format!.value,
    };
  }

  function onSubmit(data: JurosRecebidosFilterForm) {
    reportMutation.mutate(buildParams(data));
  }

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
            disabled={!hasValidRange || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          {/* Clientes — CheckboxListField REMOTO (busca server-side). */}
          <Box>
            <Controller
              name="client_uuids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.client}
                  items={clientsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={clientsSearch}
                  onSearchChange={setClientsSearch}
                  searchPlaceholder={text.searchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.client}
                  emptyLabel={text.empty}
                  errorLabel={text.error}
                  retryLabel={text.retry}
                  isLoading={clientsQuery.isLoading}
                  isError={clientsQuery.isError}
                  onRetry={clientsQuery.refetch}
                  columns={columnsForm.threeColumns}
                  isDisabled={isGenerating}
                />
              )}
            />
          </Box>

          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="proprietary_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.proprietary}
                  cacheUniqs={[activeFarmUuid]}
                  service={listProprietaryOptionsFarmScoped}
                  mapOptions={(item: ProprietaryOption) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
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
                  <DateInput value={value ?? null} onChange={onChange} disabled={isGenerating} />
                )}
              />
            </Box>

            <Controller
              name="farm_uuid"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.farm}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option ?? null)}
                  options={farmOptions}
                  loading={farmsQuery.isLoading}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="format"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.format}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                  isDisabled={isGenerating}
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
