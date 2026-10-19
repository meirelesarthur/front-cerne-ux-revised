// src/pages/BaseRegistrations/Permissions/PermissionDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de uma Permissão — Cadastros Base,
// execução 032, TASK-FE-2403. Rota própria:
// /cadastros-base/permissoes/:uuid/detalhe (guardada por `permissions_view`).
//
// Molde exato: `SystemUpdateDetalhe.tsx` — `FormContainer` + `headerActions`
// (botão Editar) + `InfoField` local, SEM `useForm`/RHF, leitura direta de
// `detailQuery.data`.
//
// Corpo (4 campos, fiel ao `show.blade.php` legado): Nome, Descrição — texto
// plano simples, SEM HTML/sanitização (campo `string` curta, diferente de
// `SystemUpdate.description`) —, Dt. Criação, Dt. Atualização (só na
// Visualização, nunca no form — fiel ao legado, que também não deixa editar
// timestamps).
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

import { getPermission } from '@/services/v2/BaseRegistrations/permission-service';

const PERMISSIONS_LIST_ROUTE = '/cadastros-base/permissoes';

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

export default function PermissionDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.permission;

  // Guard de navegação — uuid mal formado não deve chegar à query nem
  // renderizar conteúdo (mesmo racional de `SystemUpdateDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(PERMISSIONS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const detailQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.permission, uuid],
    queryFn: async () => {
      const response = await getPermission(uuid as string);
      return response.data;
    },
    enabled: isValidGuid(uuid),
    retry: false,
  });

  if (!isValidGuid(uuid)) {
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
                onClick={() => navigate(PERMISSIONS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer
      title={text.detail.pageTitle}
      headerActions={
        item &&
        can('permissions_edit') && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={text.detail.actions.edit}
              icon={FiEdit as ElementType}
              size="sm"
              onClick={() => navigate(`${PERMISSIONS_LIST_ROUTE}/${uuid}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.detail.fields.name} value={item?.name ?? '—'} />
              <InfoField label={text.detail.fields.description} value={item?.description ?? '—'} />
              <InfoField
                label={text.detail.fields.createdAt}
                value={item?.created_at ? formatDate(item.created_at) : '—'}
              />
              <InfoField
                label={text.detail.fields.updatedAt}
                value={item?.updated_at ? formatDate(item.updated_at) : '—'}
              />
            </SimpleGrid>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
