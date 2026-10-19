import { Fragment } from "react";

import { Flex, Separator, Skeleton } from "@chakra-ui/react";

import { UnitTypes } from "@/contexts/UnitContext";

import transformNumberToStringKg from "@/utils/transformNumberToStringKg";
import transformNumberToStringTn from "@/utils/transformNumberToStringTn";

import { DisplayField } from "./DisplayField";

export interface DisplayFieldData {
  value: string | number;
  label: string;
  unit?: UnitTypes;
}
interface DisplayFieldGroupProps {
  displayFields: DisplayFieldData[];
  loading: boolean;
}
export function DisplayFieldGroup({
  displayFields,
  loading,
}: DisplayFieldGroupProps) {
  return (
    <Flex backgroundColor="displayFieldBG" direction="column">
      <Separator marginBottom="2" colorPalette="border1" />
      <Flex gap="8" rowGap="4" wrap="wrap" direction="row" paddingX="10">
        {displayFields.map((item) => (
          <Fragment key={item.label}>
            <Skeleton
              loading={loading}
              css={{
                "--start-color": "var(--chakra-colors-primary-500)",
                "--end-color": "var(--chakra-colors-border2)",
              }}
              marginBottom={loading ? "4px" : "0"}
            >
              <DisplayField
                label={item.label}
                value={
                  item.unit!
                    ? item.unit === "kg"
                      ? transformNumberToStringKg(item.value)
                      : transformNumberToStringTn(item.value)
                    : item.value
                }
              />
            </Skeleton>
          </Fragment>
        ))}
      </Flex>
      <Separator marginTop="2" colorPalette="border1" />
    </Flex>
  );
}
