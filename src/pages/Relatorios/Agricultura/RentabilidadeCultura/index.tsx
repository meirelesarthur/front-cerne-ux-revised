// src/pages/Relatorios/Agricultura/RentabilidadeCultura/index.tsx
// -----------------------------------------------------------------------------
// Tela "Rentabilidade/Cultura — Relatório" (F-302, esteira
// CORE_WORKSPACE/97-Esteiras/077, F-302-plano-front.md). Rota nova
// `/relatorios/agricultura/rentabilidade-cultura`, filho novo do submenu
// "Agricultura" (`rel-agr` — wiring em navigationTree.ts/
// navigationPermissions.ts/router/index.tsx, reportado à parte).
//
// Mirror ESTRUTURAL do casco de `Relatorios/Vendas/ClienteProduto/index.tsx`
// (F-313) — MESMO arquétipo "filtro→download binário, sem prévia,
// `SelectAsyncPaginate` para lookup paginado" — SÓ PDF (SEM seletor de
// formato, o `type` do ClienteProduto é removido, sem substituto).
//
// Cascata harvest→datas (única, simples, 1 direção) mirror EXATO
// `ProducaoCusteioArea`/F-298 (IG-01/IG-02), só que sem o 2º campo
// cascateado `areas` — aqui só datas:
//   IG-01 — selecionar `harvest` autopreenche `start_date`/`end_date` a
//   partir do PRÓPRIO objeto `Harvest` (já tem `start_date`/`end_date` no
//   shape retornado por `listActiveHarvests`, sem 2ª chamada de rede).
//   IG-02 — editar manualmente qualquer uma das 2 datas depois reseta
//   `harvest` para vazio (guarda `cascadeOriginRef`).
// `cultivation_uuid` é INDEPENDENTE dessa cascata (nenhum campo o
// preenche/reseta).
//
// `cultivation_uuid` — `SelectAsyncPaginate` sobre `listCultivationOptions`
// (`@/services/v2/Cultivation/cultivation-service.ts`), REQUIRED (diferente
// de todo campo opcional do template F-230/F-313 — `v.option<string>()`).
// `harvest` — `useQuery` simples + `Select` local (universo pequeno por
// tenant) sobre `listActiveHarvests`
// (`@/services/v2/Harvests/harvest-service.ts`), OPCIONAL, 100% client-side
// (NUNCA enviado ao service — risco 3 do plano de front).
// -----------------------------------------------------------------------------

import { useRef, useState } from 'react';

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

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { profitabilityByCropReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/profitability-by-crop-report-filter-schema';

import { listCultivationOptions } from '@/services/v2/Cultivation/cultivation-service';
import { listActiveHarvests } from '@/services/v2/Harvests/harvest-service';
import { downloadProfitabilityByCropReportPdf } from '@/services/v2/Relatorios/profitability-by-crop-report-service';

import type { Option } from '@/@types/option';
import type { CultivationOption } from '@/@types/v2/Cultivation/cultivation';
import type { Harvest } from '@/@types/v2/Harvests';
import type {
  ProfitabilityByCropReportFilterForm,
  ProfitabilityByCropReportParams,
} from '@/@types/v2/Relatorios/profitability-by-crop-report';

// Extrai o texto de busca independente do formato entregue pelo
// `SelectAsyncPaginate` (string cru ou `{ search }`) — mesmo helper inline já
// usado em `ClienteProduto`/`PesagensColheita`/`JurosPagos`/`LoteFornecedor`.
function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function mapCultivationOption(item: CultivationOption) {
  return { label: item.label, value: item.uuid };
}

const pristineValues: ProfitabilityByCropReportFilterForm = {
  cultivation_uuid: null,
  harvest: null,
  start_date: null,
  end_date: null,
};

/** Origem da última mudança em `start_date`/`end_date` — guarda anti-loop de
 * IG-02 (evita resetar `harvest` no MESMO ciclo de render em que IG-01
 * acabou de preenchê-los), mirror EXATO `ProducaoCusteioArea`. */
type CascadeOrigin = 'user' | 'cascade';

export default function RentabilidadeCulturaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.profitabilityByCropReport.report;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<ProfitabilityByCropReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: profitabilityByCropReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const cascadeOriginRef = useRef<CascadeOrigin>('user');

  const harvestsQuery = useQuery({
    queryKey: [queryKey.harvests.active],
    queryFn: listActiveHarvests,
  });

  const harvests = harvestsQuery.data?.data ?? [];

  const harvestOptions: Option<string>[] = harvests.map((harvest) => ({
    value: harvest.uuid,
    label: harvest.description,
  }));

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // IG-01 — cascata client-side: ao selecionar uma safra, deriva
  // `start_date`/`end_date` do PRÓPRIO objeto `Harvest` já carregado por
  // `listActiveHarvests` (sem 2ª chamada de rede). `shouldDirty:false` —
  // preenchimento derivado de outro campo do MESMO form, não hidratação de
  // servidor (Lei 2/`fillForm` não se aplica aqui).
  function handleHarvestChange(option: Option<string> | null) {
    setValue('harvest', option, { shouldDirty: true });

    if (!option) return;

    const selectedHarvest = harvests.find((harvest: Harvest) => harvest.uuid === option.value);
    if (!selectedHarvest) return;

    cascadeOriginRef.current = 'cascade';
    setValue('start_date', selectedHarvest.start_date, { shouldDirty: false });
    setValue('end_date', selectedHarvest.end_date, { shouldDirty: false });
  }

  // IG-02 — editar manualmente `start_date`/`end_date` DEPOIS de IG-01 ter
  // rodado desfaz a associação visual à safra (mirror
  // `.trigger('change.select2')` do legado). Não dispara na própria escrita
  // de IG-01 (guarda `cascadeOriginRef`).
  function handleManualDateChange(field: 'start_date' | 'end_date', value: string | null) {
    if (cascadeOriginRef.current !== 'cascade') {
      setValue('harvest', null, { shouldDirty: false });
    }
    cascadeOriginRef.current = 'user';
    setValue(field, value, { shouldDirty: true });
    trigger(['start_date', 'end_date']);
  }

  function buildParams(data: ProfitabilityByCropReportFilterForm): ProfitabilityByCropReportParams {
    return {
      cultivation_uuid: data.cultivation_uuid?.value as string,
      start_date: data.start_date as string,
      end_date: data.end_date as string,
    };
  }

  async function handleDownload(data: ProfitabilityByCropReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadProfitabilityByCropReportPdf(buildParams(data));
      downloadBlob(blob, 'rentabilidade-cultura.pdf');
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `ClienteProduto`/`ProducaoCusteioArea`).
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
            disabled={!isValid || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Controller
              name="cultivation_uuid"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.cultivation}
                  placeholder={text.cultivationPlaceholder}
                  isRequired
                  error={errors.cultivation_uuid?.message}
                  service={listCultivationOptions}
                  mapOptions={mapCultivationOption}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="harvest"
              control={control}
              render={({ field: { name, value } }) => (
                <Select
                  label={text.fields.harvest}
                  placeholder={text.harvestPlaceholder}
                  name={name}
                  value={value}
                  onChange={handleHarvestChange}
                  options={harvestOptions}
                  loading={harvestsQuery.isPending}
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
                render={({ field: { value } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={(newValue) => handleManualDateChange('start_date', newValue)}
                  />
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
                render={({ field: { value } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={(newValue) => handleManualDateChange('end_date', newValue)}
                  />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>
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
