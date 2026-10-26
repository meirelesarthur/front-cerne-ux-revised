// src/components/ui/ToggleRow.tsx
// Campo booleano em linha (DS `ToggleRow`): interruptor + rótulo e, opcional, ícone de ajuda com
// explicação em tooltip. Controlado.

import { Box, Flex } from '@chakra-ui/react';

import { Tooltip } from '../TooLtip';
import { Switch } from './switch';
import { Icon } from './Icon';

export interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  /** Explicação curta, mostrada no tooltip do ícone de ajuda. */
  hint?: string;
  disabled?: boolean;
}

export function ToggleRow({ label, checked, onChange, hint, disabled }: ToggleRowProps) {
  return (
    <Flex align="center" gap="12px" px="12px" py="10px" bg="semanticNeutral.100" borderWidth="1px" borderColor="semanticNeutral.200" borderRadius="8px">
      <Switch checked={checked} onCheckedChange={(details: { checked: boolean }) => onChange(details.checked)} disabled={disabled}>
        {label}
      </Switch>
      {hint && (
        <Tooltip label={hint}>
          <Box as="span" display="flex" color="fg.muted" aria-label={hint}>
            <Icon name="info" size={12} />
          </Box>
        </Tooltip>
      )}
    </Flex>
  );
}

export default ToggleRow;
