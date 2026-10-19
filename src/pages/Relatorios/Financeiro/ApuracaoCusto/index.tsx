// src/pages/Relatorios/Financeiro/ApuracaoCusto/index.tsx
// -----------------------------------------------------------------------------
// Tela "Apuração de Custo — Relatório" (F-245, TASK-245-FE-02, esteira 073 —
// AMPLIADA na rodada de homologação de 5 itens: F-245 "Apuração de Custo").
//
// Casco original mirror de `Relatorios/Financeiro/JurosPagos/index.tsx`
// (`FormContainer` + footer, download via Blob + `downloadBlob`, erro 422-
// como-Blob tratado via `parseBlobError`) MAIS o 2º campo multiselect
// (`account_uuids`, tenant-wide) no padrão já em produção de
// `Financeiro/CashFlow/index.tsx`.
//
// AMPLIAÇÃO (homologação, execução 073) — mirror ESTRUTURAL de
// `Relatorios/Financeiro/CustoProducao/index.tsx` (F-272) para as 3 peças
// novas, adaptadas ao formato "relatório largo" desta tela (colunas
// dinâmicas vindas da API, não um schema fixo de 3 colunas):
//   1. Campo "Tipo de Relatório" (`report_type`, Option<'pdf'|'excel'>) —
//      100% CLIENT-SIDE, pré-selecionado "PDF", nunca vai para a API, só
//      roteia qual dos 2 endpoints binários o botão "Imprimir" chama.
//   2. Layout: `account_uuids` (Conta Bancária) MAIOR — `gridColumn` span 2
//      fecha a 2ª linha do grid de 4 colunas (mirror EXATO da técnica usada
//      em `cost_center_ids` de `CustoProducao`).
//   3. "Filtrar" chama `/cost-calculation-report/preview` (JSON) e renderiza
//      a prévia como TABELA na própria página — larga (rótulo + até 12
//      colunas de mês + Total + Média), por isso dentro de um container com
//      `overflowX: 'auto'`. Fetch MANUAL (`enabled:false`+`refetch()` num
//      `useEffect` reagindo a `appliedFilters`), mirror EXATO `CustoProducao`/
//      `CashFlow`. Colunas/alinhamento vêm DINÂMICOS da API
//      (`columns[].key/label/align`) — o cliente NUNCA hardcoda cabeçalho ou
//      reformata célula (`cells[key]` já vem formatada PT-BR pelo backend).
//   4. Botão "Imprimir" (renomeado de "Baixar PDF") ABAIXO do "Filtrar" no
//      footer (`VStack` alinhado à direita, não mais `Flex` em linha única) —
//      roteia PDF/Excel conforme `report_type` (mirror `handleDownload` de
//      `CustoProducao`).
//
// Reset por fazenda ativa (contrato §4, INALTERADO): SÓ `cost_center_uuids`
// (escopado pela fazenda ATIVA, `farm_uuid` aditivo de `/cost-centers/
// options`) é limpo na troca da fazenda ativa do header — `account_uuids`
// (tenant inteiro), `farm_uuid` (todas as fazendas do tenant, sub-filtro
// OPCIONAL do relatório) e `report_type` (100% client-side) NÃO dependem da
// fazenda ativa e permanecem intactos. Não confundir os dois conceitos de
// "fazenda" (risco #2 do contrato de tela).
//
// REFINAMENTO (homologação, execução 073 — 3ª rodada) — 3 ajustes de UX:
//   1. Botões "Filtrar"/"Imprimir" coladas na borda: o `Box`/`Flex` dos
//      botões vivia FORA do `<Form>` (`<Form>` aplica `paddingX` próprio via
//      `configureSpacing().formSpacing`, os irmãos fora dele não recebiam
//      NADA — `PageCard` sem `footer` não injeta padding nenhum,
//      `FormContainer.tsx`, `!hasFooter → <Box>{children}</Box>`). Corrigido
//      aplicando o MESMO token `formSpacing.paddingX` (não um px arbitrário)
//      no `VStack` externo + `noPadding` no `<Form>` (evita padding
//      duplicado) — botões e tabela agora alinham com os campos do form.
//   2. "Imprimir" (condicional a `hasGeneratedReport`) SOBE para o MESMO
//      bloco de "Filtrar" (empilhados, `VStack` `gap={3}`), ANTES da área de
//      resultado/tabela — antes ficava DEPOIS da tabela.
//   3. Barra de rolagem horizontal não aparecia: causa-raiz é o "flexbug"
//      clássico de `min-width:auto` em item flex — o `<Skeleton>` (div
//      simples) é item flex do `VStack` (`flexDirection: column`); sem
//      `overflow` próprio, seu tamanho mínimo automático no eixo cruzado
//      (largura) é calculado pelo min-content do SUBÁRVORE inteira,
//      "enxergando através" do `Box overflowX="auto"` aninhado — o container
//      de overflow cresce JUNTO com a tabela em vez de ficar preso à largura
//      disponível, e a rolagem nunca aparece. Corrigido com `minW={0}` no
//      `<Skeleton>` (quebra a propagação exatamente no item flex mais
//      próximo do container de overflow) + `w="100%" maxW="100%" minW={0}`
//      explícitos no `Box` de overflow (não depender só do `overflowX`) +
//      `minW` do `Table.Root` trocado de `"full"` para
//      `max(100%, colunas×110px)` (preenche o container quando cabe, força
//      transbordo real quando não cabe — mais robusto que só
//      `width="max-content"`, que já preservamos).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Skeleton, Table, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
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

