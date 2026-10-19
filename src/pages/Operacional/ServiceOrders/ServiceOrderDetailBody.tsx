// src/pages/Operacional/ServiceOrders/ServiceOrderDetailBody.tsx
// -----------------------------------------------------------------------------
// Corpo SOMENTE LEITURA da Visualização de Ordem de Serviço (execução 086,
// FE-01) — extraído de `ServiceOrderDetalhe.tsx` para ser testável por fixture
// do contrato `GET /service-orders/{uuid}` (`ServiceOrderDetailResource`).
//
// Execução 086: o Resource passou a devolver `label`/`measurement_name`/
// `warehouse` nos 5 blocos (colunas Nome/Unidade/Armazém), `attachments[]`
// (aba Anexos com links), `category_label` e os campos de cancelamento
// (motivo/data/quem, só com status 9). Nenhum uuid truncado é exibido:
// `label ?? '—'` (FK órfã = `null`, honesto). Datas via `formatDate`.
// -----------------------------------------------------------------------------

import { Box, Flex, Link, SimpleGrid, Table, Tabs, Text } from '@chakra-ui/react';

import { CollapsibleSection } from '@/components/Form/CollapsibleSection';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';

import { columnsForm } from '@/constants/coluns-form';
import { serviceOrderLaborTypeOptions } from '@/constants/serviceOrders/options/service-order-labor-type-options';

import type { ServiceOrderDetail } from '@/@types/v2/ServiceOrders';

const NO_DATA = '—';
const DATE_PATTERN = 'dd/MM/yyyy';
const DATE_TIME_PATTERN = 'dd/MM/yyyy HH:mm';

/**
 * @param {string | null | undefined} value - Data ISO (`yyyy-MM-dd` ou datetime) da API.
 * @param {string} pattern - Padrão `date-fns` de saída.
 * @return {string} Data formatada, ou `—` quando ausente/ inválida.
 */
export function formatServiceOrderDate(
  value: string | null | undefined,
  pattern: string = DATE_PATTERN
): string {
  if (!value) return NO_DATA;
  return formatDate(value, pattern) || NO_DATA;
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
      <Text fontSize="sm" color="fg.default" whiteSpace="pre-wrap">
        {value}
      </Text>
    </Box>
  );
}

function check(value: boolean): string {
  return value ? '✓' : NO_DATA;
}

export interface ServiceOrderDetailBodyProps {
  item: ServiceOrderDetail | undefined;
  isLoading: boolean;
}

