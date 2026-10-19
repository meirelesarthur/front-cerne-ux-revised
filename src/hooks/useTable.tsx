import { useContext } from "react";

import { TableContext } from "@/contexts/TableContext";

export function useTable() {
  return useContext(TableContext);
}
