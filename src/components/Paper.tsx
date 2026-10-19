import { ReactNode } from "react";

import { Box } from "@chakra-ui/react";

interface ContainerProps {
  children: ReactNode;
}

export function Paper({ children }: ContainerProps) {
  return (
    <Box
      width="full"
      height="fit-content"
      padding="2"
      flexFlow="wrap"
      background="formBG"
      boxShadow="md"
      borderRadius="4"
      marginBottom="4"
    >
      {children}
    </Box>
  );
}
