import { ReactNode } from "react";

import { Box, useMediaQuery } from "@chakra-ui/react";

interface ContainerTabPanelPros {
  children: ReactNode;
}

export function ContainerTabPanel({ children }: ContainerTabPanelPros) {
  const [isMobile] = useMediaQuery(["(max-width: 850px)"]);

  return (
    <>
      <Box paddingX={isMobile ? "10" : "16"} width="full">
        {children}
      </Box>
    </>
  );
}
