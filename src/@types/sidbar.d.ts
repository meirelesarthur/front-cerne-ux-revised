import { IconType } from "react-icons";

export interface SidebarSubCategory {
  id: string;
  idPai: string;
  idModule: string;
  title: string;
  icon?: IconType | React.FunctionComponent;
  iconColorMode?: "fill" | "stroke";
  linkedTo?: string;
  path?: string;
  childrens?: SidebarSubCategory[];
  type: "menu" | "link" | "hidden";
  master?: boolean;
}

export interface SidebarCategory {
  id: string;
  idModule?: string;
  idPai?: string;
  title: string;
  icon: IconType | React.FunctionComponent;
  iconColorMode?: "fill" | "stroke";
  linkedTo?: string;
  path?: string;
  childrens: SidebarSubCategory[];
  type?: "menu" | "link" | "hidden";
  master?: boolean;
}
