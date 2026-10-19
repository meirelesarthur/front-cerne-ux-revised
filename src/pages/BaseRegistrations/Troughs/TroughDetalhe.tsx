// src/pages/BaseRegistrations/Troughs/TroughDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura, cards) de um COCHO (Trough) —
// Cadastros Base / Pecuários. TELA NOVA — não existe equivalente no legado
// (pedido explícito do dono, contrato de API §1.1/§1.2 item 3). Rota própria
// `/cadastros-base/cochos/:uuid/detalhe`, já registrada em `router/index.tsx`
// (TASK-FE-2204, chokepoint de fundação), guardada por `troughs_view`.
//
// Molde estrutural: `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx`
// (mirror instruído pelo contrato de tela §5) — rota PRÓPRIA (não um modo
// `readOnly` de `CreateOrUpdateTrough.tsx`), `FormContainer` com
// `headerActions` (badges + botão Editar) e sub-componentes locais
// `InfoField`/`DetailPanel` (label+valor / painel com borda+rótulo) — sem
// `DetailGrid` novo.
//
// Dados: `useTroughForm` (`useTroughs.tsx`, JÁ EXISTE — hook INALTERADO, só
// consumido em modo leitura) — `GET /troughs/{uuid}` via `getTroughByUuid`.
// `fillForm` é um no-op proposital: esta tela não tem `useForm`/RHF nenhum,
// só lê `troughQuery.data` diretamente (mesmo contrato de hook, uso
// divergente do formulário — o hook não foi tocado).
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

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { troughTypeOptions } from '@/constants/Trough/options/trough-type-options';

import type { TroughData } from '@/@types/v2/BaseRegistrations/troughs';

import { useTroughForm } from './useTroughs';

const TROUGHS_LIST_ROUTE = '/cadastros-base/cochos';

// Campo de leitura (label + valor) — mesma adaptação já usada em
// `DetalheCentroCusto.tsx` (tokens Chakra no lugar de `style={}` da
// Referência UX do design system `cerne`).
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
// `DetalheCentroCusto.tsx`, reaproveitada aqui em modo leitura, sem
// componente novo.
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

// Tela de leitura — sem `useForm`/RHF. `useTroughForm` exige `fillForm` no
// seu contrato (hook compartilhado com o formulário, INALTERADO aqui); o
// dado real é lido direto de `troughQuery.data` abaixo.
function noop() {}

export default function TroughDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.trough;

  const canEdit = can('troughs_edit');

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mesmo racional de `DetalheCentroCusto.tsx`):
  // redireciona para a listagem antes de montar qualquer coisa.
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(TROUGHS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const troughQuery = useTroughForm({ registrationId: uuid, fillForm: noop });

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([troughQuery as any]);
  const trough = (troughQuery as any)?.data as TroughData | undefined;
  const notFound = !isLoading && (troughQuery as any).isError;

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
                onClick={() => navigate(TROUGHS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  // Painel "Localização" — Área OU Módulo Pastejo (o que estiver
  // preenchido, regra XOR) + Curral (se vinculado, independente dos 2).
  // Todos vazios é ESTADO VÁLIDO (contrato de tela §5), não erro.
  const locationEntries: Array<{ label: string; value: string }> = [];
  if (trough?.area) {
    locationEntries.push({ label: text.detail.fields.area, value: trough.area.description });
  }
  if (trough?.grazing) {
    locationEntries.push({ label: text.detail.fields.grazing, value: trough.grazing.description });
  }
  if (trough?.feedlot_corral) {
    locationEntries.push({
      label: text.detail.fields.feedlotCorral,
      value: trough.feedlot_corral.name
        ? `${trough.feedlot_corral.identification} — ${trough.feedlot_corral.name}`
        : trough.feedlot_corral.identification,
    });
  }
  const hasLocation = locationEntries.length > 0;

  return (
    <FormContainer
      title={trough?.description ?? text.singularLabel}
      headerActions={
        trough && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Badge colorPalette={trough.type === 'A' ? 'blue' : 'gray'} variant="subtle">
              {troughTypeOptions.getLabel(trough.type, languageGB)}
            </Badge>
            <Badge
              colorPalette={trough.is_enabled ? 'green' : 'gray'}
              variant="subtle"
              py={1}
              px={3}
            >
              {trough.is_enabled ? text.list.table.active : text.list.table.inactive}
            </Badge>
            {canEdit && (
              <Button
                title={text.detail.actions.edit}
                icon={FiEdit as ElementType}
                size="sm"
                onClick={() => navigate(`${TROUGHS_LIST_ROUTE}/${uuid}`)}
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
              {trough?.code ?? '—'}
            </Text>

            <DetailPanel title={text.detail.sections.generalData}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.code} value={trough?.code ?? '—'} />
                <InfoField
                  label={text.detail.fields.type}
                  value={trough ? troughTypeOptions.getLabel(trough.type, languageGB) : '—'}
                />
                <InfoField
                  label={text.detail.fields.description}
                  value={trough?.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.totalArea}
                  value={trough ? String(trough.total_area) : '—'}
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.location}>
              {hasLocation ? (
                <SimpleGrid columns={columnsForm.default} gap={6}>
                  {locationEntries.map((entry) => (
                    <InfoField key={entry.label} label={entry.label} value={entry.value} />
                  ))}
                </SimpleGrid>
              ) : (
                <Text fontSize="sm" color="fg.muted">
                  {text.detail.emptyLocation}
                </Text>
              )}
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
