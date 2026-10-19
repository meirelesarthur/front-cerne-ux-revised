import { Box, HStack, Text, TextProps } from "@chakra-ui/react";

interface StatusProps extends TextProps {
  text: string;
  backgroundColor: string | undefined;
}

export function Status({ text, backgroundColor, ...props }: StatusProps) {
  return (
    <HStack>
      <Box boxSize="2" borderRadius="full" backgroundColor={backgroundColor} />
      <Text {...props}>{text}</Text>
    </HStack>
  );
}
