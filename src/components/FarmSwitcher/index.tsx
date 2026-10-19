// src/components/FarmSwitcher/index.tsx
// -----------------------------------------------------------------------------
// TASK-FE-921 (AJUSTE 3 — seletor de fazenda ativa do header, troca o
// contexto X-Farm-Id). Fiel ao `FarmSwitcher.tsx` do design system `cerne`
// (`GB.Cerne.UX/src/components/ui/FarmSwitcher.tsx`, consumido em
// `Topbar.tsx:77` ao lado do `SearchBar`): campo de BUSCA filtrável sobre as
// fazendas do usuário, não um dropdown estático — o texto exibido sincroniza
// com a fazenda ativa (`useEffect` mirror do `cerne`), `maxVisible=6`,
// largura ~200px fechado.
//
// Adaptação de stack (não é UX-GAP — mesmo espírito da adaptação já feita
// por `HeaderSearch` sobre o `SearchBar` do cerne, ver plano
// `PLANO-farm-selector-header.md` §1a): o `SearchSelect` do cerne (`<div>`
// próprio) vira `Popover.Root`+`Portal`+`Popover.Positioner`+`Popover.Content`
// (Chakra v3), mesmo padrão já usado por `NotificationPanel`/`ErrorLogPanel`/
// `HeaderSearch`.
//
// DEC-020 (decisões do dev, gate do plano §7 — aplicadas exatamente):
//   1. Troca de fazenda CHAMA o backend (`useSelectFarm` → POST
//      /me/farms/{uuid}/select, efeito colateral real — RN-07).
//   2. `onSuccess`: `queryClient.invalidateQueries()` SEM filtro (mesmo
//      padrão de `forceLogout()`) — nenhuma queryKey do projeto segrega por
//      fazenda ativa (achado crítico do plano §3), então só invalidação
//      ampla garante que toda tela farm-scoped recarregue com o novo
//      contexto.
//   3. Com 0 fazendas (`Gestor_Plataf`/contratante novo): ESCONDE o
//      componente (diverge do default do plano, que propunha "mostrar
//      sempre" — o dev optou por esconder). Mesmo tratamento para erro na
//      query (`isError`): sem lista confiável, não há o que oferecer no
//      seletor — o erro em si já é capturado pelo `ErrorLogPanel` via
//      interceptor Axios (nenhum mascaramento, só não exibe um seletor
//      quebrado).
//   4. Tela aberta ao trocar: SÓ invalida/refetch — SEM `navigate()`.
// -----------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Flex, Icon, Input, Popover, Portal, Spinner, Text } from "@chakra-ui/react";
import { FiCheck, FiChevronDown, FiMapPin } from "react-icons/fi";
import { useContextSelector } from "use-context-selector";
import { useQueryClient } from "@tanstack/react-query";

import { AuthContext } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { useMyFarms } from "@/hooks/useMyFarms";
import { useSelectFarm } from "@/hooks/useSelectFarm";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";

import type { FarmRef } from "@/@types/v2/Farms";

const MAX_VISIBLE = 6;

