import { headerWindowColor } from "@/constants/header-window-color";

export type HeaderWindowColorType =
  typeof headerWindowColor[keyof typeof headerWindowColor];
