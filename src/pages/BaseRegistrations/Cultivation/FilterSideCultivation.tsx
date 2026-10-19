// src/pages/BaseRegistrations/Cultivation/FilterSideCultivation.tsx
// -----------------------------------------------------------------------------
// Drawer de FILTRO da árvore de Cultura/Variedade (Contrato B canônico).
// Reaproveita a casca global <FilterSide> e injeta só o conteúdo da feature:
// busca por nome — CLIENT-SIDE (o endpoint /tree não é paginado nem aceita
// `search` server-side; o filtro é aplicado sobre a árvore já carregada, ver
// index.tsx) — + rodapé aplicar/limpar.
//
// `filter` aqui reflete o state LOCAL `search` do index.tsx (não
// `paginatedQuery.filter` — esta tela é client-side sobre árvore, não
// paginada). O drawer rehidrata o campo com esse valor ao reabrir —
// `useEffect` com deps SÓ `[isOpen]` (mesmo padrão de FilterSideAddressing).
// -----------------------------------------------------------------------------

import { useEffect } from "react";

import { Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";

import { LanguageDate } from "@/@types/language";
import type { CultivationFilterForm } from "@/@types/v2/Cultivation/cultivation";
import { Button } from "@/components/Button";
import { FilterSide } from "@/components/FilterSide";
import { Form } from "@/components/Form";
import { Input } from "@/components/Form/Input";

import type { FilterModalProps } from "@/@types/filter-modal";

const pristineFormValues: CultivationFilterForm = {
  search: "",
};

function toInternalValues(rawFilter?: CultivationFilterForm | null): CultivationFilterForm {
  return {
    search: rawFilter?.search ?? "",
  };
}

export function FilterSideCultivation({
  isOpen,
  onClose,
  handleReset,
  handleFilterChange,
  filter,
  languageGB,
}: FilterModalProps<CultivationFilterForm>) {
  const { register, handleSubmit, reset } = useForm<CultivationFilterForm>({
    defaultValues: {
      ...pristineFormValues,
      ...toInternalValues(filter),
    },
  });

  function onSubmit(data: CultivationFilterForm) {
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
            {languageGB.cultivation.filter.title}
          </Text>

          <Input
            label={languageGB.cultivation.filter.search}
            placeholder={languageGB.cultivation.filter.searchPlaceholder}
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
            variant="outline"
            onClick={handleResetFiltersOnClose}
            type="button"
          />
          <Button title={languageGB.defaltStrings.applyFilters} type="submit" />
        </Form.FooterFilter>
      </Form>
    </FilterSide>
  );
}
