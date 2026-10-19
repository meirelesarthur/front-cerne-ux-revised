import { memo } from "react"; // 1. Importe o 'memo'

import { Text } from "@chakra-ui/react";

import { useUnit } from "@/contexts/UnitContext";

import transformNumberToStringKg from "@/utils/transformNumberToStringKg";
import transformNumberToStringTn from "@/utils/transformNumberToStringTn";

interface UnitColumnRowProps {
  rowValue: string | number;
}

// 2. Envolva o componente com memo na exportação
export const UnitColumnRow = memo(({ rowValue }: UnitColumnRowProps) => {
  const { unit } = useUnit();
  return (
    <Text>
      {unit === "kg"
        ? transformNumberToStringKg(rowValue)
        : transformNumberToStringTn(rowValue)}
    </Text>
  );
});
