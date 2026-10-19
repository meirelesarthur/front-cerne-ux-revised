export const Input = {
  baseStyle: {},
  variants: {
    line: {
      field: {
        bg: "inputBG",
        height: "8",
        minWidth: "240px",
        borderColor: "semanticNeutral.700",
        fontSize: "14px",
        _placeholder: {
          color: "placeholderColor",
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
    outline: {
      field: {
        bg: "inputBG",
        height: "8",
        color: "primitiveTexteColor",
        borderColor: "border2",
        fontSize: "14px",
        _placeholder: {
          color: "placeholderColor",
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
        _hover: {
          borderColor: "border2",
        },
      },
    },
    outline2: {
      field: {
        bg: "inputBG",
        height: "8",
        color: "primitiveTexteColor",
        borderColor: "border2",
        _placeholder: {
          color: "placeholderColor",
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
        _hover: {
          borderColor: "border2",
        },
      },
    },
    outlineGrid: {
      field: {
        bg: "inputBG",
        height: "8",
        color: "primitiveTexteColor",
        borderColor: "border2",
        _placeholder: {
          color: "placeholderColor",
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
        _hover: {
          borderColor: "border2",
        },
      },
    },
  },
};
