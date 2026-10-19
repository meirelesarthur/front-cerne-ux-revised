// src/pages/BaseRegistrations/SystemUpdates/SystemUpdateDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (somente leitura) de uma ATUALIZAÇÃO DO SISTEMA — Cadastros
// Base, execução 031, TASK-FE-1103. Rota própria:
// /cadastros-base/atualizacoes-sistema/:uuid/detalhe (guardada por
// `system_updates_view`).
//
// Mirror `BaseRegistrations/Parameters/ParametersDetalhe.tsx` /
// `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx` (mesma execução/família):
// `FormContainer` + `headerActions` (botão Editar) + `InfoField` local — SEM
// `useForm`/RHF, leitura direta de `detailQuery.data`. O botão "Voltar" do
// Blade legado NÃO é replicado à parte — `FormContainer` já tem o ícone de
// fechar/voltar no header (mesmo precedente de `ParametersDetalhe`/
// `DetalheCentroCusto`, adaptação sem cópia, `get_spa_ux_fidelity_pattern`).
//
// Decisão do dono §7.2 (contrato-front-atualizacoes-sistema.md, aprovada,
// `decisoes-do-dono-031.md` #4b): `description` renderiza como HTML
// SANITIZADO (`RichTextContent`, que já passa por `sanitizeHtml()`/DOMPurify
// internamente) — NUNCA texto plano, NUNCA `dangerouslySetInnerHTML` cru.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiEdit } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { RichTextContent } from '@/components/RichTextEditor/RichTextContent';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getSystemUpdate } from '@/services/v2/BaseRegistrations/systemUpdate-service';

const SYSTEM_UPDATES_LIST_ROUTE = '/cadastros-base/atualizacoes-sistema';

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

export default function SystemUpdateDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.baseRegistrations.systemUpdate;

  // Guard de navegação — uuid mal formado não deve chegar à query nem
  // renderizar conteúdo (mesmo racional de `ParametersDetalhe.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(SYSTEM_UPDATES_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const detailQuery = useQuery({
    queryKey: [queryKey.baseRegistrations.systemUpdate, uuid],
    queryFn: async () => {
      const response = await getSystemUpdate(uuid as string);
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
                onClick={() => navigate(SYSTEM_UPDATES_LIST_ROUTE)}
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
        can('system_updates_edit') && (
          <Flex align="center" gap={3} flexShrink={0}>
            <Button
              title={text.detail.actions.edit}
              icon={FiEdit as ElementType}
              size="sm"
              onClick={() => navigate(`${SYSTEM_UPDATES_LIST_ROUTE}/${uuid}`)}
            />
          </Flex>
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField
                label={text.detail.fields.releaseDate}
                value={item?.release_date ? formatDate(item.release_date) : '—'}
              />
            </SimpleGrid>

            <Box>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="fg.muted"
                textTransform="uppercase"
                letterSpacing="wide"
                mb={2}
              >
                {text.detail.fields.description}
              </Text>
              <RichTextContent html={item?.description} />
            </Box>
          </Flex>
        </Skeleton>
      </Box>
    </FormContainer>
  );
}
