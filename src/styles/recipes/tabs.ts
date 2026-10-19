import { defineSlotRecipe } from '@chakra-ui/react';

export const tabsRecipe = defineSlotRecipe({
  className: 'tabs',
  slots: ['root', 'list', 'trigger', 'content', 'contentGroup', 'indicator'],
  base: {
    root: {
      '--tabs-trigger-radius': 'radii.l2',
      display: 'flex',
      flexDirection: 'column',
    },
    list: {
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      scrollbarWidth: 'none',
    },
    trigger: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2',
      cursor: 'pointer',
      transition: 'all 0.2s',
      outline: 'none',
      _disabled: {
        opacity: 0.4,
        cursor: 'not-allowed',
      },
    },
    content: {
      padding: '4',
    },
    contentGroup: {
      position: 'relative',
    },
    indicator: {
      position: 'absolute',
      transition: 'all 0.2s',
    },
  },
  variants: {
    variant: {
      line: {
        list: {
          width: 'full',
          paddingX: '10',
          whiteSpace: 'nowrap',
          borderBottom: '0',
          overflowY: 'hidden',
        },
        trigger: {
          paddingX: '0',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          marginRight: '4',
          borderTopRadius: 'var(--tabs-trigger-radius)',
          _selected: {
            borderBottom: '2px solid',
            borderColor: 'primaryMain',
            color: 'primaryMain',
            fontWeight: 600,
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        content: {
          padding: '4',
          paddingTop: '14',
          paddingX: '0',
        },
        contentGroup: {
          paddingBottom: '14',
          color: 'semanticNeutral.900',
          border: '1px solid',
          borderColor: 'semanticNeutral.200',
          background: 'formBG',
        },
      },
      primary: {
        list: {
          width: 'full',
          paddingX: '0',
          whiteSpace: 'nowrap',
          borderBottom: '0',
          overflowY: 'hidden',
        },
        trigger: {
          paddingX: '4',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: '4',
          borderTopRadius: 'var(--tabs-trigger-radius)',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        content: {
          padding: '4',
          paddingTop: '14',
          paddingX: '0',
        },
        contentGroup: {
          marginBottom: '14',
          color: 'semanticNeutral.900',
          background: 'primitiveBG',
        },
      },
      secondary: {
        list: {
          width: 'full',
          whiteSpace: 'nowrap',
          paddingX: '10',
          overflow: 'auto',
          overflowY: 'none',
        },
        trigger: {
          paddingX: '4',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'transparent',
          marginRight: '4',
          borderTopRadius: 'var(--tabs-trigger-radius)',
          _selected: {
            borderBottom: '2px solid',
            borderColor: 'primaryMain',
            color: 'primaryMain',
            fontWeight: 600,
          },
        },
        content: {
          padding: '0',
          paddingX: '10',
          paddingY: '0',
        },
        contentGroup: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '0',
        },
      },
      secondaryAnalysis: {
        list: {
          width: 'full',
          whiteSpace: 'nowrap',
          paddingX: '0',
          overflow: 'auto',
          overflowY: 'none',
        },
        trigger: {
          paddingX: '4',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: '4',
          borderTopRadius: 'var(--tabs-trigger-radius)',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
        },
        content: {
          padding: '0',
          paddingX: '0',
          paddingTop: '8',
          backgroundColor: 'FormBG',
        },
        contentGroup: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '0',
        },
      },
      secondaryWithChildren: {
        list: {
          width: 'full',
          paddingX: '10',
          overflow: 'auto',
          whiteSpace: 'nowrap',
        },
        trigger: {
          paddingX: '4',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: '15px',
          borderTopRadius: 'var(--tabs-trigger-radius)',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        content: {
          padding: '0',
          paddingX: '0',
          paddingY: '0',
          backgroundColor: 'formBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
        contentGroup: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
      },
      'soft-rounded': {
        list: {
          overflow: 'auto',
          paddingX: '0',
          whiteSpace: 'nowrap',
        },
        trigger: {
          paddingX: '4',
          fontWeight: 'medium',
          border: '0.5px solid',
          borderColor: 'borderGrid',
          borderRadius: 'var(--tabs-trigger-radius)',
          marginRight: '15px',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG2',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBGPrimary',
            color: 'tabs.textSelectedColor',
            border: 'none',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        content: {
          padding: '0',
          paddingTop: '10',
          paddingBottom: '0',
          paddingX: '0',
        },
        contentGroup: {
          paddingTop: '0',
        },
      },
      'soft-rounded-outline': {
        list: {
          width: 'full',
          overflow: 'auto',
          whiteSpace: 'nowrap',
        },
        trigger: {
          paddingX: '4',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          borderRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG2',
            color: 'blue.600',
            borderBottom: 'solid 3px',
          },
          _disabled: {
            opacity: '0.4',
            cursor: 'not-allowed',
          },
        },
        content: {
          padding: '0',
          paddingTop: '14',
          paddingBottom: '0',
          paddingX: '0',
        },
        contentGroup: {
          paddingTop: '0',
        },
      },
      // `outline` — variante PADRÃO das tabs de formulário do projeto (EST-07).
      // "Folder tabs" (mirror do `outline` do Chakra, personalizado): a lista
      // tem uma linha inferior fininha e a aba SELECIONADA vira uma "caixinha"
      // (borda em cima/laterais, fundo `formBG`, base aberta) que se encaixa na
      // área de conteúdo — accent verde (`primaryMain`). Padding lateral do
      // conteúdo = 0 (o respiro lateral vem SÓ do body do `FormContainer`,
      // px=20px) → conteúdo da tab alinhado ao form comum, sem inset extra.
      outline: {
        list: {
          position: 'relative',
          width: 'full',
          paddingX: '0',
          whiteSpace: 'nowrap',
          overflow: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          _before: {
            content: '""',
            position: 'absolute',
            bottom: '0',
            insetX: '0',
            borderBottomWidth: '1px',
            borderBottomColor: 'border2',
          },
          // O `outline` NATIVO do Chakra (que faz merge com esta variante) define
          // a linha inferior em `_horizontal._before` usando o token genérico
          // `border` (preto no dark, #141414). Precisa sobrescrever NO MESMO
          // nível com `border2` (cinza, = borda dos inputs) — senão o preto dele
          // vence o nosso `_before` plano.
          _horizontal: {
            _before: {
              borderBottomWidth: '1px',
              borderBottomColor: 'border2',
            },
          },
        },
        trigger: {
          paddingX: '4',
          marginRight: '1',
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'transparent',
          borderWidth: '1px',
          borderColor: 'transparent',
          borderTopRadius: 'var(--tabs-trigger-radius)',
          marginBottom: '-1px',
          _selected: {
            backgroundColor: 'formBG',
            color: 'primaryMain',
            fontWeight: 600,
            borderColor: 'border2',
            borderBottomColor: 'transparent',
          },
          // Mesma sobrescrita no nível `_horizontal` que o `outline` nativo do
          // Chakra usa para a borda da aba selecionada (senão volta ao `border`
          // preto no dark).
          _horizontal: {
            _selected: {
              borderColor: 'border2',
              borderBottomColor: 'transparent',
            },
          },
          _disabled: {
            opacity: 0.4,
            cursor: 'not-allowed',
          },
        },
        content: {
          padding: '0',
          paddingX: '0',
          paddingTop: '6',
          paddingBottom: '0',
        },
        contentGroup: {
          paddingTop: '0',
        },
      },
    },
    size: {
      sm: {
        trigger: {
          fontSize: 'sm',
          paddingX: '2',
        },
      },
      md: {
        trigger: {
          fontSize: 'md',
          paddingX: '4',
        },
      },
      lg: {
        trigger: {
          fontSize: 'lg',
          paddingX: '6',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'line',
    size: 'md',
  },
});
