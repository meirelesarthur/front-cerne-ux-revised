// src/_examples/pages/cadastros/recursos/RecursoConfiguracoesTab.tsx
// -----------------------------------------------------------------------------
// CAMADA DE EXEMPLO — 2ª aba do formulário ("Configurações"), em ARQUIVO
// SEPARADO.
//
// Demonstra o segundo nível do padrão real de abas (Rank → AgentToolsTab.tsx /
// AgentMcpsTab.tsx): a aba principal ("Dados Gerais") mora inline no
// CreateOrUpdateRecurso.tsx; abas extras (que só aparecem ao EDITAR) são
// componentes separados renderizados dentro de <Tabs.Content>.
//
// Recebe o `control` do React Hook Form do formulário-pai — não cria form
// próprio, apenas contribui campos ao mesmo form.
// -----------------------------------------------------------------------------

import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { Control, Controller } from "react-hook-form";

import type { ResourceForm as ResourceFormType } from "@/_examples/types/resource";
import { LanguageDate } from "@/@types/language";
import { Switch } from "@/components/ui/switch";

interface RecursoConfiguracoesTabProps {
  control: Control<ResourceFormType>;
  languageGB: LanguageDate;
}

export function RecursoConfiguracoesTab({
  control,
  languageGB,
}: RecursoConfiguracoesTabProps) {
  return (
    <VStack align="stretch" gap={6} pt={2}>
      <Text fontSize="sm" color="fg.muted">
        {languageGB.examples.resource.form.configTab.description}
      </Text>

      <Controller
        name="enabled"
        control={control}
        render={({ field }) => (
          <Flex
            align="center"
            justify="space-between"
            p={4}
            bg="bg.subtle"
            borderRadius="md"
            border="1px solid"
            borderColor={field.value ? "green.500" : "border.default"}
            maxW="md"
          >
            <VStack align="flex-start" gap={0}>
              <Text fontWeight="medium" color="fg.default">
                {languageGB.examples.resource.form.configTab.visibility}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {languageGB.examples.resource.form.configTab.visibilityHint}
              </Text>
            </VStack>
            {/* @ts-ignore - Chakra UI v3 Switch API */}
            <Switch
              checked={!!field.value}
              onCheckedChange={(details: any) => field.onChange(details.checked)}
              colorPalette="green"
            />
          </Flex>
        )}
      />

      <Box />
    </VStack>
  );
}
