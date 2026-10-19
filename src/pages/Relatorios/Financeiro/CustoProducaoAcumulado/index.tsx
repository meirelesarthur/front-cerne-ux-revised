// src/pages/Relatorios/Financeiro/CustoProducaoAcumulado/index.tsx
// -----------------------------------------------------------------------------
// Tela "Custo de Produção Acumulado" (F-217, TASK-058-F217-FE-02, esteira
// 97-Esteiras/058). Rota
// `/relatorios/financeiro/custo-de-producao-acumulado`, materializa o item
// de menu FILHO `rel-fin-custo-producao-acumulado`, sob o grupo/submenu
// `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// DIVERGÊNCIA DELIBERADA (D-058-02, plano §0 — NÃO reabrir/re-perguntar): o
// irmão não-acumulado desta feature (F-272, `CustoProducao/index.tsx`, já
// migrado) TEM tabela hierárquica on-screen + 3 modais de drill-down.
// **Esta tela NÃO tem** — é classificada como "relatório download-only" no
// UX-MAPPING desta esteira. Mirror estrutural de
// `Relatorios/Financeiro/Adiantamento/index.tsx` (FormContainer + Form cru,
// SEM `formFilter`, SEM grid/prévia, download via Blob + `downloadBlob`,
// erro 422-como-Blob tratado via `parseBlobError`, prioriza a mensagem
// ESPECÍFICA de `errors` por campo sobre o `message` genérico — inclusive
// o 422 de limite de 12 meses, D-058-06, tratado de forma 100% data-driven
// a partir da resposta real da API, nunca com texto hardcoded). O endpoint
// de preview JSON e os 3 endpoints de drill-down existem na API mas NÃO são
// consumidos por esta entrega (fora de escopo, extensão futura).
//
// 2 endpoints de download dedicados (`/pdf`, `/excel`) — SEM dispatch por
// query param `format`: o campo `format` é CLIENT-SIDE apenas e decide qual
// função de service é chamada (mirror `Adiantamento`, 1 botão + Select
// "Tipo de Relatório", para consistência visual com os irmãos de
// Financeiro).
//
// Validação de 12 meses (D-058-06/D-217-A) espelhada NO CLIENTE
// (`accumulated-income-statement-report-filter-schema.ts`) — evita
// round-trip para um 422 previsível, mas o 422 real do servidor (se o
// limite mudar ou a validação client for contornada) ainda é tratado com a
// MESMA prioridade de mensagem específica por campo.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
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

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import {
  calculationModuleOptions,
  groupOptions,
  hasStockOptions,
  reportFormatOptions,
  typeOptions,
} from '@/constants/Relatorios/accumulated-income-statement-report/options';

import { accumulatedIncomeStatementReportFilterSchemaResolver } from '@/validations/schemas/AccumulatedIncomeStatementReport/accumulated-income-statement-report-filter-schema';

import {
  downloadAccumulatedIncomeStatementReportExcel,
  downloadAccumulatedIncomeStatementReportPdf,
} from '@/services/v2/AccumulatedIncomeStatementReport/accumulated-income-statement-report-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { LanguageDate } from '@/@types/language';
import type {
  AccumulatedIncomeStatementReportFilterForm,
  AccumulatedIncomeStatementReportParams,
} from '@/@types/v2/AccumulatedIncomeStatementReport';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { Harvest } from '@/@types/v2/Harvests';

