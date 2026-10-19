import { Switch as ChakraSwitch } from "@chakra-ui/react";
import * as React from "react";

export interface SwitchProps extends ChakraSwitch.RootProps {
  children?: React.ReactNode;
}

/**
 * Switch Component - Wrapper para Chakra UI v3
 *
 * Uso:
 * <Switch
 *   checked={value}
 *   onCheckedChange={(details) => setValue(details.checked)}
 * />
 */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(props, ref) {
    const { children, ...rest } = props;
    return (
      <ChakraSwitch.Root {...rest}>
        <ChakraSwitch.HiddenInput ref={ref} />
        {/* @ts-ignore - Chakra UI v3 TypeScript definitions don't properly declare children prop */}
        <ChakraSwitch.Control>
          <ChakraSwitch.Thumb />
        </ChakraSwitch.Control>
        {/* @ts-ignore - Chakra UI v3 TypeScript definitions don't properly declare children prop */}
        {children && <ChakraSwitch.Label>{children}</ChakraSwitch.Label>}
      </ChakraSwitch.Root>
    );
  }
);

// Export individual components for advanced usage
export const SwitchRoot = ChakraSwitch.Root;
export const SwitchControl = ChakraSwitch.Control;
export const SwitchThumb = ChakraSwitch.Thumb;
export const SwitchLabel = ChakraSwitch.Label;
export const SwitchHiddenInput = ChakraSwitch.HiddenInput;
