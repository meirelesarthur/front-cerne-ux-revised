// src/pages/BaseRegistrations/Parameters/ParametersDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de um PARÂMETRO — Configurações, execução
// 031, TASK-FE-031-43. Rota: /configuracoes/parametros/:parameterUuid/detalhe
// (guardada por `parameters_view`, wiring real da rota é este mesmo lote —
// ver `src/router/index.tsx`).
//
// Mirror `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx` /
// `CadastrosBase/SaldoInicial/SaldoInicialDetalhe.tsx` (mesma execução 031):
// `FormContainer` + `headerActions` (botão Editar) + `InfoField` local
// (label + valor) para o painel de leitura. Sem `useForm`/RHF — leitura
// direta de `parameterQuery.data`.
//
// ⚠️ CAMPO "TIPO" DELIBERADAMENTE OMITIDO (contrato §7, fidelidade ao
// legado — Doc Bruta §4: `type` nunca aparece em `index`/`show` do Admin
// legado, só no `<select>` do form). NÃO "corrigir" adicionando o campo por
// parecer incompleto.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';
import { isReservedParameterName } from '@/constants/reserved-parameter-names';

import { getParameter } from '@/services/v2/BaseRegistrations/parameter-service';

const PARAMETERS_LIST_ROUTE = '/configuracoes/parametros';

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

export default function ParametersDetalhe() {
  const { parameterUuid } = useParams<{ parameterUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.parameters.parameter;

  // Guard de navegação — uuid mal formado não deve chegar à query.
  useEffect(() => {
    if (!isValidGuid(parameterUuid)) {
      navigate(PARAMETERS_LIST_ROUTE, { replace: true });
    }
  }, [parameterUuid, navigate]);

  const detailQuery = useQuery({
    queryKey: [queryKey.parameters.detail, parameterUuid],
    queryFn: async () => {
      const response = await getParameter(parameterUuid as string);
      return response.data;
    },
    enabled: isValidGuid(parameterUuid),
    retry: false,
  });

  if (!isValidGuid(parameterUuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

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
                onClick={() => navigate(PARAMETERS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={item?.name ?? text.singularLabel}
      headerActions={
        item &&
        can('parameters_edit') &&
        // Correção C3 — reservados são SOMENTE VISUALIZAÇÃO: sem este guard,
        // o botão "Editar" navegaria para `CreateOrUpdateParameters.tsx`, que
        // por sua vez redireciona de volta para cá (loop de UX). Fecha a
        // mesma proteção já aplicada na listagem (`index.tsx`).
        !isReservedParameterName(item.name) && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={text.detail.actions.edit}
              icon={FiEdit as ElementType}
              size="sm"
              onClick={() => navigate(`${PARAMETERS_LIST_ROUTE}/${parameterUuid}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <SimpleGrid columns={columnsForm.default} gap={6}>
            <InfoField label={text.detail.fields.name} value={item?.name ?? '—'} />
            <InfoField label={text.detail.fields.value} value={item?.value ?? '—'} />
            <InfoField label={text.detail.fields.description} value={item?.description || '—'} />
            <InfoField
              label={text.detail.fields.createdAt}
              value={item?.created_at ? formatDate(item.created_at) : '—'}
            />
            <InfoField
              label={text.detail.fields.updatedAt}
              value={item?.updated_at ? formatDate(item.updated_at) : '—'}
            />
          </SimpleGrid>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
