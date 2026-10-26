import { ReactNode, memo } from 'react';

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuRootProps,
  Portal,
  Text,
} from '@chakra-ui/react';
import { Icon as UiIcon } from './ui/Icon';

import { LanguageDate } from '@/@types/language';

import { Tooltip } from './TooLtip';

// ============================================
// Actions.Item - Menu Item component
// ============================================

interface ActionsItemProps {
  children: ReactNode;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  color?: string;
  disabled?: boolean;
  /**
   * Motivo do `disabled` (ex.: "Adiantamento não pode ser editado.") — quando
   * presente E `disabled=true`, envolve o item num `Tooltip` explicativo
   * (esteira 036, TASK-FE-036-112, guardas de estado Editar/Excluir). O
   * import de `Tooltip` já existia neste arquivo sem uso; este é o
   * cabeamento real do mecanismo, não uma variante nova (conferido via
   * `get_pwa_ui_components_pattern` — `ui/Tooltip` aceita `disabled` para o
   * caso condicional). ADITIVO: sem esta prop, comportamento inalterado.
   */
  disabledReason?: string;
  /**
   * Marca o item como ação irreversível/destrutiva (ex.: excluir). ADITIVO,
   * default `"default"` preserva 100% o comportamento atual. Quando
   * `"danger"`: cor padrão vira o token semântico `feedBack.errorMain` (em
   * vez do `red.400`/`red.500` hardcoded que hoje aparece ad-hoc em telas
   * como Centro de Custo) e o hover ganha o wash vermelho suave
   * `feedBack.error`, fiel ao `DropdownRow` do design system `cerne`
   * (hover: `feedback.error.bg` + `feedback.error.text`). A prop `color`
   * explícita, se passada, ainda vence — não quebra quem já usa `color`.
   */
  tone?: 'default' | 'danger';
}

const ActionsItem = memo(
  ({
    children,
    icon,
    onClick,
    color,
    disabled = false,
    disabledReason,
    tone = 'default',
  }: ActionsItemProps) => {
    const isDanger = tone === 'danger';
    const resolvedColor = color || (isDanger ? 'feedBack.errorMain' : undefined);

    const item = (
      // @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis
      <Menu.Item
        onClick={(e: React.MouseEvent) => {
          // Rede de segurança (esteira 036, TASK-FE-036-112) — mesmo que o
          // Menu.Item headless não suprima o onClick nativo quando
          // `disabled`, este guard garante que a ação NUNCA dispara com o
          // item visualmente desabilitado.
          if (disabled) return;
          e.stopPropagation();
          onClick?.(e);
        }}
        disabled={disabled}
        aria-disabled={disabled}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.5 : 1}
        _hover={{ bg: disabled ? undefined : isDanger ? 'feedBack.error' : 'sidebarItemHoverBG' }}
        px="14px"
        py="9px"
        borderRadius="md"
        gap="8px"
      >
        {icon && (
          <Box color={resolvedColor || 'sidebarTextColor'} flexShrink={0}>
            {icon}
          </Box>
        )}
        <Text fontSize="base" color={resolvedColor || 'fg.default'}>
          {children}
        </Text>
      </Menu.Item>
    );

    if (disabled && disabledReason) {
      return (
        <Tooltip content={disabledReason} showArrow>
          {item}
        </Tooltip>
      );
    }

    return item;
  }
);

ActionsItem.displayName = 'ActionsItem';

// ============================================
// Actions.Separator - divisor entre itens (ex.: antes de uma ação
// destrutiva) — subcomponente NOVO, aditivo; não afeta quem já usa
// Actions/Actions.Item sem ele.
// ============================================

const ActionsSeparator = memo(() => (
  // @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis
  <Menu.Separator borderColor="sidebarBorder" my={1} />
));

ActionsSeparator.displayName = 'ActionsSeparator';

// ============================================
// Actions - Main Menu component
// ============================================

interface ActionsProps extends MenuRootProps {
  text?: string;
  backgroundColorText?: string | undefined;
  backgroundColorMenu?: string | undefined;
  children: ReactNode;
  tooltipLabel?: string;
  languageGB?: LanguageDate;
  size?: 'sm' | 'md' | 'lg';
}

const ActionsComponent = memo(
  ({
    children,
    text,
    backgroundColorText,
    backgroundColorMenu,
    tooltipLabel,
    languageGB,
    size = 'md',
    ...rest
  }: ActionsProps) => {
    const sizeStyles = {
      sm: { minWidth: '28px', width: '28px', height: '28px', fontSize: '15' },
      md: { minWidth: '32px', width: '32px', height: '32px', fontSize: '15' },
      lg: { minWidth: '36px', width: '36px', height: '36px', fontSize: '17' },
    };

    const currentSize = sizeStyles[size];

    return (
      <Flex gap="2">
        {text && (
          <HStack>
            <Box boxSize="2" borderRadius="full" backgroundColor={backgroundColorText} />
            <Text fontSize="md" color="primitiveTexteColor">
              {text}
            </Text>
          </HStack>
        )}
        <Menu.Root positioning={{ placement: 'bottom-end' }} {...rest}>
          {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
          <Menu.Trigger asChild>
            <IconButton
              aria-label={tooltipLabel || languageGB?.defaltStrings?.actions || 'Actions'}
              color="sidebarTextColor"
              backgroundColor={backgroundColorMenu || 'transparent'}
              variant="ghost"
              border="1px solid transparent"
              borderRadius="8px"
              minWidth={currentSize.minWidth}
              width={currentSize.width}
              height={currentSize.height}
              onClick={(e) => e.stopPropagation()}
              _hover={{ bg: 'semanticNeutral.100', borderColor: 'semanticNeutral.200' }}
            >
              <UiIcon name="more-vertical" size={Number(currentSize.fontSize)} />
            </IconButton>
          </Menu.Trigger>
          <Portal>
            {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
            <Menu.Positioner>
              {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
              <Menu.Content
                bg={backgroundColorMenu || 'cardBG'}
                borderRadius="lg"
                boxShadow="lg"
                py={1}
                minW="150px"
                border="1px solid"
                borderColor="sidebarBorder"
              >
                {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
                <Box onClick={(e) => e.stopPropagation()}>{children}</Box>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </Flex>
    );
  }
);

ActionsComponent.displayName = 'Actions';

// ============================================
// Export Actions with Item subcomponent
// ============================================

export const Actions = Object.assign(ActionsComponent, {
  Item: ActionsItem,
  Separator: ActionsSeparator,
});
