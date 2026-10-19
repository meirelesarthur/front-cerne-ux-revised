import { useEffect, useState } from "react";

import {
  Center,
  Flex,
  Image,
  Text,
  VStack,
  useMediaQuery,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { toaster } from "@/components/ui/toaster";

import { useLanguage } from "@/hooks/useLanguage";

import customToast from "@/utils/custom-toast";

import { Button } from "./Button";

import imageNotFound from "@/assets/404-error-with-portals-amico.png";

export function NotFound() {
  const navigate = useNavigate();
  const [isMobile] = useMediaQuery(["(max-width: 990px)"]);
  const { languageGB } = useLanguage();
  const [isMount, setIsMount] = useState(false);

  setTimeout(() => setIsMount(true), 0);
  useEffect(() => {
    if (isMount) {
      setTimeout(() => navigate(-1), 7000);

      toaster.create(
        customToast({
          status: "warning",
          description: languageGB.defaltStrings.redirected,
          duration: 7000,
        }),
      );
    }
  }, [isMount]);

  return (
    <Flex
      background={
        isMobile
          ? "linear-gradient(to bottom, #37474F 50%, #263238 50%);"
          : "linear-gradient(to bottom, #263238 50%, #37474F 50%);"
      }
      height="100vh"
      width="100vw"
      position="absolute"
      zIndex="998"
      overflow="hidden"
      alignItems="center"
    >
      <Flex
        height="100%"
        width="100%"
        gridColumn="revert"
        flexDirection={isMobile ? "column-reverse" : "row"}
        justifyContent="center"
        alignItems="center"
      >
        <Center
          flexDirection="column"
          flex="1"
          padding="4"
          width={isMobile ? "100%" : "50%"}
          height={isMobile ? "50%" : "100%"}
        >
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="white"
            textAlign="center"
          >
            {languageGB.defaltStrings.pageNotFound}
          </Text>
          <Text color="white" textAlign="center">
            {languageGB.defaltStrings.performNewSearch}
          </Text>
          <VStack>
            <Button
              title={languageGB.defaltStrings.toGoBack}
              marginTop="10"
              onClick={() => navigate(-1)}
            />
          </VStack>
        </Center>
        <Flex
          height={isMobile ? "50%" : "100%"}
          width={isMobile ? "100%" : "50%"}
          alignItems="end"
          justifyContent="center"
        >
          <Image src={imageNotFound} boxSize="90%" objectFit="contain" />
        </Flex>
      </Flex>
    </Flex>
  );
}
