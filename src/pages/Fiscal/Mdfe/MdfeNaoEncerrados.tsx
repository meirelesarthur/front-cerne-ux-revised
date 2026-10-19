// src/pages/Fiscal/Mdfe/MdfeNaoEncerrados.tsx
// -----------------------------------------------------------------------------
// Tela "MDFe Não Encerrados" — TASK-MDFE-FE-06 (`CONTRATO-FRONT-MDFE.md §6`,
// mirror `SR-F05`/`LS011-LS015`/`AC029`/`AC030`). Tela SEPARADA da Listagem
// (não é o mesmo grid com filtro extra): formulário de consulta com
// `emissor_id` OBRIGATÓRIO — botão "Consultar" fica desabilitado até a
// seleção. A LISTA é Onda 1 (`GET /mdfes?encerrado=false&emissorId=...`,
// MESMO endpoint do index, fecha `GAP-MDFE-04`).
//
// TASK-MDFE-FE-09 (Onda 2) — a ação "Encerrar" foi LIGADA (`POST /mdfes/
// {uuid}/close`, `useRequest({typesRequest: 'apply'})`, mirror
// `CONTRATO-FRONT-MDFE.md §8`). Gate por permissão (`mdfe_edit`, legado —
// `CONTRATO-API-MDFE.md §6`): sem a permissão, a ação some da linha (RBAC
// deny-by-default, nunca só `disabled`). Confirmação via `DeleteConfirmDialog`
// (componente genérico já compartilhado no fork — encerrar é irreversível
// junto à SEFAZ, mesma classe de ação que Cancelar em `MdfeEmissionPanel.tsx`,
// que usa modal de motivo; aqui não há motivo a coletar, só confirmação).
// Sucesso invalida a query desta própria lista (removendo a linha, já que o
// item deixa de satisfazer `encerrado=false`) + a Listagem principal.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import { Box, EmptyState, Flex, Icon, Table as ChakraTable, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { FiFileText, FiXCircle } from 'react-icons/fi';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Select } from '@/components/Form/Select';
import { FormContainer } from '@/components/Layout/FormContainer';
import { QueryErrorState } from '@/components/QueryErrorState';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';
import { useRequest } from '@/hooks/useRequest';

import formatDate from '@/utils/formatDate';

import { queryKey } from '@/constants/query-key';

import { closeMdfe, listMdfes } from '@/services/v2/Fiscal/mdfe-service';
import { listIssuers } from '@/services/v2/Issuers/issuer-service';

import type { Option } from '@/@types/option';
import type { MdfeData } from '@/@types/v2/Fiscal/Mdfe';

const NAO_ENCERRADOS_QUERY_KEY = 'mdfe-nao-encerrados';

/**
 * Só MDF-e AUTORIZADO pode ser encerrado na SEFAZ: cancelado/rejeitado/novo ficam fora da lista.
 * @param {string} emissorId uuid do emissor escolhido na consulta
 * @return {object} parâmetros de `listMdfes`
 */
export function naoEncerradosListParams(emissorId: string) {
  return { page: 1, per_page: 100, estado: 'aprovado', encerrado: false, emissorId } as const;
}

interface NaoEncerradosFormValues {
  emissorId: Option<string> | null;
}

