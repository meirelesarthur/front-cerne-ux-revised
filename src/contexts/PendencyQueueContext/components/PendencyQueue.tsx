import {
  CloseButton,
  Flex,
  Heading,
  HStack,
  IconButton,
  VStack,
} from "@chakra-ui/react";

// import { Alert } from "@/components/Alert";

import { useLanguage } from "@/hooks/useLanguage";
import usePendencyQueue from "@/hooks/usePendencyQueue";

export function PendencyQueue() {
  const {
    handleClosePendencyQueue,
    handleRemovePendency,
    pendencyQueue,
    hasMinimized,
    toggleHasMinimized,
    disclosure,
  } = usePendencyQueue();
  const { languageGB } = useLanguage();
  if (!disclosure?.open) return null;

  function minHeight(caracter: number) {
    if (caracter <= 50) return "16";
    if (caracter <= 100) return "80px";
    if (caracter <= 150) return "115px";
    if (caracter <= 200) return "150px";
    if (caracter <= 250) return "185px";
    if (caracter <= 300) return "220px";
    if (caracter <= 350) return "255px";
    if (caracter <= 400) return "290px";
    if (caracter <= 450) return "325px";
    if (caracter <= 500) return "360px";
    if (caracter <= 550) return "395px";
    if (caracter <= 600) return "430px";
    if (caracter <= 650) return "465px";
    if (caracter <= 700) return "500px";
    if (caracter <= 750) return "535px";
    if (caracter <= 800) return "570px";
  }

  function checkPendency() {
    if (pendencyQueue.length === 1) return "-7rem";
    if (pendencyQueue.length === 2) return "-12.75rem";
    if (pendencyQueue.length === 3) return "-18.5rem";
    if (pendencyQueue.length >= 4) return "-18.75rem";
  }

  return (
    <Flex
      flexDirection="column"
      width="460px"
      maxWidth="calc(100% - 2rem)"
      position="fixed"
      right="1rem"
      bottom={hasMinimized ? checkPendency() : "1rem"}
      borderRadius="5px"
      backgroundColor="primitiveBG"
      overflow="hidden"
      zIndex="tooltip"
      boxShadow="0px 2px 10px rgba(0, 0, 0, 0.161)"
      maxHeight="22.25rem"
      transition=".3s bottom ease-in"
    >
      <Flex
        as="header"
        justifyContent="space-between"
        alignItems="center"
        padding="4"
        color="white"
        backgroundColor="gray.700"
        transition="background-color 0.3s"
        maxHeight="14"
      >
        <Heading as="h1" fontSize="sm" fontWeight="bold">
          {languageGB.defaltStrings.notifications}
        </Heading>
        <HStack>
          <IconButton
            aria-label="teste"
            variant="ghost"
            color="gray.300"
            fontSize="xl"
            size="xs"
            // icon={hasMinimized ? <MdExpandLess /> : <MdMinimize />}
            onClick={toggleHasMinimized}
          />
          <CloseButton
            color="gray.300"
            size="sm"
            onClick={handleClosePendencyQueue}
          />
        </HStack>
      </Flex>
      <VStack
        as="section"
        // gap="3"
        flexDirection="column"
        padding="4"
        overflowY="scroll"
      >
        {/* {pendencyQueue.map((pendency) => (
          <Alert
            key={pendency.id}
            status={pendency.status}
            title={pendency.title}
            description={pendency.content}
            minHeight={minHeight(pendency.content.length)}
            onClose={() => handleRemovePendency(pendency.id)}
          />
        ))} */}
      </VStack>
    </Flex>
  );
}
