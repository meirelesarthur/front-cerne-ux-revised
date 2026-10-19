// src/pages/Operacional/Processamentos/ProcessingDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (read-only) de Processamento — TASK-FE-039-PROC-02,
// enriquecida no round-6 (97-Esteiras/039, round6-fix-plan.md, TASK-FE-039-R6-05).
// Rota: /operacional/processamentos/:uuid, gate `processing_view`.
//
// Mirror `Operacional/Nascimentos/BirthAnimalDetalhe.tsx` (tela DEDICADA
// read-only — a API não tem `update()`, front-plan-proc.md §1.1) e
// `Operacional/VendaAnimais/MovementSaleDetalhe.tsx` (botão "Finalizar" no
// footer, gate `processing_create` + `status===PENDING`, mirror `canFinish`).
//
// FD4 (front-plan-proc.md §3.3/§7, REVISTO round-6) — `batch_id` (topo) e
// `animals_snapshot[]` continuam IDS INTERNOS OPACOS, NUNCA renderizados. A
// tabela por-animal do finalizado usa `item.animals[]` (round-6,
// display-ready), NÃO o snapshot cru.
//
// Seções 2-5 (Animais/Pesagem/Ultrassom/Sanitário) só aparecem em
// `FINISHED` — em `PENDING` a API devolve `animals: []`, `weighing: null`,
// `ultrasounds: []`, `sanitary: null`, a tela fica idêntica à de antes do
// round-6 (round6-fix-plan.md §3.4.4).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { ModalAction } from '@/components/ModalAction';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatCurrencyBRL from '@/utils/formatCurrencyBRL';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import {
  processingStatus,
  processingStatusColor,
} from '@/constants/processamentos/processing/processing-status';
import { queryKey } from '@/constants/query-key';

import {
  cancelProcessing,
  getProcessingByUuid,
} from '@/services/v2/Processamentos/processing-service';

import type { ProcessingDetail } from '@/@types/v2/Processamentos/processing';

import { ProcessingDetailAnimalsTable } from './ProcessingDetailAnimalsTable';
import { ProcessingDetailSanitaryBlock } from './ProcessingDetailSanitaryBlock';
import { ProcessingDetailUltrasoundTable } from './ProcessingDetailUltrasoundTable';

const PROCESSAMENTOS_LIST_ROUTE = '/operacional/processamentos';

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

