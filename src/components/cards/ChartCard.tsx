import { Box, Card, HStack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: string | number;
  actionButton?: ReactNode;
  footer?: ReactNode;
}

export const ChartCard = ({
  title,
  subtitle,
  children,
  height = "auto",
  actionButton,
  footer,
}: ChartCardProps) => {
  return (
    <Card.Root
      variant="elevated"
      bg="cardBG"
      borderRadius="12px"
      width="100%"
      height={height}
      position="relative"
      boxShadow="sm"
      border="1px solid"
      borderColor="border2"
    >
      <Card.Body display="flex" flexDirection="column" gap="3" p="4">
        {/* Header with title and optional action button */}
        <HStack justifyContent="space-between" alignItems="center" flexShrink={0}>
          <Box flex="1">
            <Text
              fontSize="14px"
              fontWeight="600"
              color="text.primary"
              mb={subtitle ? '1' : '0'}
              lineHeight="1.4"
            >
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="12px" fontWeight="normal" color="text.secondary" lineHeight="1.4">
                {subtitle}
              </Text>
            )}
          </Box>
          {actionButton && <Box flexShrink={0}>{actionButton}</Box>}
        </HStack>

        {/* Chart content */}
        <Box flex="1" position="relative" width="100%" minH="180px">
          {children}
        </Box>

        {/* Optional footer */}
        {footer && (
          <Box mt="auto" pt="4" flexShrink={0}>
            {footer}
          </Box>
        )}
      </Card.Body>
    </Card.Root>
  );
};
