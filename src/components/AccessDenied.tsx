// src/components/AccessDenied.tsx
// Tela de "Acesso negado" exibida DENTRO do layout autenticado quando o
// usuário navega (por URL) para uma funcionalidade cuja permissão ele não
// tem. Mesmo corpo visual do ModulePlaceholder — não é um overlay como o
// NotFound, porque o usuário está logado e o restante da navegação continua
// válido. Lembrete: isto é UX; o backend nega de verdade (403).

import { Flex, Heading, Icon, Text } from "@chakra-ui/react";
import { ShieldOff } from "lucide-react";

import { useLanguage } from "@/hooks/useLanguage";

export function AccessDenied() {
  const { languageGB } = useLanguage();

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="70vh"
      p={8}
      m={6}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border.default"
      borderRadius="xl"
      bg="bg.subtle"
    >
      <Icon as={ShieldOff} boxSize={12} color="fg.muted" mb={4} />
      <Heading size="lg" color="fg.default" mb={2} textAlign="center">
        {languageGB.defaltStrings.accessDenied}
      </Heading>
      <Text color="fg.muted" textAlign="center" maxW="440px">
        {languageGB.defaltStrings.accessDeniedDescription}
      </Text>
    </Flex>
  );
}
