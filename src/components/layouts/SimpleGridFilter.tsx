// src/components/layouts/SimpleGridFilter.tsx
import { forwardRef, ReactNode } from "react";

import { SimpleGrid, SimpleGridProps } from "@chakra-ui/react";

import { columnsForm } from "@/constants/coluns-form";

interface SimpleGridFilterProps extends SimpleGridProps {
  children: ReactNode;
}

// Envolvemos o componente com forwardRef para ele poder receber a ref
export const SimpleGridFilter = forwardRef<
  HTMLDivElement,
  SimpleGridFilterProps
>(({ children, ...rest }, ref) => {
  return (
    <SimpleGrid
      ref={ref} // E passamos a ref para o SimpleGrid
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
      {...rest}
    >
      {children}
    </SimpleGrid>
  );
});

SimpleGridFilter.displayName = "SimpleGridFilter";
