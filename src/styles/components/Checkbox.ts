export const Checkbox = {
  baseStyle: {
    control: {
      borderColor: "gray.700",
      bg: "primitiveBG",
      _checked: {
        bg: "green.600",
        borderColor: "green.600",
        _hover: {
          bg: "green.600",
          borderColor: "green.600",
        },
      },
      _indeterminate: {
        bg: "green.600",
        borderColor: "green.600",
        _hover: {
          bg: "green.600",
          borderColor: "green.600",
        },
      },
      _disabled: {
        bg: "gray.200",
        borderColor: "gray.200",
        color: "black",
      },
      _readOnly: {
        bg: "gray.100",
        color: "gray.700",
      },
    },
  },
  sizes: {
    md: {
      control: {
        width: 4,
        height: 4,
      },
    },
    lg: {
      control: {
        width: 5,
        height: 5,
      },
    },
  },
  variants: {
    circle: {
      control: {
        borderRadius: "full",
      },
    },
  },
};
