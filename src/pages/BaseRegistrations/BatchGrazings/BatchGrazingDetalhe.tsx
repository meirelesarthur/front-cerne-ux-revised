// src/pages/BaseRegistrations/BatchGrazings/BatchGrazingDetalhe.tsx
// -----------------------------------------------------------------------------
// Tela de VISUALIZAÇÃO (cards, somente leitura) de 1 vínculo Lote/Módulo
// (BatchGrazing) — Cadastros Base / Pecuários (TASK-FE-2003, execução 029).
// Rota PRÓPRIA: /cadastros-base/lote-modulo/:uuid (registrada em
// TASK-FE-2004, ANTES do catch-all `/cadastros-base/*`) — faz o papel que
// "Editar" faria em outras features (aqui não existe edição, D1 do contrato
// de API `contrato-lote-modulo.md`).
//
// Molde estrutural: `CadastrosBase/CentroCusto/DetalheCentroCusto.tsx` —
// `FormContainer` com `headerActions`, sub-componentes locais
// `InfoField`/`DetailPanel` RECRIADOS aqui (não importados de CentroCusto,
// contrato de tela §4/Tarefa). SEM `useForm`/RHF — lê `batchGrazingQuery.data`
// direto (`fillForm` é um no-op proposital, mesmo racional de
// `DetalheCentroCusto.tsx`).
//
// Métricas SEMPRE do backend (`GET /batch-grazings/{uuid}`, nunca
// recalculadas no client — diferente da criação, que é preview best-effort).
// SEM "UA/Suporte" — a métrica nem existe na resposta da API (decisão G8).
//
// Ações não-destrutivas (D3/D12 do contrato de API — o backend registra
// saída, nunca apaga histórico):
//   - "Remover" por lote (`DELETE .../batches/{batchUuid}`) — o módulo
//     permanece com os demais lotes; ao remover o último, o vínculo deixa de
//     aparecer na listagem (efeito do backend, refletido aqui só como lista
//     vazia de lotes no card, SEM navegação automática).
//   - "Excluir vínculo" inteiro (`DELETE /batch-grazings/{uuid}`, botão no
//     `headerActions`) — volta para a listagem.
// -----------------------------------------------------------------------------

import { ElementType, ReactNode, useEffect, useState } from 'react';

