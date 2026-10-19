import { ReactNode } from "react";

import { Box, Flex, useMediaQuery } from "@chakra-ui/react";
import { NavigateFunction } from "react-router-dom";

import { languages } from "@/constants/languages";

import { HeaderWindowColorType } from "@/@types/header-window-color";

import { HeaderFormPrimary } from "./HeaderFormPrimary";

interface ContainerProps {
  children: ReactNode;
  title: string;
  headerColor: HeaderWindowColorType;
  navigate?: NavigateFunction;
}

export function ContainerV2({
  children,
  title,
  headerColor,
  navigate: customNavigate,
}: ContainerProps) {
  const [isMobile] = useMediaQuery(["(max-width: 680px)"]);
  // const navigate = useNavigate();

  // function handleGoBank() {
  //   if (customNavigate) {
  //     customNavigate({ ...customNavigate });
  //   }

  //   navigate(-1);
  // }

  return (
    <>
      <Box width="full">
        <HeaderFormPrimary
          languageGB={languages.US}
          title={title}
          headerColor={headerColor}
          navigate={customNavigate}
        />
        <Flex
          width="full"
          justifyContent="center"
          paddingX={isMobile ? "4" : "8"}
        >
          <Box
            width="full"
            maxWidth="1428px"
            backgroundColor="formBG"
            borderBottomRadius="20px"
            marginTop={20}
          >
            {children}
          </Box>
        </Flex>
      </Box>
    </>
  );
}
