// src/components/Form/InputMask.tsx
// -----------------------------------------------------------------------------
// TASK-FE-335/ERRO-FE-014 (Causa A) — a composição anterior
// (`<Input as={ReactInputMask} .../>`) é o padrão de troca de elemento do
// Chakra UI v2 (`as={Componente}`). A versão instalada
// (`@chakra-ui/react@3.36.0`) reconstruiu `Input` sobre `ark-ui`
// (`ark.input` = `withAsChild("input")`), que só entende `asChild`/
// `children` para composição — NUNCA leu a prop `as`. Resultado: `as`,
// `mask`, `maskPlaceholder`, `beforeMaskedStateChange` chegavam como
// atributos crus no `<input>` DOM nativo (warning do React) E a lib
// `react-input-mask` nunca era de fato instanciada — a máscara NUNCA
// aplicava (rastreamento completo em `ERRO-FE-014`, Causa A).
//
// Correção: padrão `children` OFICIALMENTE DOCUMENTADO da lib (README,
// seção "children") — o input real vira `children` de `<ReactInputMask>`;
// a lib clona (`cloneElement`) nele o valor mascarado/`onChange`
// interceptado/`ref` do DOM real gerenciado internamente. Elimina de vez a
// dependência da composição `as`/Chakra v3 quebrada, sem precisar
// reimplementar o algoritmo de máscara à mão (as máscaras aqui — CPF/CNPJ/
// CEP — são padrões FIXOS de string; `react-input-mask` já lida bem com
// isso via `children`).
//
// `@types/react-input-mask@3.0.5` (DefinitelyTyped) ainda modela
// `ReactInputMask` como componente de CLASSE (API do react-input-mask v2
// estável) — a versão REALMENTE instalada
// (`react-input-mask@3.0.0-alpha.2`, ver
// `node_modules/react-input-mask/lib/react-input-mask.development.js`) é um
// componente FUNCIONAL construído com `React.forwardRef`, que aceita
// `children` e encaminha o `ref` recebido para o nó DOM real do filho via
// `cloneElement`. Sem o cast abaixo, o @types desatualizado não deixa o TS
// aceitar nem `children` como elemento único nem o `ref` como
// `Ref<HTMLInputElement>` — mesmo paradigma de cast que este arquivo já
// usava para contornar o Chakra v2 (`Input as React.FC<InputCustomProps>`),
// só que agora mirando o alvo certo (`react-input-mask`, não o Chakra).
// -----------------------------------------------------------------------------
import React, { forwardRef } from 'react';

import { Input as ChakraInput, InputProps as ChakraInputProps } from '@chakra-ui/react';
import ReactInputMaskLib, { BeforeMaskedStateChangeStates, InputState } from 'react-input-mask';

import { Field } from './Field';

interface InputMaskProps extends Omit<ChakraInputProps, 'mask'> {
  name: string;
  label?: string;
  mask: string | Array<string | RegExp>;
  beforeMaskedStateChange?(states: BeforeMaskedStateChangeStates): InputState;
  maskPlaceholder?: string | null;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  isDirty?: boolean;
}

type ReactInputMaskComponent = React.ForwardRefExoticComponent<
  Omit<ChakraInputProps, 'mask'> & {
    mask: string | Array<string | RegExp>;
    maskPlaceholder?: string | null;
    beforeMaskedStateChange?(states: BeforeMaskedStateChangeStates): InputState;
    children: React.ReactElement;
  } & React.RefAttributes<HTMLInputElement>
>;

const ReactInputMask = ReactInputMaskLib as unknown as ReactInputMaskComponent;

export const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(
  (
    {
      label = '',
      name,
      mask,
      isRequired = false,
      error = '',
      helperText = '',
      beforeMaskedStateChange,
      maskPlaceholder,
      ...rest
    },
    ref
  ) => {
    return (
      <Field
        label={label}
        invalid={!!error}
        errorText={error}
        helperText={helperText}
        isRequired={isRequired}
      >
        <ReactInputMask
          mask={mask}
          maskPlaceholder={maskPlaceholder}
          beforeMaskedStateChange={beforeMaskedStateChange}
          ref={ref}
          {...rest}
        >
          <ChakraInput id={name} name={name} />
        </ReactInputMask>
      </Field>
    );
  }
);

InputMask.displayName = 'InputMask';
