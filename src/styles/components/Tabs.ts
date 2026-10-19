import { configureSpacing } from '@/utils/config-padding';

// export const TabsMob = {
//   parts: ["tab", "tablist", "tabpanel"],
//   variants: {
//     line: {
//       tablist: {
//         marginTop: tabsGeralSpacing.tabListSpacing.marginTop,
//         paddingX: "8",
//         width: "full",
//         overflow: "auto",
//         msOverflowStyle: "none",
//         borderBottom: 0,
//       },
//       tab: {
//         paddingX: "4",
//         fontWeight: "medium",
//         _selected: {
//           color: "green.600",
//           borderBottom: "5px solid",
//         },
//       },
//       tabpanels: {
//         marginBottom: "14",
//         border: "1px solid",
//         borderColor: "semanticNeutral.200",
//         background: "formBG",
//         boxShadow: "1px 4px 10px rgba(0, 0, 0, 0.15)",
//       },
//       tabpanel: {
//         padding: "0",
//         paddingTop: "14",
//         paddingBootom: "0",
//         paddingX: "7",
//       },
//     },
//     secondary: {
//       tablist: {
//         width: "full",
//         color: "semanticNeutral.900",
//         paddingX: "10",
//         overflow: "auto",
//         msOverflowStyle: "none",
//       },
//       tab: {
//         paddingX: {
//           base: "2",
//           md: "3",
//           lg: "4",
//         },
//         fontWeight: "medium",
//         backgroundColor: "formBG",
//         marginRight: "15px",
//         borderTopLeftRadius: "base",
//         borderTopRightRadius: "base",
//         _selected: {
//           backgroundColor: "tabSelectedBG",
//           color: "white",
//         },
//       },
//       tabpanels: {
//         paddingTop: "0",
//         borderTop: "1px solid",
//         borderColor: "semanticNeutral.200",
//         paddingBottom: "10",
//       },
//       tabpanel: {
//         padding: "0",
//         paddingX: "0",
//         paddingY: "10",
//         backgroundColor: "formBG",
//         background: "formBG",
//         borderBottom: "1px solid",
//         borderColor: "semanticNeutral.200",
//       },
//     },
//     secondaryWithChildren: {
//       tablist: {
//         width: "full",
//         color: "semanticNeutral.900",
//         paddingX: "10",
//         overflow: "auto",
//         msOverflowStyle: "none",
//       },
//       tab: {
//         paddingX: {
//           base: "2",
//           md: "3",
//           lg: "4",
//         },
//         fontWeight: "medium",
//         backgroundColor: "formBG",
//         color: "semanticNeutral.400",
//         marginRight: "15px",
//         borderTopLeftRadius: "base",
//         borderTopRightRadius: "base",
//         _selected: {
//           backgroundColor: "tabSelectedBG",
//           color: "white",
//         },
//       },
//       tabpanels: {
//         paddingTop: "0",
//         borderTop: "1px solid",
//         borderColor: "semanticNeutral.200",
//         paddingBottom: "10",
//       },
//       tabpanel: {
//         padding: "0",
//         paddingX: "0",
//         paddingY: "14",
//         backgroundColor: "formBG",
//         borderBottom: "1px solid",
//         borderColor: "semanticNeutral.200",
//       },
//     },
//     "soft-rounded": {
//       tablist: {
//         overflow: "auto",
//         paddingX: "10",
//         msOverflowStyle: "none",
//         backgroundColor: "formBG",
//         borderRadius: "3xl",
//       },
//       tab: {
//         paddingX: {
//           base: "2",
//           md: "3",
//           lg: "4",
//         },
//         fontWeight: "medium",
//         borderRadius: "3xl",
//         marginRight: "15px",
//         color: "semanticNeutral.400",
//         backgroundColor: "formBG",
//         _selected: {
//           backgroundColor: "primaryMain",
//           color: "white",
//         },
//         _disabled: {
//           opacity: "0.4",
//           cursor: "not-allowed",
//         },
//       },
//       tabpanels: {
//         paddingTop: "0",
//       },
//       tabpanel: {
//         padding: "0",
//         paddingTop: "14",
//         paddingBottom: "0",
//         paddingX: "0",
//       },
//     },
//     "soft-rounded-outline": {
//       tablist: {
//         width: "full",
//         color: "semanticNeutral.900",
//         overflow: "auto",
//         msOverflowStyle: "none",
//         backgroundColor: "white",
//         borderRadius: "3xl",
//       },
//       tab: {
//         paddingX: {
//           base: "2",
//           md: "3",
//           lg: "4",
//         },
//         fontWeight: "medium",
//         borderRadius: "3xl",
//         _selected: {
//           backgroundColor: "white",
//           color: "green.600",
//           borderBottom: "solid 3px",
//         },
//         _disabled: {
//           opacity: "0.4",
//           cursor: "not-allowed",
//         },
//       },
//       tabpanels: {
//         paddingTop: "0",
//       },
//       tabpanel: {
//         padding: "0",
//         paddingTop: "14",
//         paddingBottom: "0",
//         paddingX: "0",
//       },
//     },
//   },
// };

