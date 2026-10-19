// src/pages/Relatorios/Suprimentos/index.tsx
// -----------------------------------------------------------------------------
// Tela do Relatório SLA (SupplyStatusSlaReport — Administrativo /
// Suprimentos, TASK-SLA-FE-02, esteira 97-Esteiras/037). Filtro (uuid OU par
// de datas + status opcional) + botão "Gerar", que dispara o download
// `.xlsx` DIRETAMENTE — sem etapa de "prévia" (backend 100% síncrono,
// `Excel::download`, sem fila/job/polling, TASK-SLA-FE-01).
//
// Rota `/relatorios/suprimentos` (item de menu `rel-sup`, JÁ reservado em
// `navigationTree.ts`/`navigationPermissions.ts`). Achado de auditoria: o
// bucket de permissão `rel-sup` cobre 7 relatórios do hub Suprimentos, dos
// quais SÓ o SLA tem backend pronto hoje — decisão default do Arquiteto
// (reversível): materializar a rota AGORA com SÓ a seção do Relatório SLA
// visível, sem placeholders "em breve" para os outros 6 (item de aceite
// TASK-SLA-FE-02, registrado para o dono confirmar/reverter).
//
// Passo UX (get_spa_ux_fidelity_pattern): UX-GAP declarado — o `ux_root`
// (`ReportWorkspace`/`EstoqueConsolidadoReportPage.tsx`) presume um fluxo
// "gerar prévia → exportar" que NÃO existe neste backend; casca adaptada:
// `FormContainer` (mirror `PlatformDocuments/index.tsx`, tela ÚNICA sem
// grid) + `Form formFilter` (mirror `FilterSideInvoice.tsx`, mas embutido na
// PÁGINA, não em `FilterSide`/drawer — não há listagem para filtrar aqui).
//
// Mapeamento de erro de negócio (ACHADO desta Tarefa, leitura direta de
// `GenerateRequestPurchaseSlaReportAction`): o task-packet original citava
// "403 configuração incompleta", mas o código real lança
// `BusinessRuleException` → HTTP 422 para (a) fazenda ausente, (b)
// configuração de SLA incompleta e (c) nenhum gatilho informado; e
// `ResourceNotFoundException` → HTTP 404 para nenhuma solicitação
// encontrada. Como a resposta é `responseType: 'blob'`, um erro JSON chega
// como `Blob` (não como objeto já parseado) — `parseDownloadError` abaixo
// converte o Blob de volta para texto/JSON antes de ler `message`.
//
// ADITIVO (TASK-RC-FE-01, esteira 037): lê `?uuid=` da URL (navegação vinda
// da ação "Relatório SLA" da listagem Rejeitados/Cancelados,
// `Administrativo/Rejeitados/index.tsx`) e pré-preenche o campo "Solicitação"
// do filtro via `getRequestPurchase(uuid)` (busca o `code` para o label do
// `SelectAsyncPaginate`) — decisão de UX default (navegar para o formulário
// em vez de baixar direto o xlsx do dropdown, mirror não-1:1 do legado,
// reversível a pedido do dono).
//
// AJUSTE DE LAYOUT (TASK-SLA-FE-02, homologação do dono): o botão "Gerar"
// estava solto/destacado no fim do card (dentro do `<Form>`, empurrado por
// `mt="6"`), fora da área de AÇÃO do formulário. Reposicionado para o
// `footer` de `FormContainer` — mesma casca de rodapé de ação fixo (borda
// superior, `PageCard fullHeight`) usada pelos formulários irmãos de
// CRUD desta SPA (ex.: `CadastrosBase/CausaMortePerda/
// CreateOrUpdateCausaMortePerda.tsx`), já que não existe, hoje, nenhuma
// tela de RELATÓRIO de página cheia (fora de `FilterSide`/drawer) que use
// `Form.FooterFilter` — esse rodapé é específico do drawer de filtro
// (`SimpleGridFilter`/scroll de listagem) e não se aplica aqui. Botão
// passa de `type="submit"` (dentro do `<Form>`) para `type="button"` +
// `onClick={handleSubmit(onSubmit)}` (fora do `<form>`, no footer da
// casca) — mesma técnica das telas de CRUD citadas. Lógica de
// habilitação/loading/submit/download PRESERVADA — só posição.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useState } from 'react';

import { Flex, Text } from '@chakra-ui/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { isAxiosError } from 'axios';
import { Controller, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { SelectAsyncPaginate } from '@/components/Form/SelectAsyncPaginate';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { downloadBlob } from '@/utils/downloadBlob';

import { requestPurchaseStatusOptions } from '@/constants/RequestPurchases/options/request-purchase-status-options';

import { supplyStatusSlaReportFilterSchema } from '@/validations/schemas/RelatorioSla/relatorio-sla-filter-schema';

import {
  getRequestPurchase,
  listRequestPurchases,
} from '@/services/v2/RequestPurchases/request-purchase-service';
import { downloadSupplyStatusSlaReport } from '@/services/v2/SupplyStatusSlaReport/supply-status-sla-report-service';

import type { Option } from '@/@types/option';
import type { RequestPurchaseListItem } from '@/@types/v2/RequestPurchases';
import type { SupplyStatusSlaReportFilterForm } from '@/@types/v2/SupplyStatusSlaReport';

const pristineValues: SupplyStatusSlaReportFilterForm = {
  uuid: null,
  start_date: null,
  end_date: null,
  status: null,
};

/**
 * A resposta é `responseType: 'blob'` — um erro JSON (404/422) chega como
 * `Blob`, não como objeto já parseado pelo axios. Converte de volta para
 * texto/JSON antes de ler `message` (mirror do envelope
 * `{success,message,data,errors,meta}`, get_spa_api_client_pattern §3).
 * @param {unknown} error - Erro capturado do `catch` (esperado `AxiosError`).
 * @return {Promise<Object>} Status HTTP e mensagem real do backend, quando disponíveis.
 */
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
      return { status, message: parsed?.message ?? null };
    } catch {
      return { status, message: null };
    }
  }

  const message = (data as { message?: string } | undefined)?.message ?? null;
  return { status, message };
}

