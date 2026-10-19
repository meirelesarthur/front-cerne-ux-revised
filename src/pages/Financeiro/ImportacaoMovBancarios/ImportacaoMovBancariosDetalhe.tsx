// src/pages/Financeiro/ImportacaoMovBancarios/ImportacaoMovBancariosDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de DETALHE (100% leitura) de IMPORTAÇÃO MOV. BANCÁRIOS — TASK-064-MOV-FE-03.
// Rota `/financeiro/importacao/:uuid` (guardada por `movement-sheets_view` —
// a mesma permissão da listagem; não existe modo `editar` no mode_matrix).
//
// Mirror estrutural de `Administrativo/CorrecaoEstoque/CorrecaoEstoqueDetalhe.tsx`
// (`useParams<{uuid}>` + `isValidGuid` guard antes de qualquer chamada de
// rede + `useQuery` direto, NÃO hook de form genérico). **MAIS SIMPLES que o
// precedente:** `MovementSheetResource` não expõe array de itens — SEM
// Seção 2/`Table.Root`/`EmptyState` de itens (não existe conceito
// equivalente aqui, não fabricar uma seção vazia por simetria).
//
// Isolamento de tenant (`HasFarmTenantScope`, decisão 8 da arquitetura de
// API): 404 tratado de forma honesta e idêntica para "não existe" e "existe
// mas é de outra fazenda" — nunca um erro genérico de console.
// -----------------------------------------------------------------------------

import { ElementType, useEffect } from 'react';

import { Box, EmptyState, Flex, Icon, SimpleGrid, Skeleton, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import { getMovementSheet } from '@/services/v2/MovementSheets/movement-sheet-service';

const IMPORTACAO_MOV_BANCARIOS_LIST_ROUTE = '/financeiro/importacao';

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

export default function ImportacaoMovBancariosDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();

  const text = languageGB.movementSheets.movementSheet;
  const noData = text.detail.noData;

  const hasValidParams = isValidGuid(uuid);

  // Guarda de entrada — `uuid` ausente ou mal-formado NUNCA dispara a
  // chamada de rede; redireciona à Listagem com toast. Deps somente
  // [hasValidParams], mesma disciplina do precedente `CorrecaoEstoqueDetalhe`.
  useEffect(() => {
    if (!hasValidParams) {
      toaster.create({
        type: 'error',
        title: text.detail.invalidParamsToast.title,
        description: text.detail.invalidParamsToast.description,
      });
      navigate(IMPORTACAO_MOV_BANCARIOS_LIST_ROUTE, { replace: true });
    }
  }, [hasValidParams]);

  const detailQuery = useQuery({
    queryKey: [queryKey.movementSheets.movementSheet, uuid],
    queryFn: async () => {
      const response = await getMovementSheet(uuid!);
      return response.data;
    },
    enabled: hasValidParams,
    retry: false,
  });

  if (!hasValidParams) {
    return null;
  }

  const isLoading = checkLoadingStatus([detailQuery as any]);
  const item = detailQuery.data;
  const notFound = !isLoading && detailQuery.isError;

  // Estado: 404 (importação inexistente ou de outra fazenda — isolamento
  // por tenant é silencioso, `HasFarmTenantScope`).
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
                onClick={() => navigate(IMPORTACAO_MOV_BANCARIOS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  return (
    <FormContainer title={item ? item.code : text.singularLabel}>
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading} width="fit-content">
          <Text fontSize="sm" color="fg.muted">
            {item ? formatDate(item.date) : text.singularLabel}
          </Text>
        </Skeleton>

        <Flex direction="column" gap={6} mt={6}>
          {/* ---- Seção única — Identificação (Resource não expõe itens) ---- */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color="fg.default"
              mb={4}
              pb={2}
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              {text.detail.sections.identification}
            </Text>
            <SimpleGrid columns={columnsForm.default} gap={6}>
              <InfoField label={text.detail.fields.code} value={item?.code || noData} />
              <InfoField
                label={text.detail.fields.date}
                value={item ? formatDate(item.date) : noData}
              />
              <InfoField label={text.detail.fields.user} value={item?.user?.name || noData} />
            </SimpleGrid>
          </Box>
        </Flex>
      </Box>
    </FormContainer>
  );
}
