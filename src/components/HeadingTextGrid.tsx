import { Heading, HeadingProps } from "@chakra-ui/react";

interface HeadingTextGridProps extends HeadingProps {
  children?: React.ReactNode;
}
export function HeadingTextGrid({ children }: HeadingTextGridProps) {
  return (
    <Heading color="textGridColor" fontSize="16px" fontWeight="600">
      {children}
    </Heading>
  );
}
