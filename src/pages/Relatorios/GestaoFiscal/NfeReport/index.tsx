// src/pages/Relatorios/GestaoFiscal/NfeReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "NFe/Emitidas — Relatório" (F-287, TASK-F287-FE-02, esteira
// 97-Esteiras/079). Rota `/relatorios/gestao-fiscal/nfe-report`, consumindo
// `GET /api/v1/nfe-report` (binário PDF/Excel, `responseType:'blob'`), gate
// `nfe_report`. Materializa o item de menu FILHO `rel-gfi-nfe-report`, sob o
// grupo/submenu `rel-gfi` ("Gestão Fiscal", `navigationTree.ts`), ao lado de
// "Faturamento" e "Partida Dobrada".
//
// Mirror estrutural 1:1 de `Relatorios/GestaoFiscal/Faturamento/index.tsx`
// (F-286), que por sua vez é mirror triplo de `ContasAPagar`/`Máquinas`/
// `NfeEmitModal` (ver docblock do próprio F-286). Nenhum layout é inventado
// nesta Tarefa — 100% reuso de componentes já certificados (UX-GAP
// declarado no plano §2, seguir-pelo-padrão).
//
// Ordem lógica dos 9 campos (F-287-plano-frontend §4, fiel a C13 do
// contrato legado): start_date, end_date, status, client_ids[], farm_ids[],
// center_ids[], issuer_id, provider_id, format. Layout físico agrupa os
// campos de valor único (DateInput/Select) num grid e os 3
// `CheckboxListField` (multi-seleção) em blocos abaixo — mesma convenção já
// aplicada por `Faturamento`/`ContasAPagar` (o grid físico não precisa
// repetir a ordem DOM do legado; a ORDEM RELATIVA dentro de cada grupo é
// preservada).
//
// DF-02 (achado do plano) — `provider_id` usa a CONSTANTE do fork
// (`providerType.transportador = 4`), NUNCA o literal `3` do legado
// (mesma classe de bug já catalogada em CategoryProduct/PlanAccount).
// DF-04 — `client_ids` herda `{ has: 'nfes' }` de F-286 (mesmo universo
// funcional, NFes emitidas).
// LK-04 (contrato legado) — `center_ids` é SEMPRE restrito à fazenda ATIVA
// da sessão (`activeFarmUuid`), independente de `farm_ids` cobrir múltiplas
// fazendas — mirror fiel via `useOptionsChecklistQuery` com `extraParams`
// fixo em `activeFarmUuid`.
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão único
// "Gerar relatório" (o binário é gerado 100% no servidor).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
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
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { providerType } from '@/constants/cadastrosBase/provider/provider-type';
import { columnsForm } from '@/constants/coluns-form';
import { nfeEstadoOptions } from '@/constants/Fiscal/nfe-estado-options';
import { queryKey } from '@/constants/query-key';
import { nfeReportFormatOptions } from '@/constants/Relatorios/nfe-report/options/nfe-report-format-options';

import { nfeReportFilterSchemaResolver } from '@/validations/schemas/NfeReport/nfe-report-filter-schema';

