import { ReactNode } from "react";

import { Separator, useMediaQuery, VStack } from "@chakra-ui/react";

interface SimpleGridPros {
  children: ReactNode;
  noDivider?: boolean;
  noPadding?: boolean;
  hasDividerBottom?: boolean;
}

export function ContainerTableSecondary({
  children,
  noDivider,
  noPadding,
  hasDividerBottom,
}: SimpleGridPros) {
  const [isMobile] = useMediaQuery(["(max-width: 680px)"]);
  return (
    <>
      {!noDivider && <Separator marginTop="10" />}
      <VStack
        paddingTop={noDivider ? "0" : "10"}
        alignItems="stretch"
        gap="10"
        paddingX={noPadding ? "0" : "10"}
        width="full"
      >
        {children}
      </VStack>
      {hasDividerBottom && (
        <Separator marginBottom="10" color="semanticNeutral.200" />
      )}
    </>
  );
}
