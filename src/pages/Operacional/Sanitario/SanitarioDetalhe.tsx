// src/pages/Operacional/Sanitario/SanitarioDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura) de Sanitário — `san-screen-show`
// (F-062, TASK-SAN-FE-06, contrato-tela-lane-c-sanitario-frontend.md §6.9).
// Rota `/operacional/sanitario/:uuid` (registro do param/gate `sanitary_view`
// é da TASK-SAN-FE-33 — este arquivo só declara o nome do param esperado,
// mirror `CreateOrUpdateSanitario.tsx`/`AcasalamentoDetalhe.tsx`).
//
// Casca `FormContainer` com `headerActions` = só `Voltar` (SEM badge de
// status — Sanitário não tem máquina de estados, Regra 0 da Tarefa). Molde
// estrutural: `AcasalamentoDetalhe.tsx` (`DisplayFieldGroup` para o bloco de
// identificação + blocos condicionais abaixo, SEM `Tabs`/`ContainerGrid`).
//
// Tela PRÓPRIA do módulo Sanitário desde a primeira linha — título/breadcrumb
// NUNCA herdados de Pesagem (correção de CL-02, Regra 1 da Tarefa). Usa
// `text.singularLabel` ("Sanitário"), nunca um literal ou label de Pesagem.
//
// 3 blocos sempre carregados de uma vez só (`SanitaryResource`, eager-load
// incondicional — contrato-tela §6.9, mirror `mode_matrix`: o legado usa
// abas visuais, mas o dado vem inteiro no `show`, sem lazy-load por aba):
//   1. Produtos — SEMPRE presente, `emptySection` se `items` vier `[]`.
//   2. Animais — SEMPRE presente, `emptySection` se `sanitaryAnimals` vier `[]`.
//   3. Controle de Horas — CONDICIONAL a `time_control===true` (Regra 2 da
//      Tarefa: "não renderizar vazio quando false" — o bloco inteiro, título
//      incluso, só existe no DOM quando `time_control` é `true`; se vier
//      `true` mas `labor` vier `[]` mesmo assim, mostra `emptySection`
//      dentro do bloco, não omite o bloco).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, Table, Text, VStack } from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryById } from '@/hooks/useCustomFormQueryById';
import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import formatWeight from '@/utils/formatWeight';
import { isValidGuid } from '@/utils/guid';

import { queryKey } from '@/constants/query-key';

import { getSanitaryByUuid } from '@/services/v2/Sanitaries/sanitaries-service';

import type { SanitaryDetail, SanitaryLaborFuncTypeValue } from '@/@types/v2/Sanitaries';

const SANITARIO_LIST_ROUTE = '/operacional/sanitario';

const LABOR_TYPE_EMPLOYEE = 1;
const LABOR_TYPE_FUNCTION = 2;
const LABOR_TYPE_PROVIDER = 3;

const noData = '—';

