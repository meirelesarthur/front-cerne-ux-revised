// src/pages/Public/Site/SitePublicoLanguageSwitcher.tsx
// -----------------------------------------------------------------------------
// Seletor local de idioma (pt/en/es) — SOMENTE os 5 rótulos do menu da landing
// pública do Site (97-Esteiras/061, TASK-SITE-10, `05-CONTRATO-TELA-pagina-
// publica-site.md ## 6`/"Leitura do dev" item 2).
//
// Mirror ESTRUTURAL (adaptação, não import) de
// `@/pages/Public/Rastreio/RastreioLanguageSwitcher.tsx` — MESMO visual
// (grupo compacto `role="group"`, 3 botões, `aria-pressed` no selecionado,
// tokens Chakra v3 `colorPalette="primary"`), mas com um DESVIO OBRIGATÓRIO
// (ajuste #4 do dono, DoD da Tarefa):
//
// ⚠️ NUNCA `useLanguage()`/`updateLanguageGB()` aqui — esse hook grava em
// `localStorage` GLOBAL (`utils/auth-token.ts`), compartilhado com a sessão
// admin autenticada no MESMO domínio. Um visitante anônimo trocando o idioma
// nesta página pública não pode alterar silenciosamente a preferência de
// quem depois logar naquele navegador. O estado aqui é 100% LOCAL
// (`useState`, elevado pelo pai `index.tsx`) e afeta SOMENTE os 5 rótulos do
// menu — o resto do conteúdo (`content.*`) nunca comuta (fatia BR fixa,
// import direto de `languagePtBr/languageSite.ts`).
// -----------------------------------------------------------------------------

import { Button as ChakraButton, HStack } from '@chakra-ui/react';

/** Códigos internos do app (`get_pwa_i18n_pattern ## 5` — `BR|US|ES`, nunca
 *  `pt-BR|en-US|es-ES`) — reaproveitado aqui só como convenção de nomeação,
 *  SEM nenhuma dependência do Context global de idioma. */
export type SitePublicoLanguageCode = 'BR' | 'US' | 'ES';

interface SitePublicoLanguageSwitcherProps {
  value: SitePublicoLanguageCode;
  onChange: (code: SitePublicoLanguageCode) => void;
  groupLabel: string;
  ptLabel: string;
  enLabel: string;
  esLabel: string;
}

const LANGUAGE_CODES: SitePublicoLanguageCode[] = ['BR', 'US', 'ES'];

export function SitePublicoLanguageSwitcher({
  value,
  onChange,
  groupLabel,
  ptLabel,
  enLabel,
  esLabel,
}: SitePublicoLanguageSwitcherProps) {
  const labels: Record<SitePublicoLanguageCode, string> = {
    BR: ptLabel,
    US: enLabel,
    ES: esLabel,
  };

  return (
    <HStack
      role="group"
      aria-label={groupLabel}
      gap={1}
      p={1}
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="lg"
      bg="bg.subtle"
    >
      {LANGUAGE_CODES.map((code) => {
        const selected = value === code;
        return (
          <ChakraButton
            key={code}
            type="button"
            size="xs"
            minW="10"
            variant={selected ? 'solid' : 'ghost'}
            colorPalette={selected ? 'primary' : 'gray'}
            aria-pressed={selected}
            aria-label={labels[code]}
            onClick={() => onChange(code)}
          >
            {labels[code]}
          </ChakraButton>
        );
      })}
    </HStack>
  );
}

export default SitePublicoLanguageSwitcher;
