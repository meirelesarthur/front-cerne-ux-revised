// src/components/Form/FormBody.tsx
import { forwardRef } from "react";

import { BoxProps } from "@chakra-ui/react";

import { SimpleGridFilter } from "../layouts/SimpleGridFilter";

export const FormBodyFilter = forwardRef<HTMLDivElement, Omit<BoxProps, "columns">>(
  ({ children, ...rest }, ref) => (
    <SimpleGridFilter ref={ref} {...rest}>
      {children}
    </SimpleGridFilter>
  ),
);

FormBodyFilter.displayName =
  "FormBodyFilter";
