// src/styles/recipes/menu.ts
import { defineRecipe } from "@chakra-ui/react";

export const menuRecipe = defineRecipe({
  className: "chakra-menu",
  base: {
    py: "0",
    borderRadius: "2",
    boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.161)",
    border: "none",
    bg: "bg",
    color: "fg",
    minWidth: "3xs",
    zIndex: "dropdown",
  },
  variants: {
    size: {
      xs: {
        py: "1",
        minWidth: "32",
      },
      sm: {
        py: "1",
        minWidth: "36",
      },
      md: {
        py: "2",
        minWidth: "40",
      },
      lg: {
        py: "2",
        minWidth: "44",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});
