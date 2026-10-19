import { useEffect, useState } from "react";

import { Box, Flex, Icon, Input, SimpleGrid, Text } from "@chakra-ui/react";
import { MdAdd, MdCheck, MdClose, MdEdit } from "react-icons/md";

import { useRequest } from "@/hooks/useRequest";

import { columnsForm } from "@/constants/coluns-form";
import { templateColumns } from "@/constants/template-columns";

import { LanguageDate } from "@/@types/language";
import { Response } from "@/@types/response-api";

interface Item {
  id?: string;
  grainId?: string;
  symbol?: string;
  name: string;
}

interface EditableListComponentProps<TData extends Item = Item> {
  onItemsChange: (items: TData[]) => void;
  data: TData[];
  title: string;
  queryKey: string;
  registrationId: string;
  asyncFunctionUpdate(data: TData): Promise<Response<TData> | undefined>;
  asyncFunctionCreate(data: TData): Promise<Response<TData> | undefined>;
  isDisabled?: boolean;
  languageGB: LanguageDate;
}

function EditableListComponent<TData extends Item = Item>({
  onItemsChange,
  data,
  title,
  asyncFunctionUpdate,
  asyncFunctionCreate,
  queryKey,
  registrationId,
  isDisabled,
  languageGB,
}: EditableListComponentProps<TData>) {
  const [add, setAdd] = useState(false);
  const [value, setValue] = useState<TData>();
  const [items, setItems] = useState<TData[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<TData>();

  async function handleAccept() {
    if (!!registrationId) {
      await updateListComponentMutation.mutateAsync(value);
    }
    if (value?.name.trim()) {
      const newItem: TData = { name: value?.name } as TData;
      const newItems = [...items, newItem];
      setItems(newItems);
      setValue(null!);
      setAdd(false);
    }
  }

  useEffect(() => {
    if (data) {
      setItems(data);
    }
  }, [data]);

  const updateListComponentMutation = useRequest({
    asyncFunction: tryPersistAsyncFunctionUpdate,
    entityName: title,
    queryKey: queryKey,
    typesRequest: "update",
    actionSuccess: () => {
      handleClear();
    },
  });

  async function tryPersistAsyncFunctionUpdate(data: TData) {
    if (registrationId && !value?.id) {
      return await asyncFunctionCreate({
        name: data.name,
        grainId: registrationId,
      } as TData);
    }
    return await asyncFunctionUpdate(data);
  }

  function handleClear() {
    setEditIndex(null);
    setEditValue(null!);
    setAdd(false);
  }

  const handleEdit = (index: number) => {
    setEditIndex(index);
    setEditValue(items[index]);
  };

  async function handleUpdate(index: number) {
    if (editValue?.id) {
      await updateListComponentMutation.mutateAsync(editValue);
      return;
    }
    const updatedItems = [...items];
    updatedItems[index].name = editValue?.name!;
    setItems(updatedItems);
    handleClear();
  }

  useEffect(() => {
    if (!isDisabled) onItemsChange(items);
  }, [items, onItemsChange]);

  return (
    <Box width="full" marginTop="8">
      <Flex
        alignItems="center"
        justifyContent="space-between"
        marginY="2"
        height="40px"
        paddingRight="4"
      >
        <Text color="gray.400">{title}</Text>
        {add || !!editValue ? (
          <Flex gap={4} alignItems="center">
            {editValue ? (
              <Input
                value={editValue.name}
                onChange={(e) =>
                  setEditValue({
                    id: editValue.id,
                    name: e.target.value,
                  } as TData)
                }
                placeholder={languageGB.defaltStrings.value}
                marginEnd={2}
              />
            ) : (
              <Input
                value={value?.name}
                onChange={(e) => setValue({ name: e.target.value } as TData)}
                placeholder={languageGB.defaltStrings.value}
                marginEnd={2}
              />
            )}
            <Icon as={MdClose} onClick={handleClear} />
            {editValue ? (
              <Icon as={MdCheck} onClick={() => handleUpdate(editIndex!)} />
            ) : (
              <Icon as={MdCheck} onClick={handleAccept} />
            )}
          </Flex>
        ) : isDisabled ? (
          ""
        ) : (
          <Icon as={MdAdd} onClick={() => setAdd(true)} />
        )}
      </Flex>
      <Box borderWidth={1} borderColor="yellow.800" width="full" />
      <SimpleGrid
        columns={columnsForm.default}
        gap={2}
        templateColumns={templateColumns.default}
        marginTop={2}
      >
        {items?.map((item, index) => (
          <Flex
            key={index}
            align="center"
            justify="space-between"
            borderColor="green.700"
            padding={2}
            borderWidth={1}
            borderRadius="3xl"
          >
            <Box paddingStart={2}>{item?.name}</Box>
            <Flex alignItems="center" justifyContent="center">
              <Icon
                as={MdEdit}
                onClick={() => handleEdit(index)}
                color="green.700"
                fontSize={20}
              />
              {/* <Icon as={MdDelete} onClick={item.id ? null! : () => handleDelete(index)} color="red.700" /> */}
            </Flex>
          </Flex>
        ))}
      </SimpleGrid>
    </Box>
  );
}

export default EditableListComponent;