import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import {
  listProviderOptions,
  type ProviderOptionItem,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { getIssuerReportOptions } from '@/services/v2/Issuers/issuer-service';
import { downloadNfeReport } from '@/services/v2/NfeReport/nfe-report-service';

import type { LanguageDate } from '@/@types/language';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { NfeReportFilterForm, NfeReportParams } from '@/@types/v2/NfeReport';
import type { NfeIssuerOption } from '@/@types/v2/Nfes';

import type { FieldErrors } from 'react-hook-form';

// Mirror EXATO `NfeEmitModal.tsx::issuerOptionLabel`/`Faturamento` — mesma
// prioridade de campo (razão social → nome fantasia → uuid como último
// recurso).
function issuerOptionLabel(issuer: NfeIssuerOption): string {
  return issuer.razao_social ?? issuer.nome_fantasia ?? issuer.uuid;
}

function buildPristineValues(languageGB: LanguageDate): NfeReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    status: null,
    client_ids: [],
    farm_ids: [],
    center_ids: [],
    issuer_id: null,
    provider_id: null,
    format: nfeReportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function NfeReportRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.nfeReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NfeReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: nfeReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Clientes (CheckboxListField REMOTO, busca server-side debounced) —
  // `has:'nfes'` (DF-04, herdado de F-286) estreita ao universo com NFe
  // emitida (mesmo racional do relatório irmão). --------------------------
  const [clientsSearch, setClientsSearch] = useState('');
  const clientsQuery = useOptionsChecklistQuery({
    asyncFunction: listClientOptions,
    queryKey: queryKey.cadastrosBase.clients,
    search: clientsSearch,
    mapItem: (item) => ({ value: item.uuid, label: item.name }),
    extraParams: { has: 'nfes' },
  });

  // ---- Fazendas (CheckboxListField sobre lookup FLAT, sem paginação —
  // `listFarms()`/`GET /farms/current-tenant`, universo do TENANT, mirror
  // `Faturamento`, busca filtrada no cliente). -----------------------------
  const [farmSearch, setFarmSearch] = useState('');
  const farmsQuery = useQuery({
    queryKey: [queryKey.farms.list],
    queryFn: listFarms,
  });
  useQueryError([farmsQuery]);
  const allFarmItems = useMemo(
    () => (farmsQuery.data ?? []).map((farm) => ({ value: farm.uuid, label: farm.description })),
    [farmsQuery.data]
  );
  const farmItems = useMemo(
    () =>
      allFarmItems.filter((item) =>
        item.label.toLowerCase().includes(farmSearch.trim().toLowerCase())
      ),
    [allFarmItems, farmSearch]
  );

  // ---- Centros de Custo (CheckboxListField REMOTO) — LK-04 do contrato
  // legado: SEMPRE restrito à fazenda ATIVA da sessão
  // (`activeFarmUuid`), independente de `farm_ids` cobrir múltiplas
  // fazendas (mirror fiel, `farm_uuid` fixo no `extraParams`). -------------
  const [centersSearch, setCentersSearch] = useState('');
  const centersQuery = useOptionsChecklistQuery({
    asyncFunction: listCostCenterOptions,
    queryKey: queryKey.costCenters.list,
    search: centersSearch,
    mapItem: (item: CostCenterRef) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    extraParams: { is_enabled: 'true', farm_uuid: activeFarmUuid },
  });

  // ---- Emissor (Select estático, lookup SEM paginação — mirror
  // `Faturamento`/`NfeEmitModal`). `/issuers/report-options`
  // (tenant+is_enabled+pivot farm, SEM issues_nfe). ------------------------
  const issuerQuery = useOptionsSelectQuery({
    asyncFunction: () => getIssuerReportOptions().then((response) => response.data),
    queryKey: queryKey.issuers.reportOptions,
    mapOption: (issuer: NfeIssuerOption) => ({
      value: issuer.uuid,
      label: issuerOptionLabel(issuer),
    }),
  });

  function buildParams(data: NfeReportFilterForm): NfeReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      status: data.status?.value || undefined,
      client_ids: data.client_ids.length > 0 ? data.client_ids : undefined,
      farm_ids: data.farm_ids.length > 0 ? data.farm_ids : undefined,
      center_ids: data.center_ids.length > 0 ? data.center_ids : undefined,
      issuer_id: data.issuer_id?.value || undefined,
      provider_id: data.provider_id?.value || undefined,
      format: data.format?.value || undefined,
    };
  }

  async function handleDownload(data: NfeReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadNfeReport(params);
      downloadBlob(blob, `nfe-emitidas.${params.format === 'xlsx' ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror Faturamento).
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

  // BUGFIX (2026-09-11, dono): `handleSubmit(handleDownload)` sem 2º
  // argumento falha em SILÊNCIO quando o resolver reprova o form — o RHF
  // simplesmente não chama `handleDownload`, sem erro visível (causa-raiz
  // real: `status` exigia Option não-nula no schema mesmo nascendo `null`,
  // já corrigido em `nfe-report-filter-schema.ts`). Este handler é a rede de
  // segurança: qualquer invalidez futura aparece para o usuário via toast
  // em vez de reproduzir a falha silenciosa.
  function onInvalid(formErrors: FieldErrors<NfeReportFilterForm>) {
    const firstMessage = Object.values(formErrors)
      .map((fieldError) =>
        fieldError && typeof fieldError === 'object' && 'message' in fieldError
          ? fieldError.message
          : undefined
      )
      .find((message): message is string => typeof message === 'string');
    toaster.error({
      title: text.pageTitle,
      description: firstMessage ?? text.downloadError,
    });
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
            onClick={handleSubmit(handleDownload, onInvalid)}
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
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={nfeEstadoOptions.options(languageGB)}
                  placeholder={text.statusPlaceholder}
                />
              )}
            />

            <Controller
              name="issuer_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.issuerId}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={issuerQuery.options}
                  loading={issuerQuery.isLoading}
                  placeholder={text.issuerPlaceholder}
                />
              )}
            />

            {/* Prestador de Serviço — SelectAsyncPaginate (`listProviderOptions`,
                DF-02: SEMPRE `providerType.transportador`, NUNCA o literal `3`
                do legado). */}
            <Controller
              name="provider_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.providerId}
                  placeholder={text.providerPlaceholder}
                  service={listProviderOptions}
                  mapOptions={(item: ProviderOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    type: providerType.transportador,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
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
                  options={nfeReportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Clientes — CheckboxListField REMOTO (`listClientOptions`, DF-04). */}
          <Box>
            <Controller
              name="client_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.clientIds}
                  items={clientsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={clientsSearch}
                  onSearchChange={setClientsSearch}
                  searchPlaceholder={text.clientsSearchPlaceholder}
                  selectAllLabel={text.clientsSelectAll}
                  deselectAllLabel={text.clientsDeselectAll}
                  selectedCountLabel={text.clientsSelectedCount}
                  emptyLabel={text.clientsEmptyLabel}
                  isLoading={clientsQuery.isLoading}
                  isError={clientsQuery.isError}
                  onRetry={clientsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Fazendas — CheckboxListField sobre lookup FLAT (`listFarms()`,
              universo do tenant), opcional. */}
          <Box>
            <Controller
              name="farm_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.farmIds}
                  items={farmItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={farmSearch}
                  onSearchChange={setFarmSearch}
                  searchPlaceholder={text.farmsSearchPlaceholder}
                  selectAllLabel={text.farmsSelectAll}
                  deselectAllLabel={text.farmsDeselectAll}
                  selectedCountLabel={text.farmsSelectedCount}
                  emptyLabel={text.farmsEmptyLabel}
                  isLoading={farmsQuery.isLoading}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>

          {/* Centros de Custo — CheckboxListField REMOTO (`listCostCenterOptions`,
              LK-04: SEMPRE restrito à fazenda ATIVA da sessão). */}
          <Box>
            <Controller
              name="center_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.centerIds}
                  items={centersQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={centersSearch}
                  onSearchChange={setCentersSearch}
                  searchPlaceholder={text.centersSearchPlaceholder}
                  selectAllLabel={text.centersSelectAll}
                  deselectAllLabel={text.centersDeselectAll}
                  selectedCountLabel={text.centersSelectedCount}
                  emptyLabel={text.centersEmptyLabel}
                  isLoading={centersQuery.isLoading}
                  isError={centersQuery.isError}
                  onRetry={centersQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
