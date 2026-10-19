// src/components/CrossFarmViewToggle/index.tsx
// -----------------------------------------------------------------------------
// Toggle "Ver títulos de todas as fazendas" (DEC-115) — componente
// COMPARTILHADO entre Contas a Pagar (TASK-FE-036-125, criado aqui) e Contas a
// Receber (TASK-FE-036-344, só consome — NÃO duplicar).
//
// Puramente apresentacional: nenhuma leitura de `useCurrentFarm`/query própria
// — quem resolve gate de visibilidade, estado `checked` e mecânica de
// preservação do filtro (`all_farms`) é a página consumidora (ver
// `ContasAPagar/index.tsx`).
//
// Referência UX (Passo UX, `ux_root` commit-âncora
// `24bd91603a6ee4e19b58fa5efe2221835c83e306`): adapta o primitivo
// `src/components/ui/ToggleSwitch.tsx` do design system `cerne` — switch
// compacto, `role="switch"`, `aria-checked`, rótulo à direita — ao Chakra v3
// já em produção no SPA (`@/components/ui/switch`, MESMO import do toggle
// por-linha de `fiscal_document` em `src/pages/Incomes/index.tsx:47,600`),
// via os tokens do `src/theme.ts` do próprio SPA (sem tokens brutos do cerne).
// NÃO reaproveita `src/components/ToggleSwitch.tsx` — código morto (zero usos
// no repositório), assinatura de método de pagamento e cor hardcoded
// (`background="#E2F8F3"`), que violaria a proibição de hex fixo fora dos
// tokens (`get_spa_ux_fidelity_pattern`).
// -----------------------------------------------------------------------------

import { Flex, Text } from '@chakra-ui/react';

import { Switch } from '@/components/ui/switch';

interface CrossFarmViewToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function CrossFarmViewToggle({
  checked,
  onCheckedChange,
  label,
  disabled,
}: CrossFarmViewToggleProps) {
  return (
    <Flex align="center" gap={2}>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(details: { checked: boolean }) => onCheckedChange(details.checked)}
        aria-label={label}
      />
      <Text fontSize="sm" fontWeight="medium" color={disabled ? 'fg.muted' : undefined}>
        {label}
      </Text>
    </Flex>
  );
}
