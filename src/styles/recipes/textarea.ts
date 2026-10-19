// src/styles/recipes/textarea.ts
// Migração do Textarea para Chakra UI v3 - padrão headless
import { defineRecipe } from "@chakra-ui/react";

export const textareaRecipe = defineRecipe({
  className: "chakra-textarea",
  base: {
    appearance: "none",
    bg: "transparent",
    border: "1px solid",
    borderColor: "border",
    borderRadius: "md",
    color: "fg",
    fontSize: "md",
    fontFamily: "inherit",
    minH: "20",
    outline: "none",
    px: "3",
    py: "2",
    resize: "vertical",
    width: "full",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "normal",
    _placeholder: {
      color: "fg.subtle",
    },
    _hover: {
      borderColor: "border.emphasized",
    },
    _focus: {
      borderColor: "colorPalette.solid",
      boxShadow: "0 0 0 1px var(--chakra-colors-colorPalette-solid)",
    },
    _disabled: {
      bg: "bg.disabled",
      borderColor: "border.disabled",
      color: "fg.disabled",
      cursor: "not-allowed",
      opacity: 1,
    },
    _readOnly: {
      bg: "bg.disabled",
      borderColor: "border.disabled",
      color: "fg.disabled",
      cursor: "default",
    },
    _invalid: {
      borderColor: "border.error",
      _focus: {
        borderColor: "border.error",
        boxShadow: "0 0 0 1px var(--chakra-colors-border-error)",
      },
    },
  },
  variants: {
    variant: {
      outline: {
        bg: "bg",
        border: "1px solid",
        borderColor: "border",
        _hover: {
          borderColor: "border.emphasized",
        },
      },
      subtle: {
        bg: "bg.subtle",
        border: "1px solid transparent",
        _hover: {
          bg: "bg.muted",
        },
        _focus: {
          bg: "bg",
          borderColor: "colorPalette.solid",
        },
      },
      flushed: {
        bg: "transparent",
        border: "none",
        borderBottom: "2px solid",
        borderColor: "border",
        borderRadius: "0",
        px: "0",
        _focus: {
          borderColor: "colorPalette.solid",
          boxShadow: "none",
        },
      },
    },
    size: {
      xs: {
        fontSize: "xs",
        px: "2",
        py: "1",
        minH: "16",
      },
      sm: {
        fontSize: "sm",
        px: "2.5",
        py: "1.5",
        minH: "18",
      },
      md: {
        fontSize: "md",
        px: "3",
        py: "2",
        minH: "20",
      },
      lg: {
        fontSize: "lg",
        px: "4",
        py: "2.5",
        minH: "24",
      },
      xl: {
        fontSize: "xl",
        px: "4",
        py: "3",
        minH: "28",
      },
    },
    resize: {
      none: {
        resize: "none",
      },
      vertical: {
        resize: "vertical",
      },
      horizontal: {
        resize: "horizontal",
      },
      both: {
        resize: "both",
      },
    },
  },
  defaultVariants: {
    variant: "outline",
    size: "md",
    resize: "vertical",
  },
});
