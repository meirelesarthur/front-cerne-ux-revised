import { ReactNode, useCallback, useState } from "react";

import { Box } from "@chakra-ui/react";
import { createContext } from "use-context-selector";

// Loading global desabilitado - será substituído por Skeleton no futuro
// import { Loading } from "@/components/Loading";

interface LoadProviderProps {
  children: ReactNode;
}

interface LoadContextType {
  toggleLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const LoadContext = createContext({} as LoadContextType);

function LoadProvider({ children }: LoadProviderProps) {
  const [isLoading, setIsLoading] = useState(false);

  const toggleLoading = useCallback((loading: boolean) => {
    // Loading global desabilitado - será substituído por Skeleton no futuro
    // setIsLoading(loading);
    console.log("[LoadContext] toggleLoading disabled - use Skeleton instead");
  }, []);

  return (
    <LoadContext.Provider
      value={{
        toggleLoading,
        isLoading,
      }}
    >
      <Box position="relative" width="full" height="full" overflow="visible">
        {/* Loading global desabilitado - será substituído por Skeleton no futuro */}
        {/* <Loading isLoading={isLoading} /> */}
        {children}
      </Box>
    </LoadContext.Provider>
  );
}

export { LoadContext, LoadProvider };
