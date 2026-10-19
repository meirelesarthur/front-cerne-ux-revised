// src/components/Branding/BrandingLocked.tsx
// Estado "bloqueado" (upsell) da Marca quando o plano não é elegível (403 do backend).

import { Flex, Icon, Text } from "@chakra-ui/react";
import { FiLock } from "react-icons/fi";

export function BrandingLocked({ title, description }: { title: string; description: string }) {
  return (
    <Flex direction="column" align="center" justify="center" gap={3} py={12} px={6} textAlign="center">
      <Flex align="center" justify="center" boxSize={12} borderRadius="full" bg="secondaryLighter">
        <Icon as={FiLock} boxSize={6} color="primaryMain" />
      </Flex>
      <Text fontWeight="semibold" color="brandColorText" fontSize="lg">
        {title}
      </Text>
      <Text fontSize="sm" color="fg.muted" maxW="420px">
        {description}
      </Text>
    </Flex>
  );
}

export default BrandingLocked;
