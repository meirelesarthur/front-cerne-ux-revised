// src/icon-type.d.ts
import "@chakra-ui/react";
import { ElementType } from "react";

import { IconType } from "react-icons";

declare module "@chakra-ui/react" {
  // Estendemos a interface de props do componente Icon do Chakra
  export interface IconProps {
    // E dizemos a ele que a prop 'as' pode ser do tipo original (ElementType)
    // OU do tipo da biblioteca react-icons (IconType).
    as?: ElementType | IconType;
  }
}
