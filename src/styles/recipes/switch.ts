// src/styles/recipes/switch.ts
import { defineRecipe } from "@chakra-ui/react";

export const switchRecipe = defineRecipe({
  className: "chakra-switch",
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
      raised: {
        "& [data-part=control]": {
          boxShadow: "inset 0 2px 2px rgba(0, 0, 0, 0.1)",
          _checked: {
            boxShadow: "inset 0 2px 2px rgba(0, 0, 0, 0.15)",
          },
        },
      },
      solid: {
        "& [data-part=control]": {
          bg: "gray.200",
          _checked: {
            bg: "colorPalette.solid",
          },
        },
      },
    },
    size: {
      sm: {
        "& [data-part=control]": {
          width: "8",
          height: "4",
        },
        "& [data-part=thumb]": {
          width: "3",
          height: "3",
        },
      },
      md: {
        "& [data-part=control]": {
          width: "10",
          height: "5",
        },
        "& [data-part=thumb]": {
          width: "4",
          height: "4",
        },
      },
      lg: {
        "& [data-part=control]": {
          width: "12",
          height: "6",
        },
        "& [data-part=thumb]": {
          width: "5",
          height: "5",
        },
      },
    },
  },
  defaultVariants: {
    variant: "solid",
    size: "md",
  },
});
