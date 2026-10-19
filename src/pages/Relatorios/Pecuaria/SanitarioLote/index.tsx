// src/pages/Relatorios/Pecuaria/SanitarioLote/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) Sanitário por Lote — Relatórios > Pecuária
// (`san-screen-report`). Export síncrono via blob — o servidor devolve o
// binário pronto na mesma resposta `GET /sanitaries-batch-report`.
//
// RE-ALINHAMENTO F-318 (esteira 078, F-318-plano-frontend.md,
// TASK-F318-F03) — a tela JÁ EXISTIA sob um contrato REDUZIDO (TASK-SAN-FE-08
// anterior: só `start_date`/`end_date`/`batch_uuid`, os outros 4 filtros
// tratados como campo morto por especulação incorreta). A API foi
// RE-MIGRADA (SFC-318-FILTERS/SFC-318-PERM) e restaurou `category_uuid`/
// `feedlot_corral_uuid`/`animal_uuid`/`product_uuid` + trocou o slug de
// permissão para `sanitaries-batch-report_view` (gate na rota, ver
// `router/index.tsx`). Esta edição RESTAURA os 4 selects, preservando a
// casca/mecânica de download já validada.
//
// Mirrors: `Relatorios/Pecuaria/DesempenhoPesagemConfinamento/index.tsx`
// (Curral via `listFeedlotCorrals` — índice, NÃO `/feedlot-corrals/options`,
// que serve só os enums do FORM) e `Relatorios/Estoque/SaidasCentroCusto/
// index.tsx` (Select simples alimentado por `useQuery` para lookup GLOBAL/
// farm-scoped + guardrail `useEffect([activeFarmUuid])` que reseta os
// selects farm-scoped na troca de fazenda ativa).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Download, FileSpreadsheet } from 'lucide-react';
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
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { sanitariesBatchReportFilterSchema } from '@/validations/schemas/Sanitaries/sanitaries-batch-report-filter-schema';

import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listFeedlotCorrals } from '@/services/v2/FeedlotCorrals/feedlot-corral-service';
import { listProductOptions } from '@/services/v2/Products/product-service';
import {
  downloadSanitariesBatchReportPdf,
  downloadSanitariesBatchReportXlsx,
} from '@/services/v2/Sanitaries/sanitaries-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { FeedlotCorralListItem } from '@/@types/v2/FeedlotCorrals';
import type { ProductOption } from '@/@types/v2/Products';

// Form values desta tela (page-scoped, não compartilhado — só esta tela
// consome `SanitaryBatchReportFilterForm`). Todos os selects viram
// `Option<string>|null` (widgets `Select`/`SelectAsyncPaginate`); cada um
// vira `{campo}_uuid` no payload real do service
// (`DownloadSanitariesBatchReportParams`).
interface SanitaryBatchReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  category: Option<string> | null;
  feedlotCorral: Option<string> | null;
  batch: Option<string> | null;
  animal: Option<string> | null;
  product: Option<string> | null;
}

const pristineValues: SanitaryBatchReportFilterForm = {
  start_date: null,
  end_date: null,
  category: null,
  feedlotCorral: null,
  batch: null,
  animal: null,
  product: null,
};

function mapCategoryOption(item: CategoryAnimalOptionItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapFeedlotCorralOption(item: FeedlotCorralListItem): Option<string> {
  return { label: `${item.identification} — ${item.name}`, value: item.uuid };
}

function mapAnimalOption(item: AnimalOptionListItem): Option<string> {
  return { label: item.label, value: item.uuid };
}

function mapProductOption(item: ProductOption): Option<string> {
  return { label: item.description, value: item.uuid };
}

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mirror
// `DesempenhoPesagemConfinamento`/`CusteioLote`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

// Com `responseType: 'blob'`, um erro JSON (422) chega como `Blob`, não como
// objeto já parseado pelo axios — converte de volta para texto/JSON antes de
// ler `message` (mirror `EvolucaoRebanhoRelatorio::parseDownloadError`, que
// por sua vez espelha `Relatorios/Suprimentos/index.tsx`).
function extractErrorMessage(parsed: unknown): string | null {
  const body = parsed as { message?: string; errors?: Record<string, string[]> } | undefined;
  const firstFieldError = body?.errors ? Object.values(body.errors)[0]?.[0] : undefined;
  return firstFieldError ?? body?.message ?? null;
}

async function parseDownloadError(
  error: unknown
): Promise<{ status: number | null; message: string | null }> {
  if (!isAxiosError(error)) {
    return { status: null, message: error instanceof Error ? error.message : null };
  }

  const status = error.response?.status ?? null;
  const data = error.response?.data as unknown;

  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return { status, message: extractErrorMessage(parsed) };
    } catch {
      return { status, message: null };
    }
  }

  return { status, message: extractErrorMessage(data) };
}

