// src/pages/Relatorios/Pecuaria/EstoqueRebanho/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Pecuária > Estoque/Rebanho" (F-228, execução
// 97-Esteiras/078, TASK-F228-F03). Rota
// `/relatorios/pecuaria/estoque-rebanho`, materializa o item de menu FILHO
// `rel-pec-estoque-rebanho`, filho do grupo `rel-pec` ("Pecuária",
// `navigationTree.ts`) — fiel ao legado (`sidebar.blade.php:2858`, submenu
// `#pecuariarelatorio`).
//
// Mirror ESTRUTURAL de `Relatorios/Agricultura/DescarteRomaneio/index.tsx`
// (F-256 — casca `FormContainer` + footer, `DateInput` via `Controller`,
// download blob PDF, `parseBlobError`, reset farm-scoped na troca de
// fazenda) + `Relatorios/Pecuaria/CusteioLote/index.tsx` (multiselect
// `SelectAsyncPaginate isMulti` via `Controller`). DIFERENÇAS vs F-256:
// (a) `species` é MULTISELECT (não 1 `area` single); (b) **1 único botão
// "Baixar PDF"** — PDF-ONLY (FRONT-05), SEM Excel, SEM `report_type`,
// mirror `custeio-lote` MENOS o botão Excel.
//
// Endpoint FLAT (raiz, NÃO `/reports/...`): `GET /animals-report`, params
// `start_date`(req)/`end_date`(req)/`species[]`(opt uuid). Nome do arquivo
// fixo do contrato: `relatorio-estoque-rebanho.pdf` (aberto inline via
// `window.open`, não forçado por `downloadBlob` — mirror `DescarteRomaneio`,
// não `CusteioLote`).
//
// `species` — `SelectAsyncPaginate isMulti` alimentado por `listSpecieOptions`
// (`@/services/v2/Species/species-service`, `/species/options`, tenant-scoped
// via `X-Farm-Id`) — NÃO `listSpecies` (gated `specie_view`), NÃO endpoint
// genérico novo. Resetado na troca de fazenda ativa (FRONT-15, guardrail
// `filtro_farm_scoped_reset_na_troca_de_fazenda`).
//
// FIX GAP-16/item 8 (2026-09, decisão do dono — homologação): `species` é
// OBRIGATÓRIO (fiel ao legado — vazio produzia linhas-fantasma de todas as
// espécies). `isRequired` + `error` no próprio `SelectAsyncPaginate` (mirror
// `MovimentacaoRebanho`/DS `Field`) e botão "Baixar PDF" GATED por
// `speciesValue` vazio (mirror `equipmentIdsValue.length === 0` em
// `Relatorios/Frotas/Manutencoes/index.tsx`, F-276).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';

import { animalsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/animals-report-filter-schema';

import {
  downloadAnimalsReportPdf,
  toAnimalsReportParams,
} from '@/services/v2/Relatorios/animals-report-service';
import { listSpecieOptions } from '@/services/v2/Species/species-service';

import type { AnimalsReportFormValues } from '@/@types/v2/Relatorios/animals-report';
import type { SpecieOptionItem } from '@/@types/v2/Species/species';

const pristineValues: AnimalsReportFormValues = {
  start_date: null,
  end_date: null,
  species: [],
};

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `CusteioLote/index.tsx`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

export default function EstoqueRebanhoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.animalsReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnimalsReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: animalsReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Guardrail farm-scoped (FRONT-15) — `species` é resetado na troca de
  // fazenda ativa (mirror `filtro_farm_scoped_reset_na_troca_de_fazenda`): a
  // seleção anterior deixaria de existir no universo da nova fazenda e
  // causaria 422/lista estagnada.
  useEffect(() => {
    setValue('species', [], { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // GATE do botão "Baixar PDF" (FIX GAP-16/item 8) — mirror
  // `equipmentIdsValue` em `Relatorios/Frotas/Manutencoes/index.tsx`: sem
  // nenhuma espécie selecionada o botão fica desabilitado, ANTES mesmo da
  // validação do submit.
  const speciesValue = watch('species');
  const hasSelectedSpecies = Boolean(speciesValue?.length);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `DescarteRomaneio`/`CusteioLote`).
  async function notifyDownloadError(error: unknown) {
    const parsed = await parseBlobError(error);
    const fieldMessage = parsed.errors
      ? Object.values(parsed.errors)
          .flat()
          .find((message): message is string => typeof message === 'string')
      : undefined;
    toaster.error({
      title: text.pageTitle,
      description: fieldMessage ?? parsed.message ?? text.toasts.genericError,
    });
  }

  async function handleDownloadPdf(values: AnimalsReportFormValues) {
    const params = toAnimalsReportParams(values);
    setIsExportingPdf(true);
    try {
      const blob = await downloadAnimalsReportPdf(params);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `DescarteRomaneio`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
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
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || !hasSelectedSpecies}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.threeColumns} gap={6}>
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
              {errors.start_date?.message && (
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
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="species"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.species}
                  placeholder={text.speciesPlaceholder}
                  isRequired
                  error={errors.species?.message}
                  isMulti
                  closeMenuOnSelect={false}
                  service={listSpecieOptions}
                  mapOptions={(item: SpecieOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? []}
                  onChange={(options: any) => field.onChange(options ?? [])}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              )}
            />
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
