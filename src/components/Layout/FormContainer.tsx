import React, { ReactNode } from 'react';

import {
  Box,
  Flex,
  Heading,
  Icon,
  IconButton,
  ScrollArea,
  Separator,
  Text,
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

import { Tooltip } from '../TooLtip';
import { PageCard } from '../ui/PageCard';

interface FormContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showDivider?: boolean;
  maxWidth?: string;
  isWidthFull?: boolean;
  /** Ações extras à direita do header (ex.: Badge/Editar em Detalhe de Safra). */
  headerActions?: ReactNode;
  /**
   * Rodapé fixo (opt-in). Quando passado, a casca vira `PageCard fullHeight`:
   * header fixo → corpo com scroll → footer fixo full-width. Ausente = fluxo atual.
   */
  footer?: ReactNode;
  /**
   * Corpo sem padding nem scroll próprios, ocupando a altura útil (casca `PageCard fullHeight`).
   * Para telas que montam o próprio layout interno (ex.: workspace de conciliação).
   * Opt-in — ausente = fluxo atual.
   */
  fullBleed?: boolean;
}

export const FormContainer: React.FC<FormContainerProps> = ({
  title,
  subtitle,
  children,
  showDivider = false,
  // Default full-width para casar com a casca da GRID (`ContainerGrid`): mesma
  // moldura `PageCard` com respiro lateral de `padding="2"` (Ajuste global —
  // formulário passa a respeitar o mesmo layout da listagem). Callsites podem
  // capar passando `maxWidth`/`isWidthFull` (hoje só 1 usa).
  maxWidth = 'full',
  isWidthFull = false,
  headerActions,
  footer,
  fullBleed = false,
}) => {
  const navigate = useNavigate();
  const hasFooter = !!footer;
  const isFull = hasFooter || fullBleed;
  const PAD = 5;

  const header = (
    // Header estilo listagem (Ajustes Globais): sem linha separadora, título
    // maior + texto de apoio pequeno (subtítulo opcional) e botão X no extremo
    // oposto. Sem subtítulo mapeado, o espaço não é ocupado e o form sobe.
    <Box px={PAD} py={3} mb={isFull ? 0 : subtitle ? 6 : 4} flexShrink={0}>
      <Flex alignItems="center" justifyContent="space-between" gap={4}>
        <Box minW={0}>
          <Heading size="lg" fontWeight="600" color="fg.default" lineClamp="1">
            {title}
          </Heading>
          {subtitle && (
            <Text fontSize="sm" color="fg.muted" lineClamp="1">
              {subtitle}
            </Text>
          )}
        </Box>
        <Flex alignItems="center" gap={2} flexShrink={0}>
          {headerActions}
          <Tooltip label="Voltar" placement="bottom" content="Voltar">
            <IconButton
              aria-label="Voltar"
              variant="ghost"
              borderRadius="full"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <Icon as={FiX} boxSize={5} />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
    </Box>
  );

  return (
    <Box width="full" p="2" height={isFull ? '100%' : undefined}>
      <Box
        width="full"
        mx="auto"
        maxWidth={isWidthFull ? 'full' : maxWidth}
        height={isFull ? '100%' : undefined}
      >
        <PageCard fullHeight={isFull}>
          {header}
          {isFull ? (
            <>
              {/* Body com scroll SÓ aqui (header e footer ficam fixos). Barra
                  sutil overlay (`ScrollArea`, Chakra 3.37): fininha, aparece no
                  hover/scroll e NÃO ocupa espaço (fica sobre o conteúdo). */}
              {fullBleed ? (
                <Box flex="1" minH={0} width="full">
                  {children}
                </Box>
              ) : (
              <ScrollArea.Root flex="1" minH={0} width="full" type="hover">
                <ScrollArea.Viewport>
                  <ScrollArea.Content px={PAD} pt={PAD} pb={PAD}>
                    {children}
                  </ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar>
                  <ScrollArea.Thumb />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
              )}
              {hasFooter && (
              <Box
                flexShrink={0}
                borderTop="1px solid"
                borderColor="border2"
                px={PAD}
                py={2.5}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap={3}
              >
                {footer}
              </Box>
              )}
            </>
          ) : (
            <>
              <Box>{children}</Box>
              {showDivider && <Separator marginY="10" borderColor="border1" />}
            </>
          )}
        </PageCard>
      </Box>
    </Box>
  );
};
