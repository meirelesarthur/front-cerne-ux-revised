export const buttonRecipe = {
  className: 'button',
  description: 'The styles for the Button component',
  base: {
    fontWeight: '600',
    borderRadius: '8px', // DS radius.base
    color: 'buttonSolidColor',
    whiteSpace: 'noWrap',
    fontSize: '14px',
    _hover: {
      _disabled: {
        bg: 'semanticNeutral.200',
      },
    },
  },
  variants: {
    variant: {
      solid: {
        bg: 'buttonSolidBG',
        color: 'buttonSolidColor',
        _hover: {
          bg: 'blue.900',
        },
        _active: {
          bg: 'blue.900',
        },
        _disabled: {
          bg: 'semanticNeutral.200',
          color: 'primitiveDisableTextColor',
        },
      },
      // Alinhado ao "ring" do Button.tsx do design system `cerne`: contorno
      // sutil por `border` (equivalente ao box-shadow externo de lá) em vez
      // do preenchimento solto azul no hover — hover vira um wash neutro
      // claro, igual à referência (`variantHover.secondary = neutral[50]`).
      secondary: {
        bg: 'buttonOutlineBG',
        color: 'semanticNeutral.700',
        // DS: contorno neutro[250] de 1.5px (ring). Props separadas: o shorthand `border`
        // sozinho emitia a cor como currentColor (escura) e descartava `borderColor`.
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: 'semanticNeutral.200',
        _hover: {
          bg: 'semanticNeutral.100',
          color: 'semanticNeutral.800',
          borderColor: 'semanticNeutral.400',
        },
        _active: {
          bg: 'semanticNeutral.100',
          color: 'semanticNeutral.800',
          borderColor: 'semanticNeutral.400',
        },
        _disabled: {
          bg: 'semanticNeutral.200',
          color: 'primitiveDisableTextColor',
          borderColor: 'semanticNeutral.200',
        },
      },
      secondary_semanticNeutral: {
        bg: 'buttonOutlineBG',
        color: 'semanticNeutral.700',
        border: '2px solid',
        borderColor: 'semanticNeutral.700',
        _hover: {
          bg: 'buttonSolidBG',
          color: 'white',
        },
        _active: {
          bg: 'buttonSolidBG',
          color: 'white',
        },
        _disabled: {
          bg: 'semanticNeutral.200',
          color: 'primitiveDisableTextColor',
        },
      },
      outline: {
        bg: 'buttonOutlineBG',
        border: '2px solid',
        borderColor: 'buttonOutlineColor',
        color: 'buttonOutlineColor',
        _hover: {
          bg: 'blue.900',
          borderColor: 'blue.900',
          color: 'white',
        },
        _active: {
          bg: 'blue.900',
          borderColor: 'blue.900',
        },
        _disabled: {
          borderColor: 'semanticNeutral.500',
          color: 'primitiveDisableTextColor',
          bg: 'none',
        },
      },
      ghost: {
        color: 'semanticNeutral.700',
        padding: '0',
        _hover: {
          color: 'blue.900',
          bg: 'transparent',
        },
        _active: {
          bg: 'transparent',
          color: 'blue.900',
        },
        _disabled: {
          color: 'primitiveDisableTextColor',
        },
      },
      ghost_danger: {
        color: 'red.600',
        padding: '0',
        _hover: { color: 'red.800', bg: 'transparent' },
        _active: { bg: 'transparent', color: 'red.800' },
        _disabled: { color: 'primitiveDisableTextColor' },
      },
      ghost_warning: {
        color: 'feedBack.warnMain',
        padding: '0',
        _hover: { color: 'feedBack.warnMain', bg: 'transparent' },
        _active: { bg: 'transparent', color: 'feedBack.warnMain' },
        _disabled: { color: 'primitiveDisableTextColor' },
      },
      solid_danger: {
        bg: 'feedBack.errorMain',
        color: 'white',
        _hover: { bg: '#911419' },
        _active: { bg: '#911419' },
        _disabled: {
          bg: 'semanticNeutral.200',
          color: 'primitiveDisableTextColor',
        },
      },
      outline_danger: {
        bg: 'buttonOutlineBG',
        border: '2px solid',
        borderColor: 'feedBack.errorMain',
        color: 'feedBack.errorMain',
        _hover: {
          bg: 'feedBack.errorMain',
          borderColor: 'feedBack.errorMain',
          color: 'white',
        },
        _active: {
          bg: 'feedBack.errorMain',
          borderColor: 'feedBack.errorMain',
        },
        _disabled: {
          borderColor: 'semanticNeutral.400',
          color: 'semanticNeutral.400',
          bg: 'none',
        },
      },
      outline_warn: {
        bg: 'buttonOutlineBG',
        border: '2px solid',
        borderColor: 'feedBack.warnMain',
        color: 'feedBack.warnMain',
        _hover: {
          bg: 'feedBack.warnMain',
          borderColor: 'feedBack.warnMain',
          color: 'white',
        },
        _active: { bg: 'feedBack.warnMain', borderColor: 'feedBack.warnMain' },
        _disabled: {
          borderColor: 'semanticNeutral.400',
          color: 'semanticNeutral.400',
          bg: 'none',
        },
      },
      solid_warn: {
        bg: 'feedBack.warnMain',
        color: 'white',
        _hover: { bg: 'feedBack.warnMain' },
        _active: { bg: 'feedBack.warnMain' },
        _disabled: {
          bg: 'semanticNeutral.200',
          color: 'primitiveDisableTextColor',
        },
      },
      buttonMenu: {
        bg: 'semanticNeutral.100',
        borderRadius: '50%',
        border: 'none',
        color: 'blue.900',
        _hover: { bg: 'semanticNeutral.200', color: 'blue.900' },
        _active: { bg: 'semanticNeutral.200', borderColor: 'blue.900' },
      },
      // Variante NOVA (aditiva) — ação destrutiva formal, substitui o padrão
      // ad-hoc `colorPalette="red"` solto em telas. Mesmo racional visual de
      // `solid_danger`, nomeada como o `variant="destructive"` do cerne para
      // ficar explícita a intenção semântica de "ação irreversível".
      destructive: {
        // DS (Button variant='destructive'): fundo branco, texto de erro (red 700) e contorno
        // 1.5px red 100; hover preenche com red 100. Ação irreversível sem 'gritar' vermelho sólido.
        bg: 'buttonOutlineBG',
        color: 'red.700',
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderColor: 'red.100',
        _hover: { bg: 'red.100' },
        _active: { bg: 'red.100' },
        _disabled: {
          bg: 'semanticNeutral.200',
          color: 'primitiveDisableTextColor',
          borderColor: 'semanticNeutral.200',
        },
      },
    },
    size: {
      xs: {
        height: 8,
        fontSize: '12px',
        paddingX: 2,
        paddingY: 2,
      },
      sm: {
        height: '34px', // DS btn.sm
        fontSize: '14px',
        paddingX: 3,
        paddingY: 3,
      },
      md: {
        height: '36px',
        fontSize: '14px',
        paddingX: 6,
        paddingY: 3,
      },
      lg: {
        height: '38px',
        fontSize: '14px',
        paddingX: 10,
        paddingY: 3,
      },
    },
  },

  defaultVariants: {
    variant: 'solid',
    size: 'lg',
  },
};
