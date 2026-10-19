// src/pages/MeuPerfil/AccountSummaryCard.tsx
// -----------------------------------------------------------------------------
// Card "Resumo da conta" — Execução 071, TASK-071-FE-03 (SRF-071-01a, D7).
// SÓ EXIBIÇÃO: avatar (foto ou iniciais), nome, e-mail, um badge por perfil
// de acesso (`roles` do `/auth/me`, rótulo Spatie EXATO — P-FE-02, sem
// mapeamento) e um badge com a fazenda atual (`useCurrentFarm`). Sem fazenda
// ativa ou erro ao buscá-la → OMITE o badge em silêncio (contrato de tela §2.1
// — é só exibição e não bloqueia a tela).
//
// Adaptado (não copiado) de `GB.Cerne.UX@ffe92bc` `PerfilUsuario.tsx:256-272`
// — avatar com o MESMO gradiente do Header (`loginButtonPrimary → green.300`).
// -----------------------------------------------------------------------------

import { Avatar, Badge, Box, Flex, Heading, Skeleton, Text } from '@chakra-ui/react';

import { PageCard } from '@/components/ui/PageCard';

import { useAuth } from '@/hooks/useAuth';
import { useCurrentFarm } from '@/hooks/useCurrentFarm';
import { useLanguage } from '@/hooks/useLanguage';

export function AccountSummaryCard() {
  const { languageGB } = useLanguage();
  const text = languageGB.common.myProfile.accountSummary;
  const { user, roles } = useAuth();
  const farmQuery = useCurrentFarm();

  const farmLabel = farmQuery.data?.description;

  return (
    <PageCard>
      <Box p={5}>
        <Heading size="sm" mb={4} color="fg.default">
          {text.title}
        </Heading>

        <Flex align="center" gap={4}>
          <Avatar.Root
            size="lg"
            bgGradient="to-br"
            gradientFrom="loginButtonPrimary"
            gradientTo="green.300"
            color="white"
          >
            <Avatar.Image src={user?.photoUrl ?? undefined} />
            <Avatar.Fallback name={user?.username ?? 'U'} />
          </Avatar.Root>

          <Box minW={0}>
            <Text fontWeight="semibold" lineClamp="1">
              {user?.username}
            </Text>
            <Text color="text.secondary" fontSize="sm" lineClamp="1">
              {user?.email}
            </Text>
          </Box>
        </Flex>

        <Flex mt={4} gap={2} wrap="wrap">
          {roles.map((role) => (
            <Badge key={role} colorPalette="blue">
              {role}
            </Badge>
          ))}

          {farmQuery.isLoading && <Skeleton height="20px" width="96px" borderRadius="md" />}
          {!farmQuery.isLoading && !farmQuery.isError && farmLabel && (
            <Badge colorPalette="green">{farmLabel}</Badge>
          )}
        </Flex>
      </Box>
    </PageCard>
  );
}

export default AccountSummaryCard;
