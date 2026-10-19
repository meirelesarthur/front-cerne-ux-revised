// src/pages/Fiscal/NfeEmitidas/NfeDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de Visualização (somente leitura) de NFe Emitida — TASK-FE-036-406.
// Mirror estrutural `InvoiceDetalhe.tsx` — bloco read-only, sem `useForm`,
// seções sequenciais (sem abas). É também o destino do redirect da guarda de
// edição bloqueada (`CreateOrUpdateNfe.tsx`, contrato de tela §4.1).
//
// Sem recálculo client-side aqui — `total_products`/`amount` exibidos são os
// PERSISTIDOS (fonte da verdade, `NfeResource.total_products/amount`),
// diferente das telas de formulário (que mostram preview antes de salvar).
//
// **Correção NFE-R2-013/014/015/016 (REAUDITORIA-036-2a-rodada.md, esteira
// 036fix2):** enriquecido com Operação/Finalidade/Tipo de Frete (rótulo do
// catálogo, não código cru), ICMS/base (condicional, mirror
// `_nfe_detail.blade.php:135-147`, só quando `percent_icms > 0`), seção
// "Transporte" completa (transportador/guia/frete/volumes/pesos) e, no item,
// Pacote/Área/Total. **GAP-API (NFE-R2-012/016, ainda ABERTO)** — o
// `ItemNfeResource` real (confirmado por leitura direta) só devolve
// `{uuid}` para `package`/`area` (sem `description`); mostrado como uuid
// truncado (SEM MOCK — não inventamos um rótulo que a API não fornece).
// -----------------------------------------------------------------------------

import { ElementType, useEffect, useState } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiPrinter } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { downloadBlob } from '@/utils/downloadBlob';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { isNfeEditable, nfeEstadoColor } from '@/constants/Fiscal/nfe-estado-options';
import {
  nfeFinalidadeOptions,
  nfeShippingTypeOptions,
  nfeTipoOperacaoOptions,
  nfeTypeGuideOptions,
  nfeTypePaymentOptions,
} from '@/constants/Fiscal/nfe-fiscal-catalogs';

import { downloadNfeDanfe, downloadNfeDanfePreview } from '@/services/v2/Fiscal/nfe-service';

import { NfeEmissionPanel } from './NfeEmissionPanel';
import { useNfeDetail } from './useNfeDetail';

const NFES_LIST_ROUTE = '/fiscal/nfe-emitidas';

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

// NFE-R2-016 — rótulo do catálogo em vez do código cru (mirror legado, que
// resolve pelo array estático em PHP antes de exibir).
function catalogLabel<TValue extends string | number>(
  options: { value: TValue; label: string }[],
  value: TValue | null | undefined,
  noData: string
): string {
  if (value === null || value === undefined) return noData;
  return options.find((option) => option.value === value)?.label ?? String(value);
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={1}
      >
        {label}
      </Text>
      <Text fontSize="sm" color="fg.default">
        {value}
      </Text>
    </Box>
  );
}

