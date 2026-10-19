// src/pages/Relatorios/Financeiro/Adiantamento/index.tsx
// -----------------------------------------------------------------------------
// Tela "Adiantamento — Relatório de Títulos Baixados" (F-219,
// TASK-055-FE-02, esteira 97-Esteiras/055). Rota
// `/relatorios/financeiro/adiantamento`, materializa o item de menu FILHO
// `rel-fin-adiantamento`, sob o grupo/submenu `rel-fin` ("Financeiro",
// `navigationTree.ts`).
//
// Mirror estrutural de `Relatorios/Financeiro/PagamentoPrevistoReal/index.tsx`
// (F-289) — FormContainer + footer, sem grid/prévia, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError`, prioriza
// a mensagem específica de `errors` por campo sobre o `message` genérico.
//
// Diverge do molde `PagamentoPrevistoRealRelatorio` DE PROPÓSITO (F-219 é
// mais "select2 simples" que os irmãos):
//   - Os lookups Fornecedor/Cliente/Proprietário/Centro/Fazenda são
//     SINGLE-select (`Select`/`SelectAsyncPaginate`) — NÃO
//     `CheckboxListField` (o legado usa select2 simples, não multi-checkbox
//     nesta tela).
//   - Campo novo `number` — texto livre (filtro LIKE server-side),
//     `@/components/Form/Input`, widget que nenhum irmão desta família usa.
//   - SEM `condition`/`ReportColumnsField`/ordenação/periodicidade — apenas
//     os 9 filtros do contrato de tela.
//   - `provider_id` filtra só Fornecedores (`findParams:{type:1}`, RN-14,
//     D-FE-1) — `listProviderOptions` já aceita `type` (aditivo, GAP-VD-05).
//   - `client_id` via `listClientOptions` (mesmo lookup de
//     `ContasAReceber`/`ContasRecebidas`), SEM paginação real (a API
//     devolve a coleção inteira de clientes ativos do tenant).
//   - `start_date`/`end_date` são OBRIGATÓRIOS (schema mirror
//     `pag-prev-real-report-filter-schema.ts`) e filtram Vencimento
//     (`due_date`, roteiro API §Passo 1).
//   - RN-02 (exclusão mútua client/provider) é resolvida SERVER-SIDE
//     (D-FE-2) — o front envia ambos os valores se ambos selecionados; o
//     servidor decide.
//
// Sem grid/tabela de prévia — só o form de parâmetros + botão "Gerar
// Relatório" (o binário — PDF paisagem ou Excel — é gerado 100% no
// servidor, `responseType:'blob'` obrigatório).
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Input } from '@/components/Form/Input';
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

import { advanceReportFilterSchemaResolver } from '@/validations/schemas/AccountsReports/advance-report-filter-schema';

import { downloadAdvanceReport } from '@/services/v2/AccountsReports/advance-report-service';
import type { ClientOptionItem } from '@/services/v2/CadastrosBase/Client/client-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProprietaryOptions } from '@/services/v2/CadastrosBase/Proprietary/proprietary-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';

import type { LanguageDate } from '@/@types/language';
import type { AdvanceReportFilterForm, AdvanceReportParams } from '@/@types/v2/AccountsReports';
import type { CostCenterRef } from '@/@types/v2/CostCenters';

function buildPristineValues(languageGB: LanguageDate): AdvanceReportFilterForm {
  return {
    start_date: null,
    end_date: null,
    number: null,
    farm_id: null,
    provider_id: null,
    client_id: null,
    proprietary_id: null,
    center_id: null,
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function AdiantamentoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const shared = languageGB.accountsReports.shared;
  const text = languageGB.accountsReports.advance;

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors, isValid },
  } = useForm<AdvanceReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: advanceReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Proprietário/Fazenda (Select estático, lookup SEM paginação) -----
  const proprietaryQuery = useOptionsSelectQuery({
    asyncFunction: () => listProprietaryOptions(undefined, 'farm'),
    queryKey: queryKey.cadastrosBase.proprietaryOptions,
    mapOption: (item) => ({ value: item.uuid, label: item.label }),
  });
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listFarms,
    queryKey: queryKey.farms.list,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  function buildParams(data: AdvanceReportFilterForm): AdvanceReportParams {
    return {
      start_date: data.start_date!,
      end_date: data.end_date!,
      number: data.number || undefined,
      farm_id: data.farm_id?.value || undefined,
      provider_id: data.provider_id?.value || undefined,
      client_id: data.client_id?.value || undefined,
      proprietary_id: data.proprietary_id?.value || undefined,
      center_id: data.center_id?.value || undefined,
      format: data.format!.value,
    };
  }

  // Onda K/FIX 1 — defesa em profundidade: `onInvalid` garante feedback
  // (toast) mesmo no caso residual em que o disable visual do botão fique
  // dessincronizado do form (mirror `CusteioModulo`/`CustoProducaoAcumulado`).
  // 100% data-driven — a 1ª mensagem sai de `formState.errors` (schema Yup
  // i18n, `invalidDateRange`), nunca string literal.
  function onInvalid(formErrors: FieldErrors<AdvanceReportFilterForm>) {
    const firstMessage = Object.values(formErrors)
      .map((error) => error?.message)
      .find((message): message is string => typeof message === 'string');
    toaster.error({ title: text.pageTitle, description: firstMessage ?? shared.downloadError });
  }

  async function handleDownload(data: AdvanceReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadAdvanceReport(buildParams(data));
      downloadBlob(blob, `titulos-baixados-adiantamentos.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: shared.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror
      // `PagamentoPrevistoRealRelatorio`).
      const parsed = await parseBlobError(error);
      const fieldMessage = parsed.errors
        ? Object.values(parsed.errors)
            .flat()
            .find((message): message is string => typeof message === 'string')
        : undefined;
      toaster.error({
        title: text.pageTitle,
        description: fieldMessage ?? parsed.message ?? shared.downloadError,
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
            title={shared.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload, onInvalid)}
            loading={isDownloading}
            disabled={!isValid || isDownloading}
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
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
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
                render={({ field: { value, onChange } }) => (
                  <DateInput
                    value={value ?? null}
                    onChange={(v) => {
                      onChange(v);
                      trigger(['start_date', 'end_date']);
                    }}
                  />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            <Controller
              name="number"
              control={control}
              render={({ field }) => (
                <Input
                  label={text.fields.number}
                  name={field.name}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value || null)}
                />
              )}
            />

            <Controller
              name="farm_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.farm}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={farmQuery.options}
                  loading={farmQuery.isLoading}
                />
              )}
            />

            <Controller
              name="provider_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.provider}
                  service={listProviderOptions}
                  mapOptions={(item: ProviderOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                    type: 1,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.client}
                  service={listClientOptions}
                  mapOptions={(item: ClientOptionItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="proprietary_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={shared.fields.proprietary}
                  name={field.name}
                  value={field.value}
                  onChange={(option) => field.onChange(option ?? null)}
                  options={proprietaryQuery.options}
                  loading={proprietaryQuery.isLoading}
                />
              )}
            />

            <Controller
              name="center_id"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={shared.fields.costCenter}
                  cacheUniqs={[activeFarmUuid]}
                  service={(params) =>
                    listCostCenterOptions({
                      ...params,
                      only_analytic: true,
                      is_enabled: 'true',
                      farm_uuid: activeFarmUuid ?? undefined,
                    })
                  }
                  mapOptions={(item: CostCenterRef) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: typeof search === 'string' ? search : search.search,
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
                  label={shared.fields.format}
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
