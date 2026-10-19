import { ReactNode } from "react";

import { Box, Flex, useMediaQuery } from "@chakra-ui/react";

interface GridSummaryProps {
  children: ReactNode;
}

export function GridSummary({ children }: GridSummaryProps) {
  const [isMobile] = useMediaQuery(["(max-width: 680px)"]);

  return (
    <Box
      position={"absolute"}
      bottom={4}
      right={isMobile ? 4 : 10}
      background={"white"}
      height="10"
      width={"fit-content"}
      borderRadius="md"
      as={Flex}
      justifyContent={"flex-end"}
      alignItems={"center"}
      gap={6}
      paddingX={10}
      flexDirection="row"
      boxShadow="md"
      border={"1px solid"}
      borderColor="borderGrid"
      color="primitiveTexteColor"
      backgroundColor="gridBG"
    >
      {children}
    </Box>
  );
}
