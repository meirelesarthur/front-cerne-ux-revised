// src/styles/recipes/checkbox.ts
import { defineRecipe } from "@chakra-ui/react";

export const checkboxRecipe = defineRecipe({
  className: "chakra-checkbox",
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2",
    cursor: "pointer",
    _disabled: {
      cursor: "not-allowed",
      opacity: 0.6,
    },
  },
  variants: {
    variant: {
      outline: {
        "& [data-part=control]": {
          borderWidth: "1px",
          borderColor: "border",
          bg: "bg",
          _checked: {
            bg: "colorPalette.solid",
            borderColor: "colorPalette.solid",
            color: "colorPalette.contrast",
          },
        },
      },
      subtle: {
        "& [data-part=control]": {
          bg: "bg.subtle",
          _checked: {
            bg: "colorPalette.muted",
            color: "colorPalette.fg",
          },
        },
      },
      solid: {
        "& [data-part=control]": {
          bg: "colorPalette.solid",
          color: "colorPalette.contrast",
          _checked: {
            bg: "colorPalette.solid",
            color: "colorPalette.contrast",
          },
        },
      },
    },
    size: {
      sm: {
        "& [data-part=control]": {
          width: "4",
          height: "4",
        },
      },
      md: {
        "& [data-part=control]": {
          width: "5",
          height: "5",
        },
      },
      lg: {
        "& [data-part=control]": {
          width: "6",
          height: "6",
        },
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
  },
});
