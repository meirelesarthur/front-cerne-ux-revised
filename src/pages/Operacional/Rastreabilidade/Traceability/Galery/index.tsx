// src/pages/Operacional/Rastreabilidade/Traceability/Galery/index.tsx
// -----------------------------------------------------------------------------
// Tela de GALERIA de imagens de 1 Produto (Traceability — Rastreabilidade,
// F-067, TASK-TR-FE-07). Contrato de tela `## 4.3`: grid de cards de imagem
// (mirror `FileManager`, `get_pwa_file_upload_and_export_pattern §1`) +
// upload único por vez (campo `image`, SEM `remove_image` — D18, campo morto
// do legado NÃO recriado) + remoção individual por card, SEM confirm extra
// (legado não tinha, `AM-13`).
//
// Rota: `/operacional/rastreabilidade/produtos/:uuid/galeria`. Só existe
// DEPOIS do 1º save do Produto (a clonagem de galeria do produto anterior,
// `SE-01`, é comportamento do SERVIDOR — esta tela nunca pré-exibe nada além
// do que `GET /traceabilities/{uuid}/galery` devolver).
//
// Mirror ESTRUTURAL: `useChargeDocuments`/`ChargeDocumentsModal`
// (Operacional/Carregamento) para a query FLAT de sub-recurso (`[queryKey.
// rastreabilidade.traceability, uuid, 'galery']`, mesmo racional de chave
// composta que ainda casa por prefixo com `queryKey.rastreabilidade.
// traceability` na invalidação — mirror `useSyncChargeDocuments`) e
// `TraceabilityList/index.tsx` (mutação simples `useMutation` + toaster,
// já que `deleteTraceabilityGaleryImage` devolve `void`, incompatível com o
// contrato `Response<T>` de `useRequest`). Casca `FormContainer` (título +
// botão "Voltar" nativo, mirror `PlatformDocuments/index.tsx` — UX-GAP
// declarado no contrato de tela `## 1`, sem página própria no DS `cerne`
// para galeria).
//
// ⚠️ DIVERGÊNCIA DOCUMENTADA (precedência código real > ficha): a leitura
// DIRETA do backend (`TraceabilityGaleryResource::image`,
// `UploadTraceabilityGaleryImageAction`) mostra que o campo `image` expõe
// SÓ o nome do arquivo (coluna física `varchar(30)`, schema legado — nunca
// um path completo), NUNCA uma URL pronta. O diretório físico
// (`traceability-galeries/`) é uma convenção FIXA do servidor (mesma usada
// por `DestroyTraceabilityGaleryImageAction`), reconstruída aqui só para
// alimentar `resolveStorageUrl` (mesmo helper já usado por `MovementSale`/
// `MovementPurchase` Documents). Gap aditivo recomendado à API (expor
// `image_url` pronto, mirror `DocumentResource.url`) — registrado, não
// bloqueia esta Tarefa.
//
// ⚠️ Rota/menu (contrato de tela `## 6`) — NÃO wireados aqui. O roteamento
// real do projeto vive TODO em `src/router/index.tsx` (arquivo único); o
// path `src/router/v2/private/rastreabilidade.routes.ts` citado na ficha
// não existe no repositório (nenhuma rota de Rastreabilidade — nem listagem,
// nem form — está registrada ainda). Como a ficha já previa essa decisão
// ("adicionada nesta Tarefa OU consolidada em TASK-TR-FE-11, o que executar
// primeiro decide") e as rotas IRMÃS (listagem/form) que a Galeria depende
// para ser alcançável também não existem, a decisão desta Tarefa é DEFERIR
// o wiring completo (list+create+edit+galeria+config+menu `ope-agr-ras`,
// mirror `ope-agr-car`) para `TASK-TR-FE-11`, evitando uma rota órfã editada
// fora de ordem no arquivo consolidado. Documentado aqui para o dono.
// -----------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

import { Box, EmptyState, Icon, Image, SimpleGrid, Skeleton, VStack } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FiAlertTriangle, FiImage, FiTrash2 } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { IconButtonTable } from '@/components/IconButtonTable';
import { FormContainer } from '@/components/Layout/FormContainer';
import { toaster } from '@/components/ui/toaster';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';
import { isValidGuid } from '@/utils/guid';
import { resolveStorageUrl } from '@/utils/resolveStorageUrl';

import { queryKey } from '@/constants/query-key';

import {
  deleteTraceabilityGaleryImage,
  getTraceabilityGalery,
  uploadTraceabilityGalery,
} from '@/services/v2/Rastreabilidade/traceability-service';

import type { TraceabilityGaleryImage } from '@/@types/v2/Rastreabilidade/traceability';

const TRACEABILITY_PRODUCTS_BASE_ROUTE = '/operacional/rastreabilidade/produtos';

// Diretório FIXO do disco `public` (`UploadTraceabilityGaleryImageAction::
// DIRECTORY`/`DestroyTraceabilityGaleryImageAction`, GB.Cerne.Api) — ver
// divergência documentada no cabeçalho do arquivo.
const TRACEABILITY_GALERY_DIRECTORY = 'traceability-galeries';

// Mirror `TraceabilityGaleryRequest::rules()` (`mimes:jpeg,png,jpg,gif,svg`,
// `max:2048` KB) — mesmos limites de `ImageUpload.tsx` (defaults do
// componente), validados aqui client-side ANTES do POST (feedback imediato).
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/jpg,image/gif,image/svg+xml';
const MAX_IMAGE_SIZE_MB = 2;