import { configureSpacing } from '@/utils/config-padding';
import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { costCalculationReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/cost-calculation-report-filter-schema';

import { listAccounts } from '@/services/v2/CadastrosBase/Account/account-service';
import { listCostCenterOptions } from '@/services/v2/CostCenters/cost-center-service';
import { listFarms } from '@/services/v2/Farms/farm-service';
import {
  downloadCostCalculationReportExcel,
  downloadCostCalculationReportPdf,
  getCostCalculationReportPreview,
  type CostCalculationReportParams,
} from '@/services/v2/Relatorios/cost-calculation-report-service';

import type { Option } from '@/@types/option';
import type { AccountListItem } from '@/@types/v2/CadastrosBase/account';
import type { CostCenterRef } from '@/@types/v2/CostCenters';
import type { FarmRef } from '@/@types/v2/Farms';

interface CostCalculationReportFilterForm {
  start_date: string | null;
  end_date: string | null;
  farm_uuid: Option<string> | null;
  cost_center_uuids: Option<string>[] | null;
  account_uuids: Option<string>[] | null;
  order_by: 'asc' | 'desc';
  /** Campo 100% CLIENT-SIDE (homologação) — nunca vai para
   *  `CostCalculationReportParams` (não existe na API). Só decide qual dos 2
   *  endpoints de binário (`/cost-calculation-report`/`/excel`) o botão
   *  "Imprimir" chama. */
  report_type: Option<'pdf' | 'excel'>;
}

export default function ApuracaoCustoRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.costCalculationReport.report;
  // Mesmo token de espaçamento horizontal que `<Form>` já aplica internamente
  // (`configureSpacing().formSpacing.paddingX`) — reaproveitado no `VStack`
  // externo (refinamento item 1) para os botões/tabela alinharem com os
  // campos do form, sem inventar um valor de px novo.
  const { formSpacing } = configureSpacing();

  // Função (não constante) porque o default pré-selecionado de `report_type`
  // (homologação) precisa do `label` traduzido — `text` só existe depois de
  // `useLanguage()` (mirror `buildPristineValues` de `CustoProducao`).
  function buildPristineValues(): CostCalculationReportFilterForm {
    return {
      start_date: null,
      end_date: null,
      farm_uuid: null,
      cost_center_uuids: [],
      account_uuids: [],
      order_by: 'asc',
      report_type: { value: 'pdf', label: text.reportTypeOptions.pdf },
    };
  }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CostCalculationReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: costCalculationReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<CostCalculationReportParams | null>(null);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // Reset por fazenda ativa (contrato §4) — SÓ `cost_center_uuids` (escopado
  // pela fazenda ATIVA); `account_uuids` (tenant inteiro), `farm_uuid`
  // (sub-filtro opcional, tenant-wide) e `report_type` (client-side) NÃO
  // devem ser apagados na troca de fazenda.
  useEffect(() => {
    setValue('cost_center_uuids', []);
  }, [activeFarmUuid, setValue]);

  // "Fazenda" (FILTER-03) — `listFarms()` devolve array FLAT sem paginação
  // real (mirror da nota de cabeçalho de `farm-service.ts`); `Select`
  // estático + `useQuery`, NÃO `SelectAsyncPaginate` (mesma técnica de
  // `JurosPagos/index.tsx`).
  const farmsQuery = useQuery({
    queryKey: ['cost-calculation-report', 'farms'],
    queryFn: listFarms,
  });
  const farmOptions: Option<string>[] = (farmsQuery.data ?? []).map((farm: FarmRef) => ({
    label: farm.description,
    value: farm.uuid,
  }));

  const orderByOptions: Option<'asc' | 'desc'>[] = [
    { value: 'asc', label: text.orderByOptions.asc },
    { value: 'desc', label: text.orderByOptions.desc },
  ];

  // "Tipo de Relatório" (homologação) — client-side, roteia `handleDownload`
  // para o endpoint binário certo; mirror `reportTypeOptions` de
  // `CustoProducao/index.tsx`.
  const reportTypeOptions: Option<'pdf' | 'excel'>[] = [
    { value: 'pdf', label: text.reportTypeOptions.pdf },
    { value: 'excel', label: text.reportTypeOptions.excel },
  ];

  function buildParams(data: CostCalculationReportFilterForm): CostCalculationReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      farm_uuid: data.farm_uuid?.value || undefined,
      cost_center_uuids: data.cost_center_uuids?.length
        ? data.cost_center_uuids.map((option) => option.value)
        : undefined,
      account_uuids: data.account_uuids?.length
        ? data.account_uuids.map((option) => option.value)
        : undefined,
      order_by: data.order_by,
    };
  }

  // Prévia em tabela (homologação, item 3) — fetch MANUAL
  // (`enabled:false`+`refetch()`), mirror EXATO `CustoProducao/index.tsx` —
  // só busca ao clicar "Filtrar".
  const previewQuery = useQuery({
    queryKey: [queryKey.relatorios.costCalculationPreview, appliedFilters],
    queryFn: () => getCostCalculationReportPreview(appliedFilters!),
    enabled: false,
    refetchOnWindowFocus: false,
  });

  useQueryError([previewQuery]);

  useEffect(() => {
    if (appliedFilters) previewQuery.refetch();
    // Disparo manual controlado só por `appliedFilters` (mirror
    // `CustoProducao`/`CashFlow`) — `previewQuery`/`previewQuery.refetch`
    // deliberadamente fora do array de dependências (nenhuma regra
    // `exhaustive-deps` ativa neste projeto).
  }, [appliedFilters]);

  function handleFiltrar(data: CostCalculationReportFilterForm) {
    setAppliedFilters(buildParams(data));
  }

  const hasBeenFiltered = appliedFilters !== null;
  const isReportEmpty =
    hasBeenFiltered && !previewQuery.isError && (previewQuery.data?.rows.length ?? 0) === 0;
  // "Imprimir" só aparece com relatório GERADO (ajuste de homologação,
  // execução 073, item 2) — mesma condição de sucesso-com-dados que já
  // renderiza a tabela abaixo, reaproveitada para não divergir critério.
  const hasGeneratedReport =
    hasBeenFiltered && !previewQuery.isError && (previewQuery.data?.rows.length ?? 0) > 0;

  // "Imprimir" (homologação, item 4 — PDF ou Excel conforme `report_type`,
  // renomeado de "Baixar PDF") — `report_type` é lido ao vivo do form
  // (`watch`) porque é client-side puro, fora de
  // `CostCalculationReportParams` (nunca vai para a API).
  const reportTypeValue = watch('report_type');

  async function handleDownload(data: CostCalculationReportFilterForm) {
    setIsDownloading(true);
    const isExcel = reportTypeValue?.value === 'excel';
    try {
      const params = buildParams(data);
      const blob = isExcel
        ? await downloadCostCalculationReportExcel(params)
        : await downloadCostCalculationReportPdf(params);
      downloadBlob(
        blob,
        isExcel ? 'apuracao-de-custo-relatorio.xlsx' : 'apuracao-de-custo-relatorio.pdf'
      );
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `Dre/index.tsx`/`JurosPagos/index.tsx`).
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
    <FormContainer title={text.pageTitle} subtitle={text.pageSubtitle}>
      {/* `paddingX={formSpacing.paddingX}` (refinamento item 1) — mesmo token
          que `<Form>` já usava só para os SEUS próprios campos; aplicado aqui
          no `VStack` externo para os botões e a área de resultado (abaixo)
          alinharem com o form, em vez de colar na borda do `PageCard` (que,
          sem `footer` na `FormContainer`, não injeta padding nenhum).
          `minW={0}` (refinamento item 3) — ver nota de cabeçalho: quebra a
          propagação do min-content da tabela larga o mais cedo possível na
          cadeia de flex items. */}
      <VStack align="stretch" gap={6} paddingX={formSpacing.paddingX} minW={0}>
        <Form noPadding onSubmit={(event) => event.preventDefault()}>
          <VStack align="stretch" gap={6}>
            {/* Grid de 4 colunas (`columnsForm.fourColumns`): 1ª linha fecha
                exatamente com os 4 campos originais (datas/Fazenda/Centro de
                Custo); 2ª linha reorganizada (homologação, item 2) — "Ordenar
                por" + "Tipo de Relatório" (1 coluna cada) + "Conta Bancária"
                MAIOR (`gridColumn` span 2, ocupa o espaço restante da linha,
                mirror EXATO da técnica de `cost_center_ids` em
                `CustoProducao`). */}
            <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
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
                name="farm_uuid"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.farm}
                    placeholder={text.farmPlaceholder}
                    name={name}
                    value={value}
                    onChange={(option: Option<string> | null) => onChange(option ?? null)}
                    options={farmOptions}
                    loading={farmsQuery.isLoading}
                  />
                )}
              />

              {/* Centro de Custo — escopado pela fazenda ATIVA (header
                  `X-Farm-Id`, `activeFarmUuid`), NUNCA pelo valor do campo
                  "Fazenda" acima (risco #2 do contrato de tela). `cacheUniqs`
                  invalida o cache de options da fazenda anterior + `useEffect`
                  acima limpa o valor selecionado na troca. */}
              <Controller
                name="cost_center_uuids"
                control={control}
                render={({ field }) => (
                  <SelectAsyncPaginate
                    name={field.name}
                    label={text.fields.costCenters}
                    placeholder={text.costCentersPlaceholder}
                    isMulti
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
                    value={field.value ?? []}
                    onChange={(options: any) => field.onChange(options ?? [])}
                  />
                )}
              />

              {/* Ordenar por — rótulos fiéis ao legado (`'+ Antigo'`/
                  `'+ Recente'`, FILTER-06), não genéricos. Abre a 2ª linha
                  (homologação, item 2). */}
              <Controller
                name="order_by"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.orderBy}
                    name={name}
                    value={orderByOptions.find((option) => option.value === value) ?? null}
                    onChange={(option: Option<'asc' | 'desc'> | null) =>
                      onChange(option?.value ?? 'asc')
                    }
                    options={orderByOptions}
                    noClearable
                  />
                )}
              />

              {/* Campo NOVO — Tipo de Relatório (`report_type`), homologação
                  item 1. 100% client-side (roteia `handleDownload`, nunca vai
                  para a API) — pré-selecionado "PDF". */}
              <Controller
                name="report_type"
                control={control}
                render={({ field: { name, value, onChange } }) => (
                  <Select
                    label={text.fields.reportType}
                    name={name}
                    value={value}
                    onChange={(option: Option<'pdf' | 'excel'> | null) =>
                      onChange(option ?? reportTypeOptions[0])
                    }
                    options={reportTypeOptions}
                    noClearable
                  />
                )}
              />

              {/* Conta Bancária — tenant inteiro (mirror EXATO de
                  `CashFlow/index.tsx` linhas 246-266), SEM `cacheUniqs`, SEM
                  reset por fazenda ativa (contrato §4). MAIOR (homologação,
                  item 2): `gridColumn` span 2 fecha a 2ª linha (`order_by` +
                  `report_type`, 1 coluna cada, já tomaram 2 das 4 colunas de
                  `columnsForm.fourColumns` no breakpoint `lg`). */}
              <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 2' }}>
                <Controller
                  name="account_uuids"
                  control={control}
                  render={({ field }) => (
                    <SelectAsyncPaginate
                      name={field.name}
                      label={text.fields.accounts}
                      placeholder={text.accountsPlaceholder}
                      isMulti
                      service={(params) => listAccounts({ ...params, is_enabled: 'true' })}
                      mapOptions={(item: AccountListItem) => ({
                        label: `${item.code} - ${item.description}`,
                        value: item.uuid,
                      })}
                      value={field.value ?? []}
                      onChange={(options: any) => field.onChange(options ?? [])}
                    />
                  )}
                />
              </Box>
            </SimpleGrid>
          </VStack>
        </Form>

        {/* "Filtrar"/"Imprimir" — ajuste de layout (homologação, execução
            073): SAEM do footer da casca e ficam logo abaixo do form de
            filtro, ACIMA de toda a área de resultado (loading/empty/error/
            tabela) que segue abaixo. Refinamento (3ª rodada, item 2):
            "Imprimir" volta a ficar no MESMO bloco de "Filtrar" — empilhado
            LOGO ABAIXO dele (`VStack` `gap={3}`, não mais depois da tabela) —
            "Filtrar" sempre visível, "Imprimir" condicional a
            `hasGeneratedReport` (filtrou + sem erro + com linhas). */}
        <VStack align="stretch" gap={3} width="full">
          <Flex width="full" justifyContent="flex-end">
            <Button
              title={text.filterButton}
              type="button"
              onClick={handleSubmit(handleFiltrar)}
              loading={previewQuery.isFetching}
            />
          </Flex>

          {hasGeneratedReport && (
            <Flex width="full" justifyContent="flex-end">
              <Button
                title={text.printButton}
                icon={Printer as any}
                type="button"
                onClick={handleSubmit(handleDownload)}
                loading={isDownloading}
                disabled={!hasValidRange || isDownloading}
              />
            </Flex>
          )}
        </VStack>

        {/* Prévia em tabela (homologação, item 3) — mirror dos estados
            obrigatórios de `CustoProducao` (loading/empty pré-filtro/error/
            empty relatório/success). Relatório LARGO (rótulo + até 12
            colunas de mês + Total + Média) — `overflowX: 'auto'` no
            container da tabela; a tabela em si MANTÉM a largura natural
            das colunas (`width="max-content"` + `whiteSpace: 'nowrap'` +
            largura mínima por coluna) para TRANSBORDAR horizontalmente e
            revelar a barra de rolagem dentro do próprio container, em vez de
            encolher as colunas para caber (ajuste homologação item 3).
            `minW={0}` no `<Skeleton>` (flex item do `VStack` externo) —
            causa-raiz real do scrollbar que não aparecia: ver nota de
            cabeçalho do arquivo (3ª rodada, item 3). */}
        <Skeleton loading={previewQuery.isFetching} minW={0}>
          {!hasBeenFiltered && !previewQuery.isFetching && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyBeforeFilter}</Text>
            </Box>
          )}

          {hasBeenFiltered && previewQuery.isError && (
            <Box py={10} textAlign="center">
              <Text color="fg.error" mb={3}>
                {text.previewError}
              </Text>
              <Button
                title={text.retryButton}
                type="button"
                variant="outline"
                onClick={() => previewQuery.refetch()}
              />
            </Box>
          )}

          {isReportEmpty && (
            <Box py={10} textAlign="center">
              <Text color="fg.muted">{text.emptyReport}</Text>
            </Box>
          )}

          {hasGeneratedReport && (
            <Box
              w="100%"
              maxW="100%"
              minW={0}
              overflowX="auto"
              pb={2}
              // Barra de rolagem horizontal SEMPRE VISÍVEL (homologação, 4ª
              // rodada). O overflow em si já funcionava (`minW={0}` da 3ª
              // rodada: medido `scrollWidth` 1734 > `clientWidth` 936, o
              // container ROLA de fato) — o que o dono não via era a BARRA:
              // com `overflowX:auto` puro o Chromium/SO desenha a scrollbar
              // no modo OVERLAY (só aparece ao passar o mouse/rolar e ocupa
              // 0px de layout), então a tabela parecia só "cortada", sem
              // nenhuma pista de que dava para rolar. Estilizar
              // `::-webkit-scrollbar` força o Chromium a renderizar a barra
              // CLÁSSICA (não-overlay, sempre visível quando há transbordo e
              // ocupando espaço real); `scrollbarWidth/Color` cobre o
              // Firefox. Escopado a ESTA tela (nenhum componente
              // compartilhado tocado). Tokens de tema do design system para
              // funcionar em light e dark.
              css={{
                scrollbarWidth: 'thin',
                scrollbarColor:
                  'var(--chakra-colors-border-emphasized) var(--chakra-colors-bg-muted)',
                '&::-webkit-scrollbar': {
                  height: '10px',
                  WebkitAppearance: 'none',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'var(--chakra-colors-bg-muted)',
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'var(--chakra-colors-border-emphasized)',
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'var(--chakra-colors-fg-muted)',
                },
              }}
            >
              {/* `width="max-content"` (não só `minW`) SOBRESCREVE o
                  `width: 100%` do variant `outline`, que fazia as colunas
                  encolherem para caber no container e escondia a barra de
                  rolagem horizontal. `whiteSpace: 'nowrap'` + `minW` por
                  coluna reforça a largura natural quando há muitas colunas
                  de mês.
                  `minW` do ROOT trocado de `"full"` para
                  `max(100%, colunas×110px)` (3ª rodada, item 3) — preenche
                  o container quando os dados cabem (poucas colunas) E força
                  o transbordo real (> 100%) quando não cabem, em vez de só
                  "no mínimo 100%" (que nunca por si só cria overflow). */}
              <Table.Root
                size="sm"
                variant="outline"
                width="max-content"
                minW={`max(100%, ${previewQuery.data!.columns.length * 110}px)`}
              >
                <Table.Header>
                  <Table.Row>
                    {previewQuery.data!.columns.map((column) => (
                      <Table.ColumnHeader
                        key={column.key}
                        textAlign={column.align}
                        minW="110px"
                        whiteSpace="nowrap"
                      >
                        {column.label}
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {previewQuery.data!.rows.map((row, index) => (
                    // eslint-disable-next-line react/no-array-index-key -- payload sem id próprio por linha
                    <Table.Row
                      key={index}
                      fontWeight={
                        row.variant === 'total'
                          ? 'bold'
                          : row.variant === 'group'
                            ? 'semibold'
                            : 'normal'
                      }
                    >
                      {previewQuery.data!.columns.map((column) => {
                        // Negativo em vermelho (homologação, esteira 073) —
                        // `negativeCells` é a lista de chaves negativas desta
                        // linha; ausente (resposta antiga, campo aditivo) →
                        // trata como `[]` (nenhuma célula vermelha). A string
                        // inteira (incl. "R$") herda `fg.error`, mesmo token
                        // já usado nesta tela para erro de validação —
                        // coerente em light/dark, sem hex hardcoded.
                        const isNegative = (row.negativeCells ?? []).includes(column.key);
                        return (
                          <Table.Cell
                            key={column.key}
                            textAlign={column.align}
                            minW="110px"
                            whiteSpace="nowrap"
                            color={isNegative ? 'fg.error' : undefined}
                          >
                            {row.cells[column.key] ?? '—'}
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Skeleton>
      </VStack>
    </FormContainer>
  );
}
