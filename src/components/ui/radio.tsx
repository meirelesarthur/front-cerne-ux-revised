// src/components/ui/radio.tsx
// -----------------------------------------------------------------------------
// Wrapper Chakra UI v3 para Radio/RadioGroup — mirror ESTRUTURAL de
// `src/components/ui/checkbox.tsx` (mesmo padrão de snippet gerado pelo
// `@chakra-ui/cli`: Root/HiddenInput/Control/Label). Primeira consumidora
// real: `SaldoEstoque/GroupStocksModal.tsx` (TASK-STK-FE-04) — escolha do
// estoque "principal"/destino da consolidação.
//
// O pacote `@chakra-ui/react` instalado NÃO expõe um namespace `Radio.*`
// avulso — o primitivo real é composto por `RadioGroup.Item` +
// `RadioGroup.ItemHiddenInput` + `RadioGroup.ItemIndicator` +
// `RadioGroup.ItemText` (confirmado por introspecção do pacote nesta sessão).
// `RadioGroup` é reexportado como `RadioGroup.Root` (controlado por
// `value`/`onValueChange`).
// -----------------------------------------------------------------------------

import * as React from 'react';

import { RadioGroup as ChakraRadioGroup } from '@chakra-ui/react';

export interface RadioProps extends ChakraRadioGroup.ItemProps {
  rootRef?: React.Ref<HTMLDivElement>;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
  const { children, inputProps, rootRef, ...rest } = props;
  return (
    <ChakraRadioGroup.Item ref={rootRef} {...rest}>
      <ChakraRadioGroup.ItemHiddenInput ref={ref} {...inputProps} />
      <ChakraRadioGroup.ItemIndicator />
      {children != null && <ChakraRadioGroup.ItemText>{children}</ChakraRadioGroup.ItemText>}
    </ChakraRadioGroup.Item>
  );
});

export const RadioGroup = ChakraRadioGroup.Root;
