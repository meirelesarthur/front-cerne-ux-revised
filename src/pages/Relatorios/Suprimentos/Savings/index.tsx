// src/pages/Relatorios/Suprimentos/Savings/index.tsx
// -----------------------------------------------------------------------------
// Tela "Relatórios > Suprimentos > Savings" (F-319, execução 97-Esteiras/013,
// TASK-013-F319-FE-01 fundação/menu/rota/filtros + TASK-013-F319-FE-02
// exportação PDF/Excel — `TASK-013-F319-FE-03` prévia em grade foi
// DESCARTADA por decisão do dono, DEC-FE-01 = sem prévia). Rota
// `/relatorios/suprimentos/savings`, materializa o item de menu FILHO
// `rel-sup-savings`, 3º filho do grupo `rel-sup` ("Suprimentos",
// `navigationTree.ts`).
//
// Referência UX (padrão REAL já migrado e aprovado em produção — NÃO o
// mockup do Storybook, correção do dono 2026-09-08,
// `97-Esteiras/013/CONTRATOS/fid-g3f-savings.md §"Referência UX"`): mirror
// ESTRUTURAL de `Relatorios/Financeiro/FluxoCaixaMensal/index.tsx` (casca +
// mecânica de download) e `Relatorios/Estoque/MovimentacaoEstoque/index.tsx`
// (2 ações de export independentes no mesmo rodapé). Widget de `farm_uuid[]`
// mirror `Relatorios/GestaoFiscal/Faturamento/index.tsx` (`CheckboxListField`
// sobre lookup FLAT, busca filtrada no cliente). PDF inline mirror
// `Relatorios/GestaoPessoal/HorasLogadas/index.tsx` (`window.open` SEM
// terceiro argumento — falso "pop-up bloqueado").
//
// ⚠️ EXCEÇÃO AUTORIZADA PELO DONO (2026-09-08): a camada api desta feature
// ainda não tem `CONTRATO_AUTOAPROVADO` (`fid-g3f-savings.md` segue
// `PARCIAL — ABERTA`, P-11 `Content-Disposition` do PDF continua ABERTO). O
// dono aceitou o risco de retrabalho e autorizou o início do front em
// paralelo à API, porque os Arquitetos de API e de Front já reconciliaram e
// convergiram nos mesmos formatos entre si. Onde a Tarefa marcou ponto como
// PROPOSTO/ABERTO, o default documentado foi implementado — se a API real
// divergir, o Tester pega na integração (LACUNA declarada, não mock).
//
// **5 campos na tela = 4 funcionais + 1 DECORATIVO** (`DEC-FE-02`, mirror do
// filtro morto do legado `CL-019`/`OQ-007`): "Comprador Responsável"
// (`user_id`) é visível, habilitado, preenchível — e SEM efeito nenhum. A
// conversão valores→payload é ISOLADA em `toSavingsReportParams()`
// (`savings-report-service.ts`), a ÚNICA fronteira permitida — a página
// NUNCA repassa os valores crus do form nem remonta chaves inline.
//
// Rota SEM `RequirePermission` DE PROPÓSITO — `OQ-005` `MANTER_COMO_IS` por
// decisão do dono: o backend não checa `savings_view` no endpoint (só o
// ITEM DE MENU é gateado, `navigationPermissions.ts`). Mirror do precedente
// já estabelecido no fork: `EvolucaoRebanho`/`GAP-EVO-01` e `HorasLogadas`.
//
// P-11 ABERTO no gate (contradição "PDF inline" na matriz x
// `GbCerneSnappyReport::download(...)` na Tarefa de API) — default
// documentado implementado: PDF **inline** (`window.open` do objectURL),
// mirror `HorasLogadas`/`ProducaoArea`, consistente com a maioria das
// referências da matriz ("EFFECT PDF inline") e o comportamento padrão do
// legado (`type≠1`). Se a API selada divergir para `attachment`, trocar para
// `downloadBlob` (como o Excel) — o Tester pega na integração.
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { downloadBlob } from '@/utils/downloadBlob';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { savingsReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/savings-report-filter-schema';

import {
  downloadSavingsReportExcel,
  downloadSavingsReportPdf,
  getSavingsReportOptions,
  toSavingsReportParams,
} from '@/services/v2/Relatorios/savings-report-service';

import type { Option } from '@/@types/option';
import type { SavingsReportFormValues } from '@/@types/v2/Relatorios/savings';

const pristineValues: SavingsReportFormValues = {
  farm_uuid: [],
  start_date: null,
  end_date: null,
  status: null,
  user_id: null,
};

export default function SavingsRelatorio() {
  const { languageGB } = useLanguage();
  const { activeFarmUuid } = useAuth();
  const text = languageGB.savingsReport.report;

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<SavingsReportFormValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: savingsReportFilterSchemaResolver(languageGB),
    defaultValues: pristineValues,
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);
  const [farmSearch, setFarmSearch] = useState('');

  // Os TRÊS lookups (fazendas/responsáveis/status) vêm de UMA única chamada
  // a `/request-quotations/savings-report/options` (P-06 do gate) — NUNCA
  // `listFarms`/`listUsers`/constante local de status.
  const optionsQuery = useQuery({
    queryKey: [queryKey.relatorios.savingsReportOptions, activeFarmUuid],
    queryFn: getSavingsReportOptions,
  });
  useQueryError([optionsQuery]);

  const farms = optionsQuery.data?.data.farms ?? [];
  const responsibles = optionsQuery.data?.data.responsibles ?? [];
  const statuses = optionsQuery.data?.data.statuses ?? [];

  // Fazendas — `CheckboxListField` sobre lookup FLAT (sem paginação), busca
  // filtrada no CLIENTE (mirror `GestaoFiscal/Faturamento::farmItems`/
  // `farmSearch`).
  const allFarmItems = farms.map((farm) => ({ value: farm.uuid, label: farm.description }));
  const farmItems = allFarmItems.filter((item) =>
    item.label.toLowerCase().includes(farmSearch.trim().toLowerCase())
  );

  const statusOptions: Option<number>[] = statuses.map((status) => ({
    value: status.value,
    label: status.label,
  }));

  // Populado por `data.responsibles` — mirror do filtro morto `LKP-002` do
  // legado. NUNCA lido por `toSavingsReportParams()`.
  const responsibleOptions: Option<string>[] = responsibles.map((responsible) => ({
    value: responsible.uuid,
    label: responsible.name,
  }));

  // `FILT-001` — default "todas as fazendas pré-selecionadas", só enquanto o
  // usuário não tiver mexido no campo (`shouldDirty:false`, precedente
  // `Agricultura/ProducaoCusteioArea/index.tsx:137-143`).
  useEffect(() => {
    if (!optionsQuery.isSuccess || dirtyFields.farm_uuid) return;
    setValue(
      'farm_uuid',
      farms.map((farm) => farm.uuid),
      { shouldDirty: false }
    );
    // Dependência intencionalmente restrita a `optionsQuery.isSuccess`/
    // `optionsQuery.data` — `dirtyFields`/`setValue`/`farms` são estáveis
    // ou lidos só dentro do efeito (mirror do padrão já usado nas telas
    // irmãs; este projeto não tem o plugin `eslint-plugin-react-hooks`
    // habilitado, então nenhuma diretiva de desabilitação é necessária aqui).
  }, [optionsQuery.isSuccess, optionsQuery.data]);

  // Troca de fazenda ativa — `user_id` é escopado a `data.responsibles`
  // (tenant/fazendas do tenant, `LKP-002`); deixar um responsável de outra
  // fazenda selecionado exibiria opção inexistente. Ser DECORATIVO não o
  // isenta de ficar visualmente coerente (risco 4, TASK-013-F319-FE-01).
  useEffect(() => {
    setValue('user_id', null, { shouldDirty: false });
  }, [activeFarmUuid, setValue]);

  // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
  // `parseBlobError` extrai o envelope real `{message, errors}`. Prioridade:
  // 1ª mensagem ESPECÍFICA de `errors`; só cai para o `message` genérico
  // quando não há erro de campo (mirror EXATO `MovimentacaoEstoque`/
  // `FluxoCaixaMensal`).
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

  // `handleSubmit` entrega os 5 campos do FORMULÁRIO (`SavingsReportFormValues`)
  // — a FRONTEIRA obrigatória `toSavingsReportParams()` é SEMPRE a 1ª linha
  // do corpo dos 2 handlers (`fid-g3f-savings.md §5 D-12`); nada toca o
  // service antes dela. PROIBIDO `{ ...values }`, spread parcial, `delete`,
  // `omit(values, [...])` — a página nunca remonta chaves inline.
  async function handleDownloadPdf(values: SavingsReportFormValues) {
    const params = toSavingsReportParams(values);
    setIsExportingPdf(true);
    try {
      const blob = await downloadSavingsReportPdf(params);
      // P-11 ABERTO no gate — default documentado: PDF INLINE, NUNCA
      // `downloadBlob()` (forçaria o save e quebraria a fidelidade ao
      // legado, mirror `HorasLogadas`/`VacasPrenhas`). SEM terceiro
      // argumento em `window.open` — `noopener`/`noreferrer` fariam o
      // retorno ser sempre `null` mesmo com a aba abrindo com sucesso
      // (HTML Living Standard); como é um `blob:` de MESMA origem, o risco
      // de tabnabbing não se aplica.
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank');
      if (!opened) {
        // Nenhum estado silencioso (`get_spa_ux_fidelity_pattern §3`).
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revoga a Object URL imediatamente — a aba recém-aberta ainda a
      // está lendo (mirror `HorasLogadas`/`ProducaoArea`).
    } catch (error) {
      await notifyDownloadError(error);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleDownloadExcel(values: SavingsReportFormValues) {
    const params = toSavingsReportParams(values);
    setIsExportingXlsx(true);
    try {
      const blob = await downloadSavingsReportExcel(params);
      downloadBlob(blob, `${text.exportFileName}.xlsx`);
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      await notifyDownloadError(error);
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
            title={text.downloadPdfButton}
            icon={Download as any}
            type="button"
            onClick={handleSubmit(handleDownloadPdf)}
            loading={isExportingPdf}
            disabled={isExportingPdf || isExportingXlsx}
          />
          <Button
            title={text.downloadExcelButton}
            icon={FileSpreadsheet as any}
            type="button"
            onClick={handleSubmit(handleDownloadExcel)}
            loading={isExportingXlsx}
            disabled={isExportingPdf || isExportingXlsx}
          />
        </Flex>
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <VStack align="stretch" gap={6}>
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
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.status}
                  placeholder={text.statusPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<number> | null) => field.onChange(option ?? null)}
                  options={statusOptions}
                  loading={optionsQuery.isFetching}
                />
              )}
            />

            {/* "Comprador Responsável" — CAMPO DECORATIVO (`DEC-FE-02`,
                mirror do filtro morto `user_id` do legado, `CL-019`/
                `OQ-007`). Visível, habilitado, preenchível, populado por
                `data.responsibles` (mesma resposta de `/options`) — e SEM
                efeito nenhum: `toSavingsReportParams()` NUNCA lê este campo
                e o parâmetro de responsável da API não tem consumidor em
                nenhum arquivo desta feature. NÃO ligar ao payload — decisão do dono,
                reconfirmada em 2026-09-08. Sem dica visual/`disabled`/
                `helperText` de aviso: "idêntico ao legado" inclui a
                ausência de qualquer sinal de que o campo não faz nada
                (exceção declarada ao `get_spa_ux_fidelity_pattern §3`). */}
            <Controller
              name="user_id"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.fields.userId}
                  placeholder={text.userIdPlaceholder}
                  name={field.name}
                  value={field.value}
                  onChange={(option: Option<string> | null) => field.onChange(option ?? null)}
                  options={responsibleOptions}
                  loading={optionsQuery.isFetching}
                />
              )}
            />

            {/* Fazendas — `CheckboxListField` sobre lookup FLAT
                (`data.farms` de `/options`), busca filtrada no CLIENTE
                (mirror `GestaoFiscal/Faturamento`). Default: TODAS
                pré-selecionadas (`FILT-001`). Payload: `string[]` de uuid,
                NUNCA `Option<T>[]`. */}
            <Box gridColumn={{ base: '1', sm: '1', md: 'span 2', lg: 'span 4' }}>
              <Controller
                name="farm_uuid"
                control={control}
                render={({ field }) => (
                  <CheckboxListField
                    label={`${text.fields.farmUuid} *`}
                    items={farmItems}
                    selectedValues={field.value}
                    onChange={field.onChange}
                    searchValue={farmSearch}
                    onSearchChange={setFarmSearch}
                    searchPlaceholder={text.farmSearchPlaceholder}
                    selectAllLabel={text.selectAll}
                    deselectAllLabel={text.deselectAll}
                    selectedCountLabel={text.fields.farmUuid}
                    emptyLabel={text.farmEmptyLabel}
                    isLoading={optionsQuery.isFetching}
                    columns={columnsForm.threeColumns}
                  />
                )}
              />
              {errors.farm_uuid?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.farm_uuid.message}
                </Text>
              )}
            </Box>
          </SimpleGrid>
        </VStack>
      </Form>
    </FormContainer>
  );
}
