// src/components/Form/InputColor.tsx
import { forwardRef } from "react";

import {
  Box,
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  Flex,
  Skeleton,
} from "@chakra-ui/react";

import { Field } from "./Field";

interface InputColorProps extends Omit<ChakraInputProps, "type" | "value" | "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  isRequired?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export const InputColor = forwardRef<HTMLInputElement, InputColorProps>(
  (
    {
      name,
      label,
      isRequired,
      error,
      helperText,
      loading = false,
      value = "#4D4D4D",
      onChange,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <Field
        label={label}
        isRequired={isRequired}
        invalid={!!error}
        errorText={error}
        helperText={helperText}
      >
        <Skeleton loading={loading} borderRadius="md" width="full">
          <Flex align="center" gap={3}>
            <Box
              as="label"
              position="relative"
              cursor={disabled ? "not-allowed" : "pointer"}
              opacity={disabled ? 0.5 : 1}
            >
              <input
                type="color"
                value={value}
                onChange={handleColorChange}
                disabled={disabled}
                ref={ref}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              />
              <Box
                width="30px"
                height="30px"
                borderRadius="md"
                border="1px solid"
                borderColor="border1"
                bg={value}
                transition="all 0.2s"
                _hover={{
                  borderColor: disabled ? "border1" : "primaryMain",
                }}
              />
            </Box>
            <ChakraInput
              id={name}
              name={name}
              value={value}
              onChange={handleColorChange}
              placeholder="#4D4D4D"
              disabled={disabled || loading}
              {...rest}
            />
          </Flex>
        </Skeleton>
      </Field>
    );
  },
);

InputColor.displayName = "InputColor";
