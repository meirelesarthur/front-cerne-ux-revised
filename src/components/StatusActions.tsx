import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { Check } from "@phosphor-icons/react";
import { BiDotsVerticalRounded } from "react-icons/bi";
import { MdBlock } from "react-icons/md";

import { LanguageDate } from "@/@types/language";

import { Status } from "./Status";
import { Tooltip } from "./TooLtip";

interface StatusActionsProps {
  text?: string;
  backgroundColor?: string | undefined;
  tooltipLabel?: string;
  languageGB: LanguageDate;
  watchStatus: boolean;
  handleActivateAndInactivate: () => void;
  handleInactivate?: () => void;
  isOpen?: boolean;
}

export function StatusActions({
  text,
  backgroundColor,
  tooltipLabel,
  isOpen,
  languageGB,
  handleActivateAndInactivate,
  handleInactivate,
  watchStatus,
}: StatusActionsProps) {
  return (
    <Flex gap="2">
      <HStack>
        <Status
          text={
            watchStatus
              ? languageGB.defaltStrings.active
              : languageGB.defaltStrings.inactive
          }
          backgroundColor={watchStatus ? "green.800" : "red.700"}
        />
        <Box
          boxSize="2"
          borderRadius="full"
          backgroundColor={backgroundColor}
        />
      </HStack>
      <Menu.Root
        open={isOpen}
        positioning={{ placement: "bottom-end", gutter: 2, strategy: "fixed" }}
      >
        {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
        <Menu.Trigger asChild>
          <Tooltip
            label={languageGB?.defaltStrings.status}
            placement="top"
            backgroundColor="semanticNeutral.100"
            color="primitiveTexteColor"
          >
            {/* @ts-ignore - custom variant */}
            <IconButton
              aria-label="Options"
              color="primary400"
              backgroundColor="primitiveBG"
              variant="buttonMenu"
              border={"none"}
              height="10"
            >
              {/* Ícone sempre dentro do <Icon /> do Chakra UI */}
              <Icon as={BiDotsVerticalRounded} boxSize={7} />
            </IconButton>
          </Tooltip>
        </Menu.Trigger>
        <Portal>
          {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
          <Menu.Positioner>
            {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
            <Menu.Content>
              {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
              <Menu.Item
                onClick={handleActivateAndInactivate}
                isDisabled={!!watchStatus}
              >
                <Icon as={Check} color="green.800" mr={2} />
                {languageGB.defaltStrings.activate}
              </Menu.Item>
              {/* @ts-ignore ChakraUI v3 headless menu: tipos ainda não compatíveis */}
              <Menu.Item
                onClick={handleActivateAndInactivate}
                isDisabled={!watchStatus}
              >
                <Icon as={MdBlock} color="red.700" mr={2} />
                {languageGB.defaltStrings.inactivate}
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </Flex>
  );
}
