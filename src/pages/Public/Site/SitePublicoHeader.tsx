// src/pages/Public/Site/SitePublicoHeader.tsx
// -----------------------------------------------------------------------------
// Header/nav da landing pública do Site (97-Esteiras/061, TASK-SITE-10,
// `05-CONTRATO-TELA-pagina-publica-site.md ## 1` linha 1 / `## 3` SUR-PUB-01/
// SUR-PUB-02/SUR-PUB-03/SUR-PUB-05/SUR-PUB-13).
//
// 5 ajustes do dono materializados aqui:
//  #2 — Logo GBCerne (`logo-min.svg`/`logo-min-white.svg`, dark-aware, mirror
//       `Public/Rastreio/index.tsx:84-85,211`/`NavRail.tsx:167`) — NUNCA o
//       verde `#004100`/logo AGRO365 do legado (`SUR-PUB-13`, tokens `cerne`).
//  #3/#5 — Menu = SOMENTE 5 itens (Sobre/Softwares/Tutoriais/Seja Parceiro/
//       Contato), rótulos via `publico.menu` (i18n já populado, Wave A).
//       Itens são placeholders INERTES — `Box`/`Text`, SEM `href`/`onClick`
//       (evita o anti-padrão `<a href="#">`, que pula pro topo da página),
//       `aria-disabled="true"`. Links reais são pendência FUTURA do dono
//       (`SUR-PUB-03`, `DECISAO_DE_ESCOPO` já registrada — NUNCA
//       `agro365.app`).
//  #4 — Seletor de idioma troca SOMENTE estes 5 rótulos — estado elevado
//       pelo pai (`index.tsx`) e repassado aqui como prop, NUNCA
//       `useLanguage()/updateLanguageGB()` (isolamento do `localStorage`
//       global, ver `SitePublicoLanguageSwitcher.tsx`).
//
// ⚠️ ISOLAMENTO OBRIGATÓRIO (gate 6.1, mesmo de F-067) — este arquivo NUNCA
// importa `@/contexts/AuthContext`/`@/hooks/useAuth`/store de farm.
// -----------------------------------------------------------------------------

import { Box, Flex, HStack, Image } from '@chakra-ui/react';

import { useTheme } from '@/contexts/ThemeContext';

import {
  SitePublicoLanguageCode,
  SitePublicoLanguageSwitcher,
} from './SitePublicoLanguageSwitcher';

import logoMinWhite from '@/assets/logo-min-white.svg';
import logoMin from '@/assets/logo-min.svg';

/** Rótulos dos 5 itens + do seletor, já resolvidos no idioma corrente
 *  (`menuText = MENU_TEXT_BY_LANG[menuLang]` em `index.tsx`) — shape mirror
 *  `SitePublicoLanguage['menu']` (`@types/language/module-site/site-
 *  publico.d.ts`). */
interface SitePublicoMenuText {
  sobre: string;
  softwares: string;
  tutoriais: string;
  sejaParceiro: string;
  contato: string;
  languageSwitcher: {
    groupLabel: string;
    pt: string;
    en: string;
    es: string;
  };
}

interface SitePublicoHeaderProps {
  menuText: SitePublicoMenuText;
  menuLang: SitePublicoLanguageCode;
  onMenuLangChange: (code: SitePublicoLanguageCode) => void;
}

// Item de menu INERTE (ajuste #3/#5, `SUR-PUB-03`) — elemento NÃO interativo
// de propósito (não `<a href="#">`), `aria-disabled` sinaliza a pendência
// sem quebrar leitor de tela. Link real é decisão FUTURA do dono (pendência
// já registrada, fora do escopo desta Tarefa).
function InertMenuItem({ label }: { label: string }) {
  return (
    <Box
      as="span"
      role="link"
      aria-disabled="true"
      tabIndex={-1}
      px={1}
      fontSize="sm"
      fontWeight="medium"
      color="fg.muted"
      cursor="default"
      userSelect="none"
    >
      {label}
    </Box>
  );
}

export function SitePublicoHeader({
  menuText,
  menuLang,
  onMenuLangChange,
}: SitePublicoHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Box
      as="header"
      w="full"
      bg="bg.default"
      borderBottom="1px solid"
      borderColor="border.subtle"
      position="sticky"
      top={0}
      zIndex="docked"
    >
      <Flex
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 8 }}
        py={3}
        align="center"
        justify="space-between"
        gap={4}
        wrap="wrap"
      >
        <Image
          src={isDark ? logoMinWhite : logoMin}
          alt="GB Cerne"
          h="32px"
          w="auto"
          flexShrink={0}
        />

        <HStack
          as="nav"
          aria-label={menuText.languageSwitcher.groupLabel}
          gap={{ base: 3, md: 6 }}
          wrap="wrap"
          justify="center"
        >
          <InertMenuItem label={menuText.sobre} />
          <InertMenuItem label={menuText.softwares} />
          <InertMenuItem label={menuText.tutoriais} />
          <InertMenuItem label={menuText.sejaParceiro} />
          <InertMenuItem label={menuText.contato} />
        </HStack>

        <SitePublicoLanguageSwitcher
          value={menuLang}
          onChange={onMenuLangChange}
          groupLabel={menuText.languageSwitcher.groupLabel}
          ptLabel={menuText.languageSwitcher.pt}
          enLabel={menuText.languageSwitcher.en}
          esLabel={menuText.languageSwitcher.es}
        />
      </Flex>
    </Box>
  );
}

export default SitePublicoHeader;
