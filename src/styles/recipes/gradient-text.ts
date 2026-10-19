// src/styles/recipes/gradient-text.ts
// Migração do GradientText para Chakra UI v3 - componente customizado
import { defineSlotRecipe } from "@chakra-ui/react";

const gradientTextAnatomy = {
  keys: () => ["wrapper", "overlay", "content"] as const,
} as const;

export const gradientTextSlotRecipe = defineSlotRecipe({
  className: "chakra-gradient-text",
  slots: gradientTextAnatomy.keys(),
  base: {
    wrapper: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "lg",
      display: "inline-block",
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundSize: "300% 100%",
      animation: "gradient linear infinite",
      zIndex: 0,
      _before: {
        content: `""`,
        position: "absolute",
        top: "2px",
        left: "2px",
        width: "calc(100% - 4px)",
        height: "calc(100% - 4px)",
        backgroundColor: "#060010",
        borderRadius: "inherit",
        zIndex: -1,
      },
    },
    content: {
      display: "inline-block",
      position: "relative",
      zIndex: 1,
      backgroundSize: "300% 100%",
      backgroundClip: "text",
      color: "transparent",
      animation: "gradient linear infinite",
    },
  },
  variants: {
    variant: {
      rainbow: {
        overlay: {
          background:
            "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
          animationDuration: "15s",
        },
        content: {
          background:
            "linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)",
          animationDuration: "15s",
        },
      },
      sunset: {
        overlay: {
          background: "linear-gradient(-45deg, #ff9a9e, #fecfef, #fecfef)",
          animationDuration: "10s",
        },
        content: {
          background: "linear-gradient(-45deg, #ff9a9e, #fecfef, #fecfef)",
          animationDuration: "10s",
        },
      },
      ocean: {
        overlay: {
          background: "linear-gradient(-45deg, #667eea, #764ba2)",
          animationDuration: "8s",
        },
        content: {
          background: "linear-gradient(-45deg, #667eea, #764ba2)",
          animationDuration: "8s",
        },
      },
    },
    speed: {
      slow: {
        overlay: {
          animationDuration: "20s",
        },
        content: {
          animationDuration: "20s",
        },
      },
      normal: {
        overlay: {
          animationDuration: "15s",
        },
        content: {
          animationDuration: "15s",
        },
      },
      fast: {
        overlay: {
          animationDuration: "8s",
        },
        content: {
          animationDuration: "8s",
        },
      },
    },
  },
  defaultVariants: {
    variant: "rainbow",
    speed: "normal",
  },
});
