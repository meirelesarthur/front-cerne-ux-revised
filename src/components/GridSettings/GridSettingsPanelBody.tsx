import { KeyboardEvent, useState } from 'react';

import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Separator,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiCheck, FiEdit2, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';

import { Button } from '@/components/Button';

import { GridColumnDndList } from './GridColumnDndList';

import type { GridSettingsFloatingPanelProps } from './GridSettingsFloatingPanel';
import type { GridPreset, GridPresetError } from '../../hooks/useGridSettings';

/**
 * Conteúdo do painel de personalização de grid, DESACOPLADO do primitivo
 * `FloatingPanel` do Chakra. Contém a lógica real (presets, reordenar/ocultar
 * colunas, restaurar/cancelar/aplicar) e é o alvo dos testes de unidade em
 * jsdom — o primitivo `FloatingPanel` (gatilho, arraste, abrir/fechar por
 * ponteiro/teclado) não monta transições no jsdom e é validado apenas na E2E.
 *
 * O `GridSettingsFloatingPanel` compõe este corpo dentro do shell flutuante.
 */
const PRESET_ERROR_MESSAGES: Record<GridPresetError, string> = {
  'no-draft': 'Nenhum rascunho aberto para esta operação.',
  'empty-name': 'Informe um nome para o preset.',
  'name-too-long': 'O nome do preset deve ter no máximo 50 caracteres.',
  'duplicate-name': 'Já existe um preset com esse nome.',
  'limit-reached': 'Limite de 8 presets atingido.',
  'not-found': 'Preset não encontrado.',
};

interface PresetManagerProps {
  draftPresetId: string | null;
  draftPresets: GridPreset[];
  isDraftDirty: boolean;
  canCreatePreset: boolean;
  selectPreset: (presetId: string | null) => GridPresetError | null;
  createPreset: (name: string) => GridPresetError | null;
  renamePreset: (presetId: string, name: string) => GridPresetError | null;
  deletePreset: (presetId: string) => GridPresetError | null;
  updatePresetFromDraft: (presetId: string) => GridPresetError | null;
}

/**
 * Gestor de presets do rascunho: seleção, criação, renomeação, exclusão e
 * atualização a partir do layout corrente. Nenhuma validação de nome/limite é
 * reimplementada aqui: o hook é a única fonte de verdade.
 * @return {JSX.Element} Bloco de gestão de presets.
 */
function PresetManager({
  draftPresetId,
  draftPresets,
  isDraftDirty,
  canCreatePreset,
  selectPreset,
  createPreset,
  renamePreset,
  deletePreset,
  updatePresetFromDraft,
}: PresetManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [createDraftName, setCreateDraftName] = useState('');
  const [renamingPresetId, setRenamingPresetId] = useState<string | null>(null);
  const [renameDraftName, setRenameDraftName] = useState('');
  const [actionError, setActionError] = useState<GridPresetError | null>(null);

  // Seleção fluida: clicar na linha do preset aplica; clicar no ativo desmarca
  // (volta ao layout sem preset). Substitui o antigo <select> nativo.
  const handleSelectPreset = (presetId: string) => {
    const error = selectPreset(presetId === draftPresetId ? null : presetId);
    setActionError(error);
  };

  const startCreate = () => {
    setIsCreating(true);
    setCreateDraftName('');
    setActionError(null);
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setCreateDraftName('');
    setActionError(null);
  };

  const confirmCreate = () => {
    const error = createPreset(createDraftName);
    setActionError(error);
    if (!error) {
      setIsCreating(false);
      setCreateDraftName('');
    }
  };

  const startRename = (preset: GridPreset) => {
    setRenamingPresetId(preset.id);
    setRenameDraftName(preset.name);
    setActionError(null);
  };

  // Escape cancela sem chamar o hook — o rascunho de nome é só local.
  const cancelRename = () => {
    setRenamingPresetId(null);
    setRenameDraftName('');
  };

  const confirmRename = () => {
    if (!renamingPresetId) return;

    const error = renamePreset(renamingPresetId, renameDraftName);
    setActionError(error);
    if (!error) {
      setRenamingPresetId(null);
      setRenameDraftName('');
    }
  };

  const handleDelete = (presetId: string) => {
    const error = deletePreset(presetId);
    setActionError(error);
    if (renamingPresetId === presetId) cancelRename();
  };

  const handleUpdateFromDraft = (presetId: string) => {
    const error = updatePresetFromDraft(presetId);
    setActionError(error);
  };

  return (
    <Box>
      <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" mb={2}>
        Configurações salvas
      </Text>

      {draftPresets.length > 0 && (
        <VStack align="stretch" gap={1.5} mb={3}>
          {draftPresets.map((preset) => {
            const isRenaming = renamingPresetId === preset.id;

            return (
              <Flex
                key={preset.id}
                data-testid={`preset-row-${preset.id}`}
                align="center"
                gap={2}
                px={2}
                py={1.5}
                borderWidth="1px"
                borderColor={preset.id === draftPresetId ? 'colorPalette.emphasized' : 'border'}
                borderRadius="md"
                bg={preset.id === draftPresetId ? 'bg.emphasized' : 'bg.panel'}
                _hover={{ bg: 'bg.muted' }}
              >
                {isRenaming ? (
                  <Input
                    size="sm"
                    flex="1"
                    minW={0}
                    autoFocus
                    aria-label={`Novo nome do preset ${preset.name}`}
                    value={renameDraftName}
                    onChange={(event) => setRenameDraftName(event.target.value)}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        confirmRename();
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelRename();
                      }
                    }}
                  />
                ) : (
                  <>
                    <Box
                      as="button"
                      flex="1"
                      minW={0}
                      textAlign="left"
                      cursor="pointer"
                      bg="transparent"
                      aria-label={`Selecionar preset ${preset.name}`}
                      aria-pressed={preset.id === draftPresetId}
                      onClick={() => handleSelectPreset(preset.id)}
                    >
                      <Text
                        fontSize="sm"
                        lineClamp="1"
                        fontWeight={preset.id === draftPresetId ? 'semibold' : 'normal'}
                      >
                        {preset.name}
                      </Text>
                    </Box>
                    <IconButton
                      aria-label={`Renomear preset ${preset.name}`}
                      size="xs"
                      variant="ghost"
                      onClick={() => startRename(preset)}
                    >
                      <Icon as={FiEdit2} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      aria-label={`Atualizar preset ${preset.name} com o rascunho atual`}
                      size="xs"
                      variant="ghost"
                      disabled={!isDraftDirty}
                      onClick={() => handleUpdateFromDraft(preset.id)}
                    >
                      <Icon as={FiRefreshCw} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      aria-label={`Excluir preset ${preset.name}`}
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleDelete(preset.id)}
                    >
                      <Icon as={FiTrash2} aria-hidden="true" />
                    </IconButton>
                  </>
                )}
              </Flex>
            );
          })}
        </VStack>
      )}

      {isCreating ? (
        <HStack gap={2}>
          <Input
            size="sm"
            flex="1"
            minW={0}
            autoFocus
            placeholder="Nome do preset"
            aria-label="Nome do novo preset"
            value={createDraftName}
            onChange={(event) => setCreateDraftName(event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirmCreate();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelCreate();
              }
            }}
          />
          <IconButton
            aria-label="Confirmar criação do preset"
            size="xs"
            variant="ghost"
            onClick={confirmCreate}
          >
            <Icon as={FiCheck} aria-hidden="true" />
          </IconButton>
          <IconButton
            aria-label="Cancelar criação do preset"
            size="xs"
            variant="ghost"
            onClick={cancelCreate}
          >
            <Icon as={FiX} aria-hidden="true" />
          </IconButton>
        </HStack>
      ) : (
        <Button
          title="Salvar como novo preset"
          variant="outline"
          width="full"
          disabled={!canCreatePreset}
          onClick={startCreate}
        />
      )}

      {actionError && (
        <Text role="alert" color="fg.error" fontSize="xs" mt={2}>
          {PRESET_ERROR_MESSAGES[actionError]}
        </Text>
      )}
    </Box>
  );
}

