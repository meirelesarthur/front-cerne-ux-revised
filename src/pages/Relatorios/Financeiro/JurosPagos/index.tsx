// src/pages/Relatorios/Financeiro/JurosPagos/index.tsx
// -----------------------------------------------------------------------------
// Tela "Juros Pagos — Relatório" (F-290, TASK-290-FE-02, esteira 073). Rota
// `/relatorios/financeiro/juros-pagos`, materializa o item de menu FILHO
// `rel-fin-juros-pagos`, sob o grupo/submenu `rel-fin` ("Financeiro",
// `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/Dre/index.tsx` (FormContainer +
// footer, sem prévia, download via Blob + `downloadBlob`, erro 422-como-Blob
// tratado via `parseBlobError`) MAIS os 3 campos extra farm-scoped
// (Fornecedor multiselect, Proprietário async single farm-scoped, Fazenda
// estática) no padrão de `Integracoes/ExportCPagarReceberDominio/index.tsx`.
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Baixar PDF"
// (contrato de API expõe só o binário, sem Resource de prévia,
// `F-290-front-contrato-tela.md §2 SURF-TABLE`).
//
// Campo `type` (PDF/Excel, FM-06 do legado) NÃO é portado — DECISAO_DE_ESCOPO
// herdada da camada API (contrato de tela §2/§3), o endpoint só produz PDF.
//
// Reset por fazenda ativa (contrato §4): SÓ `proprietary_uuid` (farm-scoped,
// `scope=farm`) é limpo na troca da fazenda ativa do header — `provider_uuids`
// (tenant inteiro) e `farm_uuid` (todas as fazendas do tenant) NÃO dependem da
// fazenda ativa e permanecem intactos.
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

import { paidInterestReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/paid-interest-report-filter-schema';

import {
  listProprietaryOptions,
  type ProprietaryOption,
} from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import {
  listProviderOptions,
  type ListProviderOptionsParams,
  type ProviderOptionItem,
} from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  downloadPaidInterestReportPdf,
  type PaidInterestReportParams,
} from '@/services/v2/Relatorios/paid-interest-report-service';

import type { Option } from '@/@types/option';
import type { PaginationQueryParams } from '@/@types/pagination';
import type { ResponsePagination } from '@/@types/response-api';
import type { FarmRef } from '@/@types/v2/Farms';

interface JurosPagosFilterForm {
  provider_uuids: Option<string>[] | null;
  proprietary_uuid: Option<string> | null;
  start_date: string | null;
  end_date: string | null;
  farm_uuid: Option<string> | null;
}

const pristineValues: JurosPagosFilterForm = {
  provider_uuids: [],
  proprietary_uuid: null,
  start_date: null,
  end_date: null,
  farm_uuid: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `ExportCPagarReceberDominio.tsx`/`FilterSideExpense.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

interface ListProprietaryOptionsParams extends PaginationQueryParams {
  search?: string;
}

// Adapta `listProprietaryOptions` (array direto, sem paginação real — fachada
// mínima já existente) ao contrato `service` de `SelectAsyncPaginate`
// (`ResponsePagination<T>`) — mesma técnica de
// `FilterSideAssetsDashboard.tsx::listProprietaryOptionsPaginated`.
// `scope: 'farm'` OBRIGATÓRIO (fecha CLM-021/CLM-023 do contrato de tela) —
// filtra pela fazenda ATIVA, não pelo tenant inteiro.
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

export default function JurosPagosRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.paidInterestReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<JurosPagosFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: paidInterestReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // Reset por fazenda ativa (contrato §4) — SÓ `proprietary_uuid` (o único
  // campo farm-scoped, `scope=farm`); `provider_uuids`/`farm_uuid` são
  // tenant-wide e NÃO devem ser apagados na troca de fazenda.
  useEffect(() => {
    setValue('proprietary_uuid', null);
  }, [activeFarmUuid, setValue]);

  // "Fazenda" (FM-05) — `listFarms()` devolve array FLAT sem paginação real
  // (mirror da nota de cabeçalho de `farm-service.ts`); `Select` estático +
  // `useQuery`, NÃO `SelectAsyncPaginate` (mesma técnica de
  // `FilterSideCashBook.tsx`).
  const farmsQuery = useQuery({
    queryKey: ['paid-interest-report', 'farms'],
    queryFn: listFarms,
  });
  const farmOptions: Option<string>[] = (farmsQuery.data ?? []).map((farm: FarmRef) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  function buildParams(data: JurosPagosFilterForm): PaidInterestReportParams {
    return {
      provider_uuids: data.provider_uuids?.map((option) => option.value) || undefined,
      proprietary_uuid: data.proprietary_uuid?.value || undefined,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      farm_uuid: data.farm_uuid?.value || undefined,
    };
  }

  async function handleDownload(data: JurosPagosFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadPaidInterestReportPdf(buildParams(data));
      downloadBlob(blob, 'juros-pagos-relatorio.pdf');
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `Dre/index.tsx`, "AJUSTE HOMOLOGAÇÃO 049 item 2").
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
            title={text.downloadPdfButton}
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
            <Controller
              name="provider_uuids"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.providers}
                  placeholder={text.providersPlaceholder}
                  isMulti
                  closeMenuOnSelect={false}
                  service={(params: PaginationQueryParams & ListProviderOptionsParams) =>
                    listProviderOptions(params)
                  }
                  mapOptions={(item: ProviderOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? []}
                  onChange={(options: any) => field.onChange(options ?? [])}
                />
              )}
            />

            <Controller
              name="proprietary_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.proprietary}
                  placeholder={text.proprietaryPlaceholder}
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
              name="farm_uuid"
              control={control}
              render={({ field: { name, value, onChange } }) => (
                <Select
                  label={text.fields.farm}
                  placeholder={text.farmPlaceholder}
                  name={name}
                  value={value}
                  onChange={(option: Option<string> | null) => onChange(option ?? null)}
                  options={farmOptions}
                  loading={farmsQuery.isLoading}
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
