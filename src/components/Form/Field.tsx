// src/components/Form/Field.tsx
import { ReactNode } from "react";

import { Field as ChakraField, Flex, Icon, TextProps } from "@chakra-ui/react";
import { MdInfoOutline } from "react-icons/md";

import { Tooltip } from "../TooLtip";

interface Props extends ChakraField.RootProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  children: ReactNode;
  tooltip?: string;
  isRequired?: boolean;
  /**
   * Ação sutil renderizada na MESMA linha do label, alinhada à direita
   * (EST-07, ajuste UX "Nova NFe Emitida" — botão `+`/editar Cliente saiu
   * de um `IconButton` avulso ao lado do select para uma ação discreta no
   * próprio label). Quando omitida, o label permanece EXATAMENTE como
   * antes (retrocompat total com todos os consumidores existentes).
   * O clique é isolado com `stopPropagation`/`preventDefault` para que a
   * associação nativa do `<label>` não foque/abra o controle abaixo.
   */
  labelAction?: ReactNode;
  /**
   * Tooltip opcional para o `labelAction` (EST-07, esteira 006 — ajuste
   * pedido pelo dono). Reutilizável via prop, nunca hardcoded na tela.
   * Quando omitida, `labelAction` renderiza exatamente como antes (sem
   * tooltip), preservando retrocompat total.
   */
  labelActionTooltip?: string;
}

const HelperText: React.FC<TextProps> = ChakraField.HelperText;
const ErrorText: React.FC<TextProps> = ChakraField.ErrorText;

export function Field({
  label,
  helperText,
  errorText,
  children,
  tooltip,
  isRequired,
  labelAction,
  labelActionTooltip,
  invalid,
  ...rest
}: Props) {
  return (
    <ChakraField.Root
      width="full"
      required={isRequired}
      invalid={invalid ?? Boolean(errorText)}
      {...rest}
    >
      {label && (
        <Flex as="label" alignItems="center" h="20px" minH="20px" fontSize="13px" fontWeight="medium" color="gray.900" lineHeight="20px">
          {label}
          <ChakraField.RequiredIndicator color="feedBack.errorMain" ml="1">
            *
          </ChakraField.RequiredIndicator>
          {!!tooltip && (
            <Tooltip label={tooltip}>
              <Icon as={MdInfoOutline} ml="1" boxSize="16px" color="gray.500" />
            </Tooltip>
          )}
          {!!labelAction && (
            // EST-07 (esteira 006, item separado — 2ª rodada): `ml="auto"`
            // não empurra nada porque a linha do label encolhe ao conteúdo
            // (sem espaço extra a distribuir); o ícone ficava colado no
            // texto. `ml="2"` dá um respiro fixo e discreto entre o label e
            // a ação, mantendo a altura de 20px e o isolamento de clique.
            <Flex
              ml="2"
              h="full"
              alignItems="center"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {labelActionTooltip ? (
                <Tooltip label={labelActionTooltip}>{labelAction}</Tooltip>
              ) : (
                labelAction
              )}
            </Flex>
          )}
        </Flex>
      )}
      {children}
      {helperText && <HelperText>{helperText}</HelperText>}
      {errorText && <ErrorText>{errorText}</ErrorText>}
    </ChakraField.Root>
  );
}
