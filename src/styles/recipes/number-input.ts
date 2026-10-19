// src/styles/recipes/number-input.ts
import { defineRecipe } from "@chakra-ui/react";

export const numberInputRecipe = defineRecipe({
  className: "chakra-number-input",
  base: {
    position: "relative",
    display: "flex",
    width: "full",
    "& input": {
      width: "full",
      minWidth: "0",
      outline: "none",
      position: "relative",
      appearance: "none",
      transitionProperty: "common",
      transitionDuration: "normal",
    },
  },
  variants: {
    variant: {
      outline: {
        "& input": {
          border: "1px solid",
          borderColor: "border",
          bg: "bg",
          borderRadius: "md",
          px: "3",
          py: "2",
          fontSize: "md",
          _hover: {
            borderColor: "border.emphasized",
          },
          _focus: {
            borderColor: "colorPalette.solid",
            boxShadow: "0 0 0 1px var(--chakra-colors-colorPalette-solid)",
          },
        },
      },
      subtle: {
        "& input": {
          bg: "bg.subtle",
          border: "1px solid transparent",
          px: "3",
          py: "2",
          _hover: {
            bg: "bg.muted",
          },
        },
      },
    },
    size: {
      sm: {
        "& input": {
          fontSize: "sm",
          px: "2.5",
          py: "1.5",
          height: "8",
        },
      },
      md: {
        "& input": {
          fontSize: "md",
          px: "3",
          py: "2",
          height: "38px", // área de input projetada (Ajustes Globais)
        },
      },
      lg: {
        "& input": {
          fontSize: "lg",
          px: "4",
          py: "2",
          height: "12",
        },
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});