export interface GridSettingsPanelBodyProps {
  gridSettings: GridSettingsFloatingPanelProps['gridSettings'];
  /** Fechamento com descarte do rascunho (Cancelar). */
  onCancel: () => void;
  /** Confirmação: persiste o rascunho e fecha (Aplicar). */
  onApply: () => void;
}

/**
 * Corpo do painel (rolável) + rodapé de ações. Estrutura de altura:
 * o corpo rola (`overflowY:auto`, `flex:1`) e o rodapé fica fixo
 * (`flexShrink:0`), de modo que Restaurar/Cancelar/Aplicar nunca transbordam,
 * em desktop, largura intermediária ou mobile.
 * @return {JSX.Element} Corpo + rodapé do painel de configurações da grid.
 */
export function GridSettingsPanelBody({
  gridSettings,
  onCancel,
  onApply,
}: GridSettingsPanelBodyProps) {
  const { draftLayout, draftPresets } = gridSettings;

  return (
    <Flex direction="column" flex="1" minH={0}>
      <Box
        display="flex"
        flexDirection="column"
        gap={3}
        px={4}
        py={4}
        overflowY="auto"
        flex="1"
        minH={0}
      >
        {draftLayout && draftPresets ? (
          <>
            <PresetManager
              draftPresetId={gridSettings.draftPresetId}
              draftPresets={draftPresets}
              isDraftDirty={gridSettings.isDraftDirty}
              canCreatePreset={gridSettings.canCreatePreset}
              selectPreset={gridSettings.selectPreset}
              createPreset={gridSettings.createPreset}
              renamePreset={gridSettings.renamePreset}
              deletePreset={gridSettings.deletePreset}
              updatePresetFromDraft={gridSettings.updatePresetFromDraft}
            />

            <Separator />

            <GridColumnDndList
              columnOptions={gridSettings.columnOptions}
              draftLayout={draftLayout}
              setDraftColumnState={gridSettings.setDraftColumnState}
            />
          </>
        ) : null}
      </Box>

      <Separator flexShrink={0} />
      <Flex
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        px={4}
        py={3}
        flexShrink={0}
        flexWrap="wrap"
      >
        <Button
          title="Restaurar padrão"
          variant="ghost"
          onClick={gridSettings.resetDraft}
        />
        <HStack gap={2}>
          <Button title="Cancelar" variant="outline" onClick={onCancel} />
          <Button title="Aplicar" colorPalette="green" onClick={onApply} />
        </HStack>
      </Flex>
    </Flex>
  );
}
