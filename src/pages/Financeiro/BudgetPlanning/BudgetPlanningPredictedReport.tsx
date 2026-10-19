// src/pages/Financeiro/BudgetPlanning/BudgetPlanningPredictedReport.tsx
// -----------------------------------------------------------------------------
// Tela de RELATÓRIO (PDF/Excel) "Previsto × Realizado Anual" — Prev.
// Orçamentária (BudgetPlanning, F-106, esteira 97-Esteiras/067,
// TASK-PO-FE-10, contrato de tela §9). Mirror ESTRUTURAL de
// `Relatorios/Pecuaria/SanitarioLote/index.tsx`/`EvolucaoRebanho/index.tsx`
// (export síncrono via blob, SEM prévia/tabela — o servidor devolve o
// binário pronto na mesma resposta `GET /budget-plannings/predicted-report`,
// `responseType: 'blob'`, SEM envelope).
//
// DIVERGÊNCIA DELIBERADA do Roteiro sugerido pela Tarefa (`useMutation`
// TanStack para o download): o padrão REAL já em produção neste fork para
// download binário (`EvolucaoRebanho`/`SanitarioLote`, comentário "convenção
// do fork") é loading POR BOTÃO via `useState` local + try/catch/finally —
// NUNCA `useMutation` para binário. Fidelidade ao código real > sugestão
// genérica da Tarefa (mesma regra já aplicada pela esteira irmã 068).
// `parseDownloadError` (cópia local, mesma duplicação intencional das 4
// telas de relatório do fork — não há util compartilhado) converte o `Blob`
// do 422 para texto/JSON antes de ler `message`/`errors` (axios não faz
// parse do corpo de erro quando `responseType: 'blob'`).
//
// Rodada 3 (esteira 065, item 1.a) — REVERTE o antigo `GAP-PO-04`: o Select
// de Fazenda volta à tela, tenant-scoped (`listEnabledFarms` — mirror
// `Relatorios/Financeiro/MovimentoBancario/index.tsx:92,194-205,227`), campo
// OPCIONAL (decisão do dono, task-packet rodada 3 — sem seleção, cai no
// fallback `X-Farm-Id` do interceptor genérico, igual ao comportamento
// anterior). Gateada por `budget-plannings_view` (rota real, ver
// `src/router/index.tsx` — NÃO o slug órfão `budget-planning-predicted_view`
// do catálogo do front, contrato de tela §12/risco 2).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { SimpleGrid } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { Download } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { Form } from '@/components/Form';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useOptionsSelectQuery } from '@/hooks/useOptionsSelectQuery';

import { downloadBlob } from '@/utils/downloadBlob';

import { columnsForm } from '@/constants/coluns-form';
import { predictedReportTypeOptions } from '@/constants/financeiro/budgetPlanning/options/predicted-report-type-options';
import { budgetPlanningYearFilterOptions } from '@/constants/financeiro/budgetPlanning/options/year-filter-options';
import { queryKey } from '@/constants/query-key';

import { listEnabledFarms } from '@/services/v2/Farms/farm-service';
import { downloadBudgetPlanningPredictedReport } from '@/services/v2/Financeiro/budget-planning-service';

import type { Option } from '@/@types/option';
import type {
  BudgetPlanningPredictedReportFilterForm,
  BudgetPlanningPredictedReportType,
} from '@/@types/v2/Financeiro/budgetPlanning';

// Janela fixa (ano corrente −5..+1), mesmo racional de
// `FilterSideBudgetPlanning.tsx` — sem tradução aplicável (rótulo = o
// próprio ano), calculada 1x por módulo.
const yearOptions = budgetPlanningYearFilterOptions();

// Com `responseType: 'blob'`, um erro JSON (422 — ex.: ano sem plano
// cadastrado) chega como `Blob`, não como objeto já parseado pelo axios —
// converte de volta para texto/JSON antes de ler `message`/`errors` (mirror
// `SanitarioLote::parseDownloadError`, que por sua vez espelha
// `Relatorios/Suprimentos/index.tsx`).
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