export function tabs() {
  const { tabsGeralSpacing, tabsLineSpacing, tabsPrimarySpacing } = configureSpacing();
  const TabsWeb = {
    parts: ['tab', 'tablist', 'tabpanel'],
    variants: {
      line: {
        tablist: {
          marginTop: tabsLineSpacing.tabListSpacing.marginTop,
          color: 'semanticNeutral.900',
          paddingX: tabsLineSpacing.tabListSpacing.paddingX,
          width: 'full',
          overflow: 'auto',
          whiteSpace: 'nowrap',
          msOverflowStyle: 'hidden',
          borderBottom: 0,
          overflowY: 'hidden',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsLineSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          marginRight: tabsLineSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            borderBottom: '2px solid',
            borderColor: '#127c65',
            color: '#127c65',
            fontWeight: 600,
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingBottom: tabsLineSpacing.tabPanelsSpacing.paddingBottom,
          color: 'semanticNeutral.900',
          border: '1px solid',
          borderColor: 'semanticNeutral.200',
          background: 'formBG',
        },
        tabpanel: {
          padding: tabsLineSpacing.tabPanelSpacing.padding,
          paddingTop: tabsLineSpacing.tabPanelSpacing.paddingTop,
          paddingBootom: tabsLineSpacing.tabPanelSpacing.paddingBottom,
          paddingX: tabsLineSpacing.tabPanelSpacing.paddingX,
        },
      },
      primary: {
        tablist: {
          marginTop: tabsPrimarySpacing.tabListSpacing.marginTop,
          color: 'semanticNeutral.900',
          paddingX: tabsPrimarySpacing.tabListSpacing.paddingX,
          width: 'full',
          overflow: 'auto',
          whiteSpace: 'nowrap',
          msOverflowStyle: 'hidden',
          borderBottom: 0,
          overflowY: 'hidden',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          marginBottom: tabsPrimarySpacing.tabPanelsSpacing.marginBottom,
          color: 'semanticNeutral.900',
          // border: "1px solid",
          // borderColor: "semanticNeutral.200",
          background: 'primitiveBG',
        },
        tabpanel: {
          padding: tabsPrimarySpacing.tabPanelSpacing.padding,
          paddingTop: tabsPrimarySpacing.tabPanelSpacing.paddingTop,
          paddingBootom: tabsPrimarySpacing.tabPanelSpacing.paddingBottom,
          paddingX: tabsPrimarySpacing.tabPanelSpacing.paddingX,
        },
      },
      secondary: {
        tablist: {
          width: 'full',
          whiteSpace: 'nowrap',
          paddingX: tabsGeralSpacing.tabListSpacing.paddingX,
          overflow: 'auto',
          overflowY: 'none',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'transparent',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            borderBottom: '2px solid',
            borderColor: '#127c65',
            color: '#127c65',
            fontWeight: 600,
          },
          _disabled: {
            // backgroundColor: "tabs.tabDisabledBG",
            // opacity: "0.5",
          },
        },
        tabpanels: {
          paddingTop: tabsGeralSpacing.tabPanelsSpacing.paddingTop,
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: tabsGeralSpacing.tabPanelsSpacing.paddingBottom,
        },
        tabpanel: {
          padding: tabsGeralSpacing.tabPanelSpacing.padding,
          paddingX: tabsGeralSpacing.tabPanelSpacing.paddingX,
          paddingY: tabsGeralSpacing.tabPanelSpacing.paddingY,
          backgroundColor: 'tabs.painelBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
      },
      secondaryAnalysis: {
        tablist: {
          width: 'full',
          whiteSpace: 'nowrap',
          paddingX: 0,
          overflow: 'auto',
          overflowY: 'none',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            // backgroundColor: "tabs.tabDisabledBG",
            // opacity: "0.5",
          },
        },
        tabpanels: {
          paddingTop: 0,
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: 0,
        },
        tabpanel: {
          padding: tabsGeralSpacing.tabPanelSpacing.padding,
          paddingX: tabsGeralSpacing.tabPanelSpacing.paddingX,
          paddingTop: 8,
          backgroundColor: 'FormBG',
        },
      },
      secondaryWithChildren: {
        tablist: {
          width: 'full',
          paddingX: tabsGeralSpacing.tabListSpacing.paddingX,
          overflow: 'auto',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: '15px',
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
        tabpanel: {
          padding: '0',
          paddingX: '0',
          paddingY: '0',
          backgroundColor: 'formBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
      },
      secondaryWithChildrenMobi: {
        tablist: {
          width: 'full',
          color: 'tabs.textColor',
          paddingX: '10',
          overflow: 'auto',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          backgroundColor: 'tabBG',
          color: 'semanticNeutral.400',
          marginRight: '8px',
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabSelectedBG',
            color: 'white',
          },
        },
        tabpanels: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
        tabpanel: {
          padding: '0',
          paddingX: '0',
          paddingY: '10',
          backgroundColor: 'formBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
      },
      secondaryMobi: {
        tablist: {
          width: 'full',
          paddingX: '10',
          overflow: 'auto',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: '8px',
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
        tabpanel: {
          padding: '0',
          paddingX: '0',
          paddingY: '10',
          backgroundColor: 'tabs.painelBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
      },
      'soft-rounded': {
        tablist: {
          overflow: 'auto',
          paddingX: tabsGeralSpacing.tabListSpacing.paddingX,
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          borderRadius: 'base',
          marginRight: '15px',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG2',
          _selected: {
            backgroundColor: 'primaryMain',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '14',
          paddingBottom: '0',
          paddingX: '0',
        },
      },
      'soft-rounded-mobi': {
        tablist: {
          overflow: 'auto',
          paddingX: '10',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          borderRadius: 'base',
          marginRight: '15px',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG2',
          _selected: {
            backgroundColor: 'primaryMain',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '14',
          paddingBottom: '0',
          paddingX: '0',
        },
      },
      'soft-rounded-outline': {
        tablist: {
          width: 'full',
          overflow: 'auto',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          borderRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG2',
            color: 'green.600',
            borderBottom: 'solid 3px',
          },
          _disabled: {
            opacity: '0.4',
            cursor: 'not-allowed',
          },
        },
        tabpanels: {
          paddingTop: '0',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '14',
          paddingBottom: '0',
          paddingX: '0',
        },
      },
    },
  };

  const TabsMobi = {
    parts: ['tab', 'tablist', 'tabpanel'],
    variants: {
      line: {
        tablist: {
          marginTop: tabsGeralSpacing.tabListSpacing.marginTop,
          color: 'semanticNeutral.900',
          paddingX: '8',
          width: 'full',
          overflow: 'auto',
          whiteSpace: 'nowrap',
          msOverflowStyle: 'hidden',
          borderBottom: 0,
          overflowY: 'hidden',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          marginBottom: '14',
          color: 'semanticNeutral.900',
          border: '1px solid',
          borderColor: 'semanticNeutral.200',
          background: 'formBG',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '14',
          paddingBootom: '0',
          paddingX: '7',
        },
      },
      primary: {
        tablist: {
          marginTop: tabsGeralSpacing.tabListSpacing.marginTop,
          color: 'semanticNeutral.900',
          paddingX: '8',
          width: 'full',
          overflow: 'auto',
          whiteSpace: 'nowrap',
          msOverflowStyle: 'hidden',
          borderBottom: 0,
          overflowY: 'hidden',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          marginBottom: '0',
          color: 'semanticNeutral.900',
          // border: "1px solid",
          // borderColor: "semanticNeutral.200",
          background: 'primitiveBG',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '0',
          paddingBootom: '0',
          paddingX: '0',
        },
      },
      secondary: {
        tablist: {
          width: 'full',
          whiteSpace: 'nowrap',
          paddingX: '10',
          overflow: 'auto',
          overflowY: 'none',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
        tabpanel: {
          padding: '0',
          paddingX: '0',
          paddingY: '10',
          backgroundColor: 'tabs.painelBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
      },

      secondaryModal: {
        tablist: {
          width: 'full',
          whiteSpace: 'nowrap',
          paddingX: '0',
          overflow: 'auto',
          overflowY: 'none',
          sx: {
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          },
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: tabsGeralSpacing.tabSpacing.marginRight,
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
        tabpanel: {
          padding: '0',
          paddingX: '0',
          paddingY: '10',
          borderColor: 'semanticNeutral.200',
        },
      },
      secondaryWithChildren: {
        tablist: {
          width: 'full',
          paddingX: '10',
          overflow: 'auto',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG',
          marginRight: '15px',
          borderTopLeftRadius: 'base',
          borderTopRightRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
          borderTop: '1px solid',
          borderColor: 'semanticNeutral.200',
          paddingBottom: '10',
        },
        tabpanel: {
          padding: '0',
          paddingX: '0',
          paddingY: '14',
          backgroundColor: 'formBG',
          borderBottom: '1px solid',
          borderColor: 'semanticNeutral.200',
        },
      },
      'soft-rounded': {
        tablist: {
          overflow: 'auto',
          paddingX: '10',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          borderRadius: 'base',
          marginRight: '15px',
          color: 'tabs.textColor',
          backgroundColor: 'tabs.tabBG2',
          _selected: {
            backgroundColor: 'primaryMain',
            color: 'tabs.textSelectedColor',
          },
          _disabled: {
            backgroundColor: 'tabs.tabDisabledBG',
          },
        },
        tabpanels: {
          paddingTop: '0',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '14',
          paddingBottom: '0',
          paddingX: '0',
        },
      },
      'soft-rounded-outline': {
        tablist: {
          width: 'full',
          overflow: 'auto',
          msOverflowStyle: 'none',
          whiteSpace: 'nowrap',
        },
        tab: {
          paddingX: tabsGeralSpacing.tabSpacing.paddingX,
          fontWeight: 'medium',
          color: 'tabs.textColor',
          borderRadius: 'base',
          _selected: {
            backgroundColor: 'tabs.tabSelectedBG2',
            color: 'green.600',
            borderBottom: 'solid 3px',
          },
          _disabled: {
            opacity: '0.4',
            cursor: 'not-allowed',
          },
        },
        tabpanels: {
          paddingTop: '0',
        },
        tabpanel: {
          padding: '0',
          paddingTop: '14',
          paddingBottom: '0',
          paddingX: '0',
        },
      },
    },
  };

  return TabsWeb;
}
