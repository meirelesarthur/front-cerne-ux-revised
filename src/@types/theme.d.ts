// src/@types/theme.d.ts

export interface SemanticTokensColors {
  brandColorText: { value: string };
  loadingBG: { value: string };
  primitiveBG: { value: string };
  primitiveBGHover: { value: string };
  primitiveTexteColor: { value: string };
  secondaryTexteColor: { value: string };
  primitiveDisableTextColor: { value: string };
  primaryMain: { value: string };
  primaryDarker: { value: string };
  primaryDark: { value: string };
  primaryLighter: { value: string };
  primaryLight: { value: string };
  primary: { value: string };
  primary2: { value: string };
  primary300: { value: string };
  primary400: { value: string };
  primary500: { value: string };
  secondaryMain: { value: string };
  secondaryDark: { value: string };
  secondaryDarker: { value: string };
  secondaryLight: { value: string };
  secondaryLighter: { value: string };
  secondary: { value: string };
  secondary2: { value: string };
  secondary300: { value: string };
  secondary400: { value: string };
  secondaryBG: { value: string };
  outlineBorder: { value: string };
  headerPanelBG: { value: string };
  menuBG: { value: string };
  menuTextColor: { value: string };
  menuSelectedTextColor: { value: string };
  menuSelectedBG: { value: string };
  menuLateralBG: { value: string };
  border1: { value: string };
  border2: { value: string };
  borderGrid: { value: string };
  formBG: { value: string };
  classSyntheticBG: { value: string };
  classSyntheticText: { value: string };
  bg: { muted: { value: string } };
  gridBG: { value: string };
  gridBGAlternate: { value: string };
  supplyEmergencyRowBg: { value: string };
  supplyStatus1: { value: string };
  supplyStatus2: { value: string };
  supplyStatus3: { value: string };
  supplyStatus4: { value: string };
  supplyStatus5: { value: string };
  supplyStatus6: { value: string };
  supplyStatus7: { value: string };
  supplyStatus8: { value: string };
  supplyStatus9: { value: string };
  supplyStatus10: { value: string };
  supplyStatus11: { value: string };
  gridHeadEndFooter: { value: string };
  gridHeadSecondary: { value: string };
  textGridColor: { value: string };
  selectedTextGridColor: { value: string };
  textInlineBG: { value: string };
  tabSelectedBG: { value: string };
  tabBG: { value: string };
  textReadOnlyColor: { value: string };
  buttonOutlineBG: { value: string };
  buttonOutlineColor: { value: string };
  buttonSolidBG: { value: string };
  buttonSolidColor: { value: string };
  paginationColor: { value: string };
  paginationBG: { value: string };
  paginationSelectedBG: { value: string };
  paginationSelectedColor: { value: string };
  cardColor: { value: string };
  placeholderColor: { value: string };
  inputBG: { value: string };
  tabs: {
    textColor: { value: string };
    textSelectedColor: { value: string };
    tabBG: { value: string };
    tabBG2: { value: string };
    tabSelectedBG: { value: string };
    tabSelectedBG2: { value: string };
    tabSelectedBGPrimary: { value: string };
    tabDisabledBG: { value: string };
    painelBG: { value: string };
  };
  headerWindowBG: {
    create: { value: string };
    update: { value: string };
    consult: { value: string };
  };
  headerWindowColor: {
    create: { value: string };
    update: { value: string };
    consult: { value: string };
  };
  text: {
    primary: { value: string };
    secondary: { value: string };
    disabled: { value: string };
    inverse: { value: string };
  };
  semanticNeutral: {
    100: { value: string };
    200: { value: string };
    300: { value: string };
    400: { value: string };
    500: { value: string };
    600: { value: string };
    700: { value: string };
    800: { value: string };
    900: { value: string };
  };
  foreground: {
    1: { value: string };
    2: { value: string };
    3: { value: string };
    4: { value: string };
    '3.2': { value: string };
  };
  feedBack: {
    successMain: { value: string };
    warnMain: { value: string };
    errorMain: { value: string };
    infoMain: { value: string };
    success: { value: string };
    warn: { value: string };
    error: { value: string };
    info: { value: string };
  };
  colorCicle: {
    success: { value: string };
    warn: { value: string };
    error: { value: string };
    info: { value: string };
  };
  colorIcon: {
    success: { value: string };
    warn: { value: string };
    error: { value: string };
    info: { value: string };
  };
  bodyBackground: { value: string };
  bodyColor: { value: string };
  // Card externo de conteúdo (envolve Header+SecondaryNav+página) — bg.outer do CERNE.
  // Distinto de cardBG (bg.surface): outer é o "card grande" do chassi, surface é
  // usado por cards internos de página (PageCard etc.).
  contentOuterBG: { value: string };
  loginBackground: { value: string };
  loginCardBG: { value: string };
  loginTextWhite: { value: string };
  loginInputBG: { value: string };
  loginInputBorder: { value: string };
  loginInputIcon: { value: string };
  loginButtonPrimary: { value: string };
  // TopBar colors
  topBarBG: { value: string };
  topBarBorder: { value: string };
  topBarIconColor: { value: string };
  topBarTextColor: { value: string };
  topBarTextSecondary: { value: string };
  topBarNotificationBadge: { value: string };
  // Header Module Navigation colors
  headerModuleColor: { value: string };
  headerModuleActiveColor: { value: string };
  headerModuleActiveBG: { value: string };
  headerModuleHoverBG: { value: string };
  // Sidebar colors
  sidebarBG: { value: string };
  sidebarBorder: { value: string };
  sidebarTextColor: { value: string };
  sidebarTextHover: { value: string };
  sidebarTitleColor: { value: string };
  sidebarSubtitleColor: { value: string };
  sidebarItemHoverBG: { value: string };
  sidebarItemActiveBG: { value: string };
  sidebarItemActiveText: { value: string };
  // Card colors
  cardBG: { value: string };
  cardBorder: { value: string };
  cardTextPrimary: { value: string };
  cardTextSecondary: { value: string };
  cardShadow: { value: string };
  summaryBg: { value: string };
  summaryAccent: { value: string };
  summaryText: { value: string };
  summaryMuted: { value: string };
  summaryFaint: { value: string };
  summaryIcon: { value: string };
  summaryPositive: { value: string };
  summaryAdded: { value: string };
  addonText: { value: string };
  // Chart colors
  chartGridLine: { value: string };
  chartAxisText: { value: string };
  chartTooltipBG: { value: string };
  chartTooltipBorder: { value: string };
  // Stat Card colors (para painéis de estatísticas)
  statCard: {
    // Card padrão (neutro)
    defaultBG: { value: string };
    defaultBorder: { value: string };
    defaultText: { value: string };
    defaultIcon: { value: string };
    // Card de sucesso (verde)
    successBG: { value: string };
    successBorder: { value: string };
    successText: { value: string };
    successIcon: { value: string };
    // Card primário (azul)
    primaryBG: { value: string };
    primaryBorder: { value: string };
    primaryText: { value: string };
    primaryIcon: { value: string };
    // Card de aviso (laranja/amarelo)
    warningBG: { value: string };
    warningBorder: { value: string };
    warningText: { value: string };
    warningIcon: { value: string };
    // Card roxo (para grupos/categorias)
    purpleBG: { value: string };
    purpleBorder: { value: string };
    purpleText: { value: string };
    purpleIcon: { value: string };
  };
  // Permission UI colors
  permissionActive: {
    bg: { value: string };
    bgHover: { value: string };
    border: { value: string };
    icon: { value: string };
  };
  permissionInactive: {
    bg: { value: string };
    bgHover: { value: string };
    border: { value: string };
    icon: { value: string };
  };
  // Terminal colors
  terminal: {
    bg: { value: string };
    headerBG: { value: string };
    headerBorder: { value: string };
    contentBG: { value: string };
    text: { value: string };
    textMuted: { value: string };
    textDisabled: { value: string };
    border: { value: string };
    cardBG: { value: string };
    cardBorder: { value: string };
    phaseBG: { value: string };
    phaseActiveBG: { value: string };
    phaseActiveBorder: { value: string };
    outputBG: { value: string };
    streamingBG: { value: string };
    streamingBorder: { value: string };
    successBG: { value: string };
    successBorder: { value: string };
    successText: { value: string };
    errorBG: { value: string };
    errorBorder: { value: string };
    errorText: { value: string };
    statusRunning: { value: string };
    statusCompleted: { value: string };
    statusError: { value: string };
    statusPending: { value: string };
    liveIndicator: { value: string };
  };
  // Trial Banner colors
  trialBanner: {
    bg: { value: string };
    border: { value: string };
    text: { value: string };
    icon: { value: string };
    ctaBg: { value: string };
    ctaText: { value: string };
  };
  // Classification/taxonomy badge colors (ex.: manifesto SEFAZ da Dfe,
  // `ClassificationBadge`/`ClassificationSlot`,
  // `src/constants/Fiscal/dfe/dfe-manifest-event.ts`, execução 044,
  // TASK-DFE-FE-05) — cor de TAXONOMIA de domínio (categoria/estado
  // nomeado), nunca resultado de ação (`feedBack.*`) nem paleta crua
  // (`colorPalette`). `slot1..slot4` cobrem os 4 eventos reais do enum de
  // manifestação; `slot5..slot8` ficam PRONTOS (mesma forma) para o próximo
  // módulo que precisar de mais categorias nomeadas, sem reabrir este
  // arquivo. `neutral` é o estado "sem categoria"/"não classificado".
  classification: {
    slot1: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot2: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot3: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot4: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot5: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot6: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot7: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    slot8: { bg: { value: string }; fg: { value: string }; border: { value: string } };
    neutral: { bg: { value: string }; fg: { value: string }; border: { value: string } };
  };
  // Paleta categórica de séries dos gráficos de dashboard (execução 046,
  // TASK-DASH-FE-01 — kit `src/components/charts/*` + `DashboardGrid`).
  // Espelha `t.chart.series[0..7]` do design system `cerne`
  // (`GB.Cerne.UX/src/design/tokens.ts`, commit 8663490). Estrutura ANINHADA
  // (`chart.*`), distinta dos tokens FLAT pré-existentes acima
  // (`chartGridLine`/`chartAxisText`/`chartTooltipBG`/`chartTooltipBorder`,
  // mantidos — consumidos pelo `EstacaoDeMontaBarChart` feito à mão).
  // `chart.grid`/`chart.surface` cobrem o canvas dos gráficos novos
  // (`@chakra-ui/charts` + `recharts`); `chart.series.0..7` é a paleta
  // consumida via `getChartSeriesColor` (`src/constants/dashboards/chart-series-palette.ts`).
  chart: {
    series: {
      0: { value: string };
      1: { value: string };
      2: { value: string };
      3: { value: string };
      4: { value: string };
      5: { value: string };
      6: { value: string };
      7: { value: string };
    };
    grid: { value: string };
    surface: { value: string };
  };
}
