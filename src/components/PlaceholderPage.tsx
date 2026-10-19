// src/components/PlaceholderPage.tsx
// Componente placeholder para páginas em desenvolvimento

import { Flex, Heading, Icon, Text } from "@chakra-ui/react";
import { FiTool } from "react-icons/fi";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="400px"
      bg="foreground.1"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="borderGrid"
      p={8}
      m={6}
    >
      <Icon as={FiTool} boxSize={12} color="gray.400" mb={4} />
      <Heading size="lg" color="textPrimaryColor" mb={2}>
        {title}
      </Heading>
      <Text color="textSecondaryColor" textAlign="center" maxW="400px">
        {description || "Esta página está em desenvolvimento."}
      </Text>
    </Flex>
  );
}

export default PlaceholderPage;
