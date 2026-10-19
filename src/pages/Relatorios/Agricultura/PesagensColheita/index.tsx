// src/pages/Relatorios/Agricultura/PesagensColheita/index.tsx
// -----------------------------------------------------------------------------
// Tela "Pesagens/Colheita — Relatório" (F-335, execução 053, roteiro-front-
// F335-pesagens-colheita.md, TASK-053-335-FE-02). Rota
// `/relatorios/agricultura/pesagens-colheita`, materializa o item de menu
// FILHO `rel-agr-pes`, sob o grupo/submenu `rel-agr` ("Agricultura",
// `navigationTree.ts`) — grupo CONFIRMADO por recon (não é `rel-est`
// "Estoque" apesar de ler `module_weighings`).
//
// Mirror ESTRUTURAL DUPLO (roteiro §2 "Passo UX"):
//   - `Relatorios/Financeiro/JurosPagos/index.tsx` — par de datas
//     OBRIGATÓRIO (`hasValidRange` desabilita o botão), `Select` estático
//     alimentado por `useQuery` sobre lookup FLAT sem paginação real (aqui
//     `area_uuid` sobre `getAreasOptions()`, lá `farm_uuid` sobre
//     `listFarms()`).
//   - `Relatorios/Estoque/LoteFornecedor/index.tsx` — campo `format` único
//     decidindo PDF×Excel (SEM 2 botões de export distintos, a API decide o
//     binário pelo parâmetro `format`).
//   - `Relatorios/Estoque/MovimentacaoEstoque/index.tsx` — `warehouse_uuid`
//     farm-scoped com `cacheUniqs=[activeFarmUuid]` + `useEffect` resetando
//     na troca de fazenda ativa.
//
// 5 filtros opcionais reusam services JÁ EXISTENTES — NENHUM service
// compartilhado novo de lookup, exceto `getAreasOptions()` (função LOCAL
// desta feature, mirror EXATO `harvestProduct-service.ts::getAreasOptions`,
// roteiro §"Riscos + solução" item 1): `product_uuid`
// (`listProductOptions`, farm OR tenant — NÃO reseta por fazenda ativa),
// `area_uuid`/`warehouse_uuid` (farm-scoped — RESETAM na troca de fazenda
// ativa), `client_uuid` (`listClientOptions`, tenant via pivot — NÃO
// reseta), `type` (`moduleWeighingTypeOptions`, estático, sem default —
// vazio = todos os tipos), `format` (`reportFormatOptions`, `noClearable`,
// default `pdf`).
//
// Botão único "Gerar relatório" habilitado só com `hasValidRange`
// (`start_date` E `end_date` preenchidas, CORRIGE CL-09) — `useState` local
// `isDownloading` (NUNCA `useMutation` para binário).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { moduleWeighingTypeOptions } from '@/constants/ModuleWeighing/options/module-weighing-type-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { weighingHarvestReportFilterSchemaResolver } from '@/validations/schemas/WeighingHarvestReport/weighing-harvest-report-filter-schema';

import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';
import {
  downloadWeighingHarvestReport,
  getAreasOptions,
} from '@/services/v2/WeighingHarvestReport/weighing-harvest-report-service';

import type { Option } from '@/@types/option';
import type { AreaOptionItem } from '@/@types/v2/HarvestProduct';
import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';
import type {
  WeighingHarvestReportFilterForm,
  WeighingHarvestReportParams,
} from '@/@types/v2/WeighingHarvestReport';

const pristineValues = (
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): WeighingHarvestReportFilterForm => ({
  start_date: null,
  end_date: null,
  product_uuid: null,
  area_uuid: null,
  warehouse_uuid: null,
  client_uuid: null,
  type: null,
  format: reportFormatOptions.getOption('pdf', languageGB),
});

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `JurosPagos`/`LoteFornecedor`/`MovimentacaoEstoque`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapProductOption(item: ProductOption) {
  return { label: item.description, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseOption) {
  return { label: item.description, value: item.uuid };
}

function mapClientOption(item: ClientOptionItem) {
  return { label: item.name ?? '', value: item.uuid };
}

export default function PesagensColheitaRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.weighingHarvestReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<WeighingHarvestReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: weighingHarvestReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // Reset por fazenda ativa (roteiro §"Riscos + solução" item 2) — SÓ
  // `area_uuid`/`warehouse_uuid` (farm-scoped no servidor,
  // `Rule::exists(...)->where('farm_id', $farmId)`); `product_uuid` (farm OR
  // tenant) e `client_uuid` (tenant via pivot) NÃO resetam — mirror
  // `MovimentacaoEstoque::warehouse`.
  useEffect(() => {
    setValue('area_uuid', null);
    setValue('warehouse_uuid', null);
  }, [activeFarmUuid, setValue]);

  // "Área" — `getAreasOptions()` devolve array FLAT sem paginação real
  // (mirror `harvestProduct-service.ts`); `Select` estático + `useQuery`,
  // NÃO `SelectAsyncPaginate` (mesma técnica de `JurosPagos::farmsQuery`).
  const areasQuery = useQuery({
    queryKey: ['weighing-harvest-report', 'areas', activeFarmUuid],
    queryFn: getAreasOptions,
  });
  const areaOptions: Option<string>[] = (areasQuery.data ?? []).map((area: AreaOptionItem) => ({
    label: area.description,
    value: area.uuid,
  }));

  function buildParams(data: WeighingHarvestReportFilterForm): WeighingHarvestReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      product_uuid: data.product_uuid?.value || undefined,
      area_uuid: data.area_uuid?.value || undefined,
      warehouse_uuid: data.warehouse_uuid?.value || undefined,
      client_uuid: data.client_uuid?.value || undefined,
      type: data.type?.value ?? undefined,
      format: data.format?.value || undefined,
    };
  }

  async function handleDownload(data: WeighingHarvestReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadWeighingHarvestReport(params);
      downloadBlob(blob, `pesagens-colheita.${params.format ?? 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO
      // `LoteFornecedor`/`JurosPagos`/`MovimentacaoEstoque`).
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
            disabled={!hasValidRange || isDownloading}
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
            </Box>

            <Controller
              name="product_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  placeholder={text.productPlaceholder}
                  service={listProductOptions}
                  mapOptions={mapProductOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                    has: 'weighings',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="area_uuid"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.area}
                  placeholder={text.areaPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option ?? null)}
                  options={areaOptions}
                  loading={areasQuery.isLoading}
                />
              )}
            />

            <Controller
              name="warehouse_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.warehouse}
                  placeholder={text.warehousePlaceholder}
                  cacheUniqs={[activeFarmUuid]}
                  service={(params) =>
                    listWarehouseOptions({ ...params, all_types: true, include_inactive: true })
                  }
                  mapOptions={mapWarehouseOption}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="client_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.client}
                  placeholder={text.clientPlaceholder}
                  service={listClientOptions}
                  mapOptions={mapClientOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.type}
                  placeholder={text.typePlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  options={moduleWeighingTypeOptions.options(languageGB)}
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

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.periodRequiredHint}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
