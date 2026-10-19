// src/styles/recipes/modal.ts
// Migração do Modal para Dialog (Chakra UI v3) - padrão headless
import { modalAnatomy } from "@chakra-ui/anatomy";
import { defineSlotRecipe } from "@chakra-ui/react";

export const modalSlotRecipe = defineSlotRecipe({
  className: "chakra-dialog",
  slots: modalAnatomy.keys,
  base: {
    overlay: {
      bg: "blackAlpha.600",
      position: "fixed",
      inset: "0",
      zIndex: "modal",
    },
    dialogContainer: {
      position: "fixed",
      inset: "0",
      zIndex: "modal",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4",
    },
    dialog: {
      bg: "bg.panel",
      boxShadow: "lg",
      borderRadius: "lg",
      position: "relative",
      maxHeight: "calc(100vh - 7.5rem)",
      zIndex: "modal",
      _open: {
        animation: "fadeIn 0.25s ease-out",
      },
      _closed: {
        animation: "fadeOut 0.2s ease-out",
      },
    },
    header: {
      px: "6",
      py: "4",
      fontSize: "xl",
      fontWeight: "semibold",
    },
    body: {
      px: "6",
      py: "2",
      flex: "1",
      overflow: "auto",
    },
    footer: {
      px: "6",
      py: "4",
      display: "flex",
      justifyContent: "flex-end",
      gap: "3",
    },
    closeButton: {
      position: "absolute",
      top: "2",
      insetEnd: "2",
      zIndex: "1",
    },
  },
  variants: {
    size: {
      xs: {
        dialog: {
          maxW: "xs",
        },
      },
      sm: {
        dialog: {
          maxW: "sm",
        },
      },
      md: {
        dialog: {
          maxW: "md",
        },
      },
      lg: {
        dialog: {
          maxW: "lg",
        },
      },
      xl: {
        dialog: {
          maxW: "xl",
        },
      },
      "2xl": {
        dialog: {
          maxW: "2xl",
        },
      },
      "3xl": {
        dialog: {
          maxW: "3xl",
        },
      },
      "4xl": {
        dialog: {
          maxW: "4xl",
        },
      },
      "5xl": {
        dialog: {
          maxW: "5xl",
        },
      },
      "6xl": {
        dialog: {
          maxW: "6xl",
        },
      },
      full: {
        dialog: {
          maxW: "100vw",
          minH: "100vh",
          borderRadius: "0",
        },
      },
      cover: {
        dialog: {
          maxW: "100vw",
          maxH: "100vh",
          borderRadius: "0",
        },
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});
