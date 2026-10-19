import { Box, Card, Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  colorScheme?: "blue" | "gray" | "green" | "red" | "yellow";
}

export const StatCard = ({
  title,
  value,
  description,
  icon,
  colorScheme = "blue",
}: StatCardProps) => {
  return (
    <Card.Root
      variant="elevated"
      size="lg"
      bg="cardBG"
      borderRadius="12px"
      width="100%"
      minH="140px"
      boxShadow="sm"
      border="1px solid"
      borderColor="border2"
      overflow="hidden"
    >
      <Card.Body
        gap="1"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="flex-start"
        p="5"
        position="relative"
      >
        {/* Icon — top right corner */}
        {icon && (
          <Box position="absolute" top="4" right="4" opacity={0.7}>
            {icon}
          </Box>
        )}

        {/* Title */}
        <Text
          fontSize="14px"
          fontWeight="600"
          color="text.primary"
          textAlign="left"
          lineHeight="1.4"
          pr={icon ? "8" : "0"}
        >
          {title}
        </Text>

        {/* Value */}
        <Text
          fontSize="36px"
          fontWeight="600"
          color="brand.darker"
          textAlign="left"
          lineHeight="1.3"
          mt="1"
        >
          {value}
        </Text>

        {/* Description */}
        {description && (
          <Text
            fontSize="13px"
            fontWeight="normal"
            color="text.secondary"
            textAlign="left"
            lineHeight="1.4"
            maxW="90%"
            mt="1"
          >
            {description}
          </Text>
        )}
      </Card.Body>
    </Card.Root>
  );
};
