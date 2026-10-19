// src/pages/Relatorios/Pecuaria/CategoryAnimalReport/index.tsx
// -----------------------------------------------------------------------------
// Tela "Estq. Animais/Categoria — Relatório" (F-242, esteira 97-Esteiras/077,
// CONTRATOS/front/F-242-plano-front.md). Rota
// `/relatorios/pecuaria/estoque-animais-categoria`, materializa o item de
// menu FILHO `rel-pec-cat`, sob o grupo/submenu `rel-pec` ("Pecuária",
// `navigationTree.ts`) — 13º filho, após `rel-pec-mov`.
//
// Mirror ESTRUTURAL EXATO de
// `Relatorios/Estoque/LoteFornecedor/index.tsx`/`Relatorios/Estoque/
// StockAbcReport/index.tsx` — mesma casca `FormContainer` + footer + `<Form
// onSubmit={preventDefault}>` + `SimpleGrid columns={columnsForm.default}`,
// mesmo padrão de `Select` de formato `noClearable` + download síncrono por
// blob via `useState` local `isDownloading` (NUNCA `useMutation` para
// binário). Complementado por `Relatorios/Pecuaria/FichaAnimal/index.tsx`
// para a fiação de `SelectAsyncPaginate` sobre `listCategoryAnimalOptions`/
// `listBatchOptionsForForm` (mesmo helper inline `searchOf`).
//
// 4 campos: `category_uuid`/`batch_uuid`/`harvest_uuid` TODOS OPCIONAIS (fiel
// ao legado CL-04, nenhum filtro obrigatório) + `format` (PDF/Excel, default
// `pdf` pré-selecionado, `noClearable`). Botão "Gerar relatório" SEMPRE
// habilitado (`disabled={isDownloading}` apenas) — diferente de
// `LoteFornecedor` (`disabled={!providerValue}`), pois nenhum campo aqui é
// obrigatório (ACT-01/CL-04 do contrato legado).
//
// `batch_uuid` usa `listBatchOptionsForForm` (NUNCA `listBatchOptions`) — a
// API planejada valida `batch_uuid` como `sometimes|uuid|exists`, nunca
// aceita a sentinela `"0"` de "Sem lote" (risco 3 do plano front).
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
import { categoryAnimalReportFormatOptions } from '@/constants/Relatorios/category-animal-report/options/category-animal-report-format-options';

import { categoryAnimalReportFilterSchemaResolver } from '@/validations/schemas/CategoryAnimalReport/category-animal-report-filter-schema';

import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { downloadCategoryAnimalReport } from '@/services/v2/CategoryAnimalReport/category-animal-report-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';
import { listHarvestOptions } from '@/services/v2/Harvests/harvest-service';

import type { BatchOption } from '@/@types/v2/Batches';
import type {
  CategoryAnimalReportFilterForm,
  CategoryAnimalReportParams,
} from '@/@types/v2/CategoryAnimalReport';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';
import type { Harvest } from '@/@types/v2/Harvests';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline
// já usado em `LoteFornecedor`/`FichaAnimal`/`CusteioAnimal`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function CategoryAnimalReportRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.categoryAnimalReport.report;

  const buildPristineValues = (): CategoryAnimalReportFilterForm => ({
    category_uuid: null,
    batch_uuid: null,
    harvest_uuid: null,
    format: categoryAnimalReportFormatOptions.getOption('pdf', languageGB),
  });

  const { control, handleSubmit } = useForm<CategoryAnimalReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: categoryAnimalReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  function buildParams(data: CategoryAnimalReportFilterForm): CategoryAnimalReportParams {
    return {
      category_uuid: data.category_uuid?.value || undefined,
      batch_uuid: data.batch_uuid?.value || undefined,
      harvest_uuid: data.harvest_uuid?.value || undefined,
      report_type: data.format!.value,
    };
  }

  async function handleDownload(data: CategoryAnimalReportFilterForm) {
    setIsDownloading(true);
    try {
      const params = buildParams(data);
      const blob = await downloadCategoryAnimalReport(params);
      const extension = params.report_type === 'excel' ? 'xlsx' : 'pdf';
      downloadBlob(blob, `estoque-animais-categoria.${extension}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `LoteFornecedor`/`StockAbcReport`).
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
              name="category_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.category}
                  placeholder={text.categoryPlaceholder}
                  service={listCategoryAnimalOptions}
                  mapOptions={(item: CategoryAnimalOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                    // `tenant_cost_center_scoped` (063-est03-9-reprovacoes,
                    // TASK-FE-063-10) — escopa ao centro de custo do tenant
                    // ativo; `search` continua funcionando dentro do escopo
                    // (correção de `listOptionsForTenantCostCenter`).
                    tenant_cost_center_scoped: true,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="batch_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.batch}
                  placeholder={text.batchPlaceholder}
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="harvest_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.harvest}
                  placeholder={text.harvestPlaceholder}
                  service={listHarvestOptions}
                  mapOptions={(item: Harvest) => ({ label: item.description, value: item.uuid })}
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
                  options={categoryAnimalReportFormatOptions.options(languageGB)}
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
