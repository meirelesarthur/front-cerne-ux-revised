// src/pages/BaseRegistrations/Addressing/FilterSideAddressing.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da árvore de Endereçamentos. Reaproveita a casca global
// <FilterSide> e injeta só o conteúdo da feature: busca por descrição —
// CLIENT-SIDE (o endpoint `/tree` não é paginado nem aceita `search`
// server-side; o filtro é aplicado sobre a árvore já carregada no `index.tsx`,
// via `filter`/`handleFilterChange`/`handleReset` — Contrato B, `filter-modal.d.ts`).
//
// Rehidrata o campo de busca com o `filter` já aplicado ao reabrir —
// `useEffect` com deps SÓ `[isOpen]`, mesmo par `handleResetFilters` (botão
// "limpar", chama a prop `handleReset` + reseta o form) /
// `handleResetFiltersOnClose` (cancelar, reverte o form ao `filter` aplicado
// sem propagar) do molde `DiagnosisPregnancy/FilterSideDiagnosisPregnancy.tsx`.
// -----------------------------------------------------------------------------

import { useEffect } from "react";

import { Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import type { FilterModalProps } from "@/@types/filter-modal";
import type { AddressingFilterForm } from "@/@types/v2/Addressing/addressing";
import { Button } from "@/components/Button";
import { FilterSide } from "@/components/FilterSide";
import { Form } from "@/components/Form";
import { Input } from "@/components/Form/Input";

const pristineFormValues: AddressingFilterForm = { search: "" };

function toInternalValues(
  rawFilter?: AddressingFilterForm | null
): AddressingFilterForm {
  return { search: rawFilter?.search ?? "" };
}

export function FilterSideAddressing({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<AddressingFilterForm>) {
  const { register, handleSubmit, reset } = useForm<AddressingFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  // Ao (re)abrir o drawer, ressincroniza o form com o filtro aplicado.
  useEffect(() => {
    reset({
      ...pristineFormValues,
      ...toInternalValues(filter),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function onSubmit(data: AddressingFilterForm) {
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

  return (
    <FilterSide isOpen={isOpen} onClose={onClose} languageGB={languageGB}>
      <Form noPadding formFilter onSubmit={handleSubmit(onSubmit)}>
        <Form.BodyFilter>
          <Text fontWeight="bold" color="brandColorText">
            {languageGB.baseRegistrations.addressing.filter.title}
          </Text>

          <Input
            label={languageGB.baseRegistrations.addressing.filter.search}
            placeholder={languageGB.baseRegistrations.addressing.filter.searchPlaceholder}
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
