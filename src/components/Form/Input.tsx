// src/components/Form/Input.tsx
import { ElementType, forwardRef, useState } from "react";

import {
  Input as ChakraInput,
  InputProps as ChakraInputProps,
  Icon,
  IconButton,
  InputGroup,
  Skeleton,
} from "@chakra-ui/react";
import { Eye, EyeSlash } from "iconsax-react";
import { RiLock2Line } from "react-icons/ri";

import { Field } from "./Field";

interface InputProps extends ChakraInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  tooltip?: string;
  startElement?: ElementType;
  endElement?: ElementType;
  loading?: boolean;
  isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      label,
      isRequired,
      error,
      helperText,
      tooltip,
      startElement,
      endElement,
      loading = false,
      type,
      ...rest
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    const endElementPassword = isPassword ? (
      <IconButton
        aria-label="Mostrar/ocultar senha"
        variant="ghost"
        fontSize="16px"
        minWidth="18px"
        width="18px"
        onClick={() => setShowPassword(!showPassword)}
      >
        <Icon as={showPassword ? Eye : EyeSlash} size="sm" color="gray.400" />
      </IconButton>
    ) : undefined;

    const startElementPassword = isPassword ? (
      <Icon as={RiLock2Line} size="sm" color="gray.400" />
    ) : undefined;

    return (
      <Field
        label={label}
        isRequired={isRequired}
        invalid={!!error}
        errorText={error}
        helperText={helperText}
        tooltip={tooltip}
      >
        <Skeleton loading={loading} borderRadius="md" width="full">
          <InputGroup
            startElement={
              startElement && !isPassword ? (
                <Icon as={startElement} size="sm" color="gray.400" />
              ) : (
                startElementPassword
              )
            }
            endElement={
              !!endElement && !isPassword ? (
                <Icon as={endElement} size="sm" color="gray.400" />
              ) : (
                endElementPassword
              )
            }
            endOffset={isPassword ? 0 : 0}
          >
            <ChakraInput
              id={name}
              name={name}
              ref={ref}
              type={isPassword ? (showPassword ? "text" : "password") : type}
              {...rest}
            />
          </InputGroup>
        </Skeleton>
      </Field>
    );
  },
);

Input.displayName = "Input";
