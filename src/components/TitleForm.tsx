import { Box, Text } from "@chakra-ui/react";

interface TitleFormProps {
  title: string;
  noMarginTop?: boolean;
}

export function TitleForm({ title, noMarginTop }: TitleFormProps) {
  return (
    <Box width="full" marginBottom="4" marginTop={noMarginTop ? '0' : '4'}>
      <Text marginBottom="2">{title}</Text>
      <Box border="solid 1px" borderColor="yellow.800" width="full" />
    </Box>
  );
}
