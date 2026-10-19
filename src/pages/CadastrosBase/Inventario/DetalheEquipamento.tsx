// src/pages/CadastrosBase/Inventario/DetalheEquipamento.tsx
// -----
// Tela de DETALHE (somente leitura) de um EQUIPAMENTO — Cadastros Base / Bens-Ativos.
// TASK-FE-1010, execução 026.
//
// MIRROR visual do padrão `DetalheCentroCusto.tsx` / `EstoqueInicialDetalhe.tsx`.
// Adaptação: Chakra UI + FormContainer. Estrutura: 5 seções agrupadas
// (Identificação, Financeiro/Depreciação, Fiscal/Veículo, Rateio, Anexos).
//
// Campos exibidos: fidelidade ao legado `show.blade.php` (view lida na Doc Bruta).
// Exibir o que o legado exibe — não inventar campo novo.
//
// Permissão exigida: `equipments_view` (gate de lista, MESMO do detalhe).
// Rota própria: `/cadastros-base/inventario/:equipmentId/detalhe` (wiring em TASK-FE-1011).
// -----

import { ElementType, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  Link,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import {
  equipmentBodyTypeOptions,
  equipmentOwnerTpOptions,
  equipmentVehicleTypeOptions,
  equipmentWheelTypeOptions,
} from '@/constants/cadastrosBase/equipment/equipment-fiscal-catalogs';
import { columnsForm } from '@/constants/coluns-form';

import type { EquipmentData } from '@/@types/v2/Equipments';

import { useEquipmentForm } from './useEquipments';

const EQUIPAMENTOS_LIST_ROUTE = '/cadastros-base/inventario';

// Campo de leitura (label + valor) — mirror `DetalheCentroCusto.tsx`
function InfoField({
  label,
  value,
  fallback = '—',
}: {
  label: string;
  value: string | undefined;
  fallback?: string;
}) {
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
        {value ?? fallback}
      </Text>
    </Box>
  );
}

// Painel agrupado com borda/rótulo — mirror `DetalheCentroCusto.tsx`
function DetailPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box bg="bg.muted" border="1px solid" borderColor="border.subtle" borderRadius="lg" p={4}>
      <Text
        fontSize="xs"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
        pb={2}
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

