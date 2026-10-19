// src/components/AlertLogin.tsx
import { ElementType } from "react";

import {
  AlertDescription,
  AlertTitle,
  Box,
  Alert as ChakraAlert,
  CloseButton,
} from "@chakra-ui/react";

import { AlertStatus, statuses } from "./Alert";

interface AlertLoginProps {
  title?: string;
  description: string;
  status?: AlertStatus;
  closeButton?: boolean;
  onClose?: () => void;
}

export function AlertLogin({
  title = "",
  description,
  status = "info",
  closeButton = false,
  onClose,
  ...rest
}: AlertLoginProps) {
  const currentStatus = statuses[status];
  const rootStatus =
    status === "loading" || status === "edit" ? "info" : status;

  return (
    <ChakraAlert.Root
      minHeight="16"
      status={rootStatus}
      backgroundColor="foreground.4"
      {...rest}
    >
      <Box
        position="absolute"
        left="0"
        height="full"
        width="3px"
        backgroundColor={currentStatus.backgroundColor}
      />

      <ChakraAlert.Indicator
        as={currentStatus.icon as ElementType}
        fontSize="2xl"
        color={currentStatus.backgroundColor}
      />

      <ChakraAlert.Content>
        {title && <AlertTitle ml={2}>{title}</AlertTitle>}
        <AlertDescription ml={2}>{description}</AlertDescription>
      </ChakraAlert.Content>

      {closeButton && (
        <CloseButton
          position="absolute"
          right="8px"
          top="8px"
          onClick={onClose}
        />
      )}
    </ChakraAlert.Root>
  );
}
