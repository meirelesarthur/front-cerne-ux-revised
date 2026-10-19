// src/styles/recipes/tooltip.ts
// Migração do Tooltip para Chakra UI v3 - padrão headless
import { defineRecipe } from "@chakra-ui/react";

export const tooltipRecipe = defineRecipe({
  className: "chakra-tooltip",
  base: {
    bg: "bg.inverted",
    color: "fg.inverted",
    borderRadius: "md",
    fontWeight: "normal",
    fontSize: "sm",
    px: "2.5",
    py: "1.5",
    maxWidth: "xs",
    border: "1px solid",
    borderColor: "borderGrid",
    boxShadow: "sm",
    zIndex: "tooltip",
  },
  variants: {},
  defaultVariants: {},
});