export function FarmSwitcher() {
  const { languageGB } = useLanguage();
  // Mesmo padrão de `usePermissions.ts` — seletor dedicado direto no
  // `AuthContext`, sem passar por `useAuth()` (que não expõe estes campos).
  const activeFarmUuid = useContextSelector(AuthContext, (ctx) => ctx.activeFarmUuid);
  const setActiveFarm = useContextSelector(AuthContext, (ctx) => ctx.setActiveFarm);

  const queryClient = useQueryClient();
  const { data: farms = [], isLoading, isError } = useMyFarms();
  const selectFarmMutation = useSelectFarm();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeFarm = useMemo(
    () => farms.find((farm) => farm.uuid === activeFarmUuid) ?? null,
    [farms, activeFarmUuid]
  );

  // Sincroniza o texto exibido com a fazenda ativa — fidelidade ao `useEffect`
  // do `FarmSwitcher.tsx` do cerne (`setQuery(currentFarm?.name ?? '')`).
  useEffect(() => {
    setQuery(activeFarm?.description ?? "");
  }, [activeFarm]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return farms;
    return farms.filter((farm) => farm.description.toLowerCase().includes(q));
  }, [farms, query]);

  const visible = filtered.slice(0, MAX_VISIBLE);

  function handleSelect(farm: FarmRef) {
    if (farm.uuid === activeFarmUuid) {
      setOpen(false);
      return;
    }

    selectFarmMutation.mutate(farm.uuid, {
      onSuccess: (selectedFarm) => {
        // DEC-020.1/2: backend já confirmou a troca (efeito colateral real
        // no banco) — agora propaga localmente e invalida TUDO, sem filtro.
        setActiveFarm(selectedFarm.uuid);
        queryClient.invalidateQueries();

        setOpen(false);
        setQuery(selectedFarm.description);

        toaster.success({
          title: languageGB.defaltStrings.farmSwitcher.changedToastTitle,
          description: selectedFarm.description,
          duration: 4000,
        });
      },
      onError: () => {
        // Reverte o campo para a fazenda ainda ativa (rollback visual —
        // nenhum estado otimista foi aplicado antes do sucesso).
        setQuery(activeFarm?.description ?? "");

        toaster.error({
          title: languageGB.defaltStrings.farmSwitcher.changeErrorToastTitle,
          description: languageGB.defaltStrings.farmSwitcher.changeErrorToastDescription,
          duration: 6000,
        });
      },
    });
  }

  // DEC-020.3: 0 fazendas (ou erro ao carregar, sem lista confiável) →
  // esconde o componente inteiro. Enquanto carrega, também não renderiza
  // (evita o flash de um seletor vazio que desaparece 1 tick depois).
  if (isLoading || isError || farms.length === 0) {
    return null;
  }

  const isBusy = selectFarmMutation.isPending;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e: { open: boolean }) => setOpen(e.open)}
      positioning={{ placement: "bottom-end" }}
      autoFocus={false}
      restoreFocus={false}
      lazyMount
      unmountOnExit
    >
      <Popover.Anchor>
        <Flex
          align="center"
          gap={2}
          h="32px"
          w={{ base: "150px", md: "200px" }}
          pl={3}
          pr={2}
          borderRadius="base"
          borderWidth="1px"
          borderColor={open ? "sidebarItemActiveText" : "topBarBorder"}
          bg="inputBG"
          transition="border-color 0.15s ease"
          cursor={isBusy ? "not-allowed" : "text"}
          opacity={isBusy ? 0.7 : 1}
          onClick={() => {
            if (isBusy) return;
            setOpen(true);
            inputRef.current?.focus();
          }}
        >
          <Icon as={FiMapPin} boxSize={4} color="topBarTextSecondary" flexShrink={0} />
          <Tooltip content={activeFarm?.description} disabled={!activeFarm} showArrow>
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={languageGB.defaltStrings.farmSwitcher.placeholder}
              disabled={isBusy}
              aria-label={languageGB.defaltStrings.farmSwitcher.ariaLabel}
              border="none"
              bg="transparent"
              h="auto"
              px={0}
              py={0}
              fontSize="sm"
              color="topBarTextColor"
              truncate
              _placeholder={{ color: "topBarTextSecondary" }}
              _focus={{ boxShadow: "none" }}
              _focusVisible={{ boxShadow: "none" }}
            />
          </Tooltip>
          {isBusy ? (
            <Spinner size="xs" color="topBarTextSecondary" flexShrink={0} />
          ) : (
            <Icon as={FiChevronDown} boxSize={3} color="topBarTextSecondary" flexShrink={0} />
          )}
        </Flex>
      </Popover.Anchor>

      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w={{ base: "220px", md: "260px" }}
            maxW="calc(100vw - 32px)"
            bg="cardBG"
            borderRadius="xl"
            boxShadow="0px 20px 25px -5px rgba(0, 0, 0, 0.2), 0px 10px 10px -5px rgba(0, 0, 0, 0.1)"
            border="1px solid"
            borderColor="cardBorder"
            overflow="hidden"
            py={1}
          >
            {visible.length === 0 ? (
              <Box px={3} py={3}>
                <Text fontSize="sm" color="text.secondary">
                  {languageGB.defaltStrings.farmSwitcher.emptyResult}
                </Text>
              </Box>
            ) : (
              visible.map((farm) => {
                const isActive = farm.uuid === activeFarmUuid;
                return (
                  <Flex
                    key={farm.uuid}
                    as="button"
                    w="full"
                    align="center"
                    justify="space-between"
                    gap={2}
                    px={3}
                    py={2}
                    bg={isActive ? "menuSelectedBG" : "transparent"}
                    _hover={{ bg: isBusy ? undefined : "menuSelectedBG" }}
                    cursor={isBusy ? "not-allowed" : "pointer"}
                    opacity={isBusy ? 0.6 : 1}
                    onClick={() => {
                      if (isBusy) return;
                      handleSelect(farm);
                    }}
                  >
                    <Text
                      fontSize="sm"
                      color="text.primary"
                      fontWeight={isActive ? "semibold" : "normal"}
                      truncate
                      textAlign="left"
                    >
                      {farm.description}
                    </Text>
                    {isActive && (
                      <Icon as={FiCheck} boxSize={4} color="sidebarItemActiveText" flexShrink={0} />
                    )}
                  </Flex>
                );
              })
            )}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export default FarmSwitcher;
