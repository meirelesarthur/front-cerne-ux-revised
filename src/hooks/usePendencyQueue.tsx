import { useContextSelector } from "use-context-selector";

import { PendencyQueueContext } from "@/contexts/PendencyQueueContext";

export default function usePendencyQueue() {
  const handleRemovePendency = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.handleRemovePendency
  );

  const disclosure = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.disclosure
  );

  const handleAddPendency = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.handleAddPendency
  );

  const handleClosePendencyQueue = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.handleClosePendencyQueue
  );

  const hasMinimized = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.hasMinimized
  );

  const pendencyQueue = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.pendencyQueue
  );

  const toggleHasMinimized = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.toggleHasMinimized
  );

  const hasAddedPendency = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.hasAddedPendency
  );

  const setHasAddedPendency = useContextSelector(
    PendencyQueueContext,
    (pendency) => pendency.setHasAddedPendency
  );

  return {
    hasAddedPendency,
    setHasAddedPendency,
    handleRemovePendency,
    disclosure,
    handleAddPendency,
    handleClosePendencyQueue,
    hasMinimized,
    pendencyQueue,
    toggleHasMinimized,
  };
}
