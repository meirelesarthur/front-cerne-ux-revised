import { ReactNode } from "react";

import { SimpleGrid } from "@chakra-ui/react";

import { columnsForm } from "@/constants/coluns-form";

interface SimpleGridFilterProps {
  children: ReactNode;
}

export function SimpleGridFilter({ children }: SimpleGridFilterProps) {
  return (
    <SimpleGrid
      columns={columnsForm.oneColumns}
      gap="4"
      maxHeight="calc(100vh - 185px)"
      overflowY="auto"
      position={"relative"}
      height="full"
      gridAutoRows="min-content"
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {children}
    </SimpleGrid>
  );
}
