import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLoad } from "./useLoad";

export const useGlobalLoading = () => {
  const { toggleLoading } = useLoad();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  useEffect(() => {
    toggleLoading(isFetching + isMutating > 0);
  }, [isFetching, isMutating]);
};
