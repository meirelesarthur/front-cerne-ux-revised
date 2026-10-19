// src/pages/Relatorios/Agricultura/ProducaoArea/index.tsx
// -----------------------------------------------------------------------------
// Tela "Prod./Área — Relatório" (F-299, 97-Esteiras/012). Tarefa 47 —
// FUNDAÇÃO: rota/menu, casca, 4 filtros e a cascata do ciclo de produção.
// Tarefa 48 — PDF direto (correção pós-teste-manual, esteira 012): o dono
// confirmou que o legado NUNCA teve prévia em grade nesta tela — sempre foi
// filtro→clique→PDF direto (mesmo padrão já corrigido em `HorasLogadas/
// index.tsx`). O fluxo de prévia em tabela (botão "Filtrar", `previewQuery`,
// tabela dinâmica) que a Tarefa 48 introduziu por engano foi REMOVIDO por
// completo nesta correção; ver Histórico de Mudanças da Tarefa 48 md.
//
// Casco mirror ESTRUTURAL de `Relatorios/Financeiro/ApuracaoCusto/index.tsx`
// (`FormContainer` + `Form noPadding` + `SimpleGrid columnsForm.fourColumns`,
// `VStack` externo com `paddingX={formSpacing.paddingX} minW={0}`) — modelo
// canônico homologado pelo dono (contrato de tela §4/§1.2), agora com 1 único
// botão de ação direto ("Imprimir"), mirror `HorasLogadas/index.tsx`.
//
// Cascata do ciclo de produção (`INT-01`/`INT-02`/`INT-03`, contrato de tela
// §6, gate `fid-g3f-prod-area.md` §2.2): vive INTEIRAMENTE no `onChange` do
// próprio `Select` de ciclo (`handleCycleChange`), NUNCA num `useEffect` que
// observa o VALOR do campo — o legado reseta o select de ciclo sempre que
// outro filtro muda (`INT-03`, ver `handleAreaUuidsChange`/
// `handleStartDateChange`/`handleEndDateChange` abaixo); se a cascata
// reagisse ao valor, esse reset a disparia de volta e apagaria o que o
// usuário acabou de editar.
//
// Duas correções de defeito legado decididas para esta rodada (`fid-g3f-
// prod-area.md` §2, `C-11`/`C-12`, NÃO reabrir):
//   - `C-11`: "Marcar Todos"/"Desmarcar Todos" passam a FUNCIONAR — capacidade
//     nativa do `CheckboxListField`, sem código de UI novo.
//   - `C-12`/`C-12b`: trocar de ciclo SUBSTITUI a seleção de áreas (nunca
//     acumula) e a opção vazia limpa datas E áreas no próprio estado do form.
//
// `production_cycle` é CLIENT-ONLY (`FLT-01`, contrato de API §3.1) — nunca
// entra em `ProductionAreaReportParams`; só alimenta a cascata.
//
// PDF: o backend devolve `Content-Disposition: inline` (contrato de API
// §3.2, fiel ao `$pdf->stream()` + `target=_blank` do legado) — "Imprimir"
// (sempre visível quando `hasValidRange`) abre o binário via
// `URL.createObjectURL(blob)` + `window.open(url, '_blank')`, **nunca** um
// utilitário de download que force arquivo local — quebraria a fidelidade ao
// `inline` do legado. Nunca `window.open(urlDaApi)` direto (perderia o header
// `X-Farm-Id`); o object URL nunca é revogado logo em seguida (a aba recém-
// aberta ainda o lê).
// CORREÇÃO DEFINITIVA pós-QA-manual (2ª rodada, esteira 012): o par
// `'noopener,noreferrer'` foi removido do terceiro argumento — `noreferrer`
// sozinho já implica `noopener` por especificação (HTML Living Standard:
// "the noreferrer keyword also enables the noopener keyword"), então
// qualquer uma das duas keywords faz `window.open` retornar `null` mesmo com
// a aba abrindo com sucesso, produzindo o falso "pop-up bloqueado" que o
// dono reportou de novo (mesma causa raiz de `HorasLogadas/index.tsx`).
// Como é um `blob:` do MESMO ORIGEM (criado localmente via
// `URL.createObjectURL`), o risco de reverse tabnabbing que essas keywords
// mitigam (navegação cross-origin para site de terceiro) não se aplica —
// sem elas, o retorno volta a refletir corretamente se a aba abriu ou não.
// -----------------------------------------------------------------------------

import { useMemo, useState } from 'react';

