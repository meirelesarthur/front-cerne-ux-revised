import { Field, Flex, Switch } from "@chakra-ui/react";

interface ToggleSwitchProps {
  id: string;
  descricao: string;
  isChecked: boolean;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  handleOnChange: (checked: boolean, paymentMethodId: string) => void;
}

export function ToggleSwitch({
  id,
  descricao,
  isChecked,
  handleOnChange,
  isReadOnly,
  isDisabled,
}: ToggleSwitchProps) {
  return (
    <Flex
      background="#E2F8F3"
      height="12"
      paddingLeft="4"
      justifyContent="space-between"
      marginRight={10}
      gap="5"
      alignItems="center"
      maxWidth="96"
    >
      <Field.Root
        marginBottom="4px"
        htmlFor={id}
        fontWeight="semibold"
        fontSize="sm"
        color="secondaryMain"
        textTransform="uppercase"
      >
        {descricao}
      </Field.Root>
      <Switch.Root
        paddingRight="14"
        id={id}
        isChecked={isChecked}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          handleOnChange(event.currentTarget.checked, id)
        }
        isReadOnly={isReadOnly}
        isDisabled={isDisabled}
      />
    </Flex>
  );
}
