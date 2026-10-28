import type { SemanticTokensColors } from "@/@types/theme";

// Definição das cores semânticas para o tema "light"
const colors: SemanticTokensColors = {
  brandColorText: { value: "{colors.blue.700}" },
  loadingBG: { value: "rgba(255, 255, 255, 0.36)" },
  primitiveBG: { value: "{colors.gray.100}" },
  primitiveBGHover: { value: "{colors.gray.100}" },
  primitiveTexteColor: { value: "{colors.gray.700}" },
  secondaryTexteColor: { value: "{colors.gray.100}" },
  primitiveDisableTextColor: { value: "{colors.gray.400}" },
  primaryMain: { value: "{colors.blue.500}" },
  primaryDarker: { value: "{colors.blue.900}" },
  primaryDark: { value: "{colors.blue.700}" },
  primaryLighter: { value: "{colors.blue.100}" },
  primaryLight: { value: "{colors.blue.300}" },
  primary: { value: "{colors.blue.200}" },
  primary2: { value: "{colors.blue.100}" },
  primary300: { value: "{colors.blue.600}" },
  primary400: { value: "{colors.blue.500}" },
  primary500: { value: "{colors.blue.500}" },
  secondaryMain: { value: "{colors.gray.500}" },
  secondaryDark: { value: "{colors.gray.600}" },
  secondaryDarker: { value: "{colors.gray.900}" },
  secondaryLight: { value: "{colors.gray.200}" },
  secondaryLighter: { value: "{colors.gray.100}" },
  secondary: { value: "{colors.green.50}" },
  secondary2: { value: "{colors.gray.100}" },
  secondary300: { value: "{colors.gray.300}" },
  secondary400: { value: "{colors.gray.400}" },
  secondaryBG: { value: "{colors.whiteSecondary}" },
  outlineBorder: { value: "{colors.gray.200}" },
  headerPanelBG: { value: "{colors.white}" },
  menuBG: { value: "{colors.black}" },
  menuTextColor: { value: "{colors.white}" },
  menuSelectedTextColor: { value: "{colors.gray.100}" },
  menuSelectedBG: { value: "{colors.gray.100}" },
  menuLateralBG: { value: "{colors.gray.600}" },
  border1: { value: "{colors.gray.200}" },
  border2: { value: "{colors.gray.300}" },
  borderGrid: { value: "#F0F0F0" }, // stroke da DataTable (Ajustes Globais)
  formBG: { value: "{colors.white}" },
  classSyntheticBG: { value: "{colors.green.50}" },
  classSyntheticText: { value: "{colors.green.700}" },
  bg: { muted: { value: "{colors.gray.50}" } },
  gridBG: { value: "{colors.white}" }, // zebra base #FFFFFF (Ajustes Globais)
  gridBGAlternate: { value: "#FBFBFB" }, // zebra alternada (Ajustes Globais)
  // Suprimentos (execução 081, T-081-FE-01) — linha do tipo U (Emergencial) e bolinhas de status 1..11, cores do legado (`RequestPurchase::colors()` e `#EE6D8F`).
  supplyEmergencyRowBg: { value: '#EE6D8F' },
  supplyStatus1: { value: '#858796' },
  supplyStatus2: { value: '#FEC02C' },
  supplyStatus3: { value: '#B8860B' },
  supplyStatus4: { value: '#8DCDA3' },
  supplyStatus5: { value: '#FF69B4' },
  supplyStatus6: { value: '#038F59' },
  supplyStatus7: { value: '#00FFFF' },
  supplyStatus8: { value: '#0336FF' },
  supplyStatus9: { value: '#6200EE' },
  supplyStatus10: { value: '#A52A2A' },
  supplyStatus11: { value: '#0f294b' },
  gridHeadEndFooter: { value: "{colors.white}" },
  gridHeadSecondary: { value: "{colors.gray.50}" },
  textGridColor: { value: "{colors.gray.900}" },
  selectedTextGridColor: { value: "{colors.green.50}" },
  textInlineBG: { value: "{colors.white}" },
  tabSelectedBG: { value: "{colors.gray.700}" },
  tabBG: { value: "{colors.gray.700}" },
  textReadOnlyColor: { value: "{colors.gray.600}" },
  buttonOutlineBG: { value: "{colors.white}" },
  buttonOutlineColor: { value: "{colors.blue.500}" },
  buttonSolidBG: { value: "{colors.blue.500}" },
  buttonSolidColor: { value: "{colors.white}" },
  paginationColor: { value: "{colors.gray.700}" },
  paginationBG: { value: "{colors.white}" },
  paginationSelectedBG: { value: "{colors.blue.500}" },
  paginationSelectedColor: { value: "{colors.gray.100}" },
  cardColor: { value: "{colors.green.700}" },
  placeholderColor: { value: "{colors.gray.400}" },
  focusGlow: { value: 'rgba(5, 150, 105, 0.12)' },
  inputBG: { value: "{colors.gray.50}" }, // DS bg.input
  tabs: {
    textColor: { value: "{colors.gray.700}" },
    textSelectedColor: { value: "{colors.gray.100}" },
    tabBG: { value: "{colors.gray.200}" },
    tabBG2: { value: "{colors.white}" },
    tabSelectedBGPrimary: { value: "{colors.blue.500}" },
    tabSelectedBG: { value: "{colors.gray.900}" },
    tabSelectedBG2: { value: "{colors.gray.100}" },
    tabDisabledBG: { value: "{colors.gray.200}" },
    painelBG: { value: "{colors.white}" },
  },
  headerWindowBG: {
    create: { value: "{colors.green.500}" },
    update: { value: "{colors.green.900}" },
    consult: { value: "{colors.blue.900}" },
  },
  headerWindowColor: {
    create: { value: "{colors.white}" },
    update: { value: "{colors.white}" },
    consult: { value: "{colors.white}" },
  },
  text: {
    primary: { value: "{colors.gray.700}" },
    secondary: { value: "{colors.gray.500}" },
    disabled: { value: "{colors.gray.400}" },
    inverse: { value: "{colors.gray.100}" },
  },
  semanticNeutral: {
    100: { value: "{colors.gray.100}" },
    200: { value: "{colors.gray.200}" },
    300: { value: "{colors.gray.300}" },
    400: { value: "{colors.gray.400}" },
    500: { value: "{colors.gray.500}" },
    600: { value: "{colors.gray.600}" },
    700: { value: "{colors.gray.700}" },
    800: { value: "{colors.gray.800}" },
    900: { value: "{colors.gray.900}" },
  },
  foreground: {
    1: { value: "{colors.whiteSecondary}" },
    2: { value: "{colors.gray.600}" },
    3: { value: "{colors.gray.400}" },
    4: { value: "{colors.celeste}" },
    "3.2": { value: "{colors.gray.550}" },
  },
  feedBack: {
    successMain: { value: "{colors.green.700}" },
    warnMain: { value: "{colors.yellow.700}" },
    errorMain: { value: "{colors.red.700}" },
    infoMain: { value: "#2563eb" },
    // DS feedback.*.bg: success brand50 · error red100 · warning amber50 · info blue50
    success: { value: "{colors.green.50}" },
    warn: { value: "{colors.yellow.50}" },
    error: { value: "{colors.red.100}" },
    info: { value: "#eff6ff" },
  },
  colorCicle: {
    success: { value: "{colors.blue.100}" },
    warn: { value: "{colors.yellow.200}" },
    error: { value: "{colors.red.200}" },
    info: { value: "{colors.green.200}" },
  },
  colorIcon: {
    success: { value: "{colors.green.500}" },
    warn: { value: "{colors.yellow.500}" },
    error: { value: "{colors.red.500}" },
    info: { value: "{colors.blue.500}" },
  },
  bodyBackground: { value: "#E8E8E8" }, // fundo geral / bg.canvas (Ajustes Globais)
  bodyColor: { value: "{colors.gray.600}" }, // fg.muted (#404040)
  // Card externo de conteúdo (envolve Header+SecondaryNav+página) — bg.outer do CERNE.
  // NÃO é o mesmo valor de cardBG (bg.surface, #ffffff): outer é levemente mais
  // acinzentado, distinguindo o "card grande" do chassi dos cards internos de página.
  contentOuterBG: { value: "#F2F2F2" }, // segundo nível / bg.outer (Ajustes Globais)
  // Login page specific colors — CERNE (split-screen: left verde escuro / right warm white)
  loginBackground: { value: "#081a12" },
  loginCardBG: { value: "rgba(255, 255, 255, 0.16)" },
  loginTextWhite: { value: "#ffffff" },
  loginInputBG: { value: "#fafafa" },
  loginInputBorder: { value: "#e5e7eb" },
  loginInputIcon: { value: "#6b7280" },
  loginButtonPrimary: { value: "{colors.green.600}" }, // accent.default (#059669)
  // TopBar colors
  topBarBG: { value: "{colors.white}" },
  topBarBorder: { value: "{colors.gray.200}" },
  topBarIconColor: { value: "{colors.gray.600}" },
  topBarTextColor: { value: "{colors.gray.900}" },
  topBarTextSecondary: { value: "{colors.gray.500}" },
  topBarNotificationBadge: { value: "{colors.red.500}" },
  // Header Module Navigation colors — nav.* do CERNE
  headerModuleColor: { value: "#525252" }, // nav.text
  headerModuleActiveColor: { value: "{colors.green.700}" }, // nav.headerText / accent.hover
  headerModuleActiveBG: { value: "{colors.green.50}" }, // nav.itemActive (#f0fdf4)
  headerModuleHoverBG: { value: "rgba(0,0,0,0.04)" }, // nav.itemHover
  // Sidebar colors — nav.* do CERNE
  sidebarBG: { value: "{colors.white}" }, // bg.sidebar (#ffffff)
  sidebarBorder: { value: "{colors.gray.200}" },
  sidebarTextColor: { value: "#525252" }, // nav.text
  sidebarTextHover: { value: "{colors.gray.900}" }, // nav.textActive (#171717)
  sidebarTitleColor: { value: "{colors.gray.900}" },
  sidebarSubtitleColor: { value: "{colors.gray.500}" }, // nav.textMuted
  sidebarItemHoverBG: { value: "rgba(0,0,0,0.04)" }, // nav.itemHover
  sidebarItemActiveBG: { value: "rgba(5, 150, 105, 0.10)" }, // nav.itemActive (realce translúcido verde marca)
  sidebarItemActiveText: { value: "#059669" }, // accent.hover
  // Card colors — bg.surface / border.default / fg.* do CERNE
  cardBG: { value: "{colors.white}" }, // bg.surface (#ffffff)
  cardBorder: { value: "{colors.gray.200}" }, // border.default (#e5e7eb)
  cardTextPrimary: { value: "{colors.gray.900}" }, // fg.default (#171717 via text.black)
  cardTextSecondary: { value: "{colors.gray.600}" }, // fg.muted (#404040)
  // Texto forte (títulos) e estado "selecionado suave" — mudam com o tema
  strongText: { value: "{colors.gray.900}" },
  selectedBG: { value: "{colors.green.50}" },
  selectedText: { value: "{colors.green.700}" },
  selectedChipBG: { value: "{colors.green.100}" },
  // Painel de resumo (simulador de planos): bloco de contraste, mesmo valor em qualquer tema
  planPro: { value: "#047857" },
  planDeluxe: { value: "#9a6408" },
  planEnterprise: { value: "#3c4a9e" },
  onPlan: { value: "#ffffff" },
  summaryLine: { value: "rgba(255, 255, 255, 0.10)" },
  summaryLineStrong: { value: "rgba(255, 255, 255, 0.12)" },
  summaryFill: { value: "rgba(255, 255, 255, 0.05)" },
  summaryFillMid: { value: "rgba(255, 255, 255, 0.08)" },
  summaryFillActive: { value: "rgba(255, 255, 255, 0.14)" },
  summaryNoteBG: { value: "rgba(16, 185, 129, 0.14)" },
  addonSoftBG: { value: "rgba(138, 59, 107, 0.08)" },
  summaryBg: { value: "#0b2519" },
  summaryAccent: { value: "#10b981" },
  summaryText: { value: "#e2f0e8" },
  summaryMuted: { value: "#9fc2b0" },
  summaryFaint: { value: "#7da893" },
  summaryIcon: { value: "#6ee7b7" },
  summaryPositive: { value: "#4ade80" },
  summaryAdded: { value: "#f0abcf" },
  addonText: { value: "#8a3b6b" }, // valor avulso/adicional no catálogo de planos
  cardShadow: { value: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)" }, // shadow.card do CERNE
  // Chart colors
  chartGridLine: { value: "{colors.gray.200}" },
  chartAxisText: { value: "{colors.gray.500}" },
  chartTooltipBG: { value: "{colors.white}" },
  chartTooltipBorder: { value: "{colors.gray.200}" },
  // Stat Card colors (para painéis de estatísticas)
  statCard: {
    // Card padrão (neutro)
    defaultBG: { value: "{colors.gray.100}" },
    defaultBorder: { value: "{colors.gray.200}" },
    defaultText: { value: "{colors.gray.700}" },
    defaultIcon: { value: "{colors.gray.500}" },
    // Card de sucesso (verde)
    successBG: { value: "{colors.green.50}" },
    successBorder: { value: "{colors.green.200}" },
    successText: { value: "{colors.green.700}" },
    successIcon: { value: "{colors.green.500}" },
    // Card primário (azul)
    primaryBG: { value: "{colors.blue.100}" },
    primaryBorder: { value: "{colors.blue.200}" },
    primaryText: { value: "{colors.blue.700}" },
    primaryIcon: { value: "{colors.blue.500}" },
    // Card de aviso (laranja/amarelo)
    warningBG: { value: "{colors.orange.50}" },
    warningBorder: { value: "{colors.orange.200}" },
    warningText: { value: "{colors.orange.700}" },
    warningIcon: { value: "{colors.orange.500}" },
    // Card roxo (para grupos/categorias)
    purpleBG: { value: "{colors.purple.50}" },
    purpleBorder: { value: "{colors.purple.200}" },
    purpleText: { value: "{colors.purple.700}" },
    purpleIcon: { value: "{colors.purple.500}" },
  },
  // Permission UI colors
  permissionActive: {
    bg: { value: "{colors.gray.50}" },
    bgHover: { value: "{colors.purple.100}" },
    border: { value: "{colors.purple.300}" },
    icon: { value: "{colors.purple.600}" },
  },
  permissionInactive: {
    bg: { value: "{colors.gray.100}" },
    bgHover: { value: "{colors.gray.200}" },
    border: { value: "{colors.gray.300}" },
    icon: { value: "{colors.gray.500}" },
  },
  // Terminal colors (sempre escuro como PowerShell - igual ao dark mode)
  terminal: {
    // Fundo azul bem escuro (tonalidade do protótipo: oklch(0.22 0.03 262)),
    // próximo do preto mas com matiz azul. Header mantido (gray).
    bg: { value: '#0d1526' },
    headerBG: { value: '{colors.gray.700}' },
    headerBorder: { value: '{colors.gray.600}' },
    contentBG: { value: '#111b2e' },
    text: { value: '{colors.gray.100}' },
    textMuted: { value: '{colors.gray.300}' },
    textDisabled: { value: '{colors.gray.600}' },
    border: { value: '{colors.gray.700}' },
    cardBG: { value: '#172238' },
    cardBorder: { value: '{colors.gray.600}' },
    phaseBG: { value: '#141f33' },
    phaseActiveBG: { value: '#1a2332' },
    phaseActiveBorder: { value: '{colors.blue.600}' },
    outputBG: { value: '#0d1422' },
    streamingBG: { value: 'rgba(59, 130, 246, 0.1)' },
    streamingBorder: { value: 'rgba(59, 130, 246, 0.3)' },
    successBG: { value: 'rgba(34, 197, 94, 0.1)' },
    successBorder: { value: 'rgba(34, 197, 94, 0.3)' },
    successText: { value: '{colors.green.400}' },
    errorBG: { value: 'rgba(239, 68, 68, 0.1)' },
    errorBorder: { value: 'rgba(239, 68, 68, 0.3)' },
    errorText: { value: '{colors.red.400}' },
    statusRunning: { value: '{colors.blue.400}' },
    statusCompleted: { value: '{colors.green.400}' },
    statusError: { value: '{colors.red.400}' },
    statusPending: { value: '{colors.yellow.400}' },
    liveIndicator: { value: '{colors.green.400}' },
  },
  // Trial Banner colors
  trialBanner: {
    bg: { value: '{colors.purple.50}' },
    border: { value: '{colors.purple.200}' },
    text: { value: '{colors.purple.800}' },
    icon: { value: '{colors.purple.500}' },
    ctaBg: { value: '{colors.purple.600}' },
    ctaText: { value: '{colors.white}' },
  },
  // Classification/taxonomy badge colors (ClassificationBadge, execução 044,
  // TASK-DFE-FE-05 — gap registrado em `dfe-manifest-event.ts`). `slot1..4`
  // mapeiam Ciência/Confirmação/Desconhecimento/Operação-não-realizada
  // (`dfeManifestEventColor`); `slot5..8` reservados para o próximo consumidor.
  classification: {
    slot1: {
      bg: { value: '{colors.blue.100}' },
      fg: { value: '{colors.blue.700}' },
      border: { value: '{colors.blue.200}' },
    },
    slot2: {
      bg: { value: '{colors.green.100}' },
      fg: { value: '{colors.green.700}' },
      border: { value: '{colors.green.200}' },
    },
    slot3: {
      bg: { value: '{colors.orange.100}' },
      fg: { value: '{colors.orange.700}' },
      border: { value: '{colors.orange.200}' },
    },
    slot4: {
      bg: { value: '{colors.red.100}' },
      fg: { value: '{colors.red.700}' },
      border: { value: '{colors.red.200}' },
    },
    slot5: {
      bg: { value: '{colors.purple.100}' },
      fg: { value: '{colors.purple.700}' },
      border: { value: '{colors.purple.200}' },
    },
    slot6: {
      bg: { value: '{colors.yellow.100}' },
      fg: { value: '{colors.yellow.800}' },
      border: { value: '{colors.yellow.200}' },
    },
    slot7: {
      bg: { value: '{colors.gray.200}' },
      fg: { value: '{colors.gray.700}' },
      border: { value: '{colors.gray.300}' },
    },
    slot8: {
      bg: { value: '{colors.gray.100}' },
      fg: { value: '{colors.gray.600}' },
      border: { value: '{colors.gray.200}' },
    },
    neutral: {
      bg: { value: '{colors.gray.100}' },
      fg: { value: '{colors.gray.550}' },
      border: { value: '{colors.gray.200}' },
    },
  },
  // Paleta categórica de séries dos gráficos de dashboard (execução 046,
  // TASK-DASH-FE-01). Espelha `t.chart.series[0..7]` do `cerne`
  // (GB.Cerne.UX/src/design/tokens.ts@8663490) — mesmos 8 hex, literais como
  // os demais tokens de identidade visual desta paleta (`borderGrid`,
  // `bodyBackground`, `contentOuterBG` acima também são hex diretos: a rampa
  // `blue`/`red`/`yellow` de `color-tokens.ts` foi remapeada para a marca
  // verde do CERNE e não serve para uma paleta categórica distinguível).
  // Consumida via `getChartSeriesColor` (`src/constants/dashboards/chart-series-palette.ts`),
  // nunca hex direto em componente.
  chart: {
    series: {
      0: { value: '#059669' }, // brand
      1: { value: '#3b82f6' }, // azul
      2: { value: '#f59e0b' }, // âmbar
      3: { value: '#7c3aed' }, // roxo
      4: { value: '#ef4444' }, // vermelho
      5: { value: '#0891b2' }, // ciano
      6: { value: '#d97706' }, // laranja
      7: { value: '#65a30d' }, // verde-limão
    },
    grid: { value: '{colors.gray.200}' }, // mesmo valor de chartGridLine (light)
    surface: { value: '{colors.white}' }, // mesmo valor de cardBG (light)
  },
};

// Definição dos estilos globais específicos para este tema
const styles = {
  global: {
    "html, body": {
      backgroundColor: "bodyBackground",
      color: "bodyColor",
    },
    html: {
      fontSize: "100%", // DS: raiz fixa em 16px (antes escalonava 14/15/16px por largura)
    },
    ".chakra-button__icon": { fontSize: "2xl" },
    ".chakra-menu__icon-wrapper": { fontSize: "2xl!important" },
    // DS: scrollbar fina de 4px, visível (thumb neutral300, hover neutral400).
    // Antes: oculta em todo o app ("decisão do dev"); revertido ao desenho oficial.
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "#d1d5db transparent",
    },
    "*::-webkit-scrollbar": { width: "4px", height: "4px" },
    "*::-webkit-scrollbar-track": { background: "transparent" },
    "*::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "9999px" },
    "*::-webkit-scrollbar-thumb:hover": { background: "#9ca3af" },
  },
};

export const lightTheme = {
  colors,
  styles,
};
