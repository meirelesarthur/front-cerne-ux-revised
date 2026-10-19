// src/pages/Operacional/FeedlotMapDashboard/index.tsx
// -----------------------------------------------------------------------------
// Tela do MAPA DE CONFINAMENTO — Operacional/Confinamento. Rota:
// `/operacional/mapa` (guardada por `feedlot-map_view`, TASK-FE-042-200).
//
// Referência UX: `GB.Cerne.UX/src/pages/operacional/mapa-confinamento/
// MapaConfinamentoPage.tsx`@24bd916 — protótipo simplificado (2 níveis,
// dados mock). ADAPTADO (não copiado) para os 80 `surface_id` do contrato
// legado (`[[00-PLANO-ARQUITETURA-mapa]]`): `PageContainer`/`PageCard`/
// `PageHeader` → `ContainerGrid`/`HeaderGrid` (catálogo REAL do
// `frontend_root`, mirror `Autorizacao/index.tsx`); `FilterSelect` → 4
// `DateInput` (FL01-04); `EntityBoard` → `FeedlotMapBoard` (board 3 níveis
// próprio, TASK-FE-042-201 — aba "Mapa e polígonos"/`MapView` NÃO construída,
// sem `surface_id` correspondente, DEC-FE-MAP-02).
//
// Esta Tarefa (200) entrega a CASCA + hook da árvore + filtros locais + nav/
// rota. O board real (`FeedlotMapBoard`, TASK-FE-042-201) e os 8 diálogos
// (`TASK-FE-042-204..216`) consomem o estado de diálogo ativo
// (`useFeedlotMapDialogState`, local ao componente, NUNCA rota, mirror
// `get_pwa_screen_and_router_pattern`) sem precisar tocar em rota/permissão.
// -----------------------------------------------------------------------------

import {
  Box,
  Button as ChakraButton,
  EmptyState,
  Flex,
  Icon,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiBox } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ContainerGrid } from '@/components/ContainerGrid';
import { DateInput } from '@/components/DateInput';
import { HeaderGrid } from '@/components/HeaderGrid';

import { useLanguage } from '@/hooks/useLanguage';
import { usePermissions } from '@/hooks/usePermissions';

import type { FeedlotMapLocalFilters } from '@/@types/v2/FeedlotMap';

import { FeedlotCorralBatchesDialog } from './dialogs/FeedlotCorralBatchesDialog';
import { FeedlotCorralDatesDialog } from './dialogs/FeedlotCorralDatesDialog';
import { FeedlotCorralDeathDialog } from './dialogs/FeedlotCorralDeathDialog';
import { FeedlotCorralDialog } from './dialogs/FeedlotCorralDialog';
import { FeedlotCorralDietDialog } from './dialogs/FeedlotCorralDietDialog';
import { FeedlotCorralSanitaryDialog } from './dialogs/FeedlotCorralSanitaryDialog';
import { FeedlotCorralStatusDialog } from './dialogs/FeedlotCorralStatusDialog';
import { FeedlotCorralTransferDialog } from './dialogs/FeedlotCorralTransferDialog';
import { FeedlotCorralWeighingDialog } from './dialogs/FeedlotCorralWeighingDialog';
import { FeedlotSectorDialog } from './dialogs/FeedlotSectorDialog';
import { FeedlotStreetDialog } from './dialogs/FeedlotStreetDialog';
import { FeedlotYardDialog } from './dialogs/FeedlotYardDialog';
import { FeedlotMapBoard } from './FeedlotMapBoard';
import { FeedlotMapTvOverlay } from './FeedlotMapTvOverlay';
import { useFeedlotMapDialogState } from './useFeedlotMapDialogState';
import { useFeedlotMapFilters } from './useFeedlotMapFilters';
import { useFeedlotMapTree } from './useFeedlotMapTree';