export default function SupplyStatusSlaReportPage() {
  const { languageGB } = useLanguage();
  const text = languageGB.supplyStatusSlaReport;

  const [isGenerating, setIsGenerating] = useState(false);
  const [searchParams] = useSearchParams();
  const uuidFromQuery = searchParams.get('uuid');

  const { control, handleSubmit, watch, setValue } = useForm<SupplyStatusSlaReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: yupResolver(supplyStatusSlaReportFilterSchema(languageGB)) as any,
    defaultValues: pristineValues,
  });

  // ADITIVO (TASK-RC-FE-01, esteira 037) — pré-seleciona o campo "Solicitação"
  // quando a tela é aberta a partir da ação "Relatório SLA" da listagem
  // Rejeitados/Cancelados (`?uuid=<uuid>`). Busca `code` via
  // `getRequestPurchase` para popular o label do `SelectAsyncPaginate`
  // (`Option<string>`); se a busca falhar (uuid inválido/sem permissão), o
  // campo fica vazio e o usuário pode escolher manualmente — sem quebrar a
  // tela.
  useEffect(() => {
    if (!uuidFromQuery) return;

    let isMounted = true;

    getRequestPurchase(uuidFromQuery)
      .then((response) => {
        if (!isMounted) return;
        setValue('uuid', {
          value: uuidFromQuery,
          label: response.data.code ?? uuidFromQuery,
        });
      })
      .catch(() => {
        // silencioso — mantém o campo vazio, sem bloquear a tela.
      });

    return () => {
      isMounted = false;
    };
  }, [uuidFromQuery, setValue]);

  const uuidValue = watch('uuid');
  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');

  // Botão "Gerar" desabilitado até um gatilho válido estar preenchido — uuid
  // OU par completo de datas (mirror RN-02 da Action real, TASK-SLA-FE-02 DoD).
  const hasValidTrigger = !!uuidValue || (!!startDateValue && !!endDateValue);

  const statusOptions = useMemo(
    () => requestPurchaseStatusOptions.options(languageGB),
    [languageGB]
  );

  async function onSubmit(data: SupplyStatusSlaReportFilterForm) {
    setIsGenerating(true);
    try {
      const blob = await downloadSupplyStatusSlaReport({
        uuid: data.uuid?.value || undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        status: data.status?.value ?? undefined,
      });
      downloadBlob(blob, 'relatorio-sla.xlsx');
      toaster.success({ title: text.pageTitle, description: text.toasts.success });
    } catch (error) {
      const { status, message } = await parseDownloadError(error);

      if (status === 404) {
        toaster.error({ title: text.pageTitle, description: message || text.toasts.noDataError });
      } else if (status === 422) {
        toaster.error({
          title: text.pageTitle,
          description: message || text.toasts.slaConfigMissingError,
        });
      } else {
        toaster.error({
          title: text.pageTitle,
          description: message || languageGB.common.errorLog.unknownError,
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <FormContainer
      title={text.pageTitle}
      subtitle={text.pageSubtitle}
      footer={
        <Flex width="full" justifyContent="flex-end">
          <Button
            title={text.filter.generateButton}
            type="button"
            onClick={handleSubmit(onSubmit)}
            loading={isGenerating}
            disabled={!hasValidTrigger || isGenerating}
          />
        </Flex>
      }
    >
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="uuid"
          control={control}
          render={({ field }) => (
            <SelectAsyncPaginate
              name={field.name}
              label={text.filter.uuid}
              placeholder={text.filter.uuidPlaceholder}
              service={listRequestPurchases}
              mapOptions={(item: RequestPurchaseListItem) => ({
                label: item.code ?? item.uuid,
                value: item.uuid,
              })}
              findParams={(search: string | { search: string }) => ({
                search: typeof search === 'string' ? search : search.search,
              })}
              value={field.value as Option<string> | null | undefined}
              onChange={(option: any) => field.onChange(option ?? null)}
              menuPortalTarget={document.body}
              menuPosition="fixed"
            />
          )}
        />

        <Text fontSize="sm" fontWeight="medium" mt="4">
          {text.filter.startDate}
        </Text>
        <Controller
          name="start_date"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DateInput value={value ?? null} onChange={onChange} />
          )}
        />

        <Text fontSize="sm" fontWeight="medium" mt="4">
          {text.filter.endDate}
        </Text>
        <Controller
          name="end_date"
          control={control}
          render={({ field: { value, onChange } }) => (
            <DateInput value={value ?? null} onChange={onChange} />
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select
              name={field.name}
              label={text.filter.status}
              placeholder={text.filter.statusPlaceholder}
              options={statusOptions}
              value={field.value as Option<number> | null | undefined}
              onChange={(option) => field.onChange(option ?? null)}
            />
          )}
        />

        {!hasValidTrigger && (
          <Text fontSize="sm" color="fg.muted" mt="2">
            {text.filter.noTriggerHint}
          </Text>
        )}
      </Form>
    </FormContainer>
  );
}