function formatNumber(value: number | string | null | undefined): string {
  const formatted = formatWeight(value, '').trim();
  return formatted === '-' ? noData : formatted;
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

export default function SanitarioDetalhe() {
  const { sanitarioUuid: uuid } = useParams<{ sanitarioUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.sanitary.sanitary;
  const detailText = text.detail;

  const hasValidUuid = isValidGuid(uuid);

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `AcasalamentoDetalhe.tsx`/`ProcessingDetalhe.tsx`/`CreateOrUpdateSanitario.tsx`).
  useEffect(() => {
    if (!hasValidUuid) {
      navigate(SANITARIO_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  // Tela de VISUALIZAÇÃO pura — sem `useForm` (Task 06: "useCustomFormQueryById
  // sem fillForm, só leitura"); `fillForm` é um no-op deliberado (mirror
  // `ProcessingDetalhe.tsx`), a tela lê `.data` direto.
  const sanitarioQuery = useCustomFormQueryById<SanitaryDetail>({
    registrationId: hasValidUuid ? (uuid as string) : '',
    asyncFunction: getSanitaryByUuid,
    fillForm: () => undefined,
    queryKey: queryKey.sanitary.sanitary,
  });

  const isLoading = checkLoadingStatus([sanitarioQuery as any]);
  const item = (sanitarioQuery as any).data as SanitaryDetail | undefined;
  const notFound = !isLoading && (sanitarioQuery as any).isError;

  if (!hasValidUuid) {
    return null;
  }

  const typeLabel = (value: SanitaryLaborFuncTypeValue | null): string => {
    if (value === LABOR_TYPE_EMPLOYEE) return text.form.funcTypeOptions.employee;
    if (value === LABOR_TYPE_FUNCTION) return text.form.funcTypeOptions.function;
    if (value === LABOR_TYPE_PROVIDER) return text.form.funcTypeOptions.provider;
    return noData;
  };

  return (
    <FormContainer
      title={item?.code ?? text.singularLabel}
      headerActions={
        <Button
          title={detailText.backButton}
          icon={FiArrowLeft as ElementType}
          variant="outline"
          size="sm"
          onClick={() => navigate(SANITARIO_LIST_ROUTE)}
        />
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
                    onClick={() => (sanitarioQuery as any).refetch?.()}
                  />
                  <Button
                    title={detailText.backButton}
                    icon={FiArrowLeft as ElementType}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(SANITARIO_LIST_ROUTE)}
                  />
                </Flex>
              </EmptyState.Content>
            </EmptyState.Root>
          </Flex>
        ) : (
          <Flex direction="column" gap={6} mt={2}>
            {/* ---- Identificação — DisplayFieldGroup (Task 06: "Código/Data/Responsável/Lote") ---- */}
            <DisplayFieldGroup
              loading={isLoading}
              displayFields={[
                { label: detailText.fields.code, value: item?.code ?? noData },
                {
                  label: detailText.fields.date,
                  value: item?.date ? formatDate(item.date) : noData,
                },
                { label: detailText.fields.responsible, value: item?.user?.name ?? noData },
                { label: detailText.fields.batch, value: item?.batch?.name ?? noData },
              ]}
            />

            {/* ---- Bloco 1 — Produtos (SEMPRE presente) ---- */}
            <Box>
              <SectionTitle>{detailText.sections.products}</SectionTitle>
              {(item?.items.length ?? 0) === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {detailText.emptySection}
                </Text>
              ) : (
                <Box overflowX="auto">
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>{detailText.fields.product}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.warehouse}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.dose}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.total}</Table.ColumnHeader>
                        <Table.ColumnHeader>{detailText.fields.note}</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {item?.items.map((row) => (
                        <Table.Row key={row.uuid}>
                          <Table.Cell>{row.product?.name ?? noData}</Table.Cell>
                          <Table.Cell>{row.stock?.warehouse?.name ?? noData}</Table.Cell>
                          <Table.Cell>{formatNumber(row.quantity)}</Table.Cell>
                          <Table.Cell>{formatNumber(row.total_quantity)}</Table.Cell>
                          <Table.Cell>{row.note ?? noData}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}
            </Box>

            {/* ---- Bloco 2 — Animais (SEMPRE presente) ---- */}
            <Box>
              <SectionTitle>{detailText.sections.animals}</SectionTitle>
              {(item?.animals.length ?? 0) === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {detailText.emptySection}
                </Text>
              ) : (
                <Flex wrap="wrap" gap={2}>
                  {item?.animals.map((animal) => (
                    <Badge key={animal.uuid} variant="subtle" colorPalette="gray" px={2} py={1}>
                      {animal.identification}
                    </Badge>
                  ))}
                </Flex>
              )}
            </Box>

            {/* ---- Bloco 3 — Controle de Horas — CONDICIONAL a `time_control`
                (Regra 2 da Tarefa: bloco inteiro ausente quando `false`, NUNCA
                renderizado vazio). ---- */}
            {item?.time_control && (
              <Box>
                <SectionTitle>{detailText.sections.labor}</SectionTitle>
                {item.labor.length === 0 ? (
                  <Text fontSize="sm" color="fg.muted">
                    {detailText.emptySection}
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>{detailText.fields.funcType}</Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.fields.executor}</Table.ColumnHeader>
                          <Table.ColumnHeader>{detailText.fields.quantity}</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {item.labor.map((row, index) => (
                          <Table.Row key={`${row.executor_uuid ?? 'labor'}-${index}`}>
                            <Table.Cell>{typeLabel(row.func_type)}</Table.Cell>
                            <Table.Cell>{row.executor?.name ?? noData}</Table.Cell>
                            <Table.Cell>{formatNumber(row.total_quantity)}</Table.Cell>
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