// Formatação de moeda BRL
function formatCurrencyBRL(value: number | null | undefined): string {
  if (!value) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formatação de percentual
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(2)}%`;
}

// No-op para o hook (esta tela não tem useForm/RHF)
function noop() {}

export default function DetalheEquipamento() {
  const { equipmentId } = useParams<{ equipmentId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can, hasFarm } = usePermissions();

  const text = languageGB.equipments.equipment;
  const noData = text.detail.noData;

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  useEffect(() => {
    if (!isValidGuid(equipmentId)) {
      navigate(EQUIPAMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [equipmentId, navigate]);

  if (!isValidGuid(equipmentId)) {
    return null;
  }

  const equipmentQuery = useEquipmentForm({
    registrationId: equipmentId,
    fillForm: noop,
    enabled: hasFarm,
  });

  const isLoading = checkLoadingStatus([equipmentQuery as any]);
  const equipment = equipmentQuery.data as EquipmentData | undefined;
  const notFound = !isLoading && (equipmentQuery as any).isError;
  const canEdit = can('equipments_edit');

  // Estado: 404 (registro não encontrado)
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
                <EmptyState.Title>{text.detail.notFound.title}</EmptyState.Title>
                <EmptyState.Description>{text.detail.notFound.description}</EmptyState.Description>
              </VStack>
              <Button
                title={text.detail.notFound.back}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                onClick={() => navigate(EQUIPAMENTOS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const yesLabel = languageGB.defaltStrings.yes;
  const noLabel = languageGB.defaltStrings.no;

  // Mapeamento de enums fiscal
  const ownerTypeLabel =
    equipment?.owner_type === 'f'
      ? text.form.fields.ownerTypePhysical
      : equipment?.owner_type === 'j'
        ? text.form.fields.ownerTypeLegal
        : '—';

  const equipmentTypeLabel =
    equipment?.equipment_type === 'P'
      ? text.form.fields.equipmentTypeOwn
      : equipment?.equipment_type === 'T'
        ? text.form.fields.equipmentTypeOutsourced
        : '—';

  const depreciationTypeLabel =
    equipment?.depreciation_type === 1
      ? text.form.fields.depreciationTypeWithResidual
      : text.form.fields.depreciationTypeWithoutResidual;

  return (
    <FormContainer
      title={equipment?.description ?? text.singularLabel}
      headerActions={
        equipment && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge
              colorPalette={equipment.status === 1 ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {equipment.status_label ?? noData}
            </Badge>
            <Badge colorPalette={equipment.is_enabled ? 'green' : 'gray'} variant="subtle">
              {equipment.is_enabled ? text.list.table.statusActive : text.list.table.statusInactive}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                onClick={() => navigate(`${EQUIPAMENTOS_LIST_ROUTE}/${equipmentId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            {/* Imagem (se existir) — acima dos painéis */}
            {equipment?.image_url && (
              <Box
                borderRadius="lg"
                overflow="hidden"
                maxW="300px"
                border="1px solid"
                borderColor="border.subtle"
              >
                <img
                  src={equipment.image_url}
                  alt={equipment.description}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
            )}

            {/* Subtítulo — código, fiel ao legado */}
            <Text fontSize="sm" color="fg.muted">
              {equipment?.code ?? noData}
            </Text>

            {/* SEÇÃO 1: Identificação */}
            <DetailPanel title={text.detail.sections.identification}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.form.fields.code} value={equipment?.code ?? noData} />
                <InfoField
                  label={text.form.fields.family}
                  value={equipment?.family?.description ?? noData}
                />
                <InfoField
                  label={text.form.fields.product}
                  value={equipment?.product?.description ?? noData}
                />
                <InfoField
                  label={text.form.fields.status}
                  value={equipment?.status_label ?? noData}
                />
                <InfoField label={text.form.fields.equipmentType} value={equipmentTypeLabel} />
                <InfoField
                  label={text.form.fields.description}
                  value={equipment?.description ?? noData}
                />
              </SimpleGrid>

              {/* Features (multiselect) — se houver */}
              {equipment?.features && equipment.features.length > 0 && (
                <Box mt={6} pt={6} borderTop="1px solid" borderColor="border.subtle">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={3}
                  >
                    {text.form.fields.features}
                  </Text>
                  <Flex wrap="wrap" gap={2}>
                    {equipment.features.map((feature) => {
                      const featureLabel =
                        feature === 'AB'
                          ? text.form.fields.featureFuelSupply
                          : feature === 'MA'
                            ? text.form.fields.featureMaintenance
                            : feature === 'BA'
                              ? text.form.fields.featureBatch
                              : feature === 'AP'
                                ? text.form.fields.featureAppropriation
                                : feature;
                      return (
                        <Badge key={feature} colorPalette="gray" variant="subtle">
                          {featureLabel}
                        </Badge>
                      );
                    })}
                  </Flex>
                </Box>
              )}

              <Box mt={6} pt={6} borderTop="1px solid" borderColor="border.subtle">
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  <InfoField
                    label={text.form.fields.specification}
                    value={equipment?.specification ?? noData}
                  />
                  <InfoField label={text.form.fields.model} value={equipment?.model ?? noData} />
                  <InfoField
                    label={text.form.fields.patrimony}
                    value={equipment?.patrimony ?? noData}
                  />
                  <Box /> {/* Spacer */}
                </SimpleGrid>
              </Box>
            </DetailPanel>

            {/* SEÇÃO 2: Financeiro/Depreciação */}
            <DetailPanel title={text.detail.sections.financialDepreciation}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.form.fields.vlTimeProductive}
                  value={formatCurrencyBRL(equipment?.vl_time_productive)}
                />
                <InfoField
                  label={text.form.fields.vlAcquisition}
                  value={formatCurrencyBRL(equipment?.vl_acquisition)}
                />
                <InfoField
                  label={text.form.fields.dtAcquisition}
                  value={
                    equipment?.dt_acquisition
                      ? formatDate(new Date(equipment.dt_acquisition))
                      : noData
                  }
                />
                <InfoField
                  label={text.form.fields.provider}
                  value={equipment?.provider?.label ?? noData}
                />
                <InfoField
                  label={text.form.fields.hourMeter}
                  value={
                    equipment?.hour_meter !== null && equipment?.hour_meter !== undefined
                      ? equipment.hour_meter.toString()
                      : noData
                  }
                />
                <InfoField label={text.form.fields.yearMod} value={equipment?.year_mod ?? noData} />
                <InfoField
                  label={text.filter.proprietary}
                  value={equipment?.proprietary?.label}
                  fallback={noData}
                />
                <Box /> {/* Spacer */}
              </SimpleGrid>

              {/* Bloco de Depreciação (se houver) */}
              {equipment?.has_depreciation && (
                <Box mt={6} pt={6} borderTop="1px solid" borderColor="border.subtle">
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={4}
                  >
                    {text.detail.sections.depreciationData}
                  </Text>
                  <SimpleGrid columns={columnsForm.default} gap={6}>
                    <InfoField
                      label={text.form.fields.hasDepreciation}
                      value={equipment?.has_depreciation ? yesLabel : noLabel}
                    />
                    <InfoField
                      label={text.form.fields.lifeBens}
                      value={
                        equipment?.life_bens !== null && equipment?.life_bens !== undefined
                          ? `${equipment.life_bens.toString()} anos`
                          : noData
                      }
                    />
                    <InfoField
                      label={text.form.fields.depreciationType}
                      value={depreciationTypeLabel}
                    />
                    <InfoField
                      label={text.form.fields.depreciation}
                      value={formatPercent(equipment?.depreciation)}
                    />
                    <InfoField
                      label={text.form.fields.residual}
                      value={formatPercent(equipment?.residual)}
                    />
                    <InfoField
                      label={text.form.fields.vlResidual}
                      value={formatCurrencyBRL(equipment?.vl_residual)}
                    />
                    <InfoField
                      label={text.form.fields.vlDepreciate}
                      value={formatCurrencyBRL(equipment?.vl_depreciate)}
                    />
                    <InfoField
                      label="Valor Depreciado"
                      value={formatCurrencyBRL(equipment?.vl_depreciated)}
                    />
                    <InfoField
                      label="Saldo a Depreciar"
                      value={formatCurrencyBRL(equipment?.sd_depreciate)}
                    />
                    <Box /> {/* Spacer */}
                  </SimpleGrid>
                </Box>
              )}
            </DetailPanel>

            {/* SEÇÃO 3: Fiscal/Veículo (se use_fiscal) */}
            {equipment?.use_fiscal && (
              <DetailPanel title={text.detail.sections.fiscalVehicle}>
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  <InfoField label={text.form.fields.brand} value={equipment?.brand ?? noData} />
                  <InfoField label={text.form.fields.chassi} value={equipment?.chassi ?? noData} />
                  <InfoField
                    label={text.form.fields.renavam}
                    value={equipment?.renavam ?? noData}
                  />
                  <InfoField label={text.form.fields.serie} value={equipment?.serie ?? noData} />
                  <InfoField label={text.form.fields.plate} value={equipment?.plate ?? noData} />
                  <InfoField label={text.form.fields.color} value={equipment?.color ?? noData} />
                  <InfoField label={text.form.fields.uf} value={equipment?.uf ?? noData} />
                  <InfoField label={text.form.fields.rntrc} value={equipment?.rntrc ?? noData} />
                  <InfoField
                    label={text.form.fields.type}
                    value={
                      equipment?.type
                        ? equipmentVehicleTypeOptions.getLabel(equipment.type as any, languageGB)
                        : undefined
                    }
                    fallback={noData}
                  />
                  <InfoField
                    label={text.form.fields.bodyType}
                    value={
                      equipment?.body_type
                        ? equipmentBodyTypeOptions.getLabel(equipment.body_type as any, languageGB)
                        : undefined
                    }
                    fallback={noData}
                  />
                  <InfoField
                    label={text.form.fields.wheelType}
                    value={
                      equipment?.wheel_type
                        ? equipmentWheelTypeOptions.getLabel(
                            equipment.wheel_type as any,
                            languageGB
                          )
                        : undefined
                    }
                    fallback={noData}
                  />
                  <InfoField
                    label={text.form.fields.tara}
                    value={formatCurrencyBRL(equipment?.tara)}
                  />
                  <InfoField
                    label={text.form.fields.capacity}
                    value={formatCurrencyBRL(equipment?.capacity)}
                  />
                  <InfoField label={text.form.fields.ownerType} value={ownerTypeLabel} />
                  <InfoField
                    label={text.form.fields.ownerDocument}
                    value={equipment?.owner_document ?? noData}
                  />
                  <InfoField
                    label={text.form.fields.ownerName}
                    value={equipment?.owner_name ?? noData}
                  />
                  <InfoField
                    label={text.form.fields.ownerIe}
                    value={equipment?.owner_ie ?? noData}
                  />
                  <InfoField
                    label={text.form.fields.ownerUf}
                    value={equipment?.owner_uf ?? noData}
                  />
                  <InfoField
                    label={text.form.fields.ownerTp}
                    value={
                      equipment?.owner_tp !== null && equipment?.owner_tp !== undefined
                        ? equipmentOwnerTpOptions.getLabel(equipment.owner_tp, languageGB)
                        : undefined
                    }
                    fallback={noData}
                  />
                </SimpleGrid>
              </DetailPanel>
            )}

            {/* SEÇÃO 4: Rateio Centro de Custo (se houver) */}
            {equipment?.cost_centers && equipment.cost_centers.length > 0 && (
              <DetailPanel title={text.detail.sections.costCenterApportionment}>
                <Flex direction="column" gap={4}>
                  <Table.Root size="sm" variant="outline" striped>
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>{text.form.fields.code}</Table.ColumnHeader>
                        <Table.ColumnHeader>Centro de Custo</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="right">
                          {text.form.fields.percentage}
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {equipment.cost_centers.map((costCenter) => (
                        <Table.Row key={costCenter.uuid}>
                          <Table.Cell>{costCenter.code}</Table.Cell>
                          <Table.Cell>{costCenter.description}</Table.Cell>
                          <Table.Cell textAlign="right">
                            {formatPercent(costCenter.percentage)}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                      <Table.Row fontWeight="bold">
                        <Table.Cell colSpan={2} textAlign="right">
                          {text.detail.apportionment.total}
                        </Table.Cell>
                        <Table.Cell textAlign="right">
                          {formatPercent(
                            equipment.cost_centers.reduce(
                              (sum, cc) => sum + (cc.percentage || 0),
                              0
                            )
                          )}
                        </Table.Cell>
                      </Table.Row>
                    </Table.Body>
                  </Table.Root>
                </Flex>
              </DetailPanel>
            )}

            {/* SEÇÃO 5: Anexos (se houver) */}
            {equipment?.attachments && equipment.attachments.length > 0 && (
              <DetailPanel title={text.detail.sections.attachments}>
                <VStack align="stretch" gap={3}>
                  {equipment.attachments.map((attachment) => (
                    <Flex
                      key={attachment.uuid}
                      justify="space-between"
                      align="center"
                      gap={3}
                      p={3}
                      bg="bg.default"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="border.subtle"
                    >
                      <VStack align="start" gap={1} flex={1} minW={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {attachment.name || text.form.attachmentRow.defaultName}
                        </Text>
                        {attachment.file_url ? (
                          <Link
                            href={attachment.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            fontSize="sm"
                            color="blue.500"
                            _hover={{ textDecoration: 'underline' }}
                          >
                            {text.detail.attachments.download}
                          </Link>
                        ) : (
                          <Text fontSize="xs" color="fg.muted">
                            {text.detail.attachments.unavailable}
                          </Text>
                        )}
                      </VStack>
                    </Flex>
                  ))}
                </VStack>
              </DetailPanel>
            )}
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
