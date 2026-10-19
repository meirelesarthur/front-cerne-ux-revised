import {
  Text as ChakraText,
  TextProps as ChakraTextProps,
  Skeleton,
} from "@chakra-ui/react";
import "../styles/components/animations.css";

interface TextProps extends ChakraTextProps {
  children: React.ReactNode;
  loading?: boolean;
}
export function Text({ children, loading = false, ...rest }: TextProps) {
  return (
    <Skeleton
      loading={loading}
      borderRadius="md"
      // 3. Novas props para cores do Skeleton
      css={{
        "--start-color": "var(--chakra-colors-primary-500)",
        "--end-color": "var(--chakra-colors-border2)",
      }}
      marginBottom={loading ? "4px" : "0"}
    >
      <ChakraText {...rest}>{children}</ChakraText>
    </Skeleton>
  );
}
