import { Flex } from "@chakra-ui/react";

import { Text } from "./Text";

interface DisplayFieldProps {
  label: string;
  value: string | number;
}

export function DisplayField({ label, value }: DisplayFieldProps) {
  return (
    <Flex flexDirection="row" gap={1} fontSize="14px">
      <Text fontWeight="bold" color="displayFieldColor">
        {label}:
      </Text>
      <Text color="displayFieldColor">{value}</Text>
    </Flex>
  );
}
