// src/components/Form/TextArea.tsx
import { ChangeEvent, forwardRef } from "react";

import { Textarea as ChakraTextarea, TextareaProps } from "@chakra-ui/react";

import { Field } from "./Form/Field";

interface Props extends TextareaProps {
  name: string;
  label?: string;
  isRequired?: boolean;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  value?: string;
  maxLength?: number;
  error?: string;
  helperText?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  (
    {
      name,
      label,
      isRequired,
      error,
      maxLength,
      onChange,
      value,
      helperText,
      ...rest
    },
    ref,
  ) => (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      isRequired={isRequired}
    >
      <ChakraTextarea
        id={name}
        name={name}
        {...rest}
        ref={ref}
        maxLength={maxLength}
        onChange={onChange}
        borderColor="border2"
        value={value}
        minHeight={"32px"}
        paddingTop="4px"
        paddingBottom="0px"
        _hover={{ borderColor: "border2" }}
      />
    </Field>
  ),
);

TextArea.displayName = "TextArea";
