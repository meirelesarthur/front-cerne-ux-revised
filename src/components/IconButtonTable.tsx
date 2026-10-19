import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { Tooltip } from "./TooLtip";

interface IconButtonTable extends IconButtonProps {
  mensegerTooltip?: string;
}

export function IconButtonTable({ mensegerTooltip, ...rest }: IconButtonTable) {
  return (
    <Tooltip label={mensegerTooltip}>
      <IconButton fontSize="2xl" height="32px" {...rest} />
    </Tooltip>
  );
}
