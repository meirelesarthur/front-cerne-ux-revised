import { FormHTMLAttributes, ReactNode, useState } from "react";

import {
  Box,
  BoxProps,
  ChakraComponent,
  CloseButton,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  useMediaQuery,
} from "@chakra-ui/react";

import { columnsForm } from "@/constants/coluns-form";

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  isTabs?: boolean;
  noPadding?: boolean;
  optional?: boolean;
  descriptionOptional?: string;
}

export function FormFilter({
  children,
  noPadding,
  optional,
  descriptionOptional,
  ...rest
}: FormProps & BoxProps) {
  const FormBox = Box as ChakraComponent<"form">;
  const [isMobile] = useMediaQuery(["(max-width: 680px)"]);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <FormBox
      as="form"
      width="full"
      paddingX={noPadding ? "0" : isMobile ? "10" : "20"}
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
              Se você optar por preencher este formulário, os campos marcados
              com
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
        ""
      )}
      <SimpleGrid
        columns={columnsForm.oneColumns}
        gap="4"
        height="70vh"
        overflowY="auto"
      >
        {children}
      </SimpleGrid>
    </FormBox>
  );
}
