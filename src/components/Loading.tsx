import { Flex } from "@chakra-ui/react";

import { SpinnerGreenBelt } from "./SpinnerGreenBelt";

interface LoadingProps {
  isLoading: boolean;
}

export function Loading({ isLoading }: LoadingProps) {
  return (
    <Flex
      display={isLoading ? "flex" : "none"}
      flexDirection="column"
      position="fixed"
      justifyContent="flex-start"
      alignItems="center"
      backgroundColor="loadingBG"
      zIndex="tooltip"
      top="0"
      right="0"
      bottom="0"
      left="0"
      paddingTop="50vh"
      width="100vw"
      height="100vh"
    >
      <SpinnerGreenBelt />
    </Flex>
  );
}
