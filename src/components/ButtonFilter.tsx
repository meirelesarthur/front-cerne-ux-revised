import { forwardRef } from "react";

import {
  Box,
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  Icon,
  useMediaQuery,
} from "@chakra-ui/react";
import { LuSlidersHorizontal } from "react-icons/lu";

import { useLanguage } from "@/hooks/useLanguage";

import { Tooltip } from "./TooLtip";

interface ButtonProps extends ChakraButtonProps {
  filtersApplied: number;
}

export const ButtonFilter = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ filtersApplied, ...rest }: ButtonProps, ref) => {
    const { languageGB } = useLanguage();
    const [isMobile] = useMediaQuery(["(max-width: 850px)"]);

    const appliedCount = filtersApplied ?? 0;
    const hasFilters = appliedCount > 0;

    return (
      <Tooltip
        label={languageGB.defaltStrings.filters}
        placement="top"
        display={isMobile ? "" : "none"}
        backgroundColor="semanticNeutral.100"
        color="primitiveTexteColor"
      >
        <ChakraButton
          {...rest}
          color="loginButtonPrimary"
          _hover={{
            color: "headerModuleActiveColor",
          }}
          variant="ghost"
          background={"transparent"}
          ref={ref}
          fontSize="14px"
        >
          <Icon as={LuSlidersHorizontal} fontSize={18} />
          {isMobile ? "" : languageGB.defaltStrings.filters}
          {hasFilters && (
            <Box
              as="span"
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              minW="18px"
              height="18px"
              px="1.5"
              borderRadius="full"
              bg="loginButtonPrimary"
              color="white"
              fontSize="xs"
              fontWeight="bold"
              lineHeight="1"
            >
              {appliedCount}
            </Box>
          )}
        </ChakraButton>
      </Tooltip>
    );
  },
);

ButtonFilter.displayName = "ButtonFilter";
