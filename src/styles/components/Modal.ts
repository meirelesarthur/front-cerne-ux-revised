export const Modal = {
  baseStyle: {
    header: {
      bg: "formBG",
      color: "primitiveTexteColor",
      paddingX: "14",
      paddingY: "10",
    },
    closeButton: {
      color: "primitiveTexteColor",
      // bg: "semanticNeutral.100",
      // _hover: {
      //   bg: "semanticNeutral.300",
      // },
      marginRight: "6",
      marginTop: "8",
    },
    body: {
      color: "primitiveTexteColor",
      bg: "formBG",
      paddingX: "10",
      paddingBottom: "10",
      paddingTop: "0",
      borderRightRadius: "20px",
      borderLeftRadius: "20px",
    },
    footer: {
      color: "primitiveTexteColor",
      bg: "formBG",
      paddingX: "10",
      paddingBottom: "10",
      paddingTop: "0",
      borderRightRadius: "20px",
      borderLeftRadius: "20px",
    },
    dialog: {
      bg: "formBG",
    },
  },
  variants: {
    danger: {
      footer: {
        gap: "32",
        justifyContent: "space-between",
      },
    },
    form: {
      dialog: {
        bg: "transparent",
        width: "1400px",
        maxHeight: "1000px",
        borderRadius: "10px",
        height: "auto",
        overflow: "auto",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      },
      body: {
        overflow: "auto",
        msOverflowStyle: "none",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
        paddingX: "0",
        paddingBottom: "0",
        borderBottomRadius: "20px",
      },
      footer: {
        borderTopRightRadius: "0",
        borderTopLeftRadius: "0",
        justifyContent: "left",
      },
    },
  },
};
