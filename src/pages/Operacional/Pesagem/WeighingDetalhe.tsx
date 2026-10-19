// src/pages/Operacional/Pesagem/WeighingDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura) de Pesagem — `pes-screen-show`
// (F-071, TASK-PES-FE-07, contrato-tela-lane-c-pesagem-frontend.md §6.8).
// Rota `/operacional/pesagem/:uuid` (registro do param/gate `weighing_view` é
// da TASK-PES-FE-08 — este arquivo só declara o nome do param esperado,
// mirror `SanitarioDetalhe.tsx`/`AcasalamentoDetalhe.tsx`).
//
// Casca `FormContainer` com `headerActions` = `Voltar` + `Relatório
// Individual` (mesma ação de linha do menu da listagem, `downloadWeighingReport`
// — NÃO duplica a chamada, mirror `InvoiceDetalhe.tsx`, 2 botões em `Flex`).
//
// Blocos (contrato-tela §6.8):
//   1. Identificação (`DisplayFieldGroup`) — Código/Data/Lote-Categoria
//      (mutuamente exclusivos, mostra o que estiver preenchido)/Pesagem de
//      Estoque (+Preço do @ só quando `is_stock=true`).
//   2. Animais — SEMPRE presente, tabela somente leitura: identificação/
//      peso/último peso/ganho/GMD/ultrassom por linha. `gain`/`gmd`
//      calculados client-side, mirror EXATO `calcRowMetrics` de
//      `WeighingAnimalRow.tsx`/`FeedlotWeighingRow.tsx` (CV-01/CV-02) — a
//      API não devolve esses 2 campos no detalhe (`WeighingAnimalDetail` só
//      tem `weight`/`last_weight`/`last_weight_date`).
//   3. Sanitário — CONDICIONAL a `item.sanitary` existir (Regra 1 da Tarefa:
//      bloco inteiro ausente quando não há sanitário vinculado, nunca
//      "vazio" — mirror CL-024/OQ-P7). Itens somente leitura — mirror
//      EXATO `SanitarioDetalhe.tsx` (Produto/Estoque uuid truncado/Dose/
//      Total/Observação, SEM Armazém/Un.Medida — `WeighingSanitaryItemDetail`
//      não tem esses campos, confirmado por leitura direta de
//      `WeighingResource.php` nas Tarefas 01-06) e SEM Centro de Custo
//      (Regra 3, `WeighingSanitaryItemData` nunca teve esse campo no
//      sub-form de Pesagem).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import { Box, EmptyState, Flex, Icon, Table, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiPrinter, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';
import transformNumberToStringKg from '@/utils/transformNumberToStringKg';

import { queryKey } from '@/constants/query-key';

import { downloadWeighingReport, getWeighingByUuid } from '@/services/v2/Weighing/weighing-service';

import type { WeighingAnimalDetail, WeighingDetail } from '@/@types/v2/Weighing';

const PESAGEM_LIST_ROUTE = '/operacional/pesagem';

const noData = '—';

// Mirror `ServiceOrderDetalhe.truncateUuid`/`AppropriationDetalhe.truncateUuid`/
// `SanitarioDetalhe.truncateUuid` (SEM MOCK: nenhum lookup client-side
// inventado para resolver o uuid flat de `stock` que a API devolve).
function truncateUuid(uuid: string | null | undefined): string {
  if (!uuid) return noData;
  return `${uuid.slice(0, 8)}…`;
}

