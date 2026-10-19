// src/styles/recipes/text.ts
// Migração do Text para Chakra UI v3 - padrão headless
import { defineRecipe } from "@chakra-ui/react";

export const textRecipe = defineRecipe({
  className: "chakra-text",
  base: {},
  variants: {
    variant: {
      shiny: {
        background: "linear-gradient(to right, #333 20%, #eee 50%, #333 80%)",
        backgroundSize: "200% auto",
        color: "transparent",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        animation: "shiny-text-anim 2s linear infinite",
      },
      gradient: {
        backgroundImage: "linear-gradient(90deg, #40ffaa, #4079ff, #40ffaa)",
        backgroundSize: "300% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        animation: "gradient 8s linear infinite",
      },
    },
    size: {
      xs: {
        fontSize: "xs",
        lineHeight: "1.4",
      },
      sm: {
        fontSize: "sm",
        lineHeight: "1.5",
      },
      md: {
        fontSize: "md",
        lineHeight: "1.6",
      },
      lg: {
        fontSize: "lg",
        lineHeight: "1.6",
      },
      xl: {
        fontSize: "xl",
        lineHeight: "1.6",
      },
      "2xl": {
        fontSize: "2xl",
        lineHeight: "1.5",
      },
      "3xl": {
        fontSize: "3xl",
        lineHeight: "1.4",
      },
      "4xl": {
        fontSize: "4xl",
        lineHeight: "1.3",
      },
      "5xl": {
        fontSize: "5xl",
        lineHeight: "1.2",
      },
      "6xl": {
        fontSize: "6xl",
        lineHeight: "1.1",
      },
      "7xl": {
        fontSize: "7xl",
        lineHeight: "1",
      },
    },
    weight: {
      light: {
        fontWeight: "light",
      },
      normal: {
        fontWeight: "normal",
      },
      medium: {
        fontWeight: "medium",
      },
      semibold: {
        fontWeight: "semibold",
      },
      bold: {
        fontWeight: "bold",
      },
    },
    truncate: {
      true: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
    lineClamp: {
      1: {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: "1",
        overflow: "hidden",
      },
      2: {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: "2",
        overflow: "hidden",
      },
      3: {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: "3",
        overflow: "hidden",
      },
      4: {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: "4",
        overflow: "hidden",
      },
      5: {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: "5",
        overflow: "hidden",
      },
    },
  },
  defaultVariants: {
    size: "md",
    weight: "normal",
  },
});
