// src/components/Header/AccountMenu.tsx
// -----------------------------------------------------------------------------
// Menu da conta no avatar do Header — Execução 071, TASK-071-FE-05. Contrato
// de tela §6. `Popover.Root` (NÃO `Menu.Root`, AD-FE-03): há um select de
// idioma dentro do painel, e o `Menu.Root` capturaria as setas/typeahead do
// teclado, atrapalhando a navegação do select — mesmo racional do
// `NotificationPanel` (precedente Popover no projeto).
//
// "Fazer upgrade" leva à contratação de plano (`/planos/contratar`). Itens "ainda não
// construídos" (Configurações, Planos, Central de ajuda — AD-FE-02, D3/D5/D6): permanecem
// VISÍVEIS e FOCÁVEIS, com um badge "Em breve" e um toast informativo ao clicar. NENHUMA
// navegação, link de e-mail direto ou request nesses 3 itens.
//
// Adaptado (não copiado) de `GB.Cerne.UX@ffe92bc`
// `src/components/layout/Topbar.tsx:199-309`.
// -----------------------------------------------------------------------------

import { useState } from 'react';

import {
  Avatar,
  Badge,
  Box,
  Button as ChakraButton,
  Flex,
  Icon,
  IconButton,
  NativeSelect,
  Popover,
  Portal,
  Separator,
  Text,
} from '@chakra-ui/react';
import {
  Gem,
  LifeBuoy,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  UserCog,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { toaster } from '@/components/ui/toaster';

import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useLanguageSwitcher, type LanguageCode } from '@/hooks/useLanguageSwitcher';
import { useTheme } from '@/contexts/ThemeContext';

import { ROUTES } from '@/constants/routes';

interface AccountMenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  /** Rótulo do badge "Em breve" (i18n) — presente SÓ nos 4 itens
   *  "ainda não construídos" (AD-FE-02). Ausente = item comum, sem badge. */
  comingSoonLabel?: string;
  danger?: boolean;
}

function AccountMenuItem({
  icon: ItemIcon,
  label,
  onClick,
  comingSoonLabel,
  danger,
}: AccountMenuItemProps) {
  return (
    <ChakraButton
      variant="ghost"
      justifyContent="flex-start"
      width="full"
      onClick={onClick}
      color={danger ? 'red.500' : undefined}
      _hover={danger ? { bg: 'red.50', _dark: { bg: 'rgba(239, 68, 68, 0.1)' } } : undefined}
    >
      <Icon as={ItemIcon} boxSize={4} />
      <Text as="span" flex="1" textAlign="left">
        {label}
      </Text>
      {comingSoonLabel && (
        <Badge size="xs" variant="subtle" colorPalette="gray">
          {comingSoonLabel}
        </Badge>
      )}
    </ChakraButton>
  );
}