import {
  Badge,
  Box,
  EmptyState,
  Flex,
  Icon,
  SimpleGrid,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiAlertTriangle, FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { checkLoadingStatus } from '@/utils/checkLoadingStatus';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import formatDate from '@/utils/formatDate';
import { isValidGuid } from '@/utils/guid';

import { columnsForm } from '@/constants/coluns-form';
import { queryKey } from '@/constants/query-key';

import {
  deleteBatchGrazing,
  removeBatchFromGrazing,
} from '@/services/v2/BaseRegistrations/batch-grazings-service';

import type { BatchGrazingData } from '@/@types/v2/BaseRegistrations/batch-grazings';

import { useBatchGrazingForm } from './useBatchGrazings';

const BATCH_GRAZINGS_LIST_ROUTE = '/cadastros-base/lote-modulo';

// Campo de leitura (label + valor) — RECRIADO localmente (não importado de
// `DetalheCentroCusto.tsx`, contrato de tela §4).
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

// Painel agrupado com borda/rótulo — RECRIADO localmente (mesma linguagem
// visual de `DetalheCentroCusto.tsx`, sem importar de lá).
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

// `useBatchGrazingForm` exige `fillForm` no contrato do hook (compartilhado
// estruturalmente com um formulário que não existe aqui) — o dado real é
// lido direto de `batchGrazingQuery.data` abaixo, mesmo racional de
// `DetalheCentroCusto.tsx` (`noop`).
function noop() {}

export default function BatchGrazingDetalhe() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const text = languageGB.baseRegistrations.batchGrazing;

  const canDelete = can('batch_grazing_delete');

  // Guard de navegação — uuid mal formado não deve chegar ao hook de query
  // nem renderizar conteúdo (mirror `DetalheCentroCusto.tsx`).
  useEffect(() => {
    if (!isValidGuid(uuid)) {
      navigate(BATCH_GRAZINGS_LIST_ROUTE, { replace: true });
    }
  }, [uuid, navigate]);

  const batchGrazingQuery = useBatchGrazingForm({ registrationId: uuid, fillForm: noop });

  // ---- Remoção de 1 lote ----------------------------------------------------
  const [batchToRemove, setBatchToRemove] = useState<{ uuid: string; description: string } | null>(
    null
  );
  const {
    open: isOpenRemoveBatchDialog,
    onOpen: onOpenRemoveBatchDialog,
    onClose: onCloseRemoveBatchDialog,
  } = useDisclosure();

  const removeBatchMutation = useMutation({
    mutationFn: async (batchUuid: string) => {
      if (!uuid) throw new Error('uuid inválido');
      return await removeBatchFromGrazing(uuid, batchUuid);
    },
    onSuccess: () => {
      // Refetch do card (métricas/lotes atualizados) — a listagem também é
      // invalidada por segurança (a agregação por módulo muda quando 1 lote
      // sai, evitando dado obsolescente se o usuário voltar para lá).
      queryClient.invalidateQueries({ queryKey: [queryKey.batchGrazings.batchGrazing, uuid] });
      queryClient.invalidateQueries({ queryKey: [queryKey.batchGrazings.batchGrazingsList] });

      // `removeBatchDialog.description` já é uma frase completa ("Este lote
      // sai do vínculo, mas o histórico de saída é mantido..."), reaproveitada
      // aqui como confirmação de sucesso — sem criar chave de i18n nova
      // (bloco `batchGrazing` é FUNDAÇÃO travada, TASK-FE-2000).
      toaster.success({
        title: text.singularLabel,
        description: text.removeBatchDialog.description,
        duration: 7000,
      });

      onCloseRemoveBatchDialog();
      setBatchToRemove(null);
    },
    onError: (error) => {
      console.error('BatchGrazing removeBatch - error:', error);
      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isRemovingBatch = removeBatchMutation.isPending;

  const handleRemoveBatchClick = (batch: { uuid: string; description: string }) => {
    setBatchToRemove(batch);
    onOpenRemoveBatchDialog();
  };

  const handleConfirmRemoveBatch = () => {
    if (batchToRemove) {
      removeBatchMutation.mutate(batchToRemove.uuid);
    }
  };

  // ---- Exclusão do vínculo inteiro -------------------------------------------
  const {
    open: isOpenDeleteLinkDialog,
    onOpen: onOpenDeleteLinkDialog,
    onClose: onCloseDeleteLinkDialog,
  } = useDisclosure();

  const deleteLinkMutation = useMutation({
    mutationFn: async () => {
      if (!uuid) throw new Error('uuid inválido');
      return await deleteBatchGrazing(uuid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey.batchGrazings.batchGrazingsList] });

      toaster.success({
        title: text.singularLabel,
        description: text.list.deletedToast,
        duration: 7000,
      });

      navigate(BATCH_GRAZINGS_LIST_ROUTE);
    },
    onError: (error) => {
      console.error('BatchGrazing delete - error:', error);
      const errorMessage = extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError;
      toaster.error({
        title: text.singularLabel,
        description: errorMessage,
        duration: 7000,
      });
    },
  });

  const isDeletingLink = deleteLinkMutation.isPending;

  if (!isValidGuid(uuid)) {
    return null;
  }

  const isLoading = checkLoadingStatus([batchGrazingQuery as any]);
  const batchGrazing = batchGrazingQuery.data as BatchGrazingData | undefined;
  const notFound = !isLoading && (batchGrazingQuery as any).isError;

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
                onClick={() => navigate(BATCH_GRAZINGS_LIST_ROUTE)}
              />
            </EmptyState.Content>
          </EmptyState.Root>
        </Flex>
      </FormContainer>
    );
  }

  const batches = batchGrazing?.batches ?? [];

  return (
    <FormContainer
      title={
        batchGrazing?.code ? `${text.singularLabel} — ${batchGrazing.code}` : text.singularLabel
      }
      headerActions={
        batchGrazing &&
        canDelete && (
          <Button
            title={text.detail.actions.deleteLink}
            icon={FiTrash2 as ElementType}
            colorPalette="red"
            variant="outline"
            size="sm"
            onClick={onOpenDeleteLinkDialog}
          />
        )
      }
    >
      <Box px={{ base: 4, md: 10 }} pb={8}>
        <Skeleton loading={isLoading}>
          <Flex direction="column" gap={6}>
            <DetailPanel title={text.detail.sections.generalData}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField label={text.detail.fields.code} value={batchGrazing?.code ?? '—'} />
                <InfoField
                  label={text.detail.fields.grazing}
                  value={batchGrazing?.grazing.description ?? '—'}
                />
                <InfoField
                  label={text.detail.fields.date}
                  value={batchGrazing?.date ? formatDate(batchGrazing.date) : '—'}
                />
                <InfoField
                  label={text.detail.fields.employee}
                  value={batchGrazing?.employee?.name ?? '—'}
                />
              </SimpleGrid>
            </DetailPanel>

            {/* SEM "UA/Suporte" — não existe na resposta da API (decisão G8,
                contrato de API §7/D5). */}
            <DetailPanel title={text.detail.sections.metrics}>
              <SimpleGrid columns={columnsForm.default} gap={6}>
                <InfoField
                  label={text.detail.fields.hectares}
                  value={
                    batchGrazing?.hectares === null || batchGrazing?.hectares === undefined
                      ? '—'
                      : `${batchGrazing.hectares} ha`
                  }
                />
                <InfoField
                  label={text.detail.fields.animalQuantity}
                  value={
                    batchGrazing?.animals_quantity === null ||
                    batchGrazing?.animals_quantity === undefined
                      ? '—'
                      : String(batchGrazing.animals_quantity)
                  }
                />
                <InfoField
                  label={text.detail.fields.uaQuantity}
                  value={
                    batchGrazing?.ua_quantity === null || batchGrazing?.ua_quantity === undefined
                      ? '—'
                      : String(batchGrazing.ua_quantity)
                  }
                />
                <InfoField
                  label={text.detail.fields.stockingRate}
                  value={
                    batchGrazing?.taxa_lotacao_ua === null ||
                    batchGrazing?.taxa_lotacao_ua === undefined
                      ? '—'
                      : String(batchGrazing.taxa_lotacao_ua)
                  }
                />
              </SimpleGrid>
            </DetailPanel>

            <DetailPanel title={text.detail.sections.batchesLinked}>
              {batches.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {text.list.emptyState.descriptionEmpty}
                </Text>
              ) : (
                <Flex direction="column" gap={3}>
                  {batches.map((batch) => (
                    <Flex key={batch.uuid} justify="space-between" align="center" gap={3}>
                      <Badge colorPalette="gray" variant="subtle" py={1} px={3}>
                        {batch.description}
                      </Badge>
                      {canDelete && (
                        <Button
                          title={text.detail.actions.removeBatch}
                          variant="ghost"
                          size="xs"
                          colorPalette="red"
                          onClick={() => handleRemoveBatchClick(batch)}
                          disabled={isRemovingBatch}
                        />
                      )}
                    </Flex>
                  ))}
                </Flex>
              )}
            </DetailPanel>
          </Flex>
        </Skeleton>
      </Box>

      {/* Remoção de 1 lote — cópia NÃO-destrutiva (`removeBatchDialog`,
          mesma família de `deleteDialog`, TASK-FE-2001). */}
      <DeleteConfirmDialog
        isOpen={isOpenRemoveBatchDialog}
        onClose={() => {
          onCloseRemoveBatchDialog();
          setBatchToRemove(null);
        }}
        onConfirm={handleConfirmRemoveBatch}
        isLoading={isRemovingBatch}
        title={text.removeBatchDialog.title}
        description={text.removeBatchDialog.description}
        warningText={text.removeBatchDialog.warningText}
        confirmButtonText={text.removeBatchDialog.confirm}
        itemName={batchToRemove?.description}
        hideQuestionMark
        tone="warning"
      />

      {/* Exclusão do vínculo INTEIRO — mesma cópia não-destrutiva de
          `deleteDialog` (TASK-FE-2001). */}
      <DeleteConfirmDialog
        isOpen={isOpenDeleteLinkDialog}
        onClose={onCloseDeleteLinkDialog}
        onConfirm={() => deleteLinkMutation.mutate()}
        isLoading={isDeletingLink}
        title={text.deleteDialog.title}
        description={text.deleteDialog.description}
        warningText={text.deleteDialog.warningText}
        confirmButtonText={text.deleteDialog.confirm}
        itemName={batchGrazing?.code}
        hideQuestionMark
        tone="warning"
      />
    </FormContainer>
  );
}
