// src/styles/recipes/alert.ts
import { defineRecipe } from "@chakra-ui/react";

export const alertRecipe = defineRecipe({
  className: "chakra-alert",
  base: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderRadius: "md",
    padding: "3",
    gap: "3",
    bg: "colorPalette.50",
    borderInlineStartWidth: "3px",
    borderInlineStartColor: "colorPalette.500",
  },
  variants: {
    status: {
      success: {
        colorPalette: "green",
      },
      error: {
        colorPalette: "red",
      },
      warning: {
        colorPalette: "orange",
      },
      info: {
        colorPalette: "blue",
      },
    },
  },
  defaultVariants: {
    status: "info",
  },
});
