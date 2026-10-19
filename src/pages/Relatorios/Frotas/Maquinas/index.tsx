// src/pages/Relatorios/Frotas/Maquinas/index.tsx
// -----------------------------------------------------------------------------
// Tela "Máquinas — Relatório" (F-278, TASK-052-278-FE-02, esteira
// 97-Esteiras/052). Rota `/relatorios/frotas/maquinas`, materializa o item de
// menu FILHO `rel-gfr-maquinas`, sob o grupo/submenu `rel-gfr` ("Gestão de
// Frotas", `navigationTree.ts`) — o grupo era um flatItem FOLHA e vira
// item-PAI com este único filho (mirror EXATO da reestruturação já aplicada
// a `rel-est`/`rel-agr`).
//
// Mirror ESTRUTURAL DUPLO (roteiro-front-F278-maquinas.md §"Passo UX"):
//   - `Relatorios/Estoque/LoteFornecedor/index.tsx` — mesma casca
//     `FormContainer` + footer + `<Form onSubmit={preventDefault}>` +
//     `SimpleGrid columns={columnsForm.default}`, mesmo padrão de campo
//     `format` (PDF+Excel) reusando `reportFormatOptions` e único botão
//     "Gerar relatório" (SEM `useMutation` para binário, `useState`
//     `isDownloading`).
//   - `Relatorios/Financeiro/ContasAPagar/index.tsx` — mesmo padrão de
//     `CheckboxListField` remoto com busca server-side debounced
//     (`useOptionsChecklistQuery`) para o multiselect de máquinas.
//   - `Relatorios/Agricultura/ProducaoArea/index.tsx` — mesmo padrão de
//     `CheckboxListField` sobre lookup FLAT sem paginação (`getMyFarms`,
//     filtrado no cliente) para o multiselect opcional de fazendas.
//
// `equipment_ids` é o ÚNICO filtro OBRIGATÓRIO (min 1, `MachinesReportRequest`
// FILTER-01) — o botão "Gerar relatório" fica desabilitado até ≥1 máquina
// selecionada (mensagem de schema Yup, `messages.validation.equipmentsRequired`).
//
// Cascata do executor (`maintenance_type` → `maintenance_executor_id`,
// roteiro §Riscos (b)): vive INTEIRAMENTE no `onChange` do próprio Select de
// tipo (`handleMaintenanceTypeChange`) — troca o TIPO limpa o executor
// selecionado (a fonte do lookup muda de funcionário para fornecedor ou
// vice-versa) e o `SelectAsyncPaginate` do executor fica DESABILITADO
// enquanto nenhum tipo está selecionado. `listEmployeeExecutorOptions`/
// `listProviderExecutorOptions` (abaixo) normalizam `EmployeeOption`
// (`{uuid,name}`) e `ProviderOptionItem` (`{uuid,label}`) para um shape
// uniforme `{uuid,label}` — permite ao `SelectAsyncPaginate` comutar a
// `service` sem duas variantes de `mapOptions`.
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

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsChecklistQuery } from '@/hooks/useOptionsChecklistQuery';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import { maintenanceTypeOptions } from '@/constants/Relatorios/machines-report/options/maintenance-type-options';

import { machinesReportFilterSchemaResolver } from '@/validations/schemas/MachinesReport/machines-report-filter-schema';

import { listEmployeeOptions } from '@/services/v2/CadastrosBase/Employee/employee-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listEquipmentCatalogOptions } from '@/services/v2/Equipments/equipment-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { downloadMachinesReport } from '@/services/v2/MachinesReport/machines-report-service';

// PLANO-FIX AUDIT-FILTROS-RELATORIOS §2.3/§3 F-278 — whitelist de família de
// Máquinas do legado (consolidada em 4 controllers legados), enviada via
// `family_ids[]` opt-in ao genérico `/equipments/options`.
const MACHINE_FAMILY_IDS = [1, 2, 3, 5];
// PLANO-FIX §2.4/§3 F-278 — Executor-Fornecedor: Fornecedor + Terceirizado
// (`ProviderTypeEnum`), enviado via `type[]` opt-in (compat escalar
// preservada nos demais consumidores).
const EXECUTOR_PROVIDER_TYPES = [1, 3];

import type { LanguageDate } from '@/@types/language';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type {
  MachinesReportFilterForm,
  MachinesReportParams,
  MaintenanceType,
} from '@/@types/v2/MachinesReport';

/** Shape uniforme pós-normalização — mirror `ExecutorOptionItem` local, nunca
 *  exportado (plumbing exclusivo desta tela). */
interface ExecutorOptionItem {
  uuid: string;
  label: string;
}

// PLANO-FIX AUDIT-FILTROS-RELATORIOS DECISÃO DE ESCOPO #3 (Executor-
// Funcionário) — o legado lista funcionários do TENANT inteiro; o Cerne
// `/employees/options` (`employee-service.ts::ListEmployeeOptionsParams`)
// recorta pela fazenda ativa e NÃO expõe `scope=tenant` (confirmado por
// leitura do service — sem esse param, o backend não fez o aditivo opt-in
// previsto na decisão). Não inventamos o param: reportado como Gap
// [PARA ANÁLISE] no handover — este lookup permanece no recorte atual
// (fazenda ativa), sem regressão, até o backend expor `scope`.
async function listEmployeeExecutorOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<ExecutorOptionItem[]>> {
  const response = await listEmployeeOptions(params);
  return {
    ...response,
    data: {
      ...response.data,
      items: response.data.items.map((item) => ({ uuid: item.uuid, label: item.name })),
    },
  };
}

