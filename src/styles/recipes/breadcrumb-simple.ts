// src/styles/recipes/breadcrumb.ts
import { defineRecipe } from "@chakra-ui/react";

export const breadcrumbRecipe = defineRecipe({
  className: "chakra-breadcrumb",
  base: {
    display: "flex",
    alignItems: "center",
    gap: "2",
    fontSize: "sm",
    color: "fg.muted",
  },
  variants: {
    variant: {
      plain: {
        "& a:hover": {
          textDecoration: "none",
        },
      },
      underline: {
        "& a:hover": {
          textDecoration: "underline",
        },
      },
    },
    size: {
      sm: {
        fontSize: "xs",
        gap: "1",
      },
      md: {
        fontSize: "sm",
        gap: "2",
      },
      lg: {
        fontSize: "md",
        gap: "3",
      },
    },
  },
  defaultVariants: {
    variant: "plain",
    size: "md",
  },
});