function formatNumber(value: number | null, decimals: number): string {
  if (value === null) return noData;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Mirror EXATO `WeighingAnimalRow.calcRowMetrics`/`FeedlotWeighingRow.calcRowMetrics`
// (`gain = weight - last_weight`, `gmd = gain / dias`, CV-01/CV-02,
// `PRESERVAR`) — a API não devolve `gain`/`gmd` prontos no detalhe, só os
// insumos (`weight`/`last_weight`/`last_weight_date`).
function calcRowMetrics(
  weight: number,
  lastWeight: number,
  lastWeightDate: string | null,
  weighingDate: string | null
): { gain: number | null; gmd: number | null } {
  const gain = weight - lastWeight;
  let days: number | null = null;
  if (lastWeightDate && weighingDate) {
    const diff = Math.round(
      (new Date(weighingDate).getTime() - new Date(lastWeightDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    days = diff > 0 ? diff : null;
  }
  const gmd = days !== null && days > 0 ? gain / days : null;
  return { gain, gmd };
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      fontSize="sm"
      fontWeight="semibold"
      color="fg.default"
      mb={4}
      pb={2}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      {children}
    </Text>
  );
}

export default function WeighingDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.weighing.weighing;
  const detailText = text.detail;

  const hasValidUuid = isValidGuid(uuid);

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `SanitarioDetalhe.tsx`/`AcasalamentoDetalhe.tsx`/`ProcessingDetalhe.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      navigate(PESAGEM_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  // Tela de VISUALIZAÇÃO pura — sem `useForm` (mirror `SanitarioDetalhe.tsx`:
  // `fillForm` é um no-op deliberado, a tela lê `.data` direto).
  const weighingQuery = useCustomFormQueryById<WeighingDetail>({
    registrationId: hasValidUuid ? (uuid as string) : '',
    asyncFunction: getWeighingByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.weighing.weighing,
  });

  const isLoading = checkLoadingStatus([weighingQuery as any]);
  const item = (weighingQuery as any).data as WeighingDetail | undefined;
  const notFound = !isLoading && (weighingQuery as any).isError;

  // ---- Relatório individual (síncrono, blob — reusa `downloadWeighingReport`
  // da Tarefa 35, MESMA função de serviço do menu de linha da listagem,
  // Regra 3 da Tarefa: "não duplicar a chamada"). --------------------------
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  async function handleDownloadReport() {
    if (!item) return;
    setIsDownloadingReport(true);
    try {
      const blob = await downloadWeighingReport(item.uuid);
      downloadBlob(blob, `pesagem-${item.code ?? item.uuid}.pdf`);
    } catch {
      toaster.error({
        title: text.singularLabel,
        description: languageGB.common.errorLog.unknownError,
      });
    } finally {
      setIsDownloadingReport(false);
    }
  }

  if (!hasValidUuid) {
    return null;
  }

  function renderAnimalRow(row: WeighingAnimalDetail) {
    const { gain, gmd } = calcRowMetrics(
      row.weight,
      row.last_weight,
      row.last_weight_date,
      item?.date ?? null
    );
    return (
      <Table.Row key={row.uuid}>
        <Table.Cell>{row.animal?.identification ?? noData}</Table.Cell>
        <Table.Cell>{transformNumberToStringKg(row.weight)}</Table.Cell>
        <Table.Cell>{transformNumberToStringKg(row.last_weight)}</Table.Cell>
        <Table.Cell>{formatNumber(gain, 2)}</Table.Cell>
        <Table.Cell>{formatNumber(gmd, 3)}</Table.Cell>
        <Table.Cell>
          {row.has_ultrasound ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no}
        </Table.Cell>
        {/* Correção de fidelidade (97-Esteiras/002 execução 002 lane C) —
            AOL/EGS/MARM/Classe, exibidos quando a linha tem ultrassom
            vinculado (`row.ultrasound !== null`, `WeighingResource`); `—`
            quando não há exame nesta linha, mirror
            `ProcessingDetailUltrasoundTable`. */}
        <Table.Cell>{formatNumber(row.ultrasound?.aol ?? null, 2)}</Table.Cell>
        <Table.Cell>{formatNumber(row.ultrasound?.egs ?? null, 2)}</Table.Cell>
        <Table.Cell>{formatNumber(row.ultrasound?.marm ?? null, 2)}</Table.Cell>
        <Table.Cell>{row.ultrasound?.classification ?? noData}</Table.Cell>
      </Table.Row>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? text.singularLabel}
      headerActions={
        <Flex align="center" gap={3} flexShrink={0}>
          <Button
            title={text.list.actions.report}
            icon={FiPrinter as ElementType}
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            disabled={!item || isDownloadingReport}
          />
          <Button
            title={detailText.backButton}
            icon={FiArrowLeft as ElementType}
            variant="outline"
            size="sm"
            onClick={() => navigate(PESAGEM_LIST_ROUTE)}
          />
        </Flex>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        {notFound ? (
          <Flex direction="column" align="center" justify="center" py={16} px={4}>
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{detailText.notFound.title}</EmptyState.Title>
                  <EmptyState.Description>{detailText.notFound.description}</EmptyState.Description>
                </VStack>
                <Flex gap={3}>
                  <Button
                    title={languageGB.defaltStrings.tryAgain}
                    icon={FiRefreshCw as ElementType}
                    variant="outline"
                    size="sm"
                    onClick={() => (weighingQuery as any).refetch?.()}
                  />
                  <Button
                    title={detailText.backButton}
                    icon={FiArrowLeft as ElementType}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(PESAGEM_LIST_ROUTE)}
                  />
                </Flex>
              </EmptyState.Content>
            </EmptyState.Root>
          </Flex>
        ) : (
          <Flex direction="column" gap={6} mt={2}>
            {/* ---- Identificação — DisplayFieldGroup (contrato-tela §6.8) ---- */}
            <DisplayFieldGroup
              loading={isLoading}
              displayFields={[
                { label: detailText.fields.code, value: item?.code ?? noData },
                {
                  label: detailText.fields.date,
                  value: item?.date ? formatDate(item.date) : noData,
                },
                {
                  label: item?.batch ? detailText.fields.batch : detailText.fields.category,
                  value: item?.batch?.name ?? item?.category?.name ?? noData,
                },
                {
                  label: detailText.fields.isStock,
                  value: item?.is_stock
                    ? languageGB.defaltStrings.yes
                    : languageGB.defaltStrings.no,
                },
                // `arroba_value` só faz sentido quando `is_stock=true` (mirror
                // `WeighingHeaderFields.tsx` — habilitado/obrigatório só nesse caso).
                ...(item?.is_stock
                  ? [
                      {
                        label: detailText.fields.arrobaValue,
                        value:
                          item?.arroba_value != null
                            ? formatCurrencyBRL(item.arroba_value)
                            : noData,
                      },
                    ]
                  : []),
              ]}
            />

            {/* ---- Bloco 1 — Animais (SEMPRE presente) ---- */}
            <Box>
              <SectionTitle>{detailText.sections.animals}</SectionTitle>
              {(item?.animals.length ?? 0) === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {detailText.emptySection}
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>{detailText.fields.animal}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.weight}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.lastWeight}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.gain}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.gmd}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.ultrasound}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.aol}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.egs}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.marm}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.classification}</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>{item?.animals.map(renderAnimalRow)}</Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Box>

            {/* ---- Bloco 2 — Sanitário — CONDICIONAL a `item.sanitary`
                (Regra 1 da Tarefa: o bloco inteiro, título incluso, só existe
                no DOM quando o registro tem sanitário vinculado — NUNCA
                renderizado vazio/placeholder, mirror CL-024/OQ-P7). ---- */}
            {item?.sanitary && (
              <Box>
                <SectionTitle>{detailText.sections.sanitary}</SectionTitle>
                {item.sanitary.items.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted">
                    {detailText.emptySection}
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>{detailText.fields.product}</Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.fields.stock}</Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.fields.dose}</Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.fields.total}</Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.fields.note}</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {item.sanitary.items.map((row) => (
                          <Table.Row key={row.uuid}>
                            <Table.Cell>{row.product?.name ?? noData}</Table.Cell>
                            <Table.Cell>{truncateUuid(row.stock?.uuid)}</Table.Cell>
                            <Table.Cell>{row.quantity}</Table.Cell>
                            <Table.Cell>{row.total_quantity}</Table.Cell>
                            <Table.Cell>{row.note ?? noData}</Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Box>
            )}
          </Flex>
        )}
      </Box>
    </FormContainer>
  );
}