function buildPristineValues(languageGB: LanguageDate): AccumulatedIncomeStatementReportFilterForm {
  return {
    // Defaults fiéis ao legado (print 41, rodada 3 — REVERTE D-058 "SEM
    // default pré-selecionado"): Regime=Caixa, Tipo=Sintético, Módulo de
    // Cálculo=Financeiro, sempre via fábrica de options i18n (getOption),
    // nunca string literal.
    group: groupOptions.getOption('C', languageGB),
    type: typeOptions.getOption(1, languageGB),
    start_date: null,
    end_date: null,
    calculation_module: calculationModuleOptions.getOption('F', languageGB),
    farm_id: null,
    proprietary: null,
    has_stock: hasStockOptions.getOption(0, languageGB),
    harvest: null,
    cost_center: [],
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function CustoProducaoAcumuladoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.accumulatedIncomeStatementReport.report;

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isValid, touchedFields, dirtyFields, isSubmitted },
  } = useForm<AccumulatedIncomeStatementReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: accumulatedIncomeStatementReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  // Gate do botão (correção homologação, mirror `CustoProducao/index.tsx`) —
  // `isValid` do RHF pode nascer `true` no mount, ANTES de rodar o resolver
  // (gotcha documentado do RHF `mode:'onChange'`); dispara validação completa
  // uma vez no mount para o botão abrir DESABILITADO com os campos
  // obrigatórios (`group`/`type`/`start_date`/`end_date`/`calculation_module`)
  // vazios.
  // `trigger`/`exhaustive-deps` fora do array por decisão deliberada (mirror
  // `CustoProducao/index.tsx` — nenhuma regra `exhaustive-deps` ativa neste
  // projeto): dispara 1x no mount, não a cada render.
  useEffect(() => {
    trigger();
  }, []);

  // Rodada 3 — SUPRESSÃO DE EXIBIÇÃO do erro no LOAD (plano rodada3, item 1):
  // o `trigger()` acima (mantido, gate do botão) popula `formState.errors`
  // de todos os obrigatórios vazios já no mount, ANTES de qualquer
  // interação do usuário. Sem gating, o texto "Campo obrigatório" aparece
  // sozinho na tela recém-aberta (regressão de UX vs legado, print 41).
  // `showError` desacopla a EXIBIÇÃO do erro (aqui) da VALIDAÇÃO/gate do
  // botão (inalterada) — só mostra a mensagem depois que o campo foi
  // tocado/sujo ou o usuário tentou submeter.
  const showError = (name: keyof AccumulatedIncomeStatementReportFilterForm) =>
    isSubmitted || !!touchedFields[name] || !!dirtyFields[name];

  // Datas — par cruzado (fim>=início, ≤12 meses, D-058-06): a validação é
  // cross-field, então o gate considera as DUAS datas juntas — tocar/sujar
  // qualquer uma das duas libera a exibição do erro em ambas.
  const showDateError = isSubmitted || !!dirtyFields.start_date || !!dirtyFields.end_date;

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação) -----
  // `scope: 'farm'` OBRIGATÓRIO (causa-raiz do 422, correção homologação) —
  // sem escopo, `listProprietaryOptions()` cai no default `'tenant'` e lista
  // proprietários do TENANT inteiro; a validação de backend (`farm_proprietary`)
  // só aceita o proprietário da FAZENDA ATIVA. Mirror do escopo usado pela
  // tela irmã `CustoProducao/index.tsx::listProprietaryOptionsFarmScoped`
  // (`listProprietaryOptions(params.search, 'farm')`) — aqui SEM `search`
  // porque este campo usa `Select` estático + `useOptionsSelectQuery`
  // (universo completo, sem paginação/typeahead server-side), não
  // `SelectAsyncPaginate`; não há termo de busca do usuário para repassar.
  //
  // `queryKey` DEDICADO (`proprietaryOptionsFarmScoped`, NÃO o
  // `proprietaryOptions` tenant-wide reusado por ~15 outras telas) +
  // sufixado por `activeFarmUuid` (mirror `ROTEIRO-FILT-05`/`farms.listEnabled`
  // e a nota "Filtro farm-scoped deve resetar na troca de fazenda") — evita
  // (1) colisão de cache com telas tenant-scoped no mesmo `QueryClient` e
  // (2) lista desatualizada quando o usuário troca de fazenda ativa sem sair
  // desta tela.
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(undefined, 'farm'),
    queryKey: `${queryKey.cadastrosBase.proprietaryOptionsFarmScoped}-${activeFarmUuid ?? 'none'}`,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.list,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  // ---- Centro de Custo (CheckboxListField remoto, só habilitados) -------
  const [costCenterSearch, setCostCenterSearch] = useState('');
  const costCenterQuery = useOptionsChecklistQuery({
    asyncFunction: listCostCenterOptions,
    queryKey: queryKey.costCenters.list,
    search: costCenterSearch,
    mapItem: (item: CostCenterRef) => ({
      value: item.uuid,
      label: `${item.code} — ${item.description}`,
    }),
    extraParams: { is_enabled: 'true' },
  });

  function buildParams(
    data: AccumulatedIncomeStatementReportFilterForm
  ): AccumulatedIncomeStatementReportParams {
    return {
      group: data.group!.value,
      type: data.type!.value,
      start_date: data.start_date!,
      end_date: data.end_date!,
      calculation_module: data.calculation_module!.value,
      farm_id: data.farm_id?.value || undefined,
      proprietary_id: data.proprietary?.value || undefined,
      has_stock: data.has_stock?.value ?? undefined,
      harvest_id: data.harvest?.value || undefined,
      cost_center_ids: data.cost_center.length > 0 ? data.cost_center : undefined,
    };
  }

  async function handleDownload(data: AccumulatedIncomeStatementReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const format = data.format!.value;
      const blob =
        format === 'excel'
          ? await downloadAccumulatedIncomeStatementReportExcel(params)
          : await downloadAccumulatedIncomeStatementReportPdf(params);
      downloadBlob(blob, `custo-de-producao-acumulado.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro (inclusive o 422 de
      // limite de 12 meses, D-058-06) como `Blob` — `parseBlobError` extrai
      // o envelope real `{message, errors}`. Prioridade: 1ª mensagem
      // ESPECÍFICA de `errors`; só cai para o `message` genérico quando não
      // há erro de campo. 100% data-driven da resposta da API — NUNCA texto
      // hardcoded (mirror `Adiantamento`/`ContasAPagar`).
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
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={!isValid || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="group"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.group}
                  name={name}
                  value={value}
                  onChange={(option) => onChange(option ?? null)}
                  options={groupOptions.options(languageGB)}
                  noClearable
                  error={showError('group') ? errors.group?.message : undefined}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.type}
                  name={name}
                  value={value}
                  onChange={(option) => onChange(option ?? null)}
                  options={typeOptions.options(languageGB)}
                  noClearable
                  error={showError('type') ? errors.type?.message : undefined}
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                  />
                )}
              />
              {showDateError && errors.start_date?.message && (
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                  />
                )}
              />
              {showDateError && errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="calculation_module"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.calculationModule}
                  tooltip={text.calculationModuleTooltip}
                  name={name}
                  value={value}
                  onChange={(option) => onChange(option ?? null)}
                  options={calculationModuleOptions.options(languageGB)}
                  noClearable
                  error={
                    showError('calculation_module') ? errors.calculation_module?.message : undefined
                  }
                />
              )}
            />

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.farm}
                  placeholder={text.farmPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                />
              )}
            />

            <Controller
              name="proprietary"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            <Controller
              name="has_stock"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.hasStock}
                  tooltip={text.hasStockTooltip}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={hasStockOptions.options(languageGB)}
                  noClearable
                />
              )}
            />

            <Controller
              name="harvest"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.harvest}
                  placeholder={text.harvestPlaceholder}
                  service={listHarvestOptions}
                  mapOptions={(item: Harvest) => ({
                    label: item.description,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
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
                  options={reportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>

          {/* Centro de Custo — CheckboxListField REMOTO (`useOptionsChecklistQuery`,
              busca server-side, só habilitados), mirror `categories`/`providers`
              de `ContasAPagar/index.tsx`. */}
          <Box>
            <Controller
              name="cost_center"
              control={control}
              render={({ field }) => (
                <CheckboxListField
                  label={text.fields.costCenter}
                  items={costCenterQuery.items}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={costCenterSearch}
                  onSearchChange={setCostCenterSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.costCenter}
                  emptyLabel={text.lookupEmptyMessage}
                  isLoading={costCenterQuery.isLoading}
                  isError={costCenterQuery.isError}
                  onRetry={costCenterQuery.refetch}
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
