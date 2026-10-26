// src/pages/Integracoes/SoftwareDominio/IntegrationDominioDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura) de Software Domínio
// (IntegrationDominio) — Integrações, F-121, 97-Esteiras/072,
// TASK-F121-FE-05. Rota `/integracoes/dominio/:uuid`, guardada por
// `integration_dominios_view` (registrada, DEPOIS de `/editar`, em
// `src/router/index.tsx`).
//
// Molde EXATO: `CompartilhamentoDetalhe.tsx` (guard de uuid antes de
// renderizar, `FormContainer`+`headerActions`, `DisplayFieldGroup`,
// `isNotFound`/`isGenericError`). Reusa `useIntegrationDominioDetail`
// (TASK-F121-FE-02, `fillForm` omitido — default no-op) em vez de uma query
// dedicada.
//
// 4 campos (mirror contrato de tela §2.4/§5.3): Emissor → Contador → Token
// de Integração (`x_integration_key`, NUNCA `token`) → Ativo (Badge Sim/Não).
// SEM "Última sincronização" (sem dado no Resource — §8-A). Botão "Editar"
// gated por `integration_dominios_edit`; sem ação de exclusão nesta tela.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Badge, Box, EmptyState, Flex, Icon, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { isValidGuid } from '@/utils/guid';

import { integrationDominioEnabledOptions } from '@/constants/integracoes/integrationDominio/options';

import { useIntegrationDominioDetail } from './useIntegrationDominios';

const INTEGRATION_DOMINIOS_LIST_ROUTE = '/integracoes/dominio';

export default function IntegrationDominioDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();

  const text = languageGB.integrationDominios;
  const detailText = text.detail;

  // Guarda de uuid ANTES de renderizar — mirror `CompartilhamentoDetalhe.tsx`.
  const hasValidUuid = isValidGuid(uuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      navigate(INTEGRATION_DOMINIOS_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const detailQuery = useIntegrationDominioDetail(hasValidUuid ? uuid : undefined) as any;

  if (!hasValidUuid) {
    return null;
  }

  // "carregando": `isPending && isFetching` — carga inicial, nunca refetch
  // silencioso em background.
  const isLoading = detailQuery.isPending && detailQuery.isFetching;
  const item = detailQuery.data;

  const isNotFound =
    detailQuery.isError &&
    isAxiosError(detailQuery.error) &&
    detailQuery.error.response?.status === 404;
  const isGenericError = detailQuery.isError && !isNotFound;

  const canEdit = can('integration_dominios_edit');

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
                <EmptyState.Title>{text.list.error.message}</EmptyState.Title>
              </VStack>
              <Button
                title={text.list.error.retry}
                icon={FiArrowLeft as ElementType}
                variant="outline"
                size="sm"
                onClick={() => navigate(INTEGRATION_DOMINIOS_LIST_ROUTE)}
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
                <EmptyState.Title>{text.list.error.message}</EmptyState.Title>
              </VStack>
              <Flex gap={3}>
                <Button
                  title={text.list.error.retry}
                  icon={FiRefreshCw as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => detailQuery.refetch()}
                />
                <Button
                  title={detailText.title}
                  icon={FiArrowLeft as ElementType}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(INTEGRATION_DOMINIOS_LIST_ROUTE)}
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
      title={detailText.title}
      headerActions={
        <Flex gap={2}>
          {canEdit && item && (
            <Button
              title={text.list.actions.edit}
              variant="outline"
              size="sm"
              onClick={() => navigate(`${INTEGRATION_DOMINIOS_LIST_ROUTE}/${item.uuid}/editar`)}
            />
          )}
          <Button
            title={languageGB.defaltStrings.cancel}
            icon={FiArrowLeft as ElementType}
            variant="secondary"
            size="sm"
            onClick={() => navigate(INTEGRATION_DOMINIOS_LIST_ROUTE)}
          />
        </Flex>
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <DisplayFieldGroup
          loading={isLoading}
          displayFields={[
            { label: detailText.fields.issuer, value: item?.issue.razao_social ?? '' },
            { label: detailText.fields.accountant, value: item?.contador.razao_social ?? '' },
            { label: detailText.fields.token, value: item?.x_integration_key ?? '' },
          ]}
        />
        <Box mt={4}>
          <Box mb={1} fontSize="sm" fontWeight="medium" color="fg.muted">
            {detailText.fields.enabled}
          </Box>
          <Badge colorPalette={item?.is_enabled ? 'green' : 'gray'} variant="subtle">
            {item ? integrationDominioEnabledOptions.getLabel(item.is_enabled, languageGB) : ''}
          </Badge>
        </Box>
      </Box>
    </FormContainer>
  );
}
