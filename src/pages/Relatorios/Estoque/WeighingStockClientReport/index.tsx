// src/pages/Relatorios/Estoque/WeighingStockClientReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Pesagem/Armazém/Cliente — Relatório" (F-337, execução 059,
// `CORE_WORKSPACE/97-Esteiras/059/CONTRATOS/CONTRATO-F337-pesagem-armazem-
// cliente.md`). Rota sugerida
// `/relatorios/estoque/pesagem-armazem-cliente` (NÃO registrada por este
// Executor — ver "bloco de fiação" no handoff da entrega), domínio Estoque,
// mirror do submenu `rel-est` (`navigationTree.ts`).
//
// Mirror ESTRUTURAL: `Relatorios/Estoque/StockAbcReport/index.tsx` — MESMA
// casca `FormContainer` + footer + `<Form onSubmit={preventDefault}>` +
// `SimpleGrid columns={columnsForm.default}`, mesmo padrão de download
// síncrono por blob via `useState` local `isDownloading` (NUNCA `useMutation`
// para binário, `get_pwa_file_upload_and_export_pattern §2` — V3 canônico).
//
// DIFERENÇA vs `StockAbcReport`: contrato de API desta feature
// (`WeighingStockClientReportRequest::rules()`) NÃO tem filtro de período
// (`start_date`/`end_date`) — `format` (`pdf`/`xlsx`, obrigatório, default
// `pdf` pré-selecionado, `noClearable`) permanece o único campo obrigatório.
//
// DIVERGÊNCIA RESOLVIDA (DEC-267, esteira 060, ROTEIRO-F337-FRONT.md): os 3
// selects `product`/`client`/`warehouse` — que a execução 059 manteve
// deliberadamente FORA da tela por a API então não aplicar o filtro na
// query (D-02/FUP-337-01) — foram RE-ATIVADOS pelo dono como filtros
// OPCIONAIS (vazio = relatório completo). A ativação do `->when()` na
// Repository é responsabilidade coordenada de `ROTEIRO-F337-API.md`
// (mesma esteira). Fiação mirror EXATA de
// `Relatorios/Agricultura/PesagemEntradaSaida/index.tsx` (F-336), com 2
// diferenças obrigatórias: (a) os 3 são OPCIONAIS aqui (F-336 tem `product`
// obrigatório); (b) as chaves de param são `product`/`client`/`warehouse`
// (NÃO `product_uuid`/`client_uuid`/`warehouse_uuid` como F-336) — chave
// EXATA de `WeighingStockClientReportRequest::rules()`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Flex, SimpleGrid, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { weighingStockClientReportFormatOptions } from '@/constants/Relatorios/weighing-stock-client-report/options/weighing-stock-client-report-format-options';

import { weighingStockClientReportFilterSchemaResolver } from '@/validations/schemas/WeighingStockClientReport/weighing-stock-client-report-filter-schema';

import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';
import { downloadWeighingStockClientReport } from '@/services/v2/WeighingStockClientReport/weighing-stock-client-report-service';

import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';
import type {
  WeighingStockClientReportFilterForm,
  WeighingStockClientReportParams,
} from '@/@types/v2/WeighingStockClientReport';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `PesagemEntradaSaida`/`PesagensColheita`/`JurosPagos`/
// `LoteFornecedor`/`MovimentacaoEstoque`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapProductOption(item: ProductOption) {
  return { label: `${item.code} — ${item.description}`, value: item.uuid };
}

function mapWarehouseOption(item: WarehouseOption) {
  return { label: `${item.initials} — ${item.description}`, value: item.uuid };
}

function mapClientOption(item: ClientOptionItem) {
  return { label: item.name ?? '', value: item.uuid };
}

export default function WeighingStockClientReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.weighingStockClientReport.report;

  const buildPristineValues = (): WeighingStockClientReportFilterForm => ({
    product: null,
    client: null,
    warehouse: null,
    format: weighingStockClientReportFormatOptions.getOption('pdf', languageGB),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WeighingStockClientReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: weighingStockClientReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: WeighingStockClientReportFilterForm): WeighingStockClientReportParams {
    return {
      product: data.product?.value || undefined,
      client: data.client?.value || undefined,
      warehouse: data.warehouse?.value || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: WeighingStockClientReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadWeighingStockClientReport(params);
      downloadBlob(blob, `pesagem-armazem-cliente.${params.format}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `StockAbcReport`/`MovimentacaoEstoque`).
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
            disabled={isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="product"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  error={errors.product?.message as string | undefined}
                  service={listProductOptions}
                  mapOptions={mapProductOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="client"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.client}
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
              name="warehouse"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.warehouse}
                  service={listWarehouseOptions}
                  mapOptions={mapWarehouseOption}
                  // SEM `type`/`farm_uuid` no `findParams` — o endpoint já é
                  // farm-scoped por default (ROTEIRO-F337-FRONT.md §3.B).
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
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
                  options={weighingStockClientReportFormatOptions.options(languageGB)}
                  noClearable
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