export default function FeedlotMapDashboard() {
  const { languageGB } = useLanguage();
  const { can } = usePermissions();
  const text = languageGB.feedlotMap.feedlotMap;

  const canCreateYard = can('feedlot-yards_create');
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const isTvMode = searchParams.get('view') === 'true';

  const { dialog, openDialog, closeDialog } = useFeedlotMapDialogState();

  const { filters, hasActiveFilters, handleChange, handleReset, isCorralDimmed } =
    useFeedlotMapFilters();
  const treeQuery = useFeedlotMapTree({ isTvMode });

  const yards = treeQuery.data?.yards ?? [];
  const isLoading = treeQuery.isPending;
  const isError = treeQuery.isError;
  const isEmpty = !isLoading && !isError && yards.length === 0;

  function handleOpenNewYard() {
    openDialog({ kind: 'yard', mode: 'create' });
  }

  function handleViewInMap() {
    window.open('/operacional/mapa?view=true', '_blank');
  }

  // "Vender Animais" religado (`DEC-FE-MAP-03` superada, `MovementSale` já
  // existe na SPA) — mirror `Setor.js::handleSaleAnimals`
  // (`window.location.href = '/movement-sales/create?corral_id=' +
  // corral.id`): navega para a criação de Venda de Animais com o curral
  // pré-vinculado. Cerne usa `uuid`, não `id` numérico do legado.
  function handleSellAnimals(corralUuid: string) {
    navigate(`/operacional/venda-animais/novo?corral_id=${corralUuid}`);
  }

  if (isTvMode) {
    return (
      <>
        <FeedlotMapTvOverlay
          yards={yards}
          isCorralDimmed={isCorralDimmed}
          onOpenDialog={openDialog}
          onSellAnimals={handleSellAnimals}
          lastUpdatedAt={treeQuery.dataUpdatedAt}
          onClose={() => setSearchParams({}, { replace: true })}
        />
        <FeedlotMapDialogs dialog={dialog} onClose={closeDialog} />
      </>
    );
  }

  return (
    <ContainerGrid>
      <HeaderGrid
        header={
          canCreateYard ? (
            <Button title={text.page.newYard} onClick={handleOpenNewYard} />
          ) : undefined
        }
      >
        <VStack align="flex-start" gap={1}>
          <Text fontSize="2xl" fontWeight="bold" color="brandColorText">
            {text.page.title}
          </Text>
        </VStack>
      </HeaderGrid>

      <Flex mt={4} gap={3} wrap="wrap" align="flex-end">
        <Box minW="150px">
          <Text fontSize="xs" color="fg.muted" mb={1}>
            {text.filters.entryFrom}
          </Text>
          <DateInput
            value={filters.entryFrom}
            onChange={(value) => handleChange('entryFrom' as keyof FeedlotMapLocalFilters, value)}
          />
        </Box>
        <Box minW="150px">
          <Text fontSize="xs" color="fg.muted" mb={1}>
            {text.filters.entryTo}
          </Text>
          <DateInput
            value={filters.entryTo}
            onChange={(value) => handleChange('entryTo' as keyof FeedlotMapLocalFilters, value)}
          />
        </Box>
        <Box minW="150px">
          <Text fontSize="xs" color="fg.muted" mb={1}>
            {text.filters.exitFrom}
          </Text>
          <DateInput
            value={filters.exitFrom}
            onChange={(value) => handleChange('exitFrom' as keyof FeedlotMapLocalFilters, value)}
          />
        </Box>
        <Box minW="150px">
          <Text fontSize="xs" color="fg.muted" mb={1}>
            {text.filters.exitTo}
          </Text>
          <DateInput
            value={filters.exitTo}
            onChange={(value) => handleChange('exitTo' as keyof FeedlotMapLocalFilters, value)}
          />
        </Box>
        {hasActiveFilters && (
          <ChakraButton variant="ghost" size="sm" onClick={handleReset}>
            {text.filters.clear}
          </ChakraButton>
        )}
        <ChakraButton variant="outline" size="sm" ml="auto" onClick={handleViewInMap}>
          {text.page.viewInMap}
        </ChakraButton>
      </Flex>

      {/* TASK-063-MAPA2-08 — `flex="1"` aqui é herdado do contrato ANTIGO do
          `ContainerGrid` (pré-2646a8d4); hoje o `:last-child` do content box
          já recebe `flex:'0 1 auto'`/`minHeight:0` forçados via CSS (mesmo
          padrão que `Table.tsx` consome), então a prop era ignorada e
          enganosa — removida. `minH={0}` mantido (idêntico ao que a CSS já
          força, inofensivo). */}
      <Box mt={6} minH={0}>
        {isError ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiAlertTriangle} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.error.title}</EmptyState.Title>
                <EmptyState.Description>{text.error.description}</EmptyState.Description>
              </VStack>
              <ChakraButton size="sm" onClick={() => treeQuery.refetch()}>
                {text.error.retry}
              </ChakraButton>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : isEmpty ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={FiBox} boxSize={8} color="fg.muted" />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={1}>
                <EmptyState.Title>{text.emptyState.title}</EmptyState.Title>
                <EmptyState.Description>{text.emptyState.description}</EmptyState.Description>
              </VStack>
              {canCreateYard && <Button title={text.emptyState.cta} onClick={handleOpenNewYard} />}
            </EmptyState.Content>
          </EmptyState.Root>
        ) : isLoading ? (
          <VStack align="stretch" gap={4}>
            {[0, 1, 2].map((index) => (
              <Box key={index} h="120px" borderRadius="md" bg="bg.muted" opacity={0.6} />
            ))}
          </VStack>
        ) : (
          <FeedlotMapBoard
            yards={yards}
            isCorralDimmed={isCorralDimmed}
            onOpenDialog={openDialog}
            onSellAnimals={handleSellAnimals}
          />
        )}
      </Box>
      <FeedlotMapDialogs dialog={dialog} onClose={closeDialog} />
    </ContainerGrid>
  );
}

