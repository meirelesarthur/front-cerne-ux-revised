import { ReactNode, useEffect, useMemo, useState } from 'react';

import { createContext } from 'use-context-selector';

interface TitleProviderProps {
  children: ReactNode;
}

interface TitleData {
  title: string;
  form?: boolean;
}

interface TitleContextType {
  titleGB: TitleData;
  updateTitleGB: (title: TitleData) => void;
}

const TitleContext = createContext({} as TitleContextType);

function TitleProvider({ children }: TitleProviderProps) {

  const [titleGB, setTitle] = useState<TitleData>({ form: false, title: '' });

  function updateTitleGB(title: TitleData) {
    if (title !== titleGB) {
      setTitle(title);
    }
  }

  return (
    <TitleContext.Provider
      value={{
        titleGB,
        updateTitleGB,
      }}
    >
      {children}
    </TitleContext.Provider>
  );
}

export { TitleContext, TitleProvider };