const GRID_COLUMNS = { base: 2, sm: 3, md: 4, lg: 5 };

function isAcceptedImageType(candidate: File): boolean {
  return ACCEPTED_IMAGE_TYPES.split(',').some((type) => candidate.type === type);
}

export default function TraceabilityGalery() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const text = languageGB.rastreabilidade.traceability.gallery;
  const canEdit = can('traceab_edit');
  const uuidIsValid = isValidGuid(uuid);

  // Guard de navegação — `uuid` ausente/malformado não pode chegar ao
  // `queryFn` (mirror `CreateOrUpdateTraceability.tsx`).
  useEffect(() => {
    if (!uuidIsValid) {
      navigate(TRACEABILITY_PRODUCTS_BASE_ROUTE, { replace: true });
    }
  }, [uuidIsValid, navigate]);

  const galeryQueryKey = [queryKey.rastreabilidade.traceability, uuid, 'galery'];

  const galeryQuery = useQuery({
    queryKey: galeryQueryKey,
    queryFn: async () => {
      const response = await getTraceabilityGalery(uuid!);
      return response.data;
    },
    enabled: uuidIsValid,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Invalida pelo PREFIXO do singular (mirror `useSyncChargeDocuments`) —
  // casa tanto com esta query composta quanto com uma futura query de
  // detalhe do Produto (`getTraceability`, cuja `galery` inline também fica
  // obsoleta após upload/remoção).
  function invalidateGalery() {
    queryClient.invalidateQueries({ queryKey: [queryKey.rastreabilidade.traceability] });
  }

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadTraceabilityGalery(uuid!, file),
    onSuccess: () => {
      invalidateGalery();
      toaster.success({ title: text.title, description: text.savedToast, duration: 7000 });
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (galeryUuid: string) => deleteTraceabilityGaleryImage(uuid!, galeryUuid),
    onSuccess: () => {
      invalidateGalery();
      toaster.success({ title: text.title, description: text.removedToast, duration: 7000 });
    },
    onError: (error) => {
      toaster.error({
        title: text.title,
        description: extractApiErrorMessage(error) ?? languageGB.common.errorLog.unknownError,
        duration: 7000,
      });
    },
  });

  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  function openPicker() {
    if (!canEdit || isUploading) return;
    inputRef.current?.click();
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    if (!isAcceptedImageType(selected)) {
      toaster.error({ title: text.title, description: text.errorType, duration: 7000 });
      return;
    }
    if (selected.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toaster.error({ title: text.title, description: text.errorSize, duration: 7000 });
      return;
    }
    uploadMutation.mutate(selected);
  }

  function imageUrl(item: TraceabilityGaleryImage): string | undefined {
    return resolveStorageUrl(`${TRACEABILITY_GALERY_DIRECTORY}/${item.image}`) ?? undefined;
  }

  const images = galeryQuery.data ?? [];
  const isLoading = galeryQuery.isPending;
  const isEmpty = !isLoading && !galeryQuery.isError && images.length === 0;

  return (
    <FormContainer title={text.title} showDivider>
      {/* Input nativo escondido — disparado por `openPicker()`, mirror
          `ImageUpload.tsx`/`FileUpload.tsx` (dropzone própria não se aplica
          aqui: cada card já-existente ocupa o grid, o upload é um botão de
          ação, não um slot fixo). */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        disabled={!canEdit || isUploading}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {canEdit && !galeryQuery.isError && (
        <Box mb={4} display="flex" justifyContent="flex-end">
          <Button
            title={text.uploadButton}
            variant="outline"
            onClick={openPicker}
            loading={isUploading}
            disabled={isUploading}
          />
        </Box>
      )}

      {galeryQuery.isError ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiAlertTriangle} boxSize={8} color="feedBack.errorMain" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.error.message}</EmptyState.Title>
            </VStack>
            <Button
              variant="outline"
              title={text.error.retry}
              onClick={() => galeryQuery.refetch()}
            />
          </EmptyState.Content>
        </EmptyState.Root>
      ) : isLoading ? (
        <SimpleGrid columns={GRID_COLUMNS} gap={4}>
          {Array.from({ length: 4 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key -- Skeleton estático, sem identidade própria.
            <Skeleton key={index} height="140px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      ) : isEmpty ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Icon as={FiImage} boxSize={8} color="fg.muted" />
            </EmptyState.Indicator>
            <VStack textAlign="center" gap={1}>
              <EmptyState.Title>{text.emptyState}</EmptyState.Title>
            </VStack>
            {canEdit && <Button title={text.uploadButton} onClick={openPicker} />}
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <SimpleGrid columns={GRID_COLUMNS} gap={4}>
          {images.map((item) => (
            <Box
              key={item.uuid}
              position="relative"
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              overflow="hidden"
              bg="bg.subtle"
            >
              <Image
                src={imageUrl(item)}
                alt=""
                objectFit="cover"
                w="full"
                h="140px"
                bg="bg.muted"
              />
              {canEdit && (
                <Box position="absolute" top={2} right={2}>
                  <IconButtonTable
                    aria-label={text.removeButton}
                    mensegerTooltip={text.removeButton}
                    size="sm"
                    variant="solid"
                    bg="bg.default"
                    color="red.500"
                    onClick={() => deleteMutation.mutate(item.uuid)}
                    disabled={isDeleting}
                  >
                    <Icon as={FiTrash2} />
                  </IconButtonTable>
                </Box>
              )}
            </Box>
          ))}
        </SimpleGrid>
      )}
    </FormContainer>
  );
}
