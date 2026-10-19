import { useMediaQuery } from "@chakra-ui/react";

export const TooltipWeb = {
  baseStyle: {
    borderRadius: "md",
    fontWeight: "normal",
    border: "1px solid",
    borderColor: "borderGrid",
  },
};

export const TooltipMobi = {};

export function tooltip() {
  const [isMobile] = useMediaQuery(["(max-width: 850px)"]);

  return isMobile ? TooltipWeb : TooltipWeb;
}
