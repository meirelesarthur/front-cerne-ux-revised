import { ReactNode } from "react";

import { Box, Flex, StackProps } from "@chakra-ui/react";
import { createPortal } from "react-dom";

import { useEmbeddedList } from "./EmbeddedList";

interface HeaderGridProps extends StackProps {
  children: ReactNode;
  header?: ReactNode;
}

export function HeaderGrid({ children, header, ...rest }: HeaderGridProps) {
  const embedded = useEmbeddedList();

  // Lista embutida (`EmbeddedList`): o título some e os botões vão para a
  // linha da busca, no ponto que a `ListToolbar` registrou.
  if (embedded?.actionsTarget) {
    return header ? createPortal(header, embedded.actionsTarget) : null;
  }

  // Lista embutida SEM `ListToolbar`: a mesma linha, sem a busca.
  if (embedded) {
    return (
      <Flex align="center" gap="10px" wrap="wrap" mt={2} mb={3}>
        {embedded.toolbarStart}
        <Box flex="1" />
        {header}
        {embedded.toolbarEnd}
      </Flex>
    );
  }

  return (
    <Flex
      alignItems="flex-start"
      justifyContent={"space-between"}
      gap="2"
      {...rest}
    >
      <Box>{children}</Box>
      {header && (
        <Flex gap="4" alignItems="center">
          {header}
        </Flex>
      )}
    </Flex>
  );
}
