import { memo } from "react";

import {
  Flex,
  Heading,
  Icon,
  IconButton,
  useMediaQuery,
} from "@chakra-ui/react";
import { MdClose, MdInfo } from "react-icons/md";
import { NavigateFunction, useNavigate } from "react-router-dom";

import { HeaderWindowColorType } from "@/@types/header-window-color";
import { LanguageDate } from "@/@types/language";

import { Breadcrumb } from "./Breadcrumb";
import { Tooltip } from "./TooLtip";

interface HeaderSecondaryProps {
  headerColor: HeaderWindowColorType;
  navigate?: NavigateFunction;
  title: string;
  languageGB: LanguageDate;
  breadcrumb?: string[];
  breadcrumbPath?: string[];
  isPublic?: boolean;
  isHelp?: boolean;
  setHelp?: (value: boolean) => void;
}

export const HeaderFormPrimary = memo(
  ({
    headerColor,
    navigate: customNavigate,
    languageGB,
    title,
    breadcrumb,
    breadcrumbPath,
    isPublic,
    isHelp,
    setHelp,
  }: HeaderSecondaryProps) => {
    const navigate = useNavigate();
    const [isMobile] = useMediaQuery(["(max-width: 680px)"]);

    function handleGoBank() {
      if (setHelp) {
        setHelp(false);
        return;
      }
      if (customNavigate) {
        navigate({ ...customNavigate });
      }

      if (window.history.length < 2) {
        window.close();
        return;
      }

      navigate(-1);
    }

    return (
      <Flex
        as="header"
        alignItems="center"
        justifyContent="space-between"
        width={isPublic ? `100%` : `calc(100% - 3.5rem)`}
        height="14"
        backgroundColor={headerColor.bg}
        paddingX={isMobile ? "4" : "8"}
        color={headerColor.color}
        position={"absolute"}
        zIndex={1}
      >
        <Flex alignItems="baseline" flexDirection="column">
          <Heading fontSize="14px" fontWeight="bold">
            {title}
          </Heading>
          {breadcrumb && (
            <Breadcrumb
              items={breadcrumb}
              path={breadcrumbPath}
              noGrid
              color={headerColor.color}
            />
          )}
        </Flex>
        <Flex alignItems="center">
          <Tooltip
            label={languageGB?.defaltStrings.help}
            placement="right-start"
            backgroundColor="semanticNeutral.100"
            color="primitiveTexteColor"
          >
            <IconButton
              aria-label=""
              variant="ghost"
              fontSize="2xl"
              color={headerColor.color}
              _hover={{ color: headerColor.color }}
              onClick={() => setHelp && setHelp(!isHelp)}
              disabled={!!isHelp}
            >
              <Icon as={MdInfo} />
            </IconButton>
          </Tooltip>
          <Tooltip
            label={languageGB?.defaltStrings.close}
            placement="right-start"
            backgroundColor="semanticNeutral.100"
            color="primitiveTexteColor"
          >
            <IconButton
              aria-label=""
              variant="ghost"
              fontSize="2xl"
              color={headerColor.color}
              _hover={{ color: headerColor.color }}
              onClick={handleGoBank}
            >
              <Icon as={MdClose} />
            </IconButton>
          </Tooltip>
        </Flex>
      </Flex>
    );
  },
);
