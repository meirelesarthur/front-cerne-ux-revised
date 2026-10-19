// src/pages/BaseRegistrations/LowReasons/LowReasonDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura, cards) de um MOTIVO DE BAIXA
// (LowReason) — Cadastros Base / Financeiros. TELA NOVA — lote 01/EST-085,
// passada 2. Rota própria `/cadastros-base/motivos-de-baixa/:lowReasonId/detalhe`
// (registrada em `router/index.tsx`), guardada por `lowreasons_view`.
//
// Molde estrutural: `BaseRegistrations/Troughs/TroughDetalhe.tsx` (mesmo
// racional — rota PRÓPRIA, não um modo `readOnly` de
// `CreateOrUpdateLowReasons.tsx`; `FormContainer` com `headerActions`
// [badges + botão Editar]; sub-componentes locais `InfoField`/`DetailPanel`).
// LowReason é catálogo FLAT (sem hierarquia, sem localização composta) —
// por isso um único painel "Dados Gerais" com os 3 campos editáveis
// (description/do_movement/is_enabled) + `code` só-leitura.
//
// Dados: `useCustomFormQueryByGuid` (mesmo hook consumido por
// `CreateOrUpdateLowReasons.tsx`, INALTERADO) — `GET /low-reasons/{uuid}`
// via `getLowReason`. `fillForm` é um no-op proposital: esta tela não tem
// `useForm`/RHF nenhum, só lê `lowReasonQuery.data` diretamente.
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useCustomFormQueryByGuid } from '@/hooks/useCustomFormQueryByGuid';
import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getLowReason } from '@/services/v2/BaseRegistrations/lowReasons-service';

import type { LowReasonData } from '@/@types/v2/BaseRegistrations/lowReasons';

const LOW_REASONS_LIST_ROUTE = '/cadastros-base/motivos-de-baixa';

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `TroughDetalhe.tsx`/`DetalheCentroCusto.tsx` (tokens Chakra no lugar de
// `style={}` da Referência UX do design system `cerne`).
function InfoField({ label, value }: { label: string; value: ReactNode }) {
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

// Painel agrupado com borda/rótulo — mesma linguagem visual de
// `TroughDetalhe.tsx`/`DetalheCentroCusto.tsx`, reaproveitada aqui em modo
// leitura, sem componente novo.
function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
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

// Tela de leitura — sem `useForm`/RHF. `useCustomFormQueryByGuid` exige
// `fillForm` no seu contrato (hook compartilhado com o formulário,
// INALTERADO aqui); o dado real é lido direto de `lowReasonQuery.data`
// abaixo.
function noop() {}

export default function LowReasonDetalhe() {
  const { lowReasonId } = useParams<{ lowReasonId: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.lowReason;

  const canEdit = can('lowreasons_edit');

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `TroughDetalhe.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(lowReasonId)) {
      navigate(LOW_REASONS_LIST_ROUTE, { replace: true });
    }
  }, [lowReasonId, navigate]);

  const lowReasonQuery = useCustomFormQueryByGuid<LowReasonData>({
    registrationId: lowReasonId,
    queryKey: queryKey.baseRegistrations.lowReason,
    asyncFunction: getLowReason,
    fillForm: noop,
  });

  if (!isValidGuid(lowReasonId)) {
    return null;
  }

  const isLoading = checkLoadingStatus([lowReasonQuery as any]);
  const lowReason = (lowReasonQuery as any)?.data as LowReasonData | undefined;
  const notFound = !isLoading && (lowReasonQuery as any).isError;

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
                size="sm"
                onClick={() => navigate(LOW_REASONS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={lowReason?.description ?? text.singularLabel}
      headerActions={
        lowReason && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge colorPalette={lowReason.do_movement ? 'info' : 'gray'} variant="subtle">
              {lowReason.do_movement ? text.list.table.doMovementYes : text.list.table.doMovementNo}
            </Badge>
            <Badge
              colorPalette={lowReason.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {lowReason.is_enabled ? text.list.table.active : text.list.table.inactive}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${LOW_REASONS_LIST_ROUTE}/${lowReasonId}`)}
              />
            )}
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <Text fontSize="sm" color="fg.muted">
              {lowReason?.code ?? '—'}
            </Text>

            <DetailPanel title={text.detail.sections.generalData}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.code} value={lowReason?.code ?? '—'} />
                <InfoField
                  label={text.detail.fields.description}
                  value={lowReason?.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.doMovement}
                  value={
                    lowReason
                      ? lowReason.do_movement
                        ? text.list.table.doMovementYes
                        : text.list.table.doMovementNo
                      : '—'
                  }
                />
                <InfoField
                  label={text.detail.fields.isEnabled}
                  value={
                    lowReason
                      ? lowReason.is_enabled
                        ? text.list.table.active
                        : text.list.table.inactive
                      : '—'
                  }
                />
              </SimpleGrid>
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
