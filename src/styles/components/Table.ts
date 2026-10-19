export const Table = {
  baseStyle: {
    tbody: {
      bg: "gridBG",
      borderColor: "borde2",
    },
    thead: {
      padding: "8",
      th: {
        _first: {
          borderTopLeftRadius: "base",
          borderBottomLeftRadius: "base",
        },
        _last: {
          borderTopRightRadius: "base",
          borderBottomRightRadius: "base",
        },
      },
    },
    tfoot: {
      th: {
        _first: {
          borderBottomLeftRadius: "none",
        },
        _last: {
          borderBottomRightRadius: "none",
        },
      },
    },
    tr: {
      color: "gray.700",
      borderColor: "borderGrid",
      th: {
        bg: "#fff",
        color: "gray.900",
        maxWidth: "190px",
        fontWeight: "500",
        fontSize: "xs",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
      td: {
        position: "relative",
        maxWidth: "190px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: "sm",
        color: "primitiveTexteColor",
      },
    },
  },
  variants: {
    v2: {
      thead: {
        th: {
          _first: {
            borderTopLeftRadius: "0",
          },
          _last: {
            borderTopRightRadius: "0",
          },
        },
      },
      tr: {
        color: "gray.700",
        borderColor: "borderGrid",
        th: {
          bg: "gridHeadSecondary",
          color: "textGridColor",
          maxWidth: "190px",
          height: "10",
          fontWeight: "500",
          textTransform: "inherit",
          fontSize: "14px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          paddingY: "2",
          paddingLeft: "4",
          paddingRight: "4",
        },
        td: {
          position: "relative",
          maxWidth: "190px",
          height: "40px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontSize: "14px",
          color: "textGridColor",
          paddingLeft: "4",
          paddingRight: "4",
        },
      },
    },
  },
};
