import { ReactNode } from "react";

import { HStack } from "@chakra-ui/react";

interface FormFooterProps {
  children: ReactNode;
  noPadding?: boolean;
  noMargin?: boolean;
  gridRow?: boolean;
  paddingX?: boolean;
}

export function FormFooter({
  children,
  noPadding,
  noMargin,
  gridRow,
  paddingX,
}: FormFooterProps) {
  return (
    <HStack
      marginTop={noMargin ? "0" : "10"}
      paddingBottom={gridRow ? "6" : noPadding ? "0" : "12"}
      paddingX={paddingX ? "10" : "0"}
      gap="4"
    >
      {children}
    </HStack>
  );
}
