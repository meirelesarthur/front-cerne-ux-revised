import { ReactNode } from "react";

import { Box, Flex } from "@chakra-ui/react";

interface ContainerProps {
  children: ReactNode;
}

export function ContainerHeaderGrid({ children }: ContainerProps) {
  return (
    <Box
      as={Flex}
      width="full"
      height="fit-content"
      justifyContent="space-between"
    >
      {children}
    </Box>
  );
}
