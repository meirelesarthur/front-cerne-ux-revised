import { forwardRef } from "react";

import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
  IconButton,
  useMediaQuery,
} from "@chakra-ui/react";

// import { MdOutlineFilterAlt } from 'react-icons/md';
import { AddSquare } from "iconsax-react";

import { LanguageDate } from "@/@types/language";

import { Tooltip } from "./TooLtip";

interface ButtonProps extends ChakraButtonProps {
  languageGB: LanguageDate;
}

export const ButtonAdd = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ languageGB, ...rest }: ButtonProps, ref) => {
    const [isMobile] = useMediaQuery(["(max-width: 850px)"]);
    return (
      <>
        {isMobile ? (
          <Tooltip
            label={languageGB.defaltStrings.new}
            placement="top"
            backgroundColor="semanticNeutral.100"
            color="primitiveTexteColor"
          >
            <IconButton
              {...rest}
              data-tour="btn-add"
              fontSize="2xl"
              aria-label={languageGB.defaltStrings.new}
              variant="outline"
              background={"transparent"}
              ref={ref}
            >
              <AddSquare />
            </IconButton>
          </Tooltip>
        ) : (
          <ChakraButton
            {...rest}
            data-tour="btn-add"
            borderRadius="8px"
            variant="solid"
            ref={ref}
          >
            {languageGB.defaltStrings.new}
            <AddSquare style={{ marginLeft: 8 }} />
          </ChakraButton>
        )}
      </>
    );
  },
);

ButtonAdd.displayName = "ButtonAdd";
