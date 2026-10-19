export const NumberInput = {
  baseStyle: {},
  variants: {
    outline: {
      field: {
        bg: "inputBG",
        height: "8",
        borderColor: "semanticNeutral.700",
        _placeholder: {
          color: "semanticNeutral.300",
        },
        _disabled: {
          bg: "semanticNeutral.200",
          color: "semanticNeutral.700",
          opacity: 1,
        },
        _readOnly: {
          bg: "semanticNeutral.200",
          color: "semanticNeutral.700",
        },
        _hover: {
          borderColor: "border2",
        },
      },
    },
  },
};
