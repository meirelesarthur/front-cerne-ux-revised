// src/components/Button.tsx

import { ElementType, forwardRef } from "react";

import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  Icon,
  Text,
} from "@chakra-ui/react";

import { Tooltip } from "./TooLtip";

interface ButtonProps extends ChakraButtonProps {
  title: string;
  icon?: ElementType;
  tooltip?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ title, icon, tooltip, ...rest }, ref) => {
    return (
      <Tooltip label={tooltip} content={tooltip} display={tooltip ? "initial" : "none"}>
        <ChakraButton {...rest} ref={ref}>
          <Text as="span">{title}</Text>
          {icon && <Icon as={icon} fontSize="2xl" />}
        </ChakraButton>
      </Tooltip>
    );
  },
);

Button.displayName = "Button";
