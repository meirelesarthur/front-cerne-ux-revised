import React, { FormHTMLAttributes, ReactNode, useState } from 'react';

import { Box, BoxProps, ChakraComponent, CloseButton, Flex, Heading, Text } from '@chakra-ui/react';

import { configureSpacing } from '@/utils/config-padding';

import { FormBodyFilter } from './FormBodyFilter';
import { FormFooterFilter } from './FormFooterFilter';

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  isTabs?: boolean;
  noPadding?: boolean;
  optional?: boolean;
  descriptionOptional?: string;
  formFilter?: boolean;
}

export function Form({
  children,
  noPadding,
  optional,
  descriptionOptional,
  formFilter,
  ...rest
}: FormProps & BoxProps) {
  const FormBox = Box as ChakraComponent<'form'>;
  const [isOpen, setIsOpen] = useState(true);
  const { formSpacing: paddingForm } = configureSpacing();

  let footerContent: ReactNode = null;
  const mainContent: ReactNode[] = [];

  if (formFilter) {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === FormFooterFilter) {
        footerContent = child;
      } else {
        mainContent.push(child);
      }
    });
  }

  return (
    <FormBox
      as="form"
      width="full"
      height={formFilter ? 'full' : 'fit-content'}
      paddingX={noPadding ? '0' : paddingForm.paddingX}
      noValidate
      {...rest}
    >
      {optional && isOpen ? (
        <Flex
          marginBottom="10"
          height="16"
          justifyContent="space-between"
          alignItems="center"
          background="semanticNeutral.100"
          padding="2"
          borderRadius="4"
        >
          <Flex flexDirection="column">
            <Heading
              fontSize="xl"
              fontWeight="semibold"
              color="semanticNeutral.700"
              marginBottom="3px"
            >
              Preenchimento opcional
            </Heading>
            <Flex>
              Se você optar por preencher este formulário, os campos marcados com
              <Flex color="red.800" paddingX="4px">
                *
              </Flex>
              são obrigatórios.
            </Flex>
            <Text>{descriptionOptional}</Text>
          </Flex>
          <CloseButton color="gray.300" onClick={() => setIsOpen(false)} />
        </Flex>
      ) : (
        ''
      )}
      {formFilter ? (
        <Box width="full" height="full">
          <Flex direction="column" justify="space-between" height="full">
            {mainContent}
            {footerContent}
          </Flex>
        </Box>
      ) : (
        children
      )}
    </FormBox>
  );
}

Form.BodyFilter = FormBodyFilter;
Form.FooterFilter = FormFooterFilter;

export { Field } from './Field';
export { Input } from './Input';
export { InputMask } from './InputMask';
export { InputReadOnly } from './InputReadOnly';
export { MaskedInput } from './MaskedInput';
export { Textarea as TextArea } from './InputTextArea';
export { NumberInput } from './NumberInput';
export { Select } from './Select';
export { SelectAsyncPaginate } from './SelectAsyncPaginate';
export { TagsInputField } from './TagsInputField';