export function ServiceOrderDetailBody({ item }: ServiceOrderDetailBodyProps) {
  const { languageGB } = useLanguage();
  const text = languageGB.serviceOrders.serviceOrder;
  const detailText = text.detail;

  const employees = item?.employees ?? [];
  const equipments = item?.equipments ?? [];
  const products = item?.products ?? [];
  const productions = item?.productions ?? [];
  const protections = item?.protections ?? [];
  const attachments = item?.attachments ?? [];

  const isCancelled = item?.status.value === 9 || !!item?.cancellation_reason;

  const empty = (
    <Text fontSize="sm" color="fg.muted" py={4}>
      {detailText.emptySection}
    </Text>
  );

  return (
    <Box px={{ base: 4, md: 10 }} pb={8}>
      <Flex direction="column" gap={4} mt={6}>
        {/* ---- Cancelamento (só com motivo/status 9) ---- */}
        {isCancelled && (
          <CollapsibleSection title={detailText.sections.cancellation}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={detailText.cancellation.reason}
                value={item?.cancellation_reason ?? NO_DATA}
              />
              <InfoField
                label={detailText.cancellation.date}
                value={formatServiceOrderDate(item?.cancellation_date, DATE_TIME_PATTERN)}
              />
              <InfoField
                label={detailText.cancellation.user}
                value={item?.cancellation_user?.name ?? NO_DATA}
              />
            </SimpleGrid>
          </CollapsibleSection>
        )}

        {/* ---- Identificação (D-FRONT-03: seções escalares em accordion) ---- */}
        <CollapsibleSection title={detailText.sections.header}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField label={detailText.fields.code} value={item?.code ?? NO_DATA} />
            <InfoField
              label={detailText.fields.dtEmission}
              value={formatServiceOrderDate(item?.dt_emission)}
            />
            <InfoField
              label={detailText.fields.executionDate}
              value={formatServiceOrderDate(item?.execution_date)}
            />
            <InfoField
              label={detailText.fields.deadline}
              value={formatServiceOrderDate(item?.deadline)}
            />
            <InfoField label={detailText.fields.category} value={item?.category_label ?? NO_DATA} />
            <InfoField label={detailText.fields.area} value={item?.area?.name ?? NO_DATA} />
            <InfoField
              label={detailText.fields.cultivation}
              value={item?.cultivation?.name ?? NO_DATA}
            />
            <InfoField label={detailText.fields.batch} value={item?.batch?.name ?? NO_DATA} />
            <InfoField
              label={detailText.fields.categoryAnimal}
              value={item?.category_animal?.name ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.operation}
              value={item?.operation?.name ?? NO_DATA}
            />
            <InfoField label={detailText.fields.activity} value={item?.activity?.name ?? NO_DATA} />
            <InfoField label={detailText.fields.user} value={item?.user?.name ?? NO_DATA} />
            <InfoField label={detailText.fields.executor} value={item?.executor?.name ?? NO_DATA} />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ---- Condições e Instruções ---- */}
        <CollapsibleSection title={detailText.sections.conditions} defaultOpen={false}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField
              label={detailText.fields.weatherRequirements}
              value={item?.weather_requirements ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.minimumTemperature}
              value={item?.minimum_temperature != null ? String(item.minimum_temperature) : NO_DATA}
            />
            <InfoField
              label={detailText.fields.maximumTemperature}
              value={item?.maximum_temperature != null ? String(item.maximum_temperature) : NO_DATA}
            />
            <InfoField
              label={detailText.fields.allowedWorkingPeriodStart}
              value={item?.allowed_working_period_start ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.allowedWorkingPeriodEnd}
              value={item?.allowed_working_period_end ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.environmentalRestrictions}
              value={item?.environmental_restrictions ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.legalCompliance}
              value={item?.legal_compliance ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.serviceDescription}
              value={item?.service_description ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.expectedResultDescription}
              value={item?.expected_result_description ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.successCriteriaDescription}
              value={item?.success_criteria_description ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.roadmapDescription}
              value={item?.roadmap_description ?? NO_DATA}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ---- Execução (read-only — ciclo de execução é outra FEATURE_ROOT) ---- */}
        <CollapsibleSection title={detailText.sections.execution} defaultOpen={false}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField
              label={detailText.fields.executionStartDate}
              value={formatServiceOrderDate(item?.execution_start_date, DATE_TIME_PATTERN)}
            />
            <InfoField
              label={detailText.fields.executionEndDate}
              value={formatServiceOrderDate(item?.execution_end_date, DATE_TIME_PATTERN)}
            />
            <InfoField
              label={detailText.fields.executionProblems}
              value={item?.execution_problems ?? NO_DATA}
            />
            <InfoField
              label={detailText.fields.correctiveActions}
              value={item?.corrective_actions ?? NO_DATA}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ---- Avaliação (read-only — ciclo de avaliação é outra FEATURE_ROOT) ---- */}
        <CollapsibleSection title={detailText.sections.assessment} defaultOpen={false}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField
              label={detailText.fields.assessmentGrade}
              value={item?.assessment_grade != null ? String(item.assessment_grade) : NO_DATA}
            />
            <InfoField
              label={detailText.fields.ratingDate}
              value={formatServiceOrderDate(item?.rating_date, DATE_TIME_PATTERN)}
            />
            <InfoField label={detailText.fields.feedback} value={item?.feedback ?? NO_DATA} />
            <InfoField
              label={detailText.fields.recommendations}
              value={item?.recommendations ?? NO_DATA}
            />
          </SimpleGrid>
        </CollapsibleSection>

        {/* ---- Blocos de linha (D-FRONT-03: Tabs, paridade com Appropriations) ---- */}
        {/* @ts-ignore - custom variant */}
        <Tabs.Root defaultValue="0" variant={'secondary' as any} mt={2}>
          {/* @ts-ignore */}
          <Tabs.List>
            {/* @ts-ignore */}
            <Tabs.Trigger value="0">{detailText.sections.labor}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="1">{detailText.sections.equipment}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="2">{detailText.sections.products}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="3">{detailText.sections.productions}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="4">{detailText.sections.protections}</Tabs.Trigger>
            {/* @ts-ignore */}
            <Tabs.Trigger value="5">{detailText.sections.attachments}</Tabs.Trigger>
          </Tabs.List>

          {/* ---- Mão de Obra — tipo + nome do executor (execução 086) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="0">
            {employees.length === 0 ? (
              empty
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.labor.type}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.labor.name}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.labor.note}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.labor.isChecked}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {employees.map((row) => (
                      <Table.Row key={row.id}>
                        <Table.Cell>
                          {row.type
                            ? serviceOrderLaborTypeOptions.getLabel(row.type, languageGB)
                            : NO_DATA}
                        </Table.Cell>
                        <Table.Cell>{row.label ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.note ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{check(row.is_checked)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* ---- Equipamentos ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="1">
            {equipments.length === 0 ? (
              empty
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.equipment.equipment}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.equipment.note}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.equipment.isChecked}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {equipments.map((row, index) => (
                      <Table.Row key={`${row.equipment_uuid ?? 'orphan'}-${index}`}>
                        <Table.Cell>{row.label ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.note ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{check(row.is_checked)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* ---- Insumos — produto / armazém / unidade ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="2">
            {products.length === 0 ? (
              empty
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.products.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.products.warehouse}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.products.measurement}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.products.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.products.totalQuantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.products.note}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.products.isChecked}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {products.map((row, index) => (
                      <Table.Row key={`${row.stock_uuid ?? 'orphan'}-${index}`}>
                        <Table.Cell>{row.label ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.warehouse?.label ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.measurement_name ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.total_quantity}</Table.Cell>
                        <Table.Cell>{row.note ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{check(row.is_checked)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* ---- Produção ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="3">
            {productions.length === 0 ? (
              empty
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.productions.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.productions.measurement}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.productions.quantity}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.productions.note}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.productions.isChecked}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {productions.map((row, index) => (
                      <Table.Row key={`${row.product_uuid ?? 'orphan'}-${index}`}>
                        <Table.Cell>{row.label ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.measurement_name ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.quantity}</Table.Cell>
                        <Table.Cell>{row.note ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{check(row.is_checked)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* ---- Proteções/EPIs ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="4">
            {protections.length === 0 ? (
              empty
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.protections.product}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.protections.note}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.protections.isChecked}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {protections.map((row, index) => (
                      <Table.Row key={`${row.product_uuid ?? 'orphan'}-${index}`}>
                        <Table.Cell>{row.label ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{row.note ?? NO_DATA}</Table.Cell>
                        <Table.Cell>{check(row.is_checked)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>

          {/* ---- Anexos — links (execução 086) ---- */}
          {/* @ts-ignore */}
          <Tabs.Content value="5">
            {attachments.length === 0 ? (
              empty
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>{detailText.attachments.name}</Table.ColumnHeader>
                      <Table.ColumnHeader>{detailText.attachments.file}</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {attachments.map((attachment) => (
                      <Table.Row key={attachment.uuid}>
                        <Table.Cell>{attachment.name ?? attachment.filename ?? NO_DATA}</Table.Cell>
                        <Table.Cell>
                          {attachment.url ? (
                            <Link
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              color="brandColorText"
                            >
                              {detailText.attachments.open}
                            </Link>
                          ) : (
                            <Text as="span" color="fg.muted">
                              {detailText.attachments.noFile}
                            </Text>
                          )}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Box>
  );
}