export default function MdfeNaoEncerrados() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.mdfes.mdfe;
  const emissionText = text.emission;

  const { control, handleSubmit, watch } = useForm<NaoEncerradosFormValues>({
    defaultValues: { emissorId: null },
  });

  const emissorId = watch('emissorId');
  const [queryEmissorId, setQueryEmissorId] = useState<string | null>(null);
  // TASK-MDFE-FE-09 — `uuid` do MDFe pendente de confirmação de encerramento
  // (`null` = diálogo fechado, mirror `DeleteConfirmDialog` genérico).
  const [pendingCloseUuid, setPendingCloseUuid] = useState<string | null>(null);

  const issuersQuery = useQuery({
    queryKey: ['mdfe-nao-encerrados-issuer-options'],
    queryFn: () => listIssuers({ page: 1, per_page: 100 }),
    staleTime: 5 * 60 * 1000,
  });
  const issuerOptions: Option<string>[] = (issuersQuery.data?.data.items ?? []).map((issuer) => ({
    label: issuer.razao_social,
    value: issuer.uuid,
  }));

  const resultsQuery = useQuery({
    queryKey: [NAO_ENCERRADOS_QUERY_KEY, queryEmissorId],
    queryFn: () => listMdfes(naoEncerradosListParams(queryEmissorId!)),
    enabled: !!queryEmissorId,
  });

  // `queryKey` primária é a PRÓPRIA lista desta tela (o item some ao
  // reconsultar, já que deixa de satisfazer `encerrado=false`); `queryKey2`
  // cobre a Listagem principal (`FilterSideMdfe.tsx`), que também exibe
  // `encerrado`.
  const closeMutation = useRequest<MdfeData>({
    asyncFunction: async (uuid: string) => closeMdfe(uuid),
    queryKey: NAO_ENCERRADOS_QUERY_KEY,
    queryKey2: queryKey.mdfes.mdfesList,
    typesRequest: 'apply',
    entityName: text.singularLabel,
    personalizedMessage: emissionText.closeSuccessToast,
    actionSuccess: () => setPendingCloseUuid(null),
  });

  function handleConfirmClose() {
    if (!pendingCloseUuid) return;
    closeMutation.mutate(pendingCloseUuid);
  }

  function onSubmit(data: NaoEncerradosFormValues) {
    if (!data.emissorId?.value) return;
    setQueryEmissorId(data.emissorId.value);
  }

  const items = resultsQuery.data?.data.items ?? [];
  const hasSearched = !!queryEmissorId;
  const isLoading = resultsQuery.isFetching;

  return (
    <FormContainer title={text.naoEncerrados.pageTitle} subtitle={text.naoEncerrados.pageSubtitle}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex align="flex-end" gap={4} mb={6} flexWrap="wrap">
          <Box minW="280px">
            <Controller
              name="emissorId"
              control={control}
              render={({ field }) => (
                <Select
                  label={text.filter.emissor}
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  options={issuerOptions}
                  loading={issuersQuery.isLoading}
                  isRequired
                />
              )}
            />
          </Box>
          <Button
            type="submit"
            title={text.naoEncerrados.submitButton}
            disabled={!emissorId}
            loading={isLoading}
          />
        </Flex>
      </form>

      {!hasSearched ? (
        <Text fontSize="sm" color="fg.muted">
          {text.naoEncerrados.emissorRequired}
        </Text>
      ) : resultsQuery.isError ? (
        <QueryErrorState error={resultsQuery.error} onRetry={() => resultsQuery.refetch()} />
      ) : items.length === 0 && !isLoading ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiFileText} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.naoEncerrados.emptyState.title}</EmptyState.Title>
              <EmptyState.Description>
                {text.naoEncerrados.emptyState.description}
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Box overflowX="auto">
          <ChakraTable.Root size="sm">
            <ChakraTable.Header>
              <ChakraTable.Row>
                <ChakraTable.ColumnHeader>
                  {text.naoEncerrados.table.chave}
                </ChakraTable.ColumnHeader>
                <ChakraTable.ColumnHeader>
                  {text.naoEncerrados.table.protocolo}
                </ChakraTable.ColumnHeader>
                <ChakraTable.ColumnHeader>
                  {text.naoEncerrados.table.mdfeNumero}
                </ChakraTable.ColumnHeader>
                <ChakraTable.ColumnHeader>
                  {text.naoEncerrados.table.createdAt}
                </ChakraTable.ColumnHeader>
                <ChakraTable.ColumnHeader textAlign="right"> </ChakraTable.ColumnHeader>
              </ChakraTable.Row>
            </ChakraTable.Header>
            <ChakraTable.Body>
              {items.map((item) => (
                <ChakraTable.Row key={item.uuid}>
                  <ChakraTable.Cell>{item.chave ?? '—'}</ChakraTable.Cell>
                  <ChakraTable.Cell>{item.protocolo ?? '—'}</ChakraTable.Cell>
                  <ChakraTable.Cell>{item.mdfe_numero}</ChakraTable.Cell>
                  <ChakraTable.Cell>
                    {item.created_at ? formatDate(item.created_at, 'dd/MM/yyyy') : '—'}
                  </ChakraTable.Cell>
                  <ChakraTable.Cell textAlign="right">
                    {can('mdfe_edit') && (
                      <Button
                        title={text.naoEncerrados.encerrarButton}
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        icon={FiXCircle as any}
                        onClick={() => setPendingCloseUuid(item.uuid)}
                      />
                    )}
                  </ChakraTable.Cell>
                </ChakraTable.Row>
              ))}
            </ChakraTable.Body>
          </ChakraTable.Root>
        </Box>
      )}

      <DeleteConfirmDialog
        isOpen={!!pendingCloseUuid}
        onClose={() => setPendingCloseUuid(null)}
        onConfirm={handleConfirmClose}
        isLoading={closeMutation.isPending}
        tone="warning"
        title={emissionText.closeModal.title}
        description={emissionText.closeModal.description}
        warningText=""
        confirmButtonText={emissionText.closeModal.confirmButton}
        hideQuestionMark
        colorPalette="red"
      />
    </FormContainer>
  );
}
