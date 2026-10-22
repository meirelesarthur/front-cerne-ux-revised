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
        {/* DS ToggleSwitch: trilho 42x22, bolinha 18 branca com sombra, off = neutro 200,
            on = brand 600; a bolinha anda 20px (t.size.toggle). */}
        <ChakraSwitch.Control
          css={{
            width: "42px",
            height: "22px",
            padding: "2px",
            borderRadius: "full",
            bg: "semanticNeutral.200",
            transition: "background 0.2s ease",
            "&[data-state=checked]": { bg: "green.600" },
            "&[data-disabled]": { opacity: 0.5, cursor: "not-allowed" },
          }}
        >
          <ChakraSwitch.Thumb
            css={{
              boxSize: "18px",
              bg: "white",
              boxShadow: "sm",
              translate: "none",
              transform: "translateX(0)",
              transition: "transform 0.2s ease",
              "&[data-state=checked]": { transform: "translateX(20px)", translate: "none" },
            }}
          />
        </ChakraSwitch.Control>
        {/* @ts-ignore - Chakra UI v3 TypeScript definitions don't properly declare children prop */}
        {children && (
          <ChakraSwitch.Label fontSize="base" fontWeight="medium">
            {children}
          </ChakraSwitch.Label>
        )}
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
