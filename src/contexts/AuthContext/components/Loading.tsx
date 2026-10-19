import { Flex, Text } from "@chakra-ui/react";

import { SpinnerGreenBelt } from "@/components/SpinnerGreenBelt";
import { useLanguage } from "@/hooks/useLanguage";

export function Loading() {
  const { languageGB } = useLanguage();

  return (
    <Flex
      display="flex"
      flexDirection="column"
      position="fixed"
      justifyContent="flex-start"
      alignItems="center"
      backgroundColor="whiteAlpha.500"
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
      <Text fontWeight="semibold" fontSize="lg" color="primitiveTexteColor">
        {languageGB.defaltStrings?.loading || "Loading..."}
      </Text>
    </Flex>
  );
}
