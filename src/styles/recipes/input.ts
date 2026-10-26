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
    // DS `FormField`: texto 16px, contorno 1.5px, fundo neutro-50.
    fontSize: "16px",
    borderWidth: "1.5px",
    borderStyle: "solid",
    _placeholder: {
      color: "placeholderColor",
    },
    _hover: {
      borderColor: "border2",
    },
    _focus: {
      borderColor: "primaryMain",
      boxShadow: "0 0 0 3px rgba(5, 150, 105, 0.12)", // DS glow.brand
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
      cursor: "default", // DS: readonly != disabled (não sugere bloqueio)
    },
  },

  variants: {
    variant: {
      line: {
        borderColor: "semanticNeutral.700",
      },
      outline: {
        borderColor: "border1", // DS border.default (#e5e7eb)
        // A variante vence a `base`: contorno 1.5px e fundo neutro-50 do DS ficam aqui.
        bg: "inputBG",
        borderWidth: "1.5px",
      },
      outline2: {
        borderColor: "border1",
      },
      outlineGrid: {
        borderColor: "border2",
      },
    },
    size: {
      md: {
        // `textStyle` da recipe padrão do Chakra (sm = 12px) vence `fontSize`; xl = 16px (DS `font.size.md`).
        textStyle: "xl",
        fontSize: "16px",
        borderRadius: "8px", // DS radius.base
      },
    },
  },
};
