// src/styles/recipes/radio.ts
import { defineRecipe } from "@chakra-ui/react";

export const radioRecipe = defineRecipe({
  className: "chakra-radio",
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
            borderColor: "colorPalette.solid",
            bg: "colorPalette.solid",
          },
        },
      },
      subtle: {
        "& [data-part=control]": {
          bg: "bg.subtle",
          _checked: {
            bg: "colorPalette.muted",
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