import { Box, Flex, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/Button';
import { DateInput } from '@/components/DateInput';
import { Form } from '@/components/Form';
import { CheckboxListField } from '@/components/Form/CheckboxListField';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { useQueryError } from '@/hooks/useQueryError';

import { configureSpacing } from '@/utils/config-padding';
import { parseBlobError } from '@/utils/parseBlobError';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { productionAreaReportFilterSchemaResolver } from '@/validations/schemas/Relatorios/production-area-report-filter-schema';

// REUSO — não criar um terceiro `getAreasOptions()` (já existe em
// `harvestProduct-service.ts`, copiado em `rainfall-service.ts`; contrato de
// tela §5.1). `GET /areas/options` é FLAT, sem paginação.
import { getAreasOptions } from '@/services/v2/HarvestProduct/harvestProduct-service';
import {
  downloadProductionAreaReportPdf,
  listProductionAreaReportCycles,
  type ProductionAreaReportParams,
} from '@/services/v2/Relatorios/production-area-report-service';

import type { Option } from '@/@types/option';

interface ProductionAreaReportFilterForm {
  /** CLIENT-ONLY — nunca entra em `ProductionAreaReportParams` (`FLT-01`, contrato de API §3.1). */
  production_cycle: Option<string> | null;
  area_uuids: string[];
  start_date: string | null;
  end_date: string | null;
}

export default function ProducaoAreaRelatorio() {
  const { languageGB } = useLanguage();
  const text = languageGB.productionAreaReport.report;
  // Mesmo token de espaçamento horizontal que `<Form>` já aplica internamente
  // — reaproveitado no `VStack` externo para os botões/área de resultado
  // alinharem com os campos do form (mirror `ApuracaoCusto`).
  const { formSpacing } = configureSpacing();

  function buildPristineValues(): ProductionAreaReportFilterForm {
    return {
      production_cycle: null,
      area_uuids: [],
      start_date: null,
      end_date: null,
    };
  }

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductionAreaReportFilterForm>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: productionAreaReportFilterSchemaResolver(languageGB),
    defaultValues: buildPristineValues(),
  });

  // Busca do multiselect de áreas — SEMPRE controlada pelo consumidor
  // (contrato de tela §5.2): a página filtra `allAreaItems` localmente.
  const [areaSearch, setAreaSearch] = useState('');
  // "Imprimir" (Tarefa 48) — download binário síncrono, mirror `ApuracaoCusto`.
  const [isDownloading, setIsDownloading] = useState(false);

  const startDateValue = watch('start_date');
  const endDateValue = watch('end_date');
  const hasValidRange = !!startDateValue && !!endDateValue;

  // Ciclos de produção (select + payload da cascata) — `label` já formatada
  // pelo servidor (contrato de tela §5).
  const cyclesQuery = useQuery({
    queryKey: [queryKey.relatorios.productionAreaCycles],
    queryFn: listProductionAreaReportCycles,
  });
  const cycleOptions: Option<string>[] = (cyclesQuery.data ?? []).map((cycle) => ({
    value: cycle.uuid,
    label: cycle.label,
  }));

  // Áreas (multiselect) — REUSO de `getAreasOptions()`, precedente de
  // consumo `FilterSideHarvestProduct.tsx:63`.
  const areasQuery = useQuery({
    queryKey: ['production-area-report', 'areas'],
    queryFn: getAreasOptions,
  });
  const allAreaItems = useMemo(
    () => (areasQuery.data ?? []).map((area) => ({ value: area.uuid, label: area.description })),
    [areasQuery.data]
  );
  const areaItems = useMemo(
    () =>
      allAreaItems.filter((item) =>
        item.label.toLowerCase().includes(areaSearch.trim().toLowerCase())
      ),
    [allAreaItems, areaSearch]
  );

  // Erro nas queries de lookup — toast automático, sem estado local de erro
  // (`get_pwa_error_loading_and_notification_pattern §10`).
  useQueryError([cyclesQuery, areasQuery]);

  // ---------------------------------------------------------------------
  // Cascata do ciclo de produção — CORAÇÃO desta Tarefa (contrato de tela
  // §6, gate `fid-g3f-prod-area.md` §2.2). Vive INTEIRAMENTE aqui, no
  // `onChange` do próprio Select — nunca num `useEffect` que observa o
  // VALOR do campo.
  // ---------------------------------------------------------------------
  function handleCycleChange(option: Option<string> | null) {
    setValue('production_cycle', option);

    if (!option) {
      // INT-02 + C-12b CORRIGIDO — a opção vazia limpa datas E áreas no
      // próprio estado do form (na SPA, o estado do form É o que a tela
      // mostra; o legado só zerava variáveis locais do handler).
      setValue('start_date', null);
      setValue('end_date', null);
      setValue('area_uuids', []);
      return;
    }

    const cycle = cyclesQuery.data?.find((item) => item.uuid === option.value);
    if (!cycle) return;

    // INT-01 — preenche as datas, direto do servidor (ISO).
    setValue('start_date', cycle.start_date);
    setValue('end_date', cycle.end_date);

    // C-12 CORRIGIDO — SUBSTITUI a seleção de áreas (o legado só
    // ACUMULAVA). Intersecção com as options carregadas: áreas do ciclo que
    // estejam desabilitadas não aparecem em `/areas/options` e, no legado,
    // também não podiam ser marcadas.
    const known = new Set(allAreaItems.map((item) => item.value));
    setValue(
      'area_uuids',
      cycle.areas.map((area) => area.uuid).filter((uuid) => known.has(uuid))
    );
  }

  // INT-03 — editar QUALQUER outro filtro reseta visualmente o select de
  // ciclo. Como a cascata mora no `onChange` do PRÓPRIO select (acima) e não
  // num efeito sobre o valor, este `setValue('production_cycle', null)` NÃO
  // a redispara.
  function handleAreaUuidsChange(values: string[]) {
    setValue('area_uuids', values);
    setValue('production_cycle', null);
  }
  function handleStartDateChange(value: string | null) {
    setValue('start_date', value);
    setValue('production_cycle', null);
  }
  function handleEndDateChange(value: string | null) {
    setValue('end_date', value);
    setValue('production_cycle', null);
  }

  // Achata a forma do form para o payload da API — `production_cycle` NUNCA
  // entra (contrato de tela §7.1).
  function buildParams(data: ProductionAreaReportFilterForm): ProductionAreaReportParams {
    return {
      start_date: data.start_date as string,
      end_date: data.end_date as string,
      area_uuids: data.area_uuids?.length ? data.area_uuids : undefined,
    };
  }

  // "Imprimir" (Tarefa 48) → PDF **inline em nova aba** (contrato de tela
  // §7.2/risco #1). Nunca forçar download local — o backend manda
  // `Content-Disposition: inline`, reproduzindo o `$pdf->stream()` +
  // `target=_blank` do legado.
  async function handleDownload(data: ProductionAreaReportFilterForm) {
    setIsDownloading(true);
    try {
      const blob = await downloadProductionAreaReportPdf(buildParams(data));
      const url = URL.createObjectURL(blob);
      // Correção DEFINITIVA pós-QA-manual (2ª rodada) — ver nota de cabeçalho
      // do arquivo: sem terceiro argumento, pois `noreferrer` sozinho já
      // implica `noopener` e qualquer um dos dois zera o retorno de
      // referência mesmo com a aba abrindo com sucesso.
      const opened = window.open(url, '_blank');
      if (!opened) {
        // Nenhum estado silencioso (get_spa_ux_fidelity_pattern §3): o
        // bloqueador de pop-up impede a aba — sem este aviso o clique
        // simplesmente não faria nada.
        toaster.error({ title: text.pageTitle, description: text.popupBlocked });
      }
      // Não revogar o object URL logo em seguida — a aba recém-aberta ainda
      // o está lendo (mirror dos 3 precedentes citados no contrato §7.2).
    } catch (error) {
      // `responseType:'blob'` entrega o corpo do erro 422 como `Blob` —
      // `parseBlobError` extrai o envelope real `{message, errors}`.
      // Prioridade: 1ª mensagem ESPECÍFICA de `errors`; só cai para o
      // `message` genérico quando não há erro de campo (mirror EXATO de
      // `ApuracaoCusto/index.tsx:274-289`).
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
      <VStack align="stretch" gap={6} paddingX={formSpacing.paddingX} minW={0}>
        <Form noPadding onSubmit={(event) => event.preventDefault()}>
          <SimpleGrid columns={columnsForm.fourColumns} gap={6}>
            <Controller
              name="production_cycle"
              control={control}
              render={({ field: { name, value } }) => (
                <Select
                  label={text.fields.productionCycle}
                  placeholder={text.cyclePlaceholder}
                  name={name}
                  value={value}
                  onChange={handleCycleChange}
                  options={cycleOptions}
                  loading={cyclesQuery.isLoading}
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
                  <DateInput value={value ?? null} onChange={handleStartDateChange} />
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
                  <DateInput value={value ?? null} onChange={handleEndDateChange} />
                )}
              />
              {errors.end_date?.message && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  {errors.end_date?.message}
                </Text>
              )}
            </Box>

            {/* Áreas — `CheckboxListField` ocupa a linha inteira do grid de
                4 colunas (contrato de tela §5.2), mesma técnica de
                `ApuracaoCusto/index.tsx:455`. */}
            <Box gridColumn={{ base: '1', sm: '1', md: 'span 3', lg: 'span 4' }}>
              <Controller
                name="area_uuids"
                control={control}
                render={({ field }) => (
                  <CheckboxListField
                    label={text.fields.areas}
                    items={areaItems}
                    selectedValues={field.value ?? []}
                    onChange={handleAreaUuidsChange}
                    searchValue={areaSearch}
                    onSearchChange={setAreaSearch}
                    searchPlaceholder={text.areasSearchPlaceholder}
                    selectAllLabel={text.areasSelectAll}
                    deselectAllLabel={text.areasDeselectAll}
                    selectedCountLabel={text.areasSelectedCount}
                    isLoading={areasQuery.isLoading}
                    columns={columnsForm.threeColumns}
                  />
                )}
              />
              <Text fontSize="xs" color="fg.muted" mt={1}>
                {text.areasHint}
              </Text>
            </Box>
          </SimpleGrid>
        </Form>

        {/* "Imprimir" — único botão de ação, sempre visível quando
            `hasValidRange` (correção pós-teste-manual: o legado nunca teve
            prévia em grade nesta tela, mirror `HorasLogadas/index.tsx`). */}
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
      </VStack>
    </FormContainer>
  );
}
