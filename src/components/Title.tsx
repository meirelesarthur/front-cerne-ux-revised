import { ReactNode } from "react";

import { Heading, HeadingProps, Spinner } from "@chakra-ui/react";

interface TitleProps extends HeadingProps {
  children: ReactNode;
  isFetching?: boolean;
}

export function Title({ children, isFetching = false, ...rest }: TitleProps) {
  return (
    <Heading fontWeight="semibold" fontSize="20px" {...rest} color="gray.550">
      {children}
      {isFetching && <Spinner size="sm" color="primaryMain" marginLeft="2" />}
    </Heading>
  );
}
