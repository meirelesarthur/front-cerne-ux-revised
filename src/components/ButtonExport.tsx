import { forwardRef } from "react";

import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  useMediaQuery,
} from "@chakra-ui/react";
import { TbFileArrowRight } from "react-icons/tb";

import { useLanguage } from "@/hooks/useLanguage";

import { Icon } from "@chakra-ui/react";
import { Tooltip } from "./TooLtip";

interface ButtonProps extends ChakraButtonProps {}

export const ButtonExport = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ ...rest }: ButtonProps, ref) => {
    const { languageGB } = useLanguage();
    const [isMobile] = useMediaQuery(["(max-width: 850px)"]);

    return (
      <Tooltip
        label={languageGB.defaltStrings.export || "Exportar"}
        placement="top"
        display={isMobile ? "" : "none"}
        backgroundColor="semanticNeutral.100"
        color="primitiveTexteColor"
      >
        <ChakraButton
          {...rest}
          color="semanticNeutral.700"
          _hover={{
            color: "gray.400",
          }}
          variant="ghost"
          background={"transparent"}
          ref={ref}
          fontSize="14px"
        >
          {isMobile ? "" : languageGB.defaltStrings.export || "Exportar"}
          <Icon as={TbFileArrowRight} fontSize={18} />
        </ChakraButton>
      </Tooltip>
    );
  },
);

ButtonExport.displayName = "ButtonExport";
