// src/pages/MeuPerfil/index.tsx
// -----------------------------------------------------------------------------
// Tela "Meu perfil" (`/profile`) — Execução 071, TASK-071-FE-02/03/04.
// Contrato de tela §2. Layout de UMA coluna (`maxW=720px`, `mx=auto`,
// `gap=5`, `p=6`), fiel a `GB.Cerne.UX@ffe92bc` `PerfilUsuario.tsx:238-248`
// (adaptado aos tokens Chakra v3 da SPA, nunca importado do Storybook cru).
//
// Guarda de saída (SRF-071-05, contrato de tela §2/UX): `beforeunload` quando
// qualquer um dos dois cards tem alteração pendente (`onDirtyChange`).
// -----------------------------------------------------------------------------

import { useEffect, useState } from 'react';

import { Box, Heading, Text } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

import { AccountSummaryCard } from './AccountSummaryCard';
import { PersonalDataCard } from './PersonalDataCard';
import { SecurityCard } from './SecurityCard';

export default function MeuPerfil() {
  const { languageGB } = useLanguage();
  const text = languageGB.common.myProfile;

  const [personalDirty, setPersonalDirty] = useState(false);
  const [securityDirty, setSecurityDirty] = useState(false);

  useEffect(() => {
    const hasPendingChanges = personalDirty || securityDirty;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasPendingChanges) return;
      event.preventDefault();
      // Compatibilidade legada de navegador (Chrome exige `returnValue`).
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [personalDirty, securityDirty]);

  return (
    <Box maxW="720px" mx="auto" p={6}>
      <Box mb={5}>
        <Heading as="h1" size="lg" color="fg.default">
          {text.pageTitle}
        </Heading>
        <Text color="text.secondary" fontSize="sm">
          {text.pageDescription}
        </Text>
      </Box>

      <Box display="flex" flexDirection="column" gap={5}>
        <AccountSummaryCard />
        <PersonalDataCard onDirtyChange={setPersonalDirty} />
        <SecurityCard onDirtyChange={setSecurityDirty} />
      </Box>
    </Box>
  );
}
