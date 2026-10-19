// src/pages/Relatorios/Pecuaria/FichaAnimal/index.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO "gerar e sair" (PDF inline em nova aba) de Ficha Animal —
// Relatórios > Pecuária (Tarefa 47, frontend-contract-ficha-animal.md,
// `CONTRATOS_AUTOAPROVADO`). Consome `GET /api/v1/animal-record-report`
// (api-contract-ficha-animal.md), permissão `animal-record-report_view`
// REALMENTE checada no servidor (diferente de Vacas Prenhas/Horas
// Logadas/Prod.Área — aqui NÃO há gap de permissão a corrigir).
//
// Molde principal: `Relatorios/Pecuaria/VacasPrenhas/index.tsx` (mesmo hub,
// mesmo `useMutation`, mesmo `window.open` inline). As diferenças em relação
// a ele são exatamente 4 remoções (contrato §1.3): (1) sem
// `start_date`/`end_date`; (2) sem campo `type` (não existe Excel, esta tela
// nunca chama `downloadBlob`); (3) sem schema Yup (nenhum campo obrigatório,
// `useForm` sem `resolver`); (4) sem `hasValidRange`/desabilitar botão por
// filtro vazio (`OQ-05`/R-02 — submit sem filtro gera o PDF de todos os
// animais ativos, comportamento fiel). Adição única: o select de Categoria,
// mirror `CadastrosBase/Rebanho/FilterSideAnimal.tsx:206`
// (`listCategoryAnimalOptions`).
//
// Sem cascata entre os 3 selects (`CL-02`, contrato §4) — nenhum
// `findParams` cruzado. Sem grid on-screen, sem estado `empty`
// (`NAO_APLICAVEL`, contrato §R-05/§7) — não há superfície de dados
// on-screen, o "vazio" do domínio mora dentro do PDF (`OQ-04`/R-04).
// -----------------------------------------------------------------------------

import { Box, Flex, SimpleGrid } from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

import { columnsForm } from '@/constants/coluns-form';

import {
  downloadAnimalRecordReport,
  type AnimalRecordReportFilterParams,
} from '@/services/v2/Animals/animal-record-report-service';
import { listAnimalOptions } from '@/services/v2/Animals/animal-service';
import { listBatchOptionsForForm } from '@/services/v2/Batches/batch-service';
import { listCategoryAnimalOptions } from '@/services/v2/CategoryAnimals/category-animal-service';

import type { Option } from '@/@types/option';
import type { AnimalOptionListItem } from '@/@types/v2/Animals';
import type { BatchOption } from '@/@types/v2/Batches';
import type { CategoryAnimalOptionItem } from '@/@types/v2/CategoryAnimals';

// Form values desta tela (page-scoped) — `category`/`batch`/`animal` viram
// `Option<string>|null` (widget Chakra), desempacotados para `uuid` no
// submit (contrato §4). Todos opcionais, nenhum default de negócio.
interface FichaAnimalReportFormValues {
  category: Option<string> | null;
  batch: Option<string> | null;
  animal: Option<string> | null;
}

export default function FichaAnimalRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.animalRecordReport.report;

  const { control, handleSubmit } = useForm<FichaAnimalReportFormValues>({
    mode: 'onChange',
    defaultValues: {
      category: null,
      batch: null,
      animal: null,
    },
  });

  // `useMutation` direto (mirror `VacasPrenhas`/`pregnant-cows-report`) —
  // resposta binária síncrona, SEMPRE PDF inline (sem campo `type`, esta
  // tela não tem Excel, contrato §3/§8). Query key: nenhuma — mutation sem
  // cache e sem invalidação (`SEM-01`, ausência comprovada).
  const reportMutation = useMutation({
    mutationFn: (params: AnimalRecordReportFilterParams) => downloadAnimalRecordReport(params),
    onSuccess: (blob) => {
      // PDF `Content-Disposition: inline` — abre em nova aba, NUNCA
      // `downloadBlob` (forçaria download, quebrando a fidelidade a
      // AC-01/AC-02).
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');

      toaster.success({ title: text.pageTitle, description: text.successToast });
    },
    onError: (error) => {
      toaster.error({
        title: text.pageTitle,
        description: extractApiErrorMessage(error) || text.errorToast,
      });
    },
  });

  // Payload flat — omitir chave quando vazio, nunca enviar string vazia
  // (contrato §4). Sem `farm_id`/`tenant_id` (`CL-10`, parâmetros mortos) —
  // `X-Farm-Id` é injetado pelo interceptor.
  function onSubmit(data: FichaAnimalReportFormValues) {
    reportMutation.mutate({
      category_uuid: data.category?.value || undefined,
      batch_uuid: data.batch?.value || undefined,
      animal_uuid: data.animal?.value || undefined,
    });
  }

  const isGenerating = reportMutation.isPending;

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end" gap={3}>
          <Button
            title={text.submitButton}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <Box>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.filters.category}
                  placeholder={text.filterAllPlaceholder}
                  service={listCategoryAnimalOptions}
                  mapOptions={(item: CategoryAnimalOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    // `tenant_cost_center_scoped` (063-est03-9-reprovacoes,
                    // TASK-FE-063-10) — escopa ao centro de custo do tenant
                    // ativo; `search` continua funcionando dentro do escopo
                    // (correção de `listOptionsForTenantCostCenter`).
                    tenant_cost_center_scoped: true,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
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
                  placeholder={text.filterAllPlaceholder}
                  service={listBatchOptionsForForm}
                  mapOptions={(item: BatchOption) => ({ label: item.label, value: item.uuid })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
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
                  placeholder={text.filterAllPlaceholder}
                  service={listAnimalOptions}
                  mapOptions={(item: AnimalOptionListItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                  isReadOnly={isGenerating}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </Box>
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
