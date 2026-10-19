// src/pages/Relatorios/Agricultura/PesagemEntradaSaida/index.tsx
// -----------------------------------------------------------------------------
// Tela "Pesagem Entrada/Saída — Relatório" (F-336, TASK-058-F336-FE-02,
// esteira 97-Esteiras/058). Rota `/relatorios/agricultura/pesagem-entrada-
// saida`, materializa o item de menu FILHO `rel-agr-pesagem-entrada-saida`,
// sob o grupo/submenu `rel-agr` ("Agricultura", `navigationTree.ts`) — mesma
// família visual de "Pesagem Rodoviária"/"Pesagens/Colheita" (ModuleWeighing),
// ícone `Scale` reutilizado (já usado 2× no grupo, sem colisão de import).
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/ContasAPagar/index.tsx` — a
// MESMA casca (`FormContainer` + `Form` cru + footer com 1 botão Download),
// SEM `columns`/`order` (colunas e cálculo de saldo são fixos no servidor,
// FRONT-F336-plano.md §2.2) — só o chrome de FormContainer/footer é mirror.
//
// Correções FRONT-ONLY documentadas no plano (FRONT-F336-plano.md §4):
//   - `product` é OBRIGATÓRIO no schema (CORRIGE C9/FID-13 do legado, que
//     zerava silenciosamente o resultado sem produto) — `isRequired` real no
//     Select + validação no schema, não só uma dica visual.
//   - `warehouse` NUNCA envia `type` no `findParams` de `listWarehouseOptions`
//     (CORRIGE FID-16 — o legado não filtrava armazém por tipo; a fábrica de
//     lookup do front tem um default de `type` que aqui é deliberadamente
//     omitido para preservar "todos os tipos").
//   - `product`/`client` reusam `listProductOptions`/`listClientOptions` SEM
//     nenhum filtro adicional além da busca (FID-15/FID-14 — fora do escopo
//     desta tela, documentado no plano).
//
// `format` decide PDF×Excel via 1 único endpoint (`GET
// /weighing-in-out-report?...&format=pdf|xlsx`), `responseType:'blob'`
// obrigatório (sem isso o axios corrompe o binário). O FIX de VALOR do
// backend (C1 — "Peso Líquido" da Saída, `final_weight` em vez de
// `net_weight`) é 100% server-side — esta tela só baixa o binário já
// corrigido, sem recalcular nada.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { reportFormatOptions } from '@/constants/Relatorios/weighing-in-out-report/options';

import { weighingInOutReportFilterSchemaResolver } from '@/validations/schemas/WeighingInOutReport/weighing-in-out-report-filter-schema';

import {
  listClientOptions,
  type ClientOptionItem,
} from '@/services/v2/CadastrosBase/Client/client-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import { listWarehouseOptions } from '@/services/v2/Warehouses/warehouse-service';
import { downloadWeighingInOutReport } from '@/services/v2/WeighingInOutReport/weighing-in-out-report-service';

import type { ProductOption } from '@/@types/v2/Products';
import type { WarehouseOption } from '@/@types/v2/Warehouses';
import type {
  WeighingInOutReportFilterForm,
  WeighingInOutReportParams,
} from '@/@types/v2/WeighingInOutReport';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `PesagensColheita`/`JurosPagos`/`LoteFornecedor`/`MovimentacaoEstoque`.
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

function buildPristineValues(
  languageGB: ReturnType<typeof useLanguage>['languageGB']
): WeighingInOutReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    product: null,
    client: null,
    warehouse: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function PesagemEntradaSaidaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.weighingInOutReport.report;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WeighingInOutReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: weighingInOutReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: WeighingInOutReportFilterForm): WeighingInOutReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      product_uuid: data.product!.value,
      client_uuid: data.client?.value || undefined,
      warehouse_uuid: data.warehouse?.value || undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: WeighingInOutReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadWeighingInOutReport(params);
      // Mirror `pesagem_entrada_saida.pdf`/`.xlsx` do backend — sem
      // acento/underscore no lado SPA, por convenção de URL (plano §2.3).
      downloadBlob(blob, `pesagem-entrada-saida.${params.format === 'xlsx' ? 'xlsx' : 'pdf'}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO
      // `ContasAPagar`/`RomaneioCliente`/`PesagensColheita`).
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
              name="product"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.product}
                  error={errors.product?.message as string | undefined}
                  isRequired
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
                  // CORRIGE FID-16: SEM `type` no `findParams` — o legado não
                  // filtrava armazém por tipo (a fábrica de lookup do front
                  // tem um default de `type` que aqui é deliberadamente
                  // omitido para preservar "todos os tipos").
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
                  options={reportFormatOptions.options(languageGB)}
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
