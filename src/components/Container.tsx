import { ReactNode, memo } from "react";

import { Box, Flex, Separator, useMediaQuery } from "@chakra-ui/react";
import { NavigateFunction } from "react-router-dom";

import { headerWindowColor } from "@/constants/header-window-color";

import { LanguageDate } from "@/@types/language";

import { HeaderFormPrimary } from "./HeaderFormPrimary";

interface ContainerProps {
  headerColor: boolean;
  navigate?: NavigateFunction;
  children: ReactNode;
  title: string;
  languageGB: LanguageDate;
  bradcrumb?: string[];
  breadcrumbPath?: string[];
  divider?: boolean;
  isPublic?: boolean;
  isWidthFull?: boolean;
  isHelp?: boolean;
  setHelp?: (value: boolean) => void;
  helpContent?: ReactNode;
}

export const Container = memo(
  ({
    headerColor,
    navigate: customNavigate,
    children,
    languageGB,
    title,
    bradcrumb,
    breadcrumbPath,
    divider,
    isPublic,
    isWidthFull,
    isHelp,
    setHelp,
    helpContent,
  }: ContainerProps) => {
    const [isMobile] = useMediaQuery(["(max-width: 680px)"]);

    return (
      <>
        <Box width="full">
          <HeaderFormPrimary
            title={title}
            languageGB={languageGB}
            headerColor={
              headerColor ? headerWindowColor.update : headerWindowColor.create
            }
            navigate={customNavigate}
            breadcrumb={bradcrumb}
            breadcrumbPath={breadcrumbPath}
            isPublic={isPublic}
            isHelp={isHelp}
            setHelp={setHelp}
          />
          <Flex
            width="full"
            justifyContent="center"
            paddingX={isMobile ? "4" : "8"}
          >
            <Box
              width="full"
              maxWidth={
                isWidthFull || (isHelp && !!helpContent) ? "full" : "1428px"
              }
              backgroundColor="formBG"
              borderBottomRadius="20px"
              marginTop={14}
              boxShadow="1px 4px 10px rgba(0, 0, 0, 0.15)"
            >
              {isHelp && helpContent ? helpContent : children}
              {divider && (
                <Separator marginY="10" color="semanticNeutral.200" />
              )}
            </Box>
          </Flex>
        </Box>
      </>
    );
  },
);