export default function SanitarioLoteRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.sanitary.sanitary.report;

  const { control, handleSubmit, watch, setValue } = useForm<SanitaryBatchReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(sanitariesBatchReportFilterSchema(languageGB)) as any,
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botões desabilitados até as 2 datas estarem preenchidas (mirror
  // `hasValidTrigger`/`hasValidRange` de `EvolucaoRebanhoRelatorio`) — a
  // validação `end_date >= start_date` fica a cargo do schema Yup no submit.
  const hasValidRange = !!startDateValue && !!endDateValue;

  // `category` — lookup `-options` agora TENANT-SCOPED
  // (063-est03-9-reprovacoes, TASK-FE-063-10, `tenant_cost_center_scoped`) —
  // restringe às categorias vinculadas aos centros de custo do tenant ativo
  // (`X-Farm-Id`). Comentário anterior ("GLOBAL, `category_animals` SEM
  // farm-scoping") DESATUALIZADO por este fix; a troca de fazenda invalida
  // as queries do TanStack globalmente (ver `get_spa_api_client_pattern §2`),
  // então esta lista é reconsultada com o novo escopo sem precisar de
  // `activeFarmUuid` na queryKey.
  const categoryQuery = useQuery({
    queryKey: [queryKey.relatorios.sanitariesBatchReport, 'categories'],
    queryFn: () => listCategoryAnimalOptions({ tenant_cost_center_scoped: true }),
  });
  useQueryError([categoryQuery]);
  const categoryOptions: Option<string>[] = (categoryQuery.data?.data.items ?? []).map(
    mapCategoryOption
  );

  // Guardrail farm-scoped (FRONT-15) — `feedlotCorral`/`batch`/`animal`/
  // `product` são resetados na troca de fazenda ativa (mirror
  // `filtro_farm_scoped_reset_na_troca_de_fazenda`/`SaidasCentroCusto`): a
  // seleção anterior deixaria de existir no universo da nova fazenda e
  // causaria 422/lista estagnada. `category` NÃO reseta aqui — decisão FORA
  // do escopo literal de TASK-FE-063-10 (roteiro só pediu a flag
  // `tenant_cost_center_scoped` + a atualização deste comentário); agora que
  // o catálogo passou a ser tenant-scoped, uma categoria selecionada antes da
  // troca de fazenda PODE deixar de pertencer ao novo escopo — registrado
  // aqui como achado, não decidido silenciosamente (mesma cautela de FID-G3A).
  useEffect(() => {
    setValue('feedlotCorral', null, { shouldDirty: false });
    setValue('batch', null, { shouldDirty: false });
    setValue('animal', null, { shouldDirty: false });
    setValue('product', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  async function handleExportPdf(data: SanitaryBatchReportFilterForm) {
    setIsExportingPdf(true);
    try {
      const blob = await downloadSanitariesBatchReportPdf({
        start_date: data.start_date as string,
        end_date: data.end_date as string,
        category_uuid: data.category?.value || undefined,
        feedlot_corral_uuid: data.feedlotCorral?.value || undefined,
        batch_uuid: data.batch?.value || undefined,
        animal_uuid: data.animal?.value || undefined,
        product_uuid: data.product?.value || undefined,
      });
      downloadBlob(blob, 'relatorio-sanitario-lote.pdf');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      const { message } = await parseDownloadError(error);
      toaster.error({ title: text.pageTitle, description: message || text.toasts.genericError });
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleExportXlsx(data: SanitaryBatchReportFilterForm) {
    setIsExportingXlsx(true);
    try {
      const blob = await downloadSanitariesBatchReportXlsx({
        start_date: data.start_date as string,
        end_date: data.end_date as string,
        category_uuid: data.category?.value || undefined,
        feedlot_corral_uuid: data.feedlotCorral?.value || undefined,
        batch_uuid: data.batch?.value || undefined,
        animal_uuid: data.animal?.value || undefined,
        product_uuid: data.product?.value || undefined,
      });
      downloadBlob(blob, 'relatorio-sanitario-lote.xlsx');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      const { message } = await parseDownloadError(error);
      toaster.error({ title: text.pageTitle, description: message || text.toasts.genericError });
    } finally {
      setIsExportingXlsx(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.exportPdf}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleExportPdf)}
            loading={isExportingPdf}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.exportXlsx}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleExportXlsx)}
            loading={isExportingXlsx}
            disabled={!hasValidRange || isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={4}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.filters.startDate}
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
                {text.filters.endDate}
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
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.filters.category}
                  placeholder={text.placeholders.category}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={categoryOptions}
                  loading={categoryQuery.isFetching}
                />
              )}
            />

            <Box>
              <Controller
                name="feedlotCorral"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.corral}
                    placeholder={text.placeholders.corral}
                    service={listFeedlotCorrals}
                    mapOptions={mapFeedlotCorralOption}
                    findParams={(search: string | { search: string }) => ({
                      name: searchOf(search),
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="batch"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.batch}
                    service={listBatchOptionsForForm}
                    mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                    findParams={(search: string | { search: string }) => ({
                      search: searchOf(search),
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => {
                      // Exclusão mútua animal↔batch (FRONT-09, fiel ao
                      // legado): selecionar Lote limpa Animal.
                      field.onChange(option ?? null);
                      if (option) setValue('animal', null, { shouldDirty: false });
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="animal"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.animal}
                    placeholder={text.placeholders.animal}
                    service={listAnimalOptions}
                    mapOptions={mapAnimalOption}
                    findParams={(search: string | { search: string }) => ({
                      search: searchOf(search),
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => {
                      // Exclusão mútua animal↔batch (FRONT-09, fiel ao
                      // legado): selecionar Animal limpa Lote.
                      field.onChange(option ?? null);
                      if (option) setValue('batch', null, { shouldDirty: false });
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>

            <Box>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.filters.product}
                    placeholder={text.placeholders.product}
                    service={listProductOptions}
                    mapOptions={mapProductOption}
                    findParams={(search: string | { search: string }) => ({
                      search: searchOf(search),
                    })}
                    value={field.value ?? null}
                    onChange={(option: any) => field.onChange(option ?? null)}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                )}
              />
            </Box>
          </SimpleGrid>

          {!hasValidRange && (
            <Text fontSize="sm" color="fg.muted">
              {text.hint.datesRequired}
            </Text>
          )}
        </VStack>
      </Form>
    </FormContainer>
  );
}
