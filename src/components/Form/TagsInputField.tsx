// src/components/Form/TagsInputField.tsx
import { TagsInput } from "@chakra-ui/react";

import { Field } from "./Field";

interface TagsInputFieldProps {
  label?: string;
  placeholder?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  helperText?: string;
  error?: string;
  tooltip?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  delimiter?: string;
  max?: number;
}

export function TagsInputField({
  label,
  placeholder = "Digite e pressione Enter",
  value,
  onChange,
  helperText,
  error,
  tooltip,
  isRequired,
  isDisabled,
  delimiter = ",",
  max,
}: TagsInputFieldProps) {
  const handleValueChange = (details: { value: string[] }) => {
    onChange(details.value);
  };

  return (
    <Field
      label={label}
      isRequired={isRequired}
      invalid={!!error}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
    >
      <TagsInput.Root
        value={value}
        onValueChange={handleValueChange}
        addOnPaste
        editable
        delimiter={delimiter}
        max={max}
        disabled={isDisabled}
        width="full"
      >
        {/* @ts-ignore */}
        <TagsInput.Control>
          {/* @ts-ignore */}
          <TagsInput.Context>
            {/* @ts-ignore */}
            {(tagsInput: any) =>
              tagsInput.value.map((tag: string, index: number) => (
                /* @ts-ignore */
                <TagsInput.Item key={index} index={index} value={tag}>
                  <TagsInput.ItemPreview>
                    {/* @ts-ignore */}
                    <TagsInput.ItemText>{tag}</TagsInput.ItemText>
                    {/* @ts-ignore */}
                    <TagsInput.ItemDeleteTrigger />
                  </TagsInput.ItemPreview>
                  <TagsInput.ItemInput />
                </TagsInput.Item>
              ))
            }
          </TagsInput.Context>
          {/* @ts-ignore */}
          <TagsInput.Input
            placeholder={placeholder}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
          />
          <TagsInput.ClearTrigger />
        </TagsInput.Control>

        <TagsInput.HiddenInput />
      </TagsInput.Root>
    </Field>
  );
}
