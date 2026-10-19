// src/components/AlertUpdate.tsx
import { ReactNode } from "react";

import {
  Center,
  Alert as ChakraAlert, // Agora é o namespace
  CloseButton,
  Flex,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { IconType } from "react-icons";

import { getThemeGB } from "@/utils/auth-token";

import { AlertStatus, statuses } from "./Alert"; // Reutilizando o objeto statuses

// A prop 'onClose' foi adicionada de volta, pois é necessária para toasts
interface AlertProps {
  description?: ReactNode;
  icon?: IconType;
  status?: AlertStatus;
  onClose: () => void;
}

export function AlertUpdate({
  description,
  icon,
  status = "info",
  onClose,
  ...rest
}: AlertProps) {
  const themeGB = getThemeGB();
  // Corrigido para garantir que o status seja uma chave válida
  const currentStatus = statuses[status as keyof typeof statuses];

  return (
    // Usando a nova estrutura de componente composto
    <ChakraAlert.Root
      position="relative"
      width="full"
      minHeight="20"
      backgroundColor="primitiveBG"
      boxShadow="0px 3px 6px rgba(0, 0, 0, 0.161)"
      borderTopLeftRadius="base"
      borderBottomLeftRadius="base"
      _before={{
        position: "absolute",
        left: "0",
        height: "full",
        width: "5px",
        backgroundColor:
          themeGB !== "light"
            ? currentStatus.colorScheme
            : currentStatus.backgroundColor,
        content: '""',
      }}
      {...rest}
    >
      <Flex justifyContent="space-between" alignItems="center" width="full">
        <HStack width="full">
          <Center
            minWidth="10"
            height="10"
            borderRadius="full"
            backgroundColor={currentStatus.colorScheme}
          >
            <Icon
              as={icon ? icon : currentStatus.icon}
              fontSize="2xl"
              color={currentStatus.colorIcon}
            />
          </Center>
          {/* O conteúdo de texto deve ficar dentro de um Alert.Content */}
          <ChakraAlert.Content>
            <Flex width="full">{description}</Flex>
          </ChakraAlert.Content>
        </HStack>
        {/* Adicionamos o CloseButton para usar a prop 'onClose' */}
        <CloseButton
          color="gray.300"
          onClick={onClose}
          alignSelf="flex-start"
        />
      </Flex>
    </ChakraAlert.Root>
  );
}
