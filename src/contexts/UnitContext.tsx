import { getUnitGB, saveUnitGB } from "@/utils/auth-token";
import { createContext, ReactNode, useContext, useState } from "react";

export const unitTypes = {
  kg: "kg",
  tn: "tn",
} as const;

export type UnitTypes = typeof unitTypes[keyof typeof unitTypes];

interface UnitContextProps {
  unit: UnitTypes;
  handleSetUnit: (unit: UnitTypes) => void;
}

const UnitContext = createContext<UnitContextProps | undefined>(undefined);

export const useUnit = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error("useUnit must be used within a UnitProvider");
  }
  return context;
};

interface UnitProviderProps {
  children: ReactNode;
}

export const UnitProvider = ({ children }: UnitProviderProps) => {
  const unitCurrent = getUnitGB();
  const [unit, setUnit] = useState<UnitTypes>(unitCurrent || unitTypes.tn);

  function handleSetUnit(unit: UnitTypes) {
    setUnit(unit);
    saveUnitGB(unit);
  }

  return (
    <UnitContext.Provider value={{ unit, handleSetUnit }}>
      {children}
    </UnitContext.Provider>
  );
};