export function AccountMenu() {
  const { languageGB } = useLanguage();
  const text = languageGB.common.accountMenu;
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, updateTheme } = useTheme();
  const { languageInUse, handleLanguageChange } = useLanguageSwitcher();

  const [isOpen, setIsOpen] = useState(false);
  const isDark = theme === 'dark';

  function close() {
    setIsOpen(false);
  }

  function notifyComingSoon(label: string) {
    close();
    toaster.create({
      type: 'info',
      title: label,
      description: text.comingSoonToastDescription,
    });
  }

  function handleGoToProfile() {
    close();
    navigate(ROUTES.PROFILE);
  }

  function handleToggleTheme() {
    updateTheme(isDark ? 'light' : 'dark');
  }

  async function handleSignOut() {
    close();
    await signOut();
  }

  const triggerAriaLabel = text.triggerAriaLabelTemplate.replace(
    '{name}',
    user?.username ?? ''
  );

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(e: { open: boolean }) => setIsOpen(e.open)}
      positioning={{ placement: 'bottom-end' }}
      lazyMount
      unmountOnExit
    >
      {/* @ts-ignore - Chakra UI v3 API */}
      <Popover.Trigger asChild>
        <IconButton
          variant="ghost"
          size="sm"
          borderRadius="full"
          aria-label={triggerAriaLabel}
        >
          <Avatar.Root
            size="sm"
            bgGradient="to-br"
            gradientFrom="loginButtonPrimary"
            gradientTo="green.300"
            color="white"
          >
            <Avatar.Image src={user?.photoUrl ?? undefined} />
            <Avatar.Fallback name={user?.username ?? 'U'} />
          </Avatar.Root>
        </IconButton>
      </Popover.Trigger>

      <Portal>
        {/* @ts-ignore - Chakra UI v3 API */}
        <Popover.Positioner>
          {/* @ts-ignore - Chakra UI v3 API */}
          <Popover.Content
            minW="280px"
            bg="cardBG"
            borderRadius="xl"
            boxShadow="0px 20px 25px -5px rgba(0, 0, 0, 0.2), 0px 10px 10px -5px rgba(0, 0, 0, 0.1)"
            border="1px solid"
            borderColor="cardBorder"
            overflow="hidden"
            p={2}
          >
            {/* 1 — Cabeçalho: avatar md + nome + e-mail */}
            <Flex align="center" gap={3} p={2} mb={1}>
              <Avatar.Root
                size="md"
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
                <Text fontSize="sm" color="text.secondary" lineClamp="1">
                  {user?.email}
                </Text>
              </Box>
            </Flex>

            {/* 2 — Fazer upgrade — bloco, primário, ícone sparkles; leva à contratação de plano */}
            <ChakraButton
              variant="solid"
              width="full"
              mb={1}
              onClick={() => {
                close();
                navigate('/planos/contratar');
              }}
            >
              <Icon as={Sparkles} boxSize={4} />
              <Text as="span">{text.upgrade}</Text>
            </ChakraButton>

            {/* 3 — Plano atual (não clicável) */}
            <Flex align="center" justify="space-between" px={2} py={1.5}>
              <Text fontSize="sm" color="text.secondary">
                {text.currentPlanLabel}
              </Text>
              <Badge colorPalette="purple">{text.currentPlanBadge}</Badge>
            </Flex>

            {/* 4 — Idioma */}
            <Flex align="center" justify="space-between" px={2} py={1.5}>
              <Text fontSize="sm" color="text.secondary">
                {text.language}
              </Text>
              {/* @ts-ignore - Chakra UI v3 NativeSelect API */}
              <NativeSelect.Root size="sm" width="148px">
                {/* @ts-ignore */}
                <NativeSelect.Field
                  value={languageInUse}
                  onChange={(e) =>
                    handleLanguageChange(e.target.value as LanguageCode)
                  }
                >
                  <option value="BR">Português (BR)</option>
                  <option value="US">English</option>
                  <option value="ES">Español</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Flex>

            {/* 5 — Meu perfil */}
            <AccountMenuItem icon={UserCog} label={text.myProfile} onClick={handleGoToProfile} />

            {/* 6 — Configurações (Em breve) */}
            <AccountMenuItem
              icon={Settings}
              label={text.settings}
              comingSoonLabel={text.comingSoonBadge}
              onClick={() => notifyComingSoon(text.settings)}
            />

            <Separator my={1} />

            {/* 7 — Tema */}
            <AccountMenuItem
              icon={isDark ? Sun : Moon}
              label={isDark ? text.lightModeAction : text.gbModeAction}
              onClick={handleToggleTheme}
            />

            {/* 8 — Planos (Em breve) */}
            <AccountMenuItem
              icon={Gem}
              label={text.plans}
              comingSoonLabel={text.comingSoonBadge}
              onClick={() => notifyComingSoon(text.plans)}
            />

            <Separator my={1} />

            {/* 9 — Central de ajuda (Em breve) */}
            <AccountMenuItem
              icon={LifeBuoy}
              label={text.helpCenter}
              comingSoonLabel={text.comingSoonBadge}
              onClick={() => notifyComingSoon(text.helpCenter)}
            />

            <Separator my={1} />

            {/* 10 — Sair */}
            <AccountMenuItem icon={LogOut} label={text.logout} danger onClick={handleSignOut} />
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export default AccountMenu;