export default function NfeDetalhe() {
  const { nfeId } = useParams<{ nfeId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.nfes.nfe;
  const detailText = text.detail;
  const noData = detailText.table.noData;

  // TASK-FE-036-561 — loading do botão de DANFE (antes disparava
  // `window.print()`, que imprimia a própria página HTML, NÃO o DANFE
  // fiscal). Hook declarado no topo (junto dos demais) para não piorar a
  // violação pré-existente de rules-of-hooks deste componente (early
  // return condicional de GUID logo abaixo).
  const [isDownloadingDanfe, setIsDownloadingDanfe] = useState(false);

  useEffect(() => {
    if (!isValidGuid(nfeId)) {
      navigate(NFES_LIST_ROUTE, { replace: true });
    }
  }, [nfeId, navigate]);

  if (!isValidGuid(nfeId)) {
    return null;
  }

  const detailQuery = useNfeDetail(nfeId, true);

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && (detailQuery as any).isError;
  const canEdit = can('nfe_edit') && !!item && isNfeEditable(item.estado);

  // TASK-FE-036-561 — substitui `window.print()` (imprimia a página HTML de
  // Detalhe, que NÃO é o DANFE fiscal) pela chamada real do documento:
  // `estado` aprovado/cancelado (já transmitido) baixa o DANFE FINAL;
  // novo/rejeitado (rascunho) baixa o preview — mesmo par preview/final de
  // `NfeEmissionPanel.tsx::handleDownloadDanfe`.
  async function handleDownloadDanfe() {
    if (!item) return;
    setIsDownloadingDanfe(true);
    try {
      const isFinal = item.estado === 'aprovado' || item.estado === 'cancelado';
      const blob = isFinal
        ? await downloadNfeDanfe(item.uuid)
        : await downloadNfeDanfePreview(item.uuid);
      const baseName = item.code ?? item.uuid;
      downloadBlob(blob, `${isFinal ? 'danfe' : 'danfe-preview'}-${baseName}.pdf`);
    } catch {
      toaster.error({ title: text.singularLabel, description: detailText.printError });
    } finally {
      setIsDownloadingDanfe(false);
    }
  }

  if (notFound) {
    return (
      <FormContainer title={text.singularLabel}>
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
              <Button
                title={detailText.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(NFES_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? (item.code ?? text.singularLabel) : text.singularLabel}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0} className="nfe-detail-header-actions">
            <Button
              title={detailText.printButton}
              icon={FiPrinter as ElementType}
              variant="outline"
              size="sm"
              loading={isDownloadingDanfe}
              onClick={handleDownloadDanfe}
            />
            {canEdit && (
              <Button
                title={detailText.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${NFES_LIST_ROUTE}/${nfeId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <style>{'@media print { .nfe-detail-header-actions { display: none !important; } }'}</style>

      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Badge colorPalette={item ? nfeEstadoColor[item.estado] : 'gray'} variant="subtle">
            {item?.estado_label ?? text.singularLabel}
          </Badge>
        </Skeleton>

        {/* Painel de Emissão SEFAZ (TASK-FE-036-511/512, esteira
            036fe-financeiro-fiscal Onda 1) — número/chave/recibo/data de
            envio + ação "Emitir". Cancelar/Corrigir/Consultar/Downloads
            ficam para a próxima onda. */}
        {item && !isLoading && <NfeEmissionPanel nfeDetail={item} />}

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção 1 — Cabeçalho ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {detailText.sections.header}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.list.table.code} value={item?.code ?? noData} />
              {/* Correção pós-auditoria (E-03) — `client`/`provider`/
                  `issuer`/`harvest` agora trazem nome/descrição real. */}
              <InfoField
                label={text.form.fields.client}
                value={item?.client?.name ?? item?.client?.uuid ?? noData}
              />
              <InfoField
                label={text.form.fields.natureza}
                value={item?.nature?.descricao ?? noData}
              />
              <InfoField
                label={text.form.fields.stateRegistrationClient}
                value={item?.state_registration_client ?? noData}
              />
              <InfoField
                label={text.form.fields.provider}
                value={item?.provider?.name ?? item?.provider?.uuid ?? noData}
              />
              <InfoField
                label={text.form.fields.emissor}
                value={
                  item?.issuer?.razao_social ??
                  item?.issuer?.nome_fantasia ??
                  item?.issuer?.uuid ??
                  noData
                }
              />
              <InfoField
                label={text.form.fields.harvest}
                value={item?.harvest?.descricao ?? item?.harvest?.uuid ?? noData}
              />
              {/* NFE-R2-013 — Operação/Finalidade/Data de Criação, rótulo do
                  catálogo (mirror `_nfe_detail.blade.php:12,21,24`). */}
              <InfoField
                label={text.form.fields.tipo}
                value={catalogLabel(nfeTipoOperacaoOptions, item?.tipo, noData)}
              />
              <InfoField
                label={text.form.fields.finnfe}
                value={catalogLabel(nfeFinalidadeOptions, item?.finnfe, noData)}
              />
              <InfoField
                label={detailText.fields.createdAt}
                value={item ? formatDate(item.created_at, 'dd/MM/yyyy HH:mm') : noData}
              />
              {/* NFE-R2-016 — rótulo do catálogo, não código cru. */}
              <InfoField
                label={text.form.fields.typePayment}
                value={catalogLabel(nfeTypePaymentOptions, item?.type_payment, noData)}
              />
              <InfoField
                label={text.form.fields.departureDate}
                value={item?.departure_date ?? noData}
              />
              <InfoField
                label={text.form.fields.deliveryDate}
                value={item?.delivery_date ?? noData}
              />
              <InfoField
                label={text.form.fields.orderNumber}
                value={item?.order_number ?? noData}
              />
              <InfoField label={text.form.fields.refNfe} value={item?.ref_nfe ?? noData} />
              <InfoField label={text.form.fields.note} value={item?.note ?? noData} />
            </SimpleGrid>
          </Box>

          {/* ---- Seção ICMS — NFE-R2-013, condicional (mirror
              `_nfe_detail.blade.php:135-147`, só quando `percent_icms > 0`) ---- */}
          {!!item && (item.percent_icms ?? 0) > 0 && (
            <Box>
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="fg.default"
                mb={4}
                pb={2}
                borderBottom="1px solid"
                borderColor="border.subtle"
              >
                {detailText.sections.icms}
              </Text>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.form.fields.percentIcms}
                  value={item.percent_icms !== null ? String(item.percent_icms) : noData}
                />
                <InfoField
                  label={text.form.fields.icmsBase}
                  value={item.icms_base !== null ? formatCurrencyBRL(item.icms_base) : noData}
                />
              </SimpleGrid>
            </Box>
          )}

          {/* ---- Seção Transporte — NFE-R2-013/014, ausente antes (mirror
              `_nfe_detail.blade.php:149-233`: transportador, guia, frete e
              volumes/pesos). ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {detailText.sections.transport}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.form.fields.transpName} value={item?.transp_name ?? noData} />
              <InfoField label={text.form.fields.transpCnpj} value={item?.transp_cnpj ?? noData} />
              <InfoField
                label={text.form.fields.transpAddress}
                value={item?.transp_address ?? noData}
              />
              <InfoField
                label={text.form.fields.transpCity}
                value={item?.transp_city?.name ?? item?.transp_city?.uuid ?? noData}
              />
              <InfoField label={text.form.fields.gta} value={item?.gta ?? noData} />
              <InfoField
                label={text.form.fields.typeGuide}
                value={catalogLabel(nfeTypeGuideOptions, item?.type_guide, noData)}
              />
              <InfoField label={text.form.fields.ufGuide} value={item?.uf_guide ?? noData} />
              <InfoField
                label={text.form.fields.numberGuide}
                value={item?.number_guide ?? noData}
              />
              <InfoField label={text.form.fields.serieGuide} value={item?.serie_guide ?? noData} />
              <InfoField
                label={text.form.fields.shippingType}
                value={catalogLabel(nfeShippingTypeOptions, item?.shipping_type, noData)}
              />
              <InfoField label={text.form.fields.antt} value={item?.antt ?? noData} />
              <InfoField
                label={text.form.fields.shippingBoardVehicle}
                value={item?.shipping_board_vehicle ?? noData}
              />
              <InfoField
                label={text.form.fields.shippingUfShipping}
                value={item?.shipping_uf_shipping ?? noData}
              />
              <InfoField label={text.form.fields.specie} value={item?.specie ?? noData} />
              <InfoField
                label={text.form.fields.numberVolumes}
                value={
                  item?.number_volumes !== null && item?.number_volumes !== undefined
                    ? String(item.number_volumes)
                    : noData
                }
              />
              <InfoField
                label={text.form.fields.quantityVolumes}
                value={
                  item?.quantity_volumes !== null && item?.quantity_volumes !== undefined
                    ? String(item.quantity_volumes)
                    : noData
                }
              />
              <InfoField
                label={text.form.fields.netWeight}
                value={
                  item?.net_weight !== null && item?.net_weight !== undefined
                    ? String(item.net_weight)
                    : noData
                }
              />
              <InfoField
                label={text.form.fields.grossWeight}
                value={
                  item?.gross_weight !== null && item?.gross_weight !== undefined
                    ? String(item.gross_weight)
                    : noData
                }
              />
            </SimpleGrid>
          </Box>

          {/* ---- Seção 2 — Itens ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {detailText.sections.items}
            </Text>
            {(item?.items ?? []).length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                {detailText.emptyItems}
              </Text>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{text.form.fields.product}</Table.ColumnHeader>
                      {/* NFE-R2-015 — Pacote/Área restauradas; GAP-API
                          NFE-R2-012/016 (`ItemNfeResource` real só devolve
                          `{uuid}`, sem rótulo — mostrado truncado, SEM MOCK). */}
                      <Table.ColumnHeader>{detailText.table.packageField}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.table.area}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.amount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.table.total}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.discount}</Table.ColumnHeader>
                      <Table.ColumnHeader>{text.form.fields.warehouse}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {(item?.items ?? []).map((row) => (
                      <Table.Row key={row.uuid}>
                        <Table.Cell>{row.product?.description ?? noData}</Table.Cell>
                        <Table.Cell>{row.package?.uuid?.slice(0, 8) ?? noData}</Table.Cell>
                        <Table.Cell>{row.area?.uuid?.slice(0, 8) ?? noData}</Table.Cell>
                        <Table.Cell>{formatQuantity(row.quantity)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.amount)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.quantity * row.amount)}</Table.Cell>
                        <Table.Cell>{formatCurrencyBRL(row.discount)}</Table.Cell>
                        <Table.Cell>{row.warehouse?.description ?? noData}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Box>

          {/* ---- Seção 3 — Totais ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {detailText.sections.totals}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.form.totalsFields.totalProducts}
                value={item ? formatCurrencyBRL(item.total_products) : noData}
              />
              <InfoField
                label={text.form.totalsFields.discount}
                value={item ? formatCurrencyBRL(item.discount ?? 0) : noData}
              />
              <InfoField
                label={text.form.totalsFields.shippingValue}
                value={item ? formatCurrencyBRL(item.shipping_value ?? 0) : noData}
              />
              <InfoField
                label={text.form.totalsFields.addedValue}
                value={item ? formatCurrencyBRL(item.added_value ?? 0) : noData}
              />
              <InfoField
                label={text.form.totalsFields.amount}
                value={item ? formatCurrencyBRL(item.amount) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vIbs}
                value={item?.v_ibs != null ? formatCurrencyBRL(item.v_ibs) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vCbs}
                value={item?.v_cbs != null ? formatCurrencyBRL(item.v_cbs) : noData}
              />
              <InfoField
                label={text.form.totalsFields.vIs}
                value={item?.v_is != null ? formatCurrencyBRL(item.v_is) : noData}
              />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