// Roteador dos 8 diálogos do Mapa (`TASK-FE-042-204..216`) por `dialog.kind`
// — cada Tarefa só adiciona o SEU `case`, sem tocar no resto deste arquivo.
function FeedlotMapDialogs({
  dialog,
  onClose,
}: {
  dialog: ReturnType<typeof useFeedlotMapDialogState>['dialog'];
  onClose: () => void;
}) {
  return (
    <>
      <FeedlotYardDialog
        isOpen={dialog?.kind === 'yard'}
        targetUuid={dialog?.kind === 'yard' ? dialog.targetUuid : undefined}
        onClose={onClose}
      />
      <FeedlotSectorDialog
        isOpen={dialog?.kind === 'sector'}
        targetUuid={dialog?.kind === 'sector' ? dialog.targetUuid : undefined}
        yardUuid={dialog?.kind === 'sector' ? dialog.yardUuid : undefined}
        yardName={dialog?.kind === 'sector' ? dialog.yardName : undefined}
        onClose={onClose}
      />
      <FeedlotStreetDialog
        isOpen={dialog?.kind === 'street'}
        targetUuid={dialog?.kind === 'street' ? dialog.targetUuid : undefined}
        sectorUuid={dialog?.kind === 'street' ? dialog.sectorUuid : undefined}
        streetDescription={dialog?.kind === 'street' ? dialog.streetDescription : undefined}
        streetOrientation={dialog?.kind === 'street' ? dialog.streetOrientation : undefined}
        onClose={onClose}
      />
      <FeedlotCorralDialog
        isOpen={dialog?.kind === 'corral'}
        targetUuid={dialog?.kind === 'corral' ? dialog.targetUuid : undefined}
        sectorUuid={dialog?.kind === 'corral' ? dialog.sectorUuid : undefined}
        mode={dialog?.kind === 'corral' ? dialog.mode : undefined}
        onClose={onClose}
      />
      <FeedlotCorralStatusDialog
        isOpen={dialog?.kind === 'status'}
        targetUuid={dialog?.kind === 'status' ? dialog.targetUuid : undefined}
        corralData={dialog?.kind === 'status' ? dialog.corralData : undefined}
        onClose={onClose}
      />
      <FeedlotCorralBatchesDialog
        isOpen={dialog?.kind === 'lotes'}
        targetUuid={dialog?.kind === 'lotes' ? dialog.targetUuid : undefined}
        corralData={dialog?.kind === 'lotes' ? dialog.corralData : undefined}
        onClose={onClose}
      />
      <FeedlotCorralTransferDialog
        isOpen={dialog?.kind === 'transfer'}
        targetUuid={dialog?.kind === 'transfer' ? dialog.targetUuid : undefined}
        onClose={onClose}
      />
      <FeedlotCorralDatesDialog
        isOpen={dialog?.kind === 'dates'}
        targetUuid={dialog?.kind === 'dates' ? dialog.targetUuid : undefined}
        corralData={dialog?.kind === 'dates' ? dialog.corralData : undefined}
        onClose={onClose}
      />
      <FeedlotCorralDietDialog
        isOpen={dialog?.kind === 'diet'}
        targetUuid={dialog?.kind === 'diet' ? dialog.targetUuid : undefined}
        corralData={dialog?.kind === 'diet' ? dialog.corralData : undefined}
        onClose={onClose}
      />
      <FeedlotCorralDeathDialog
        isOpen={dialog?.kind === 'death'}
        targetUuid={dialog?.kind === 'death' ? dialog.targetUuid : undefined}
        onClose={onClose}
      />
      <FeedlotCorralWeighingDialog
        isOpen={dialog?.kind === 'weighing'}
        targetUuid={dialog?.kind === 'weighing' ? dialog.targetUuid : undefined}
        onClose={onClose}
      />
      <FeedlotCorralSanitaryDialog
        isOpen={dialog?.kind === 'sanitary'}
        targetUuid={dialog?.kind === 'sanitary' ? dialog.targetUuid : undefined}
        onClose={onClose}
      />
    </>
  );
}
