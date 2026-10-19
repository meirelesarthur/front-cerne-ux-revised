// src/components/Alert.tsx
import { ReactNode } from "react";

import {
  AlertDescription,
  AlertTitle,
  Center,
  Alert as ChakraAlert,
  CloseButton,
  Flex,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { IconType } from "react-icons";
import {
  MdErrorOutline,
  MdInfoOutline,
  MdOutlineCheck,
  MdOutlineEdit,
  MdOutlineWarningAmber,
} from "react-icons/md";

import { getThemeGB } from "@/utils/auth-token";

export const statuses = {
  info: {
    icon: MdInfoOutline,
    colorScheme: "colorCicle.info",
    colorIcon: "colorIcon.info",
    backgroundColor: "feedBack.infoMain",
  },
  warning: {
    icon: MdOutlineWarningAmber,
    colorScheme: "colorCicle.warn",
    colorIcon: "colorIcon.warn",
    backgroundColor: "feedBack.warnMain",
  },
  success: {
    icon: MdOutlineCheck,
    colorScheme: "colorCicle.success",
    colorIcon: "colorIcon.success",
    backgroundColor: "feedBack.successMain",
  },
  error: {
    icon: MdErrorOutline,
    colorScheme: "colorCicle.error",
    colorIcon: "colorIcon.error",
    backgroundColor: "feedBack.errorMain",
  },
  loading: {
    icon: MdInfoOutline,
    colorScheme: "colorCicle.info",
    colorIcon: "colorIcon.info",
    backgroundColor: "feedBack.infoMain",
  },
  edit: {
    icon: MdOutlineEdit,
    colorScheme: "colorIcon.success",
    colorIcon: "colorIcon.success",
    backgroundColor: "green.600",
  },
};

// 1. O tipo do 'status' agora é a chave do nosso objeto 'statuses'
//    Isso resolve os erros de 'implicit any'
export type AlertStatus = keyof typeof statuses | "edit";
interface AlertProps {
  description: ReactNode;
  title?: string;
  icon?: IconType;
  status?: AlertStatus;
  onClose: () => void;
}

export function Alert({
  description,
  title,
  icon,
  status = "info",
  onClose,
}: AlertProps) {
  const themeInUse = getThemeGB();
  const currentStatus = statuses[status];

  return (
    // 2. Usando a nova estrutura de componente composto
    <ChakraAlert.Root
      position="relative"
      width="full"
      minHeight="20"
      backgroundColor="foreground.1"
      boxShadow="0px 3px 6px rgba(0, 0, 0, 0.161)"
      borderTopLeftRadius="base"
      borderBottomLeftRadius="base"
      _before={{
        position: "absolute",
        left: "0",
        height: "full",
        width: "5px",
        backgroundColor:
          themeInUse !== "light"
            ? currentStatus.colorScheme
            : currentStatus.backgroundColor,
        content: '""',
      }}
    >
      <Flex justifyContent="space-between" alignItems="center" width="full">
        <HStack width="calc(100% - 2rem)">
          <Center
            minWidth="10"
            height="10"
            borderRadius="full"
            backgroundColor={currentStatus.colorScheme}
          >
            <Icon
              // 3. Adicionado ' ' para corrigir o tipo do ícone
              as={icon ? icon : currentStatus.icon}
              fontSize="2xl"
              color={currentStatus.colorIcon}
            />
          </Center>
          <ChakraAlert.Content>
            {title && (
              <AlertTitle color="semanticNeutral.900">{title}</AlertTitle>
            )}
            <AlertDescription
              color="semanticNeutral.700"
              fontSize="sm"
              width="280px"
              dangerouslySetInnerHTML={{ __html: description as string }}
            />
          </ChakraAlert.Content>
        </HStack>
        <CloseButton color="gray.300" onClick={onClose} />
      </Flex>
    </ChakraAlert.Root>
  );
}
