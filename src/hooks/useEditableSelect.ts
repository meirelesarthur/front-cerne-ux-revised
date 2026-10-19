// src/hooks/useEditableSelect.ts
import { useState } from "react";

import { Option } from "@/@types/option";

interface UseEditableSelectProps {
  initialValue?: Option;
  onAddItem?: (label: string) => void;
  onUpdateItem?: (data: Option) => void;
}

export function useEditableSelect({
  initialValue,
  onAddItem,
  onUpdateItem,
}: UseEditableSelectProps) {
  const [value, setValue] = useState<Option | null>(initialValue || null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Adicionado para futuras edições

  const handleSave = () => {
    if (isAdding && value?.label) {
      onAddItem?.(value.label);
      setIsAdding(false);
      setValue(null); // Limpa o input após adicionar
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setValue(initialValue || null);
  };

  return {
    value,
    setValue,
    isAdding,
    setIsAdding,
    isEditing,
    setIsEditing,
    handleSave,
    handleCancel,
  };
}
