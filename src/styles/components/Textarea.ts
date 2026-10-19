export const Textarea = {
  baseStyle: {
    borderColor: "border2",
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
  variants: {
    outline: {
      borderColor: "border2",
      bg: "inputBG",
      color: "primitiveTexteColor",
      _hover: {
        borderColor: "border2",
      },
    },
  },
};
