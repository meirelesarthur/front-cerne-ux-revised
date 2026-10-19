// src/pages/Public/Rastreio/RastreioLanguageSwitcher.tsx
// -----------------------------------------------------------------------------
// Seletor local de idioma (pt/en/es) da página PÚBLICA de rastreio (`## 4.13`/
// `## 6` do `CONTRATO-TELA-F067-rastreio-publico.md`, TASK-TR-PUB-FE-05).
//
// Mirror visual ADAPTADO (Lei "adaptação, não cópia",
// `get_spa_ux_fidelity_pattern ## 2`) de `LanguageSwitcher.tsx` do `ux_root`
// (`GB.Cerne.UX/src/components/layout/LanguageSwitcher.tsx`): grupo compacto
// de 3 botões (`role="group"`), rótulo curto (PT/EN/ES), `aria-pressed` no
// selecionado — reproduzido com tokens Chakra v3 desta SPA (`colorPalette`
// "primary", mesmo padrão já em produção no toggle de meses da mesma
// feature, `AvailabilityMonthsPicker.tsx`), NUNCA importando o componente do
// Storybook cru (config/versão de Chakra diverge, `## 1` do contrato).
//
// ⚠️ DESVIO OBRIGATÓRIO do hook padrão do app (`## 6` do contrato de tela,
// DoD da Tarefa): troca de idioma usa `useLanguage().updateLanguageGB`
// DIRETO — `useLanguageSwitcher()` (hook "canônico" do app) persiste no
// perfil via `updatePreferences()` (Execução 071, `PUT /me/preferences`),
// endpoint AUTENTICADO, PROIBIDO nesta superfície anônima (isolamento, gate
// 6.1). A troca é PURA apresentação:
// nenhum refetch, nenhuma invalidação de query — a API já devolveu as 3
// variantes de nome/descrição no mesmo payload (`## 4.3`/`## 2` do
// contrato), então mudar o Context só troca qual variante é lida do cache
// já existente (`pickLocalizedField`, TASK-TR-PUB-FE-03).
// -----------------------------------------------------------------------------

import { Button as ChakraButton, HStack } from '@chakra-ui/react';

import { useLanguage } from '@/hooks/useLanguage';

/** Códigos internos do app (`get_pwa_i18n_pattern ## 5` — `BR|US|ES`, nunca
 *  `pt-BR|en-US|es-ES`). */
type RastreioLanguageCode = 'BR' | 'US' | 'ES';

interface RastreioLanguageSwitcherProps {
  groupLabel: string;
  ptLabel: string;
  enLabel: string;
  esLabel: string;
}

const LANGUAGE_CODES: RastreioLanguageCode[] = ['BR', 'US', 'ES'];

export function RastreioLanguageSwitcher({
  groupLabel,
  ptLabel,
  enLabel,
  esLabel,
}: RastreioLanguageSwitcherProps) {
  // `useLanguage()` PURO — NUNCA `useLanguageSwitcher` (vazaria `updatePreferences`
  // autenticado, `## 6` do contrato de tela). `updateLanguageGB` só atualiza o
  // Context global (efêmero, sem persistência), mirror do racional já
  // documentado para o visitante anônimo sem perfil.
  const { languageInUse, updateLanguageGB } = useLanguage();
  const labels: Record<RastreioLanguageCode, string> = {
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
        const selected = languageInUse === code;
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
            onClick={() => updateLanguageGB(code)}
          >
            {labels[code]}
          </ChakraButton>
        );
      })}
    </HStack>
  );
}

export default RastreioLanguageSwitcher;
