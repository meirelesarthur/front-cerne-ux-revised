import { ReactNode } from "react";

import {
  AlertRootProps,
  Box,
  CloseButton,
  Flex,
  Icon,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

import { AlertStatus } from "@/components/Alert";

interface NotificationProps extends Omit<AlertRootProps, "status"> {
  description: ReactNode;
  status?: AlertStatus;
  onClose: () => void;
  onView: () => void;
  viewed?: boolean;
  toggleHasMinimized: () => void;
  hasMinimized?: boolean;
}

export function Notification({
  title,
  description,
  onClose,
  status,
  onView,
  viewed,
  toggleHasMinimized,
  hasMinimized,
}: NotificationProps) {
  const { open, onToggle } = useDisclosure();
  const color = status === "error" ? "red.700" : "green.900";
  function handleViews() {
    if (!open && hasMinimized) {
      toggleHasMinimized();
    }
    onToggle();
    onView();
  }

  return (
    <Box
      background={viewed ? "formBG" : "primary"}
      width={"full"}
      borderRadius="md"
      paddingX="2"
      paddingTop="2"
      maxHeight={open ? "full" : "70px"}
      transition="max-height 0.5s ease-in-out"
    >
      <Flex
        flexDirection="row"
        justifyContent={"space-between"}
        alignItems="center"
        paddingX="2"
      >
        <Text as={"b"} fontSize="14px" color={color}>
          {title}
        </Text>
        <CloseButton color="gray.300" onClick={onClose} />
      </Flex>
      <Box
        overflow="hidden"
        maxHeight={open ? "full" : "0"}
        transition="max-height 0.6s ease-in-out"
        color={color}
      >
        <Text fontSize="14px" textAlign={"center"}>
          {description}
        </Text>
      </Box>
      <Flex alignItems="center" justifyContent="center">
        <IconButton
          onClick={handleViews}
          variant="ghost"
          fontSize="2xl"
          aria-label={open ? "Recolher conteúdo" : "Expandir conteúdo"}
          color="gray.300"
        >
          {open ? <Icon as={FiChevronUp} /> : <Icon as={FiChevronDown} />}
        </IconButton>
      </Flex>
    </Box>
  );
}
