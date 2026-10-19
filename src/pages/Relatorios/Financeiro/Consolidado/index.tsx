// src/pages/Relatorios/Financeiro/Consolidado/index.tsx
// -----------------------------------------------------------------------------
// Tela "Consolidado (Pagar/Receber) — Relatório" (F-214, TASK-052-214-FE-02,
// esteira 97-Esteiras/052). Rota `/relatorios/financeiro/consolidado-pagar-receber`,
// materializa o item de menu FILHO `rel-fin-consolidado`, sob o
// grupo/submenu `rel-fin` ("Financeiro", `navigationTree.ts`).
//
// Mirror ESTRUTURAL de `Relatorios/Financeiro/ContasAPagar/index.tsx`
// (FormContainer + footer, SEM grid/prévia, download via Blob +
// `downloadBlob`, erro 422-como-Blob tratado via `parseBlobError`, prioriza
// a mensagem específica de `errors` por campo sobre o `message` genérico) —
// mesma casca `<Form onSubmit={preventDefault}>` cru (D-FE-14, esta tela não
// tem grid).
//
// Diferenças de PROPÓSITO vs `ContasAPagar` (roteiro SELADO
// `roteiro-front-F214-consolidado.md`, DEC-225):
//   - Datas de EMISSÃO são OBRIGATÓRIAS na UI (fecha o defeito legado que só
//     validava no HTML, §7.2 do roteiro de arquitetura) — datas de BAIXA
//     continuam opcionais.
//   - Os 5 lookups (provider/client/center/account/category) são
//     SINGLE-select (`SelectAsyncPaginate`), NÃO multi-select/`CheckboxListField`
//     remoto como `providers[]`/`categories[]` de `ContasAPagar` — o
//     contrato de tela (`AccountsPayableReceivableReportRequest`) só aceita
//     1 uuid por campo.
//   - `status[]` é `CheckboxListField` LOCAL (catálogo fixo 1-4, `Em
//     Aberto/Parcial/Quitado/Adiantamento`, `AccountsPayableReceivableStatusEnum`)
//     — NÃO remoto (sem lookup de rede, busca filtra o array local no
//     cliente).
//   - `format` é single Select (`pdf`/`xlsx`, default `pdf`, `noClearable`)
//     — 1 único botão "Gerar relatório" (mirror `ContasAPagar`), NÃO 2
//     botões diretos como `CentroCusto`.
//
// Divergência TÉCNICA declarada (LAC, não é gambiarra): o roteiro nomeia
// `getAccountOptions` (`account-service.ts`) como fonte do lookup `account`,
// mas essa função devolve os enums ESTÁTICOS `{types,cnab_types}` do
// cadastro de Conta — formato incompatível com um select de uuid (mesma
// divergência já registrada e resolvida por `CentroCusto/index.tsx`, mesma
// esteira 052). A rota dedicada `GET /accounts/options` (uuid+code+description,
// isenta do gate CRUD) prevista pela Task T4 do roteiro de arquitetura NÃO
// foi implementada no backend desta execução (confirmado por leitura direta
// de `AccountController::options()` e `routes/api.php` — só devolve os
// enums estáticos, sem rota uuid nova). Resolução: reusar `listAccounts`
// (`/accounts`, endpoint REAL já em produção, tenant-scoped,
// `is_enabled:'true'`) via `SelectAsyncPaginate`, EXATA técnica já usada por
// `CentroCusto/index.tsx` para o mesmo problema — SEM MOCK, sem inventar
// endpoint. Sem impacto no contrato do endpoint de relatório (`account` é
// só um uuid no querystring).
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { accountsPayableReceivableStatusOptions } from '@/constants/Relatorios/accounts-payable-receivable-report/options/status-options';
import { reportFormatOptions } from '@/constants/Relatorios/accounts-reports/options/report-format-options';

import { accountsPayableReceivableReportFilterSchemaResolver } from '@/validations/schemas/AccountsPayableReceivableReport/accounts-payable-receivable-report-filter-schema';

import { downloadAccountsPayableReceivableReport } from '@/services/v2/AccountsPayableReceivableReport/accounts-payable-receivable-report-service';
import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listClientOptions } from '@/services/v2/CadastrosBase/Client/client-service';
import type { ClientOptionItem } from '@/services/v2/CadastrosBase/Client/client-service';
import { listProviderOptions } from '@/services/v2/CadastrosBase/Provider/provider-service';
import type { ProviderOptionItem } from '@/services/v2/CadastrosBase/Provider/provider-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFinancialCategoryOptions } from '@/services/v2/FinancialCategories/financial-category-service';

import type { LanguageDate } from '@/@types/language';
import type {
  AccountsPayableReceivableReportFilterForm,
  AccountsPayableReceivableReportParams,
  AccountsPayableReceivableStatus,
} from '@/@types/v2/AccountsPayableReceivableReport';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FinancialCategoryOption } from '@/@types/v2/FinancialCategories';

function searchOf(search: string | { search: string }): string {
  return typeof search === 'string' ? search : search.search;
}

function buildPristineValues(languageGB: LanguageDate): AccountsPayableReceivableReportFilterForm {
  return {
    start_emission_date: null,
    end_emission_date: null,
    start_write_off_date: null,
    end_write_off_date: null,
    provider: null,
    client: null,
    center: null,
    account: null,
    category: null,
    status: [],
    format: reportFormatOptions.getOption('pdf', languageGB),
  };
}

export default function ConsolidadoPagarReceberRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.accountsPayableReceivableReport.report;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AccountsPayableReceivableReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: accountsPayableReceivableReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(languageGB),
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Status (`status[]`) — `CheckboxListField` LOCAL (catálogo fixo
  // 1-4, SEM lookup remoto, roteiro §"Riscos"(a)) — busca filtra o array
  // local no cliente. ------------------------------------------------------
  const [statusSearch, setStatusSearch] = useState('');
  const statusCatalog = useMemo(
    () => accountsPayableReceivableStatusOptions.options(languageGB),
    [languageGB]
  );
  const statusItems = useMemo(
    () =>
      statusCatalog.filter((item) =>
        item.label.toLowerCase().includes(statusSearch.trim().toLowerCase())
      ),
    [statusCatalog, statusSearch]
  );

  const startEmissionDateValue = watch('start_emission_date');
  const endEmissionDateValue = watch('end_emission_date');
  const hasRequiredEmission = !!startEmissionDateValue && !!endEmissionDateValue;

  function buildParams(
    data: AccountsPayableReceivableReportFilterForm
  ): AccountsPayableReceivableReportParams {
    return {
      start_emission_date: data.start_emission_date as string,
      end_emission_date: data.end_emission_date as string,
      start_write_off_date: data.start_write_off_date || undefined,
      end_write_off_date: data.end_write_off_date || undefined,
      provider: data.provider?.value || undefined,
      client: data.client?.value || undefined,
      center: data.center?.value || undefined,
      account: data.account?.value || undefined,
      category: data.category?.value || undefined,
      status: data.status.length > 0 ? data.status : undefined,
      format: data.format!.value,
    };
  }

  async function handleDownload(data: AccountsPayableReceivableReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadAccountsPayableReceivableReport(buildParams(data));
      downloadBlob(blob, `relatorio-consolidado-pagar-receber.${data.format!.value}`);
      toaster.success({ title: text.pageTitle, description: text.downloadSuccess });
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ContasAPagar`/`CentroCusto`).
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
            title={text.generateButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownload)}
            loading={isDownloading}
            disabled={!hasRequiredEmission || isDownloading}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startEmissionDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="start_emission_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.start_emission_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.start_emission_date.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endEmissionDate}
                <Text as="span" color="fg.error">
                  {' '}
                  *
                </Text>
              </Text>
              <Controller
                name="end_emission_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_emission_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_emission_date.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.startWriteOffDate}
              </Text>
              <Controller
                name="start_write_off_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1}>
                {text.fields.endWriteOffDate}
              </Text>
              <Controller
                name="end_write_off_date"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <DateInput value={value ?? null} onChange={onChange} />
                )}
              />
              {errors.end_write_off_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_write_off_date.message}
                </Text>
              )}
            </Box>

            <Controller
              name="provider"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.provider}
                  placeholder={text.providerPlaceholder}
                  service={listProviderOptions}
                  mapOptions={(item: ProviderOptionItem) => ({
                    label: item.label,
                    value: item.uuid,
                  })}
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
                  placeholder={text.clientPlaceholder}
                  service={listClientOptions}
                  mapOptions={(item: ClientOptionItem) => ({
                    label: item.name,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            {/* Centro de Custo — escopado pela fazenda ATIVA (header
                `X-Farm-Id`, `activeFarmUuid`) + só Analíticos
                (`only_analytic`), mirror `ApuracaoCusto`/`CentroCusto`
                (PLANO-FIX §2.5/§3 F-214). `cacheUniqs` invalida o cache de
                options ao trocar de fazenda. */}
            <Controller
              name="center"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.center}
                  placeholder={text.centerPlaceholder}
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
                    search: searchOf(search),
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            {/* Conta — `listAccounts` (`/accounts`, tenant-scoped), NÃO
                `getAccountOptions` (enums estáticos, ver nota de cabeçalho —
                mesma divergência já registrada/resolvida por `CentroCusto`). */}
            <Controller
              name="account"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.account}
                  placeholder={text.accountPlaceholder}
                  service={listAccounts}
                  mapOptions={(item: AccountListItem) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
                  findParams={(search: string | { search: string }) => ({
                    search: searchOf(search),
                    is_enabled: 'true',
                  })}
                  value={field.value ?? null}
                  onChange={(option: any) => field.onChange(option ?? null)}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <SelectAsyncPaginate
                  name={field.name}
                  label={text.fields.category}
                  placeholder={text.categoryPlaceholder}
                  service={listFinancialCategoryOptions}
                  mapOptions={(item: FinancialCategoryOption) => ({
                    label: `${item.code} — ${item.description}`,
                    value: item.uuid,
                  })}
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

          {/* Status — `CheckboxListField` LOCAL (catálogo fixo 1-4, SEM
              lookup remoto — `isLoading`/`isError`/`onRetry` omitidos de
              propósito, não há rede aqui). */}
          <Box>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <CheckboxListField<AccountsPayableReceivableStatus>
                  label={text.fields.status}
                  items={statusItems}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  searchValue={statusSearch}
                  onSearchChange={setStatusSearch}
                  searchPlaceholder={text.lookupSearchPlaceholder}
                  selectAllLabel={text.selectAll}
                  deselectAllLabel={text.deselectAll}
                  selectedCountLabel={text.fields.status}
                  emptyLabel={text.lookupEmptyMessage}
                  columns={columnsForm.twoColumns}
                />
              )}
            />
          </Box>
        </VStack>
      </Form>
    </FormContainer>
  );
}
