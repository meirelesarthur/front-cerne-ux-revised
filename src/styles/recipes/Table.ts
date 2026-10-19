export const tableRecipe = {
  className: 'table',
  description: 'The styles for the Table component',
  base: {
    width: '100%',
    borderCollapse: 'collapse',
    color: 'gray.700',
    borderColor: 'borderGrid',
  },

  variants: {
    variant: {
      line: {
        borderSpacing: 0,
        '& table': {
          width: '50%',
        },
        '& thead th': {
          // Era `bg: '#000'` (hex fixo fora dos tokens) — header ficava
          // preto sempre que uma tela usa `Table.Root variant="line"`
          // direto, sem o override inline que a maioria das telas já faz
          // (ex.: PrevisaoDepreciacao.tsx não sobrescrevia `& th`/`& thead th`
          // e herdava esse preto). Alinhado ao token que todo mundo já usa.
          bg: 'gridHeadSecondary',
          color: 'textGridColor',
          maxWidth: '190px',
          height: '38px',
          fontWeight: '500',
          textTransform: 'inherit',
          fontSize: '14px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingY: '2',
          paddingLeft: '4',
          paddingRight: '4',
          '&:first-child': {
            borderTopLeftRadius: '0',
          },
          '&:last-child': {
            borderTopRightRadius: '0',
          },
        },
        '& tbody td': {
          position: 'relative',
          maxWidth: '190px',
          // Alinhado a `t.size.tableRow` (44px) da referência UX — era 40px.
          height: '44px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '14px',
          color: 'textGridColor',
          paddingLeft: '4',
          paddingRight: '4',
        },
        '& tbody tr': {
          color: 'gray.700',
          borderColor: 'borderGrid',
        },
        '& tfoot th': {
          '&:first-child': {
            borderBottomLeftRadius: 'none',
          },
          '&:last-child': {
            borderBottomRightRadius: 'none',
          },
        },
      },

      outline: {
        border: '1px solid',
        borderColor: 'borderGrid',
        borderRadius: 'lg',
      },
    },

    size: {
      sm: {
        '& th': {
          fontSize: 'xs',
          paddingX: '2',
          paddingY: '1',
        },
        '& td': {
          fontSize: 'xs',
          paddingX: '2',
          paddingY: '1',
        },
      },
      md: {
        '& th': {
          fontSize: 'sm',
          paddingX: '3',
          paddingY: '2',
        },
        '& td': {
          fontSize: 'sm',
          paddingX: '3',
          paddingY: '2',
        },
      },
      lg: {
        '& th': {
          fontSize: 'md',
          paddingX: '4',
          paddingY: '3',
        },
        '& td': {
          fontSize: 'md',
          paddingX: '4',
          paddingY: '3',
        },
      },
    },

    interactive: {
      true: {
        '& tr': {
          cursor: 'pointer',
          '&:hover': {
            bg: 'gray.50',
            _dark: {
              bg: 'gray.800',
            },
          },
        },
      },
    },

    striped: {
      true: {
        '& tbody tr:nth-of-type(even)': {
          bg: 'gray.50',
          _dark: {
            bg: 'gray.800',
          },
        },
      },
    },

    stickyHeader: {
      true: {
        '& thead': {
          position: 'sticky',
          top: 0,
          zIndex: 1,
        },
      },
    },

    showColumnBorder: {
      true: {
        '& th': {
          borderRight: '1px solid',
          borderColor: 'borderGrid',
          '&:last-child': {
            borderRight: 'none',
          },
        },
        '& td': {
          borderRight: '1px solid',
          borderColor: 'borderGrid',
          '&:last-child': {
            borderRight: 'none',
          },
        },
      },
    },
  },

  // defaultVariants: {
  //   variant: "line",
  //   size: "md",
  // },
};
