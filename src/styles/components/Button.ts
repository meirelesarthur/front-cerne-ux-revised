export const Button = {
  baseStyle: {
    fontWeight: "600",
    borderRadius: "4px",
    color: "buttonSolidColor",
    whitespace: "noWrap",
    fontSize: "14px",
  },
  sizes: {
    sm: {
      height: 8,
      fontSize: "14px",
      px: 3,
      py: 3,
    },
    md: {
      height: 8,
      fontSize: "14px",
      px: 6,
      py: 3,
    },
    lg: {
      height: 8,
      fontSize: "14px",
      px: 10,
      py: 3,
    },
  },
  variants: {
    solid: {
      bg: "buttonSolidBG",
      color: "#fff",
      _hover: {
        bg: "green.900",
        _disabled: {
          bg: "semanticNeutral.200",
        },
      },
      _active: {
        bg: "green.900",
      },
      _disabled: {
        bg: "semanticNeutral.200",
        color: "primitiveDisableTextColor",
      },
    },
    secondary: {
      bg: "buttonOutlineBG",
      color: "semanticNeutral.700",
      _hover: {
        bg: "buttonSolidBG",
        color: "white",
        _disabled: {
          bg: "primitiveDisableTextColor",
          color: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "buttonSolidBG",
        color: "white",
      },
      _disabled: {
        bg: "semanticNeutral.200",
        color: "primitiveDisableTextColor",
      },
    },
    secondary_semanticNeutral: {
      bg: "buttonOutlineBG",
      color: "semanticNeutral.700",
      border: "2px solid",
      borderColor: "semanticNeutral.700",
      _hover: {
        bg: "buttonSolidBG",
        color: "white",
        _disabled: {
          bg: "primitiveDisableTextColor",
          color: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "buttonSolidBG",
        color: "white",
      },
      _disabled: {
        bg: "semanticNeutral.200",
        color: "primitiveDisableTextColor",
      },
    },
    outline: {
      bg: "buttonOutlineBG",
      border: "2px solid",
      borderColor: "buttonSolidBG",
      color: "#15A795",
      _hover: {
        bg: "green.900",
        borderColor: "green.900",
        color: "white",
        _disabled: {
          bg: "none",
          color: "primitiveDisableTextColor",
          borderColor: "semanticNeutral.500",
        },
      },
      _active: {
        bg: "green.900",
        borderColor: "green.900",
      },
      _disabled: {
        borderColor: "semanticNeutral.500",
        color: "primitiveDisableTextColor",
      },
    },
    ghost: {
      color: "semanticNeutral.700",
      padding: "0",
      _hover: {
        color: "green.900",
        bg: "transparent",
        _disabled: {
          color: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "transparent",
        color: "green.900",
      },
      _disabled: {
        color: "primitiveDisableTextColor",
      },
    },
    ghost_danger: {
      color: "red.600",
      padding: "0",
      _hover: {
        color: "red.800",
        bg: "transparent",
        _disabled: {
          color: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "transparent",
        color: "red.800",
      },
      _disabled: {
        color: "primitiveDisableTextColor",
      },
    },
    ghost_warning: {
      color: "feedBack.warnMain",
      padding: "0",
      _hover: {
        color: "feedBack.warnMain",
        bg: "transparent",
        _disabled: {
          color: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "transparent",
        color: "feedBack.warnMain",
      },
      _disabled: {
        color: "primitiveDisableTextColor",
      },
    },
    solid_danger: {
      bg: "feedBack.errorMain",
      color: "white",
      _hover: {
        bg: "#911419",
        _disabled: {
          bg: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "#911419",
      },
      _disabled: {
        bg: "semanticNeutral.200",
        color: "primitiveDisableTextColor",
      },
    },
    outline_danger: {
      bg: "buttonOutlineBG",
      border: "2px solid",
      borderColor: "feedBack.errorMain",
      color: "feedBack.errorMain",
      _hover: {
        bg: "feedBack.errorMain",
        borderColor: "feedBack.errorMain",
        color: "white",
        _disabled: {
          bg: "none",
          color: "semanticNeutral.400",
          borderColor: "semanticNeutral.400",
        },
      },
      _active: {
        bg: "feedBack.errorMain",
        borderColor: "feedBack.errorMain",
      },
      _disabled: {
        borderColor: "semanticNeutral.400",
        color: "semanticNeutral.400",
      },
    },
    outline_warn: {
      bg: "buttonOutlineBG",
      border: "2px solid",
      borderColor: "feedBack.warnMain",
      color: "feedBack.warnMain",
      _hover: {
        bg: "feedBack.warnMain",
        borderColor: "feedBack.warnMain",
        color: "white",
        _disabled: {
          bg: "none",
          color: "semanticNeutral.400",
          borderColor: "semanticNeutral.400",
        },
      },
      _active: {
        bg: "feedBack.warnMain",
        borderColor: "feedBack.warnMain",
      },
      _disabled: {
        borderColor: "semanticNeutral.400",
        color: "semanticNeutral.400",
      },
    },
    solid_warn: {
      bg: "feedBack.warnMain",
      color: "white",
      _hover: {
        bg: "feedBack.warnMain",
        _disabled: {
          bg: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "feedBack.warnMain",
      },
      _disabled: {
        bg: "semanticNeutral.200",
        color: "primitiveDisableTextColor",
      },
    },
    buttonMenu: {
      bg: "semanticNeutral.100",
      borderRadius: "50%",
      border: "none",
      color: "green.900",
      _hover: {
        bg: "semanticNeutral.200",
        color: "green.900",
        _disabled: {
          bg: "primitiveDisableTextColor",
        },
      },
      _active: {
        bg: "semanticNeutral.200",
        borderColor: "green.900",
      },
    },
  },
  defaultProps: {
    size: "md",
    variant: "solid",
  },
};