export default function BudgetPlanningPredictedReport() {
  const { languageGB } = useLanguage();
  const text = languageGB.financial.budgetPlanning;
  const reportText = text.predictedReport;

  const typeOptions = predictedReportTypeOptions.options(languageGB);

  // Ajuste rodada 5 (task-packet, item único): "Formato" nasce PRÉ-SELECIONADO
  // com PDF (antes: `type: null` + erro "O formato é obrigatório" no load).
  // `pristineValues` precisou migrar de módulo→componente porque a opção PDF
  // exige `languageGB` (rótulo traduzido), só disponível após `useLanguage()`
  // — `year`/`farm` permanecem com os MESMOS valores de antes, apenas
  // realocados (nenhuma outra regra tocada). Isso já satisfaz a validação
  // `required` do campo no mount; o botão Gerar (`disabled={!isValid}`)
  // passa a depender só do Ano.
  const pristineValues: BudgetPlanningPredictedReportFilterForm = {
    year: new Date().getFullYear(),
    type: predictedReportTypeOptions.getOption('pdf', languageGB),
    farm: null,
  };

  const {
    control,
    handleSubmit,
    trigger,
    formState: { isValid },
  } = useForm<BudgetPlanningPredictedReportFilterForm>({
    mode: 'onChange',
    defaultValues: pristineValues,
  });

  // Gate do botão (Item 2, rodada 3 — mirror `CustoProducaoAcumulado/index.tsx`)
  // — `isValid` do RHF pode nascer `true` no mount, ANTES de rodar a
  // validação (gotcha documentado do RHF `mode:'onChange'`); dispara a
  // validação completa 1x no mount para o botão abrir DESABILITADO até
  // `year`/`type` (obrigatórios) estarem preenchidos. `trigger` fora do
  // array de deps por decisão deliberada (mirror `CustoProducaoAcumulado` —
  // nenhuma regra `exhaustive-deps` ativa neste projeto): dispara 1x no
  // mount, não a cada render.
  useEffect(() => {
    trigger();
  }, []);

  // ---- Fazenda (Select estático, lookup SEM paginação) — `listEnabledFarms()`
  // TENANT-SCOPED (`/farms/current-tenant?only_enabled=true`), NUNCA
  // `getMyFarms`/`listFarms` (mirror `MovimentoBancario/index.tsx:194-205`,
  // ROTEIRO-FILT-05/esteira 060, achado C-P1-06) — esconde fazenda
  // desabilitada. Campo OPCIONAL (decisão do dono, task-packet rodada 3): sem
  // seleção, o `farm_uuid` vai `undefined` e o backend cai no fallback
  // `X-Farm-Id`. `queryKey.farms.listEnabled` é chave DEDICADA (NÃO
  // `queryKey.farms.list`) para não colidir no cache do TanStack Query com
  // as telas que consomem o universo sem filtro. ---------------------------
  const farmQuery = useOptionsSelectQuery({
    asyncFunction: listEnabledFarms,
    queryKey: queryKey.farms.listEnabled,
    mapOption: (item) => ({ value: item.uuid, label: item.description }),
  });

  const [isGenerating, setIsGenerating] = useState(false);

  async function onSubmit(data: BudgetPlanningPredictedReportFilterForm) {
    if (!data.year || !data.type) return;

    setIsGenerating(true);
    try {
      const type = data.type.value as BudgetPlanningPredictedReportType;
      const blob = await downloadBudgetPlanningPredictedReport({
        year: data.year,
        type,
        farm_uuid: data.farm?.value,
      });
      downloadBlob(blob, `previsto-realizado.${type}`);
      toaster.success({ title: reportText.title, description: reportText.success });
    } catch (error) {
      const { message } = await parseDownloadError(error);
      toaster.error({ title: reportText.title, description: message || reportText.genericError });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <FormContainer
      title={reportText.title}
      subtitle={reportText.subtitle}
      footer={
        <Button
          title={reportText.submitButton}
          icon={Download as any}
          type="button"
          onClick={handleSubmit(onSubmit)}
          loading={isGenerating}
          disabled={!isValid || isGenerating}
        />
      }
    >
      <Form onSubmit={(event) => event.preventDefault()}>
        <SimpleGrid columns={columnsForm.threeColumns} gap={4}>
          <Controller
            name="year"
            control={control}
            rules={{ required: reportText.yearRequired }}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={reportText.yearLabel}
                name={name}
                value={yearOptions.find((option) => option.value === value) ?? null}
                onChange={(option: Option<number> | null) => onChange(option?.value ?? null)}
                options={yearOptions}
                isRequired
                error={error?.message}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            rules={{ required: reportText.typeRequired }}
            render={({ field: { name, value, onChange }, fieldState: { error } }) => (
              <Select
                label={reportText.typeLabel}
                name={name}
                value={value}
                onChange={onChange}
                options={typeOptions}
                isRequired
                error={error?.message}
              />
            )}
          />

          <Controller
            name="farm"
            control={control}
            render={({ field: { name, value, onChange } }) => (
              <Select
                label={reportText.farmLabel}
                name={name}
                value={value}
                onChange={(option: Option<string> | null) => onChange(option ?? null)}
                options={farmQuery.options}
                loading={farmQuery.isLoading}
              />
            )}
          />
        </SimpleGrid>
      </Form>
    </FormContainer>
  );
}
