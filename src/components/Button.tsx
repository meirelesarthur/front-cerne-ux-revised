// src/components/Button.tsx

import { ElementType, forwardRef } from "react";

import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  Icon,
  Text,
} from "@chakra-ui/react";

import { Tooltip } from "./TooLtip";

/** Variantes do recipe do projeto (`styles/recipes/button.ts`) — o typegen do Chakra não as conhece. */
export type ButtonVariant =
  | 'solid'
  | 'secondary'
  | 'secondary_semanticNeutral'
  | 'outline'
  | 'ghost'
  | 'ghost_danger'
  | 'ghost_warning'
  | 'solid_danger'
  | 'outline_danger'
  | 'outline_warn'
  | 'solid_warn'
  | 'buttonMenu'
  | 'destructive';

interface ButtonProps extends Omit<ChakraButtonProps, 'variant'> {
  variant?: ButtonVariant | ChakraButtonProps['variant'];
  title: string;
  icon?: ElementType;
  tooltip?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ title, icon, tooltip, ...rest }, ref) => {
    return (
      <Tooltip label={tooltip} content={tooltip} display={tooltip ? "initial" : "none"}>
        <ChakraButton {...(rest as ChakraButtonProps)} ref={ref}>
          <Text as="span">{title}</Text>
          {icon && <Icon as={icon} fontSize="2xl" />}
        </ChakraButton>
      </Tooltip>
    );
  },
);

Button.displayName = "Button";
