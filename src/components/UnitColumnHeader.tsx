// src/components/UnitColumnHeader.tsx
import { ChangeEvent } from "react";

import { Flex, FlexProps, NativeSelect, Text } from "@chakra-ui/react";

import { UnitTypes, useUnit } from "@/contexts/UnitContext";

interface UnitColumnHeaderProps extends FlexProps {
  colunmName: string;
}

export function UnitColumnHeader({
  colunmName,
  ...rest
}: UnitColumnHeaderProps) {
  const { unit, handleSetUnit } = useUnit();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    handleSetUnit(e.target.value as UnitTypes);
  };

  return (
    <Flex
      gap="1"
      flexDirection="row"
      width="full"
      alignItems="center"
      {...rest}
    >
      <Text>{colunmName}</Text>

      <NativeSelect.Root
        size="sm"
        width="40px"
        padding="0"
        variant="plain"
        cursor="pointer"
        background="primitiveBG"
        borderRadius="md"
        color="primitiveTexteColor"
      >
        <NativeSelect.Field
          border="0"
          height="24px"
          css={{ paddingInlineEnd: 0 }}
          value={unit}
          onChange={handleChange}
        >
          <option value="kg">KG</option>
          <option value="tn">TN</option>
        </NativeSelect.Field>
      </NativeSelect.Root>
    </Flex>
  );
}
