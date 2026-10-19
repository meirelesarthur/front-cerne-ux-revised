import { ascOrDesc } from "@/constants/ascOrDesc";

export function checkAscOrDesc(
  name: string,
  orderBy: { name: string; ascOrDesc: string },
) {
  if (!orderBy || !name) return ascOrDesc.desc;
  return orderBy?.name !== name
    ? ascOrDesc.asc
    : orderBy.ascOrDesc === ascOrDesc.desc
      ? ascOrDesc.asc
      : ascOrDesc.desc;
}
