// src/pages/Relatorios/Agricultura/RomaneioVendasContrato/index.tsx
// -----------------------------------------------------------------------------
// Tela "Romaneio/Vendas/Contrato — Relatório" (F-331, 97-Esteiras/008,
// TASK-RVC-FE-02). Rota `/relatorios/agricultura/romaneio-vendas-contrato`,
// materializa o item de menu FILHO NOVO `rel-agr-rvc`, sob o grupo/submenu
// `rel-agr` ("Agricultura", `navigationTree.ts`), posicionado após
// `rel-agr-pes` (mirror da vizinhança legada, `Pesagens/Colheita` →
// `Romaneio/Vendas/Contrato`).
//
// Casco/dispatch mirror TRIPLO (UX-GAP declarado e decidido,
// GAP-FE-RVC-01):
//   - `Relatorios/Vendas/ClienteProduto/index.tsx` — casco `FormContainer` +
//     `SimpleGrid columns={columnsForm.default}` + footer de 1 botão,
//     `hasValidRange`/`periodRequiredHint`, `DateInput` com label + asterisco.
//   - `Relatorios/Financeiro/AgendaRecebimentos/index.tsx:151-201/295-348` —
//     `useMutation` com `onSuccess(blob, variables)` decidindo PDF-inline ×
//     XLSX-download por `format`, `parseBlobError` priorizando mensagem de
//     campo, campo `format` (`reportFormatOptions`, `noClearable`) e `Select`
//     alimentado por `useOptionsSelectQuery`.
//   - `Relatorios/Agricultura/PesagensColheita/index.tsx:141-144` — reset de
//     select farm-scoped na troca de fazenda ativa.
//
// SEM grid/prévia/tabela nesta feature: as 9 colunas e os 4 totais de
// rodapé são renderizados 100% no servidor, dentro do PDF/XLSX (FID-G3F
// §18) — construir grid aqui inventaria uma superfície que nunca existiu.
//
// Três lookups, três comportamentos: `client`/`product` são endpoints
// PAGINADOS → `SelectAsyncPaginate`; `contract` é FLAT (`{uuid, number}[]`,
// sem `meta`) → `Select` + `useOptionsSelectQuery` (`listSaleContractOptions`,
// TASK-RVC-FE-01). Usar `SelectAsyncPaginate` em `contract` pagina
// indefinidamente.
//
// Zero cascata: nenhum `useEffect` de preenchimento cruzado entre filtros
// (`dimensions.cascatas` = `NAO_APLICAVEL`). A ÚNICA exceção legítima é o
// reset de `contract` (farm-scoped, `HasFarmTenantScope`) na troca de
// fazenda ativa — fidelidade, não cascata. `client`/`product` são
// tenant-scoped e NÃO resetam (`GAP-RVC-01`, decidido opção A).
//
// `GAP-RVC-01` (lookup de cliente por tenant, não por fazenda) e
// `GAP-RVC-02` (item de romaneio sem unidade de medida sai do total pelo
// `INNER JOIN`) são fidelidades deliberadas do backend, `[AVALIADO]` pelo
// dono — a tela consome a API como ela responde: nenhum filtro
// client-side, nenhum aviso de rodapé, nenhum recálculo.
// -----------------------------------------------------------------------------

import { useEffect } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
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
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';
import { transferTypeOptions } from '@/constants/transfers/options';

import { transferSalesContractReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/transfer-sales-contract-report-filter-schema';

import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions, type ProductOptionItem } from '@/services/v2/Products/product-service';
import { downloadTransferSalesContractReport } from '@/services/v2/Relatorios/transfer-sales-contract-report-service';
import { listSaleContractOptions } from '@/services/v2/SaleContracts/sale-contract-service';

import type { LanguageDate } from '@/@types/language';
import type {
  TransferSalesContractReportFilterForm,
  TransferSalesContractReportParams,
} from '@/@types/v2/Relatorios/transfer-sales-contract-report';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `ClienteProduto`/`PesagensColheita`/`JurosPagos`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapClientOption(item: ClientOptionItem) {
  return { label: item.name ?? '', value: item.uuid };
}

function mapProductOption(item: ProductOptionItem) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function buildPristineValues(languageGB: LanguageDate): TransferSalesContractReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    client: null,
    type: null,
    product: null,
    contract: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function RomaneioVendasContratoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.transferSalesContractReport.report;

  const { control, handleSubmit, watch, setValue } = useForm<TransferSalesContractReportFilterForm>(
    {
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: transferSalesContractReportFilterSchemaResolver(languageGB),
      defaultValues: buildPristineValues(languageGB),
    }
  );

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // `contract` é o ÚNICO filtro farm-scoped (`HasFarmTenantScope` de
  // `SaleContract`) — reseta na troca de fazenda ativa (mirror
  // `PesagensColheita:141-144`). `client`/`product` são tenant-scoped e NÃO
  // resetam (`GAP-RVC-01`, decidido opção A). Sem o reset, um contrato de
  // outra fazenda permanece selecionado, passa no `exists` (que não é
  // farm-scoped) e produz relatório vazio silenciosamente.
  useEffect(() => {
    setValue('contract', null);
  }, [activeFarmUuid, setValue]);

  // `contract` — lookup FLAT (`{uuid, number}[]`, SEM `meta`), `Select` +
  // `useOptionsSelectQuery` (TASK-RVC-FE-01). NUNCA `SelectAsyncPaginate`
  // aqui — o endpoint não pagina. `queryKey` inclui `activeFarmUuid` para não
  // servir a lista da fazenda anterior do cache na troca de fazenda.
  const contractsQuery = useOptionsSelectQuery({
    asyncFunction: () => listSaleContractOptions(),
    queryKey: `${queryKey.saleContracts.saleContractOptions}-${activeFarmUuid}`,
    mapOption: (item) => ({ label: item.number, value: item.uuid }),
  });

  const reportMutation = useMutation({
    mutationFn: (params: TransferSalesContractReportParams) =>
      downloadTransferSalesContractReport(params),
    onSuccess: (blob, variables) => {
      if (variables.format === 'pdf') {
        // PDF abre INLINE em nova aba — o servidor responde
        // `Content-Disposition: inline` (`GbCerneSnappyReport::inline`) e o
        // legado submetia com `target=_blank` (C-13). `downloadBlob` aqui
        // quebraria a fidelidade.
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        // Nome legado EXATO (`agro365` controller:96).
        downloadBlob(blob, 'romaneio_vendas_contrato.xlsx');
      }
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    },
    onError: async (error) => {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo. `extractApiErrorMessage`
      // NÃO sabe ler `Blob` e é proibido aqui.
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

  function buildParams(
    data: TransferSalesContractReportFilterForm
  ): TransferSalesContractReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      client: data.client?.value || undefined,
      type: data.type?.value || undefined,
      product: data.product?.value || undefined,
      contract: data.contract?.value || undefined,
      format: data.format!.value,
    };
  }

  function onSubmit(data: TransferSalesContractReportFilterForm) {
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
              name="client"
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
                  isReadOnly={isGenerating}
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
                  onChange={(option) => field.onChange(option ?? null)}
                  options={transferTypeOptions.options(languageGB)}
                  isDisabled={isGenerating}
                />
              )}
            />

            <Controller
              name="product"
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
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
                />
              )}
            />

            <Controller
              name="contract"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.contract}
                  placeholder={text.contractPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={contractsQuery.options}
                  loading={contractsQuery.isLoading}
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
