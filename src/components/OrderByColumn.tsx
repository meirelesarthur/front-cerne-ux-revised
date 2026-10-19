import { Flex, Icon, Text } from "@chakra-ui/react";
import { BsArrowDown, BsArrowUp } from "react-icons/bs";
import { PiArrowsDownUp } from "react-icons/pi";

import { useTable } from "@/hooks/useTable";

interface OrdeByColumnProps {
  colunmName: string;
  name: string;
  orderBy: {
    name: string;
    ascOrDesc: string;
  };
  ascOrDesc: string;
  isProcessing: boolean;
  handleOrderByChange: (orderBy: { name: string; ascOrDesc: string }) => void;
}

export function OrdeByColumn({
  colunmName,
  name,
  handleOrderByChange,
  orderBy,
  ascOrDesc,
  isProcessing,
}: OrdeByColumnProps) {
  const { table } = useTable();
  function handleClick() {
    table.toggleAllRowsSelected(false);
    if (isProcessing) {
      return;
    }

    handleOrderByChange({ name, ascOrDesc });
  }

  return (
    <Text
      as={Flex}
      alignItems="center"
      cursor="pointer"
      gap={2}
      onClick={handleClick}
      color={orderBy?.name === name ? "primaryMain" : "white"}
    >
      {colunmName}
      {orderBy.name === name &&
        (orderBy.ascOrDesc === "asc" ? (
          <Icon as={BsArrowDown} fontSize={14} />
        ) : (
          <Icon as={BsArrowUp} fontSize={14} />
        ))}
      {orderBy.name !== name && <Icon as={PiArrowsDownUp} fontSize={16} />}
    </Text>
  );
}