async function listProviderExecutorOptions(
  params: PaginationQueryParams & { search?: string }
): Promise<ResponsePagination<ExecutorOptionItem[]>> {
  return listProviderOptions({ ...params, type: EXECUTOR_PROVIDER_TYPES });
}

function mapExecutorOption(item: ExecutorOptionItem) {
  return { label: item.label, value: item.uuid };
}

function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function buildPristineValues(languageGB: LanguageDate): MachinesReportFilterForm {
  return {
    equipment_ids: [],
    farm_ids: [],
    start_date: null,
    end_date: null,
    maintenance_type: null,
    maintenance_executor_id: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function MaquinasRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.machinesReport.report;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MachinesReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: machinesReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Máquinas (CheckboxListField REMOTO, busca server-side debounced) --
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const equipmentsQuery = useOptionsChecklistQuery({
    asyncFunction: listEquipmentCatalogOptions,
    queryKey: queryKey.equipments.options,
    search: equipmentSearch,
    mapItem: (item) => ({ value: item.uuid, label: `${item.code} — ${item.description}` }),
    extraParams: { family_ids: MACHINE_FAMILY_IDS },
  });

  // ---- Fazendas (CheckboxListField sobre lookup FLAT, sem paginação —
  // `listFarms()`/`GET /farms/current-tenant`, PLANO-FIX §3 F-278 Classe A
  // — universo do TENANT, mirror `ProducaoArea::areasQuery`, busca filtrada
  // no cliente). -----------------------------------------------------------
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

  const equipmentIdsValue = watch('equipment_ids');
  const maintenanceTypeValue = watch('maintenance_type');

  // Cascata do executor (roteiro §Riscos (b)) — vive INTEIRAMENTE no
  // `onChange` do PRÓPRIO Select de tipo, nunca num `useEffect` observando o
  // valor: trocar o tipo troca a FONTE do lookup (employee↔provider) e
  // SEMPRE limpa o executor já selecionado (não faz sentido preservar um
  // uuid de funcionário quando o tipo vira "Fornecedor").
  function handleMaintenanceTypeChange(option: MachinesReportFilterForm['maintenance_type']) {
    setValue('maintenance_type', option);
    setValue('maintenance_executor_id', null);
  }

  function buildParams(data: MachinesReportFilterForm): MachinesReportParams {
    return {
      equipment_ids: data.equipment_ids,
      farm_ids: data.farm_ids.length > 0 ? data.farm_ids : undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      maintenance_type: (data.maintenance_type?.value as MaintenanceType) || undefined,
      maintenance_executor_id: data.maintenance_executor_id?.value || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: MachinesReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadMachinesReport(params);
      downloadBlob(blob, `relatorio-maquinas.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `LoteFornecedor`/`ContasAPagar`).
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
            disabled={isDownloading || equipmentIdsValue.length === 0}
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
              name="maintenance_type"
              control={control}
              render={({ field: { name, value } }) => (
                <Select
                  label={text.fields.maintenanceType}
                  name={name}
                  value={value}
                  onChange={handleMaintenanceTypeChange}
                  options={maintenanceTypeOptions.options(languageGB)}
                />
              )}
            />

            <Controller
              name="maintenance_executor_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.maintenanceExecutor}
                  placeholder={text.maintenanceExecutorPlaceholder}
                  isDisabled={!maintenanceTypeValue}
                  service={
                    maintenanceTypeValue?.value === 'provider'
                      ? listProviderExecutorOptions
                      : listEmployeeExecutorOptions
                  }
                  cacheUniqs={[maintenanceTypeValue?.value]}
                  mapOptions={mapExecutorOption}
                  findParams={(search) => ({ search: searchOf(search) })}
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
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Máquinas — CheckboxListField REMOTO, ÚNICO filtro obrigatório
              (min 1, `MachinesReportRequest` FILTER-01). */}
          <Box>
            <Controller
              name="equipment_ids"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={`${text.fields.equipmentIds} *`}
                  items={equipmentsQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={equipmentSearch}
                  onSearchChange={setEquipmentSearch}
                  searchPlaceholder={text.equipmentsSearchPlaceholder}
                  selectAllLabel={text.equipmentsSelectAll}
                  deselectAllLabel={text.equipmentsDeselectAll}
                  selectedCountLabel={text.equipmentsSelectedCount}
                  emptyLabel={text.equipmentsEmptyLabel}
                  errorLabel={text.equipmentsErrorLabel}
                  retryLabel={text.equipmentsRetryLabel}
                  isLoading={equipmentsQuery.isLoading}
                  isError={equipmentsQuery.isError}
                  onRetry={equipmentsQuery.refetch}
                  columns={columnsForm.threeColumns}
                />
              )}
            />
            {errors.equipment_ids?.message && (
              <Text fontSize="xs" color="fg.error" mt={1}>
                {errors.equipment_ids?.message}
              </Text>
            )}
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
        </VStack>
      </Form>
    </FormContainer>
  );
}
