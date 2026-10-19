import { useMediaQuery } from "@chakra-ui/react";

export function configureSpacing() {
  const [isMobile] = useMediaQuery(["(max-width: 850px)"]);

  const formSpacing = {
    paddingY: isMobile ? "10" : "10",
    paddingX: isMobile ? "10" : "10",
    paddingTop: isMobile ? "10" : "10",
    paddingBottom: isMobile ? "10" : "10",
    paddingLeft: isMobile ? "10" : "10",
    paddingRight: isMobile ? "10" : "10",
    padding: isMobile ? "10" : "10",
  };

  const gridSpacing = {
    paddingY: isMobile ? "10" : "10",
    paddingX: isMobile ? "10" : "10",
    paddingTop: isMobile ? "10" : "10",
    paddingBottom: isMobile ? "10" : "10",
    paddingLeft: isMobile ? "10" : "10",
    paddingRight: isMobile ? "10" : "10",
    padding: isMobile ? "10" : "10",
  };

  const tabsGeralSpacing = {
    tabListSpacing: {
      paddingX: isMobile ? "10" : "10",
      marginTop: isMobile ? "10" : "14",
    },
    tabSpacing: {
      paddingX: isMobile ? "2" : "4",
      marginRight: 2,
    },
    tabPanelsSpacing: {
      paddingTop: 0,
      paddingBottom: isMobile ? "6" : "8",
    },
    tabPanelSpacing: {
      padding: 0,
      paddingX: 0,
      paddingY: isMobile ? "6" : "10",
      paddingBottom: 0,
    },
  };
  const tabsLineSpacing = {
    tabListSpacing: {
      paddingX: isMobile ? "2" : "4",
      marginTop: isMobile ? "6" : "8",
    },
    tabSpacing: {
      paddingX: isMobile ? "2" : "4",
      marginRight: 2,
    },
    tabPanelsSpacing: {
      paddingTop: 0,
      paddingBottom: isMobile ? "6" : "8",
    },
    tabPanelSpacing: {
      padding: 0,
      paddingTop: isMobile ? "6" : "8",
      paddingBottom: 0,
      paddingX: isMobile ? "4" : "7",
    },
  };
  const tabsPrimarySpacing = {
    tabListSpacing: {
      paddingX: isMobile ? "0" : "0",
      marginTop: isMobile ? "10" : "6",
    },
    tabSpacing: {
      paddingX: isMobile ? "2" : "4",
      marginRight: 2,
    },
    tabPanelsSpacing: {
      marginBottom: 0,
    },
    tabPanelSpacing: {
      padding: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingX: 0,
    },
  };
  return {
    formSpacing,
    gridSpacing,
    tabsGeralSpacing,
    tabsLineSpacing,
    tabsPrimarySpacing,
  };
}
