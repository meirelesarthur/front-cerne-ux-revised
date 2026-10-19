import { ReactNode } from "react";

import { Flex, useMediaQuery } from "@chakra-ui/react";

import { LanguageDate } from "@/@types/language";

interface HeaderFormProps {
  children: ReactNode;
  languageGB: LanguageDate;
}

export function HeaderForm({ children }: HeaderFormProps) {
  const [isMobile] = useMediaQuery(["(max-width: 680px)"]);

  return (
    <Flex
      justifyContent="space-between"
      alignItems="center"
      paddingTop="2"
      paddingX={isMobile ? "10" : "10"}
      paddingBottom="2"
    >
      {children}
    </Flex>
  );
}
