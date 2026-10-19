// src/pages/Operacional/Reproducao/Acasalamento/AcasalamentoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de visualização (somente leitura) de Acasalamento — `bm-screen-show`
// (BreedingMating, F-016, 97-Esteiras/001, TASK-BM-FE-06, contrato de tela
// §6.4). Rota `/operacional/acasalamento/:breedingMatingUuid`, gate
// `breeding-matings_view` (wiring da rota é da TASK-BM-FE-09 — este arquivo
// só declara o nome do param esperado, mirror `CreateOrUpdateAcasalamento.tsx`).
//
// Casca `FormContainer` com `headerActions` (badge de status + `Voltar`) —
// NUNCA `ContainerGrid` (não há `<Table>` abrindo o próprio scroll aqui,
// ADR-FE-BM-00). Molde: `ServiceOrderDetalhe.tsx`/`LoteReproducaoDetalhe.tsx`.
//
// ⚠️ Os 3 blocos (`bm-tab-natural`/`bm-tab-simplified`/`bm-tab-protocol`) NÃO
// são abas — o componente headless de abas do Chakra (com sua raiz, lista,
// gatilho e conteúdo) e o hook de controle de abas por URL são PROIBIDOS
// nesta tela (ADR-FE-BM-01/GAP-FE-BM-02). O legado (`show.blade.php:86-92`)
// renderiza exatamente UM dos 3 blocos por `@if/@elseif/@else`, e a API
// devolve dois `null`. Renderização condicional simples, comentada abaixo,
// exatamente para que ninguém "melhore" isso depois trocando por uma barra
// de abas com 2 gatilhos permanentemente vazios.
//
// Badge de status por token de `BREEDING_MATING_STATUS_META`/
// `getBreedingMatingStatusBadgeToken` (TASK-BM-FE-02) — o campo de cor bruta
// (hex) do envelope continua IGNORADO (`GAP-FE-BM-01`). Zero hex fixo.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { FormContainer } from '@/components/Layout/FormContainer';
import { Status } from '@/components/Status';

import { useLanguage } from '@/hooks/useLanguage';

import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { getBreedingMatingStatusBadgeToken } from '@/constants/breedingMating/breeding-mating-status';

import { NaturalDetailBlock } from './detail/NaturalDetailBlock';
import { ProtocolDetailBlock } from './detail/ProtocolDetailBlock';
import { SimplifiedDetailBlock } from './detail/SimplifiedDetailBlock';
import { useAcasalamentoDetalhe } from './useAcasalamentos';

const ACASALAMENTO_LIST_ROUTE = '/operacional/acasalamento';

export default function AcasalamentoDetalhe() {
  const { breedingMatingUuid } = useParams<{ breedingMatingUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.breedingMatings.breedingMating;
  const detailText = text.detail;

  // Guarda de uuid ANTES de renderizar (regra 10 da Tarefa) — mirror
  // `CreateOrUpdateAcasalamento.tsx`/`LoteReproducaoDetalhe.tsx`.
  const hasValidUuid = isValidGuid(breedingMatingUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      navigate(ACASALAMENTO_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const detailQuery = useAcasalamentoDetalhe(hasValidUuid ? breedingMatingUuid : undefined);

  // "carregando": `isPending && isFetching` (V5) — carga inicial, nunca
  // refetch silencioso em background (contrato de tela §6.7).
  const isLoading = detailQuery.isPending && detailQuery.isFetching;
  const item = detailQuery.data;

  const isNotFound =
    detailQuery.isError &&
    isAxiosError(detailQuery.error) &&
    detailQuery.error.response?.status === 404;
  const isGenericError = detailQuery.isError && !isNotFound;

  if (!hasValidUuid) {
    return null;
  }

  if (isNotFound) {
    return (
      <FormContainer title={detailText.title}>
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
                title={detailText.backButton}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(ACASALAMENTO_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  if (isGenericError) {
    return (
      <FormContainer title={detailText.title}>
        <Flex direction="column" align="center" justify="center" py={16} px={4}>
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{detailText.error.message}</EmptyState.Title>
              </VStack>
              <Flex gap={3}>
                <Button
                  title={detailText.error.retry}
                  icon={FiRefreshCw as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => detailQuery.refetch()}
                />
                <Button
                  title={detailText.backButton}
                  icon={FiArrowLeft as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(ACASALAMENTO_LIST_ROUTE)}
                />
              </Flex>
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.code ?? detailText.title}
      headerActions={
        item && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Status
              text={item.status.label}
              backgroundColor={getBreedingMatingStatusBadgeToken(item.status.value)}
            />
            <Button
              title={detailText.backButton}
              icon={FiArrowLeft as ElementType}
              variant="outline"
              size="sm"
              onClick={() => navigate(ACASALAMENTO_LIST_ROUTE)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <DisplayFieldGroup
          loading={isLoading}
          displayFields={[
            { label: detailText.fields.code, value: item?.code ?? '' },
            { label: detailText.fields.date, value: item?.date ? formatDate(item.date) : '' },
            { label: detailText.fields.responsible, value: item?.responsible_name ?? '' },
            // "Estação de Monta"/"Lote de Reprodução" só existem/visíveis
            // quando presentes (Simplificado dispensa os dois, regra 4 da
            // Tarefa) — campo ausente NÃO entra na lista, o legado usa `@if`.
            ...(item?.breeding_season
              ? [{ label: detailText.fields.breedingSeason, value: item.breeding_season.label }]
              : []),
            ...(item?.breeding_batch
              ? [{ label: detailText.fields.breedingBatch, value: item.breeding_batch.label }]
              : []),
            { label: detailText.fields.type, value: item?.type.label ?? '' },
            {
              label: detailText.fields.resync,
              value: item ? (item.resync ? text.options.resync.yes : text.options.resync.no) : '',
            },
          ]}
        />

        {/* Exatamente UM dos 3 blocos — NUNCA um componente de abas
            (ADR-FE-BM-01/GAP-FE-BM-02). `data.natural`/`data.simplified`/
            `data.protocol`: exatamente um preenchido, os outros `null`
            (contrato de API §6.3). */}
        {item?.natural && <NaturalDetailBlock natural={item.natural} languageGB={languageGB} />}
        {item?.simplified && (
          <SimplifiedDetailBlock simplified={item.simplified} languageGB={languageGB} />
        )}
        {item?.protocol && (
          <ProtocolDetailBlock
            protocol={item.protocol}
            breedingMatingType={item.type.value}
            languageGB={languageGB}
          />
        )}
      </Box>
    </FormContainer>
  );
}
