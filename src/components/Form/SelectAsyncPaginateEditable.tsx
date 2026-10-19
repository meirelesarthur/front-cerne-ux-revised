// src/components/Form/SelectAsyncPaginateEditable.tsx

import { useState } from "react";

import { HStack, Icon, IconButton, InputGroup } from "@chakra-ui/react";
import { BiCheck, BiPlusCircle, BiX } from "react-icons/bi";
import { MdOutlineEdit } from "react-icons/md";
import { ActionMeta } from "react-select";

import { Option } from "@/@types/option";

import { Field } from "./Field";
import { Input } from "./Input";
import {
  SelectAsyncPaginate,
  SelectAsyncPaginateProps,
} from "./SelectAsyncPaginate";

interface EditableProps<T = any> extends SelectAsyncPaginateProps<T> {
  addItem?: (label: string) => Promise<any> | void;
  updateItem?: (data: Option) => Promise<any> | void;
  deleteItem?: (id: string) => void;
}

export function SelectAsyncPaginateEditable({
  addItem,
  updateItem,
  helperText,
  isRequired,
  isReadOnly,
  label,
  name,
  onChange,
  value,
  error,
  tooltip,
  ...rest
}: EditableProps) {
  const [currentValue, setCurrentValue] = useState<Option | null>(
    (value as Option) || null,
  );
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleOnChange = (
    newValue: unknown,
    actionMeta: ActionMeta<unknown>,
  ) => {
    setCurrentValue(newValue as Option);
    if (typeof onChange === "function") {
      onChange(newValue, actionMeta);
    }
  };

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditValue("");
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditValue(currentValue?.label || "");
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditValue("");
  };

  const handleSave = async () => {
    try {
      if (isAdding && addItem && editValue) {
        await addItem(editValue);
      }
      // 2. Lógica de edição adicionada
      if (isEditing && updateItem && currentValue) {
        await updateItem({ value: currentValue.value, label: editValue });
      }
    } catch (e) {
      console.error("Falha ao salvar item", e);
    } finally {
      handleCancel();
    }
  };

  return (
    <Field
      label={label}
      errorText={error}
      helperText={helperText}
      isRequired={isRequired}
      tooltip={tooltip}
    >
      <HStack>
        {isAdding || isEditing ? (
          <InputGroup
            endElement={
              <>
                <IconButton
                  aria-label="Salvar"
                  variant="ghost"
                  onClick={handleSave}
                  size="sm"
                >
                  <Icon as={BiCheck} />
                </IconButton>
                <IconButton
                  aria-label="Cancelar"
                  variant="ghost"
                  onClick={handleCancel}
                  size="sm"
                >
                  <Icon as={BiX} />
                </IconButton>
              </>
            }
          >
            <Input
              size="md"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={isAdding ? "Digite o novo item" : "Edite o item"}
            />
          </InputGroup>
        ) : (
          <SelectAsyncPaginate
            name={name}
            value={currentValue || undefined}
            onChange={handleOnChange}
            isReadOnly={isReadOnly}
            {...rest}
          />
        )}

        {!isReadOnly && (
          <HStack gap="0">
            <IconButton
              aria-label="Adicionar"
              variant="ghost"
              onClick={handleStartAdd}
              disabled={isAdding || isEditing}
            >
              <Icon as={BiPlusCircle} />
            </IconButton>
            <IconButton
              aria-label="Editar"
              variant="ghost"
              onClick={handleStartEdit}
              disabled={!currentValue || isAdding || isEditing}
            >
              <Icon as={MdOutlineEdit} />
            </IconButton>
          </HStack>
        )}
      </HStack>
    </Field>
  );
}
