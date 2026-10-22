import { ReactNode } from 'react';

import { Box, Dialog, Flex, HStack, Icon, Portal, Text } from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

import { Button } from '@/components/Button';

import type { IconType } from 'react-icons';

// ============================================
// Props
// ============================================

/** Tons suportados pelo `callout` informativo do body. */
export type CustomDialogCalloutTone = 'info' | 'warning' | 'danger' | 'neutral';

/**
 * Config por tom. Fundo é SEMPRE `bg.muted` (neutro, já de baixa ênfase nos
 * dois temas) — só o ícone e a borda esquerda carregam a cor do tom, via
 * `colorIcon.*` (mesmo token que os ícones de StatCard usam, já calibrado
 * para não "gritar" no dark). Evita o problema do `feedBack.warn` sozinho
 * como fundo: no dark ele é `yellow.500` (saturado, nada sutil) — aqui o
 * fundo nunca muda de tom, só o acento.
 */
const calloutToneConfig: Record<CustomDialogCalloutTone, { accent: string; icon: IconType }> = {
  info: { accent: 'colorIcon.info', icon: FiInfo },
  warning: { accent: 'colorIcon.warn', icon: FiInfo },
  danger: { accent: 'colorIcon.error', icon: FiInfo },
  neutral: { accent: 'fg.muted', icon: FiInfo },
};

/**
 * Callout informativo e sutil do body. Aceita um `ReactNode` livre (render
 * total sob controle do consumidor) ou uma config `{ tone, icon, children }`
 * que aplica o banner padrão (fundo de baixa ênfase por token semântico,
 * ícone + texto discretos, theme-aware).
 */
export interface CustomDialogCalloutConfig {
  /** Tom semântico do banner. Default `'info'`. */
  tone?: CustomDialogCalloutTone;
  /** Ícone customizado (default: `FiInfo` para todos os tons). */
  icon?: IconType;
  /** Conteúdo do callout. */
  children: ReactNode;
}

export interface CustomDialogProps {
  /** Controle de abertura */
  isOpen: boolean;
  /** Callback ao fechar */
  onClose: () => void;
  /** Título do dialog (string ou ReactNode para ícone + texto) */
  title?: ReactNode;
  /**
   * Subtítulo opcional, renderizado sob o título em fonte menor e
   * `color="fg.muted"`. ADITIVO — sem esta prop nada muda no header.
   */
  subtitle?: ReactNode;
  /** Ícone exibido ao lado do título */
  titleIcon?: any;
  /** Cor do ícone do título */
  titleIconColor?: string;
  /**
   * Banner informativo OPCIONAL e SUTIL, renderizado no body acima de
   * `children`. Aceita um `ReactNode` livre ou `{ tone, icon, children }`
   * para o banner padrão (fundo de baixa ênfase por token semântico,
   * nunca branco fixo/card destoante). ADITIVO — default `undefined` = sem
   * callout, nada muda para quem não usa a prop.
   */
  callout?: ReactNode | CustomDialogCalloutConfig;
  /** Conteúdo principal (body) */
  children: ReactNode;
  /** Footer customizado. Se não informado, exibe botão "Fechar" */
  footer?: ReactNode;
  /** Se false, oculta o footer completamente */
  showFooter?: boolean;
  /** Tamanho do dialog (Chakra sizes). `form` = size responsiva padrão de
   *  modal de FORMULÁRIO (~80vw, teto 1200px; altura pelo conteúdo) — prefira-a
   *  a hard-codar `maxW`/`maxH` por modal. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'form' | 'full';
  /** Largura máxima customizada */
  maxW?: string;
  /**
   * Largura mínima customizada. ADITIVO e OPCIONAL — default `undefined`
   * preserva 100% o comportamento atual (sem piso de largura) para quem já
   * usa `CustomDialog` sem a prop. Útil para conteúdo curto (ex.: diálogo de
   * confirmação) que, sem um piso, pode renderizar mais estreito/baixo do
   * que o confortável.
   */
  minW?: string;
  /** Altura máxima customizada */
  maxH?: string;
  /** Se true, não fecha ao clicar fora */
  preventCloseOnOutside?: boolean;
  /** Borda no footer */
  footerBorder?: boolean;
  /**
   * Borda inferior no header (simétrica à `footerBorder`), só renderizada
   * quando há `title` (header presente). Default `true` — padrão para
   * todos os modais; use `false` para casos especiais que não a querem.
   */
  headerBorder?: boolean;
  /** Scroll no body */
  scrollableBody?: boolean;
  /**
   * FIX de homologação (mirror `ChargeReportModal.tsx`/`WeaningReportModal.tsx`,
   * GAP-OS-05) — o calendário do `DateInput` (react-datepicker) escapa via
   * `portalId="date-input-portal"` para um nó FORA da árvore do
   * `Dialog.Content` (irmão direto de `document.body`). O Dialog v3 (Zag/Ark)
   * é `modal` por padrão: ao abrir, aplica `pointer-events: none` no
   * `<body>` e só EXCETUA os nós listados aqui — sem essa exceção, o clique
   * num dia do calendário atravessa o próprio calendário (pointer-events
   * bloqueado), acerta o `Dialog.Backdrop` por trás e o Dialog trata como
   * clique-fora, fechando o modal antes de aplicar a data. Passthrough
   * opcional para `Dialog.Root` — `undefined` mantém o comportamento atual
   * para os demais consumidores de `CustomDialog`.
   */
  persistentElements?: (() => HTMLElement | null)[];
}

