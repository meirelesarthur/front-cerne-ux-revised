// src/pages/Integracoes/Compartilhamento/CompartilhamentoDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (somente leitura) de Compartilhamento (Sharing) —
// Integrações, F-122, 97-Esteiras/070, TASK-CP-FE-03. Rota
// `/integracoes/compartilhamento/:sharingUuid`, guardada por `sharings_view`
// (registrada, DEPOIS de `/editar`, em `src/router/index.tsx` — não tocado
// aqui).
//
// Molde EXATO: `AcasalamentoDetalhe.tsx` (guard de uuid antes de renderizar,
// `FormContainer`+`headerActions`, `DisplayFieldGroup`, `isNotFound`/
// `isGenericError`). SEM `ContainerGrid` — não há tabela nesta tela.
//
// 4 campos NESTA ORDEM EXATA (mirror `CL-032`/`RTP-03`): Responsável →
// Contratante → Data (`d/m/Y`) → Itens.
//   - "Contratante" exibe SÓ o nome (`extractTenantNameFromLabel`, mirror
//     `CL-029`/`EV-26` — o `label` completo "nif - name" é pensado para o
//     `SelectAsyncPaginate` do formulário, não para exibição direta).
//   - "Itens" exibido CRU, SEM tradução de rótulo (`CL-032` — contraste
//     deliberado com o formulário, onde "Marcação" é só o LABEL do checkbox
//     de entrada, nunca o valor exibido aqui).
//
// Sem ações de edição/exclusão nesta tela — só "Voltar" (mirror
// `show.blade.php`, `AM-06`).
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, VStack } from '@chakra-ui/react';
import { isAxiosError } from 'axios';
import { FiAlertTriangle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DisplayFieldGroup } from '@/components/DisplayFieldGroup';
import { FormContainer } from '@/components/Layout/FormContainer';

import { useLanguage } from '@/hooks/useLanguage';

import { extractTenantNameFromLabel } from '@/utils/extractTenantNameFromLabel';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { useSharingDetail } from './useSharings';

const SHARINGS_LIST_ROUTE = '/integracoes/compartilhamento';

export default function CompartilhamentoDetalhe() {
  const { sharingUuid } = useParams<{ sharingUuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.sharings;
  const detailText = text.detail;

  // Guarda de uuid ANTES de renderizar — mirror `AcasalamentoDetalhe.tsx`.
  const hasValidUuid = isValidGuid(sharingUuid ?? null);

  useEffect(() => {
    if (!hasValidUuid) {
      navigate(SHARINGS_LIST_ROUTE, { replace: true });
    }
  }, [hasValidUuid, navigate]);

  const detailQuery = useSharingDetail(hasValidUuid ? sharingUuid : undefined);

  // "carregando": `isPending && isFetching` (V5) — carga inicial, nunca
  // refetch silencioso em background.
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
      <FormContainer title={detailText.pageTitle}>
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
                onClick={() => navigate(SHARINGS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  if (isGenericError) {
    return (
      <FormContainer title={detailText.pageTitle}>
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
                  onClick={() => navigate(SHARINGS_LIST_ROUTE)}
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
      title={detailText.pageTitle}
      headerActions={
        <Button
          title={detailText.backButton}
          icon={FiArrowLeft as ElementType}
          variant="outline"
          size="sm"
          onClick={() => navigate(SHARINGS_LIST_ROUTE)}
        />
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <DisplayFieldGroup
          loading={isLoading}
          displayFields={[
            { label: detailText.responsible, value: item?.user.name ?? '' },
            {
              label: detailText.tenant,
              value: item ? extractTenantNameFromLabel(item.tenant.label) : '',
            },
            { label: detailText.date, value: item?.date ? formatDate(item.date) : '' },
            // CRU, sem tradução de rótulo (CL-032) — nunca mapear "markings"
            // para um label bonito tipo "Marcação" nesta tela.
            { label: detailText.items, value: item?.items.join(', ') ?? '' },
          ]}
        />
      </Box>
    </FormContainer>
  );
}
