import { ReactNode } from "react";

import { Box, Flex, StackProps } from "@chakra-ui/react";

interface HeaderGridProps extends StackProps {
  children: ReactNode;
  header?: ReactNode;
}

export function HeaderGrid({ children, header, ...rest }: HeaderGridProps) {
  return (
    <Flex
      alignItems="flex-start"
      justifyContent={"space-between"}
      gap="2"
      {...rest}
    >
      <Box>{children}</Box>
      {header && (
        <Flex gap="4" alignItems="center">
          {header}
        </Flex>
      )}
    </Flex>
  );
}
