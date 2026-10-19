// src/pages/Relatorios/Estoque/CustoProducaoBatida/index.tsx
// -----------------------------------------------------------------------------
// Tela "Custo Produção Batida — Relatório" (F-267, TASK-267-FE-01, esteira
// 073). Rota `/relatorios/estoque/custo-producao-batida`, materializa o item
// de menu FILHO `rel-est-custo-batida`, sob o grupo/submenu `rel-est`
// ("Estoque", `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/JurosPagos/index.tsx`
// (FormContainer + footer, sem prévia, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError`),
// simplificado para 3 campos (`start_date`/`end_date`/`food_uuid`) — sem
// reset por fazenda ativa, pois nenhum dos 3 campos é farm-scoped por
// seleção manual (o isolamento por fazenda é automático via `X-Farm-Id`,
// contrato de API `## 4.2`).
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Baixar PDF"
// (contrato de tela §4 SURF-TABLE, mesma decisão de escopo de `JurosPagos`).
//
// `food_uuid` — Select "Ração", NUNCA "Produto": reusa a técnica JÁ EXISTENTE
// no próprio módulo Batida (`CreateOrUpdateFoodBeat.tsx:135-140`,
// `listActiveFoodOptions`/`mapFoodOption`), não `listProductOptions`
// (contrato de tela §5, item 3 / risco 2 da Tarefa).
//
// Service `getFoodBeatAggregatedReport` REUSADO de
// `food-beat-service.ts` — NENHUM service novo criado (contrato de tela §6).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { foodBeatAggregateReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/food-beat-aggregate-report-filter-schema';

import {
  getFoodBeatAggregatedReport,
  type GetFoodBeatAggregatedReportParams,
} from '@/services/v2/FoodBeats/food-beat-service';
import { listFoods, type ListFoodsParams } from '@/services/v2/Foods/food-service';

import type { Option } from '@/@types/option';
import type { FoodListItem } from '@/@types/v2/Foods';

interface CustoProducaoBatidaFilterForm {
  start_date: string | null;
  end_date: string | null;
  food_uuid: Option<string> | null;
}

const pristineValues: CustoProducaoBatidaFilterForm = {
  start_date: null,
  end_date: null,
  food_uuid: null,
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `JurosPagos/index.tsx`/`FilterSideExpense.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

// Select "Ração" — mirror EXATO `CreateOrUpdateFoodBeat.tsx:135-140`
// (`listActiveFoodOptions`/`mapFoodOption`), NUNCA `listProductOptions` —
// o filtro `food_uuid` do legado seleciona a entidade Food (Ração), não
// Product (contrato de tela §5, item 3).
async function listActiveFoodOptions(params: ListFoodsParams) {
  return listFoods({ ...params, is_enabled: '1' });
}

function mapFoodOption(item: FoodListItem) {
  return { label: `${item.code} — ${item.product.description}`, value: item.uuid };
}

export default function CustoProducaoBatidaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.foodBeatAggregateReport.report;

  const { control, handleSubmit, watch } = useForm<CustoProducaoBatidaFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: foodBeatAggregateReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  function buildParams(data: CustoProducaoBatidaFilterForm): GetFoodBeatAggregatedReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      food_uuid: data.food_uuid?.value || undefined,
    };
  }

  async function handleDownload(data: CustoProducaoBatidaFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await getFoodBeatAggregatedReport(buildParams(data));
      downloadBlob(blob, 'custo-producao-batida.pdf');
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `JurosPagos/index.tsx`/`Dre/index.tsx`).
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
              name="food_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.food}
                  placeholder={text.foodPlaceholder}
                  service={listActiveFoodOptions}
                  mapOptions={mapFoodOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
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
