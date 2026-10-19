// src/pages/ComingSoon/index.tsx
// Página de "Em Construção" para módulos em desenvolvimento

import {
    Box,
    Center,
    Heading,
    Icon,
    Text,
    VStack,
} from "@chakra-ui/react";
import { HardHat, Rocket } from "@phosphor-icons/react";

import { ContainerGrid } from "@/components/ContainerGrid";
import { useLanguage } from "@/hooks/useLanguage";

interface ComingSoonProps {
  moduleName?: string;
  moduleDescription?: string;
  icon?: React.ElementType;
}

export function ComingSoon({
  moduleName,
  moduleDescription,
  icon: CustomIcon = Rocket,
}: ComingSoonProps) {
  const { languageGB } = useLanguage();

  return (
    <ContainerGrid>
      <Center minH="60vh">
        <VStack gap={6} textAlign="center" maxW="500px" px={4}>
          {/* Ícone animado */}
          <Box
            p={6}
            borderRadius="full"
            bg="primary500"
            color="white"
            position="relative"
            _before={{
              content: '""',
              position: "absolute",
              inset: "-8px",
              borderRadius: "full",
              border: "2px solid",
              borderColor: "primary300",
              animation: "pulse 2s infinite",
            }}
          >
            <Icon as={CustomIcon} boxSize={12} />
          </Box>

          {/* Título do módulo */}
          {moduleName && (
            <Heading
              size="2xl"
              color="textPrimaryColor"
              fontWeight="bold"
            >
              {moduleName}
            </Heading>
          )}

          {/* Mensagem principal */}
          <VStack gap={2}>
            <Heading size="lg" color="primary500">
              {languageGB.common.comingSoon.title}
            </Heading>
            <Text color="textSecondaryColor" fontSize="lg">
              {languageGB.common.comingSoon.description}
            </Text>
          </VStack>

          {/* Descrição do módulo */}
          {moduleDescription && (
            <Box
              p={4}
              bg="cardBG"
              borderRadius="lg"
              borderWidth="1px"
              borderColor="borderGrid"
            >
              <Text color="textSecondaryColor" fontSize="sm">
                {moduleDescription}
              </Text>
            </Box>
          )}

          {/* Indicador de progresso */}
          <VStack gap={2} pt={4}>
            <Icon as={HardHat} boxSize={6} color="feedBack.warnMain" />
            <Text color="textSecondaryColor" fontSize="sm">
              {languageGB.common.comingSoon.workInProgress}
            </Text>
          </VStack>
        </VStack>
      </Center>

      {/* CSS para animação */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }
        `}
      </style>
    </ContainerGrid>
  );
}

export default ComingSoon;
