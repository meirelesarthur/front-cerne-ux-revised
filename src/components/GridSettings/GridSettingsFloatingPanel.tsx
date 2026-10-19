import { KeyboardEvent, useEffect, useRef, useState } from 'react';

import {
  Flex,
  FloatingPanelCloseTrigger,
  FloatingPanelContent,
  FloatingPanelDragTrigger,
  FloatingPanelHeader,
  FloatingPanelPositioner,
  FloatingPanelRoot,
  FloatingPanelTitle,
  FloatingPanelTrigger,
  HStack,
  Icon,
  IconButton,
  Portal,
} from '@chakra-ui/react';
import { FiColumns, FiX } from 'react-icons/fi';

import { useLanguage } from '@/hooks/useLanguage';

import { GridSettingsPanelBody } from './GridSettingsPanelBody';

import { useGridSettings } from '../../hooks/useGridSettings';

/**
 * Deriva o tipo de retorno do hook sem depender de um export nomeado da
 * interface (o arquivo do hook é de ownership fechada de uma etapa anterior e
 * não expõe `UseGridSettingsResult`). Estruturalmente idêntico: mesmo shape,
 * só muda a forma de obtenção do tipo.
 */
type UseGridSettingsResult = ReturnType<typeof useGridSettings>;

export interface GridSettingsFloatingPanelProps {
  gridSettings: Pick<
    UseGridSettingsResult,
    | 'columnOptions'
    | 'draftLayout'
    | 'draftPresetId'
    | 'draftPresets'
    | 'isDraftDirty'
    | 'canCreatePreset'
    | 'beginDraft'
    | 'cancelDraft'
    | 'applyDraft'
    | 'setDraftColumnState'
    | 'resetDraft'
    | 'selectPreset'
    | 'createPreset'
    | 'renamePreset'
    | 'deletePreset'
    | 'updatePresetFromDraft'
  >;
  /** Obrigatório: rótulo acessível do gatilho — sem default silencioso. */
  triggerLabel: string;
  /** Default: chave já existente `gridSettings.title` — não cria chave nova. */
  title?: string;
  /**
   * Abertura controlada (opcional). Quando `open` é informado, o consumidor
   * controla o estado e recebe `onOpenChange`; caso contrário o painel gere o
   * próprio estado interno (`defaultOpen` só define o valor inicial). Existe
   * para permitir controle externo e tornar o painel testável de forma
   * determinística — o comportamento em produção (uncontrolled) não muda.
   */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Painel flutuante (arrastável, não redimensionável) de personalização da
 * grid V2. É apenas o SHELL: gatilho, header arrastável, trap de foco e o
 * `GridSettingsPanelBody` (presets + reordenar/ocultar colunas + rodapé
 * Restaurar/Cancelar/Aplicar), que concentra a lógica. Baseado no primitivo
 * `FloatingPanel` do Chakra v3 — o primitivo não trava `Tab` dentro do
 * conteúdo, por isso o trap de foco é manual via `onKeyDown` no próprio
 * conteúdo.
 * @return {JSX.Element} O gatilho + painel flutuante de configurações da grid.
 */
export function GridSettingsFloatingPanel({
  gridSettings,
  triggerLabel,
  title,
  open: openProp,
  defaultOpen,
  onOpenChange,
}: GridSettingsFloatingPanelProps) {
  const { languageGB } = useLanguage();
  const resolvedTitle = title ?? languageGB.defaltStrings.gridSettings.title;

  const contentRef = useRef<HTMLDivElement>(null);

  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const open = isControlled ? openProp : internalOpen;
  const wasOpenRef = useRef(false);

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // `beginDraft` na transição fechado -> aberto. No efeito (e não só no callback
  // do zag) para cobrir também abertura controlada/`defaultOpen`, mantendo uma
  // única fonte para o início do rascunho.
  // beginDraft é chamado só na transição fechado->aberto (guardado por ref),
  // por isso o efeito depende apenas de `open` — não re-executa a cada render
  // do consumidor mesmo que `gridSettings` mude de identidade.
  useEffect(() => {
    if (open && !wasOpenRef.current) gridSettings.beginDraft();
    wasOpenRef.current = open;
  }, [open]);

  const handleOpenChange = (details: { open: boolean }) => {
    setOpen(details.open);
  };

  const handleCancel = () => {
    gridSettings.cancelDraft();
    setOpen(false);
  };

  const handleApply = () => {
    gridSettings.applyDraft();
    setOpen(false);
  };

  // Trap de foco manual: o zag-js floating-panel não cicla Tab/Shift+Tab
  // dentro do conteúdo, então o painel — sendo `draggable`/não-modal —
  // precisa reimplementar o ciclo.
  const handleContentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const root = contentRef.current;
    if (!root) return;

    const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !root.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !root.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <FloatingPanelRoot
      open={open}
      onOpenChange={handleOpenChange}
      closeOnEscape
      draggable
      resizable={false}
      // O tamanho padrão do primitivo é 320x240 (FALLBACK_SIZE do zag), o que
      // deixava o painel "comprimido". Alargamos para acomodar as três seções
      // (presets + Visíveis | Ocultas lado a lado); `maxW=calc(100vw - 32px)` no
      // conteúdo garante o responsivo e a altura é limitada por `maxH=80vh`.
      defaultSize={{ width: 720, height: 580 }}
    >
      <FloatingPanelTrigger asChild>
        <IconButton aria-label={triggerLabel} variant="ghost">
          <Icon as={FiColumns} />
        </IconButton>
      </FloatingPanelTrigger>

      <Portal>
        <FloatingPanelPositioner>
          <FloatingPanelContent
            ref={contentRef}
            onKeyDown={handleContentKeyDown}
            maxW="calc(100vw - 32px)"
            maxH="80vh"
            display="flex"
            flexDirection="column"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            borderRadius="xl"
            boxShadow="2xl"
            overflow="hidden"
          >
            <FloatingPanelHeader
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap={3}
              px={4}
              py={3}
              borderBottomWidth="1px"
              flexShrink={0}
            >
              <FloatingPanelDragTrigger asChild>
                <HStack gap={3} flex="1" minW={0} cursor="grab">
                  <Flex
                    boxSize={8}
                    align="center"
                    justify="center"
                    borderRadius="lg"
                    bg="colorPalette.subtle"
                    color="colorPalette.fg"
                    colorPalette="green"
                    flexShrink={0}
                  >
                    <Icon as={FiColumns} boxSize={4} />
                  </Flex>
                  <FloatingPanelTitle fontSize="sm" fontWeight="semibold" lineClamp={1}>
                    {resolvedTitle}
                  </FloatingPanelTitle>
                </HStack>
              </FloatingPanelDragTrigger>

              <FloatingPanelCloseTrigger asChild>
                <IconButton
                  aria-label="Fechar painel de configurações da grade"
                  variant="ghost"
                  size="sm"
                >
                  <Icon as={FiX} />
                </IconButton>
              </FloatingPanelCloseTrigger>
            </FloatingPanelHeader>

            <GridSettingsPanelBody
              gridSettings={gridSettings}
              onCancel={handleCancel}
              onApply={handleApply}
            />
          </FloatingPanelContent>
        </FloatingPanelPositioner>
      </Portal>
    </FloatingPanelRoot>
  );
}