export default function ProcessingDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.processamentos.processing;
  const detailText = text.detail;
  const noData = '—';

  // Guard de UUID malformado ANTES de qualquer chamada (mirror
  // `BirthAnimalDetalhe.tsx`/`MovementSaleDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(PROCESSAMENTOS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const processingQuery = useCustomFormQueryByGuid<ProcessingDetail>({
    registrationId: isValidGuid(uuid) ? uuid : undefined,
    asyncFunction: getProcessingByUuid,
    // Tela de VISUALIZAÇÃO pura — sem `useForm` (mirror `useBirthAnimalDetail`);
    // `fillForm` é um no-op deliberado, a tela lê `.data` direto.
    fillForm: () => undefined,
    queryKey: queryKey.processamentos.processing,
  });

  const isLoading = checkLoadingStatus([processingQuery as any]);
  const item = (processingQuery as any).data as ProcessingDetail | undefined;
  const notFound = !isLoading && (processingQuery as any).isError;

  if (!isValidGuid(uuid)) {
    return null;
  }

  const canFinish = can('processing_create') && item?.status === processingStatus.pending;
  const canCancel = can('processing_delete') && item?.status === processingStatus.finished;

  const { open: isCancelOpen, onOpen: onOpenCancel, onClose: onCloseCancel } = useDisclosure();

  // PROC-05 — wrapper nomeado (Lei 3): fecha sobre `uuid` da rota, sem
  // navegar após o sucesso (a mesma tela agora mostra `PENDING`, o botão
  // "Finalizar" reaparece).
  async function tryCancelProcessing() {
    return cancelProcessing(uuid!);
  }

  const cancelMutation = useRequest<ProcessingDetail>({
    asyncFunction: tryCancelProcessing,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: text.list.cancelToast,
    queryKey: queryKey.processamentos.processings,
    queryKey2: queryKey.processamentos.processing,
    actionSuccess: () => undefined,
  });

  function handleCancelProcessing() {
    cancelMutation.mutate(undefined);
  }

  if (notFound) {
    return (
      <FormContainer title={detailText.notFound.title}>
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
                variant="outline"
                size="sm"
                onClick={() => navigate(PROCESSAMENTOS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item ? detailText.pageTitleTemplate.replace('{code}', item.code) : text.singularLabel}
      footer={
        <>
          <Button
            title={detailText.backButton}
            variant="outline"
            type="button"
            onClick={() => navigate(-1)}
          />
          {canFinish && (
            <Button
              title={text.list.actions.finish}
              icon={FiCheckCircle as ElementType}
              type="button"
              onClick={() => navigate(`${PROCESSAMENTOS_LIST_ROUTE}/${uuid}/finalizar`)}
            />
          )}
          {canCancel && (
            <Button
              title={text.list.actions.cancel}
              icon={FiXCircle as ElementType}
              variant="outline_danger"
              type="button"
              onClick={onOpenCancel}
            />
          )}
        </>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Flex direction="column" gap={6} mt={2}>
          {/* ---- Seção 1 — Cabeçalho ---- */}
          <Box>
            <SectionTitle>{detailText.sections.header}</SectionTitle>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={detailText.fields.code} value={item ? item.code : noData} />
              <InfoField
                label={detailText.fields.date}
                value={item ? formatDate(item.date) : noData}
              />
              <InfoField label={detailText.fields.type} value={item?.type_label ?? noData} />
              <InfoField
                label={detailText.fields.quantity}
                value={item ? String(item.quantity) : noData}
              />
              <InfoField label={detailText.fields.farm} value={item?.farm?.description ?? noData} />
              <Box>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="wide"
                  mb={1}
                >
                  {detailText.fields.status}
                </Text>
                {item ? (
                  <Badge
                    colorPalette={processingStatusColor[item.status] ?? 'gray'}
                    variant="subtle"
                  >
                    {item.status_label}
                  </Badge>
                ) : (
                  <Text fontSize="sm">{noData}</Text>
                )}
              </Box>
              {/* Só quando FINISHED (front-plan-proc.md §3.3) — `is_stock`/
                  `arroba_value` só fazem sentido pós-finalização. */}
              {item?.status === processingStatus.finished && (
                <>
                  <InfoField
                    label={detailText.fields.isStock}
                    value={
                      item.is_stock ? languageGB.defaltStrings.yes : languageGB.defaltStrings.no
                    }
                  />
                  {item.is_stock && (
                    <InfoField
                      label={detailText.fields.arrobaValue}
                      value={
                        item.arroba_value != null ? formatCurrencyBRL(item.arroba_value) : noData
                      }
                    />
                  )}
                </>
              )}
            </SimpleGrid>
          </Box>

          {/* ---- Seções 2-5 — só em FINALIZADO (round-6, round6-fix-plan.md §3.4) ---- */}
          {item?.status === processingStatus.finished && (
            <>
              {/* ---- Seção 2 — Animais ---- */}
              <Box>
                <SectionTitle>{detailText.sections.animals}</SectionTitle>
                <Skeleton loading={isLoading}>
                  <ProcessingDetailAnimalsTable
                    detail={item ?? null}
                    languageGB={languageGB}
                    isLoading={isLoading}
                  />
                </Skeleton>
              </Box>

              {/* ---- Seção 3 — Pesagem ---- */}
              {item.weighing && (
                <Box>
                  <SectionTitle>{detailText.sections.weighing}</SectionTitle>
                  <Skeleton loading={isLoading}>
                    <SimpleGrid columns={columnsForm.default} gap={6}>
                      <InfoField
                        label={detailText.weighingFields.date}
                        value={formatDate(item.weighing.date)}
                      />
                      <InfoField
                        label={detailText.weighingFields.isStock}
                        value={
                          item.weighing.is_stock
                            ? languageGB.defaltStrings.yes
                            : languageGB.defaltStrings.no
                        }
                      />
                      <InfoField
                        label={detailText.weighingFields.arrobaValue}
                        value={formatCurrencyBRL(item.weighing.arroba_value)}
                      />
                    </SimpleGrid>
                  </Skeleton>
                </Box>
              )}

              {/* ---- Seção 4 — Ultrassom ---- */}
              {item.ultrasounds.length > 0 && (
                <Box>
                  <SectionTitle>{detailText.sections.ultrasound}</SectionTitle>
                  <Skeleton loading={isLoading}>
                    <ProcessingDetailUltrasoundTable
                      detail={item ?? null}
                      languageGB={languageGB}
                      isLoading={isLoading}
                    />
                  </Skeleton>
                </Box>
              )}

              {/* ---- Seção 5 — Sanitário ---- */}
              {item.sanitary && (
                <Box>
                  <SectionTitle>{detailText.sections.sanitary}</SectionTitle>
                  <Skeleton loading={isLoading}>
                    <ProcessingDetailSanitaryBlock detail={item ?? null} languageGB={languageGB} />
                  </Skeleton>
                </Box>
              )}
            </>
          )}
        </Flex>
      </Box>

      {/* PROC-05 — Cancelar (`FINISHED`→`PENDING`), texto NÃO promete reversão de categoria/raça/peso (RW-D). */}
      <ModalAction
        isOpen={isCancelOpen}
        onClose={onCloseCancel}
        asyncFunction={handleCancelProcessing}
        clearData={() => undefined}
        languageGB={languageGB}
        header={text.cancelModal.title}
        body={text.cancelModal.body}
      />
    </FormContainer>
  );
}
