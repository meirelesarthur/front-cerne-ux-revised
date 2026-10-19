// src/components/Form/TextArea.tsx
import { ChangeEvent, forwardRef } from 'react';

import { Textarea as ChakraTextarea, Skeleton, TextareaProps } from '@chakra-ui/react';

import { Field } from './Field';

interface Props extends TextareaProps {
  name: string;
  label?: string;
  isRequired?: boolean;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  value?: string;
  maxLength?: number;
  error?: string;
  helperText?: string;
  tooltip?: string;
  loading?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(
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
      tooltip,
      loading = false,
      ...rest
    },
    ref
  ) => (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      tooltip={tooltip}
      isRequired={isRequired}
    >
      <Skeleton loading={loading} borderRadius="md" width="full">
        <ChakraTextarea
          id={name}
          name={name}
          {...rest}
          ref={ref}
          maxLength={maxLength}
          onChange={onChange}
          borderColor="border2"
          value={value}
          minHeight={'32px'}
          paddingTop="4px"
          paddingX="2"
          paddingBottom="0px"
          _hover={{ borderColor: 'border2' }}
        />
      </Skeleton>
    </Field>
  )
);

Textarea.displayName = 'TextArea';
