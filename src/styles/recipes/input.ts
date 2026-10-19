// src/styles/recipes/input.ts

export const inputRecipe = {
  className: "input",
  description: "The styles for the Input component",

  // 1. A chave 'parts' foi removida.

  // 2. Todos os estilos agora estão no nível superior, sem o aninhamento 'field:'.
  base: {
    height: "38px", // área de input projetada (Ajustes Globais) — não afeta labels
    bg: "inputBG",
    color: "primitiveTexteColor",
    fontSize: "14px",
    border: "1px solid", // Adicionado para consistência
    _placeholder: {
      color: "placeholderColor",
    },
    _hover: {
      borderColor: "border2",
    },
    _focus: {
      borderColor: "primaryMain",
      boxShadow: `0 0 0 1px var(--chakra-colors-primary-main)`,
    },
    _disabled: {
      bg: "semanticNeutral.200",
      color: "semanticNeutral.700",
      cursor: "not-allowed",
      opacity: 1,
    },
    _readOnly: {
      bg: "semanticNeutral.200",
      color: "semanticNeutral.700",
      cursor: "not-allowed",
    },
  },

  variants: {
    variant: {
      line: {
        borderColor: "semanticNeutral.700",
      },
      outline: {
        borderColor: "border2",
      },
      outline2: {
        borderColor: "border2",
      },
      outlineGrid: {
        borderColor: "border2",
      },
    },
    size: {
      md: {
        borderRadius: "6px",
      },
    },
  },
};
