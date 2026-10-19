import { forwardRef } from "react";

import {
  Button as ChakraButton,
  ButtonProps as ChakraButtonProps,
} from "@chakra-ui/react";
import { FieldNamesMarkedBoolean } from "react-hook-form";

import { LanguageDate } from "@/@types/language";

interface ButtonSaveAndNextProps extends ChakraButtonProps {
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<any>>>;
  create: boolean;
  languageGB: LanguageDate;
}

export const ButtonSaveAndNext = forwardRef<
  HTMLButtonElement,
  ButtonSaveAndNextProps
>(
  (
    { dirtyFields, create, languageGB, ...rest }: ButtonSaveAndNextProps,
    ref,
  ) => {
    // Formulário único (CRUD comum): o botão é SEMPRE "Salvar". O comportamento
    // "Próximo" pertence exclusivamente a telas com abas/steps, que têm rodapé
    // próprio e não usam este componente. `dirtyFields`/`create` são mantidos na
    // interface por compatibilidade com os ~51 pontos de uso.
    void dirtyFields;
    void create;

    return (
      <ChakraButton {...rest} ref={ref} width={24}>
        {languageGB.defaltStrings.save}
      </ChakraButton>
    );
  },
);

ButtonSaveAndNext.displayName = "ButtonSaveAndNext";