// ============================================
// Component
// ============================================

/**
 * Modal de ação padrão do GB Cerne. Use `CustomDialog` para TODO modal novo
 * (confirmação, formulário, relatório, aviso) e varie apenas `size`
 * (`xs`..`full`, ou `maxW`/`maxH` customizados) — não crie `Dialog.Root` cru.
 *
 * Estrutura fiel ao design system `cerne`: título (+ `titleIcon` opcional,
 * com linha separadora abaixo do header via `headerBorder`, default `true`)
 * → `subtitle` opcional → `callout` informativo opcional (banner sutil,
 * baixa ênfase) → `children` (body) → footer com linha separadora
 * (`footerBorder`, default `true`) e botões espaçados entre si (`footer`
 * custom ou o botão "Fechar" default). O botão PRIMÁRIO do footer deve vir do componente
 * `@/components/Button` com `variant="solid"` (default) para herdar o verde
 * de marca em dark via os tokens `buttonSolidBG`/`buttonSolidColor` do tema —
 * nunca hex fixo. Ação destrutiva usa `variant="destructive"` (ou
 * `colorPalette="red"` nos consumidores legados) e permanece vermelha.
 *
 * @return {JSX.Element} O modal renderizado.
 */
export function CustomDialog({
  isOpen,
  onClose,
  title,
  subtitle,
  titleIcon,
  titleIconColor = 'blue.500',
  callout,
  children,
  footer,
  showFooter = true,
  size = 'md',
  maxW,
  minW,
  maxH,
  preventCloseOnOutside = false,
  footerBorder = true,
  headerBorder = true,
  scrollableBody = false,
  persistentElements,
}: CustomDialogProps) {
  const calloutConfig =
    callout && typeof callout === 'object' && !('$$typeof' in (callout as object))
      ? (callout as CustomDialogCalloutConfig)
      : undefined;
  const calloutNode = calloutConfig ? undefined : (callout as ReactNode | undefined);

  // `size="form"` é semântica do CustomDialog (NÃO é size nativa do Dialog):
  // modal de FORMULÁRIO responsivo ao tamanho da tela (~80vw, teto 1200px;
  // altura pelo conteúdo até a `maxH`). Traduzida aqui para uma size nativa
  // válida + `maxW` responsiva — o número mora UMA vez só, global, em vez de
  // hard-codado por modal.
  const isFormSize = size === 'form';
  const dialogSize = isFormSize ? 'xl' : size;
  // DS Modal: sm 400 · md 520 · lg 640 (px). Sem `maxW`, essas larguras valem para as sizes do kit.
  const dsWidth = { sm: '400px', md: '520px', lg: '640px' } as const;
  const resolvedMaxW =
    maxW ?? (isFormSize ? 'min(1200px, 80vw)' : dsWidth[size as keyof typeof dsWidth]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => {
        if (!e.open) onClose();
      }}
      size={dialogSize}
      closeOnInteractOutside={!preventCloseOnOutside}
      lazyMount
      unmountOnExit
      {...(persistentElements ? { persistentElements } : {})}
    >
      <Portal>
        {/* DS: overlay rgba(0,0,0,.45) (t.color.overlay.modal) */}
        <Dialog.Backdrop bg="rgba(0, 0, 0, 0.45)" />
        {/* @ts-ignore */}
        <Dialog.Positioner>
          {/* @ts-ignore */}
          <Dialog.Content
            bg="cardBG"
            // DS Modal: raio 20, sombra `modal`, contorno 1px neutro
            borderRadius="3xl"
            boxShadow="modal"
            borderWidth="1px"
            borderColor="border.muted"
            p={0}
            // Casca de modal (equivalente do C14 para formulários): o
            // `Dialog.Content` é um flex-column LIMITADO em altura — header e
            // footer FIXOS (`flexShrink:0`), só o body rola (`flex:1; minH:0;
            // overflowY:auto`). `maxH` default `85vh` garante margem em
            // cima/baixo e impede o modal de crescer com o conteúdo (nunca o
            // header/footer scrollam). `overflow:hidden` no content preserva o
            // `borderRadius` ao cortar o body rolante.
            display="flex"
            flexDirection="column"
            overflow="hidden"
            maxH={maxH ?? '85vh'}
            {...(resolvedMaxW ? { maxW: resolvedMaxW } : {})}
            {...(minW ? { minW } : {})}
          >
            {title && (
              <Dialog.Header
                flexShrink={0}
                px="20px"
                py="16px"
                {...(headerBorder ? { borderBottomWidth: '1px', borderColor: 'border.muted' } : {})}
              >
                <Flex direction="column" gap={subtitle ? 1 : 0}>
                  {/* @ts-ignore */}
                  <Dialog.Title fontSize="16px" fontWeight="semibold" lineHeight="1.35">
                    {titleIcon ? (
                      <HStack gap={2}>
                        <Icon as={titleIcon} color={titleIconColor} />
                        {typeof title === 'string' ? <Text>{title}</Text> : title}
                      </HStack>
                    ) : typeof title === 'string' ? (
                      <Text>{title}</Text>
                    ) : (
                      title
                    )}
                  </Dialog.Title>
                  {subtitle && (
                    <Text fontSize="base" color="fg.muted" fontWeight="normal">
                      {subtitle}
                    </Text>
                  )}
                </Flex>
              </Dialog.Header>
            )}

            {/* Body = ÚNICA área rolante do modal (header/footer ficam fixos).
                Longhands `flexGrow=0`/`flexShrink=1`/`flexBasis=auto` (NÃO o
                shorthand `flex`, que NÃO vence o `flex:"1"` do recipe do modal):
                a altura segue o CONTEÚDO — modal curto fica curto (sem faixa
                morta embaixo do footer); quando o conteúdo passa da `maxH` do
                content, o body encolhe e rola. `scrollableBody` é legado/no-op. */}
            <Dialog.Body
              flexGrow={0}
              flexShrink={1}
              flexBasis="auto"
              minH={0}
              overflowY="auto"
              p="20px"
            >
              {callout && (
                <Box
                  mb={4}
                  px={3}
                  py={2.5}
                  borderRadius="md"
                  bg="bg.muted"
                  borderLeftWidth={calloutConfig ? '3px' : undefined}
                  borderLeftColor={
                    calloutConfig
                      ? calloutToneConfig[calloutConfig.tone ?? 'info'].accent
                      : undefined
                  }
                >
                  {calloutConfig ? (
                    <HStack align="flex-start" gap={2}>
                      <Icon
                        as={
                          calloutConfig.icon ?? calloutToneConfig[calloutConfig.tone ?? 'info'].icon
                        }
                        color={calloutToneConfig[calloutConfig.tone ?? 'info'].accent}
                        boxSize={4}
                        mt="2px"
                        flexShrink={0}
                      />
                      <Text fontSize="sm" color="cardTextSecondary">
                        {calloutConfig.children}
                      </Text>
                    </HStack>
                  ) : (
                    calloutNode
                  )}
                </Box>
              )}
              {children}
            </Dialog.Body>

            {showFooter && (
              <Flex
                flexShrink={0}
                justify="flex-end"
                gap="8px"
                px="20px"
                py="16px"
                {...(footerBorder ? { borderTopWidth: '1px', borderColor: 'border.muted' } : {})}
              >
                {footer ?? <Button title="Fechar" variant="outline" onClick={onClose} />}
              </Flex>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
