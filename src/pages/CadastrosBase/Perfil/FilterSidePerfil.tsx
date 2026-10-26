// src/pages/CadastrosBase/Perfil/FilterSidePerfil.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da listagem de Perfis (padrão da camada de exemplo).
// Reaproveita a casca global <FilterSide> e injeta só o conteúdo da feature:
// busca por nome/descrição (param `search` do backend) + rodapé aplicar/limpar.
// -----------------------------------------------------------------------------

import { useEffect } from "react";

import { Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import type { FilterModalProps } from "@/@types/filter-modal";
import type { RoleFilterForm } from "@/@types/v2/Roles";
import { Button } from "@/components/Button";
import { FilterSide } from "@/components/FilterSide";
import { Form } from "@/components/Form";
import { Input } from "@/components/Form/Input";

export function FilterSidePerfil({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<RoleFilterForm>) {
  const pristineFormValues: RoleFilterForm = { search: "" };

  function toInternalValues(rawFilter?: RoleFilterForm | null): RoleFilterForm {
    return { search: rawFilter?.search ?? "" };
  }

  const { register, handleSubmit, reset } = useForm<RoleFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: RoleFilterForm) {
    handleFilterChange({ search: data.search?.trim() || undefined });
    onClose();
  }

  function handleResetFilters() {
    handleReset();
    reset(pristineFormValues);
  }

  function handleResetFiltersOnClose() {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    onClose();
  }

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
  }, [isOpen]);

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {languageGB.roles.role.filter.title}
          </Text>

          <Input
            label={languageGB.roles.role.filter.search}
            placeholder={languageGB.roles.role.filter.searchPlaceholder}
            {...register("search")}
          />
        </Form.BodyFilter>
        <Form.FooterFilter>
          <Button
            title={languageGB.defaltStrings.clearAllFilters}
            variant="ghost"
            p="0"
            height="4"
            onClick={handleResetFilters}
            type="button"
          />
          <Button
            title={languageGB.defaltStrings.cancel}
            variant="secondary"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
