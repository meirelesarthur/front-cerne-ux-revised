export const Menu = {
  baseStyle: {
    list: {
      py: "none",
      borderRadius: "2",
      boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.161)",
      border: "none",
    },
    item: {
      fontSize: "12px",
      alignItems: "center",
      color: "primitiveTexteColor",
      bg: "semanticNeutral.100",
      paddingX: "2",
      paddingY: "4px",
      _hover: {
        bg: "semanticNeutral.200",
        _disabled: {
          opacity: 0.8,
          bg: "semanticNeutral.300",
        },
      },
      _disabled: {
        opacity: 0.8,
        bg: "semanticNeutral.300",
        color: "semanticNeutral.500",
      },
    },
  },
};
