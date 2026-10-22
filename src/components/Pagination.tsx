// src/components/Pagination.tsx
// Paginação ligada à tabela (`useTable`). Visual fiel ao `Pagination.tsx` do design
// system `cerne`: botões quadrados de 34px (`t.size.pageBtn`), raio md, contorno
// neutro, página atual preenchida em brand[600], reticências "…" com a mesma largura,
// anterior/próxima com 40% de opacidade quando desabilitados. A lógica (índice
// 1-based da tabela, guarda de reentrada, recuperação de página fora do range) é a
// do front e foi mantida; só a apresentação foi componentizada (`PageButton`).

import { useState } from "react";

import { Center, HStack, Icon } from "@chakra-ui/react";

import { useTable } from "@/hooks/useTable";

import rangeOfNumbers from "@/utils/rangeOfNumbers";

import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";

const PAGE_BUTTON_SIZE = "34px"; // DS: t.size.pageBtn

interface PageButtonProps {
  label: string | number;
  onClick?: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
}

/** Botão quadrado de paginação (número ou seta) — única fonte do visual do DS. */
function PageButton({ label, onClick, isActive = false, isDisabled = false, ariaLabel, children }: PageButtonProps) {
  return (
    <Center
      as="button"
      type="button"
      onClick={isDisabled || isActive ? undefined : onClick}
      disabled={isDisabled}
      aria-label={ariaLabel ?? `Página ${label}`}
      aria-current={isActive ? "page" : undefined}
      boxSize={PAGE_BUTTON_SIZE}
      flexShrink={0}
      borderRadius="md"
      borderWidth="1px"
      borderStyle="solid"
      borderColor={isActive ? "green.600" : "semanticNeutral.200"}
      bg={isActive ? "green.600" : "paginationBG"}
      color={isActive ? "white" : "semanticNeutral.500"}
      fontSize="base"
      fontWeight="medium"
      userSelect="none"
      opacity={isDisabled ? 0.4 : 1}
      cursor={isDisabled ? "not-allowed" : isActive ? "default" : "pointer"}
      transition="background 0.15s ease, color 0.15s ease, border-color 0.15s ease"
      _hover={isDisabled || isActive ? undefined : { bg: "semanticNeutral.100" }}
    >
      {children ?? label}
    </Center>
  );
}

function Ellipsis() {
  return (
    <Center
      width={PAGE_BUTTON_SIZE}
      color="semanticNeutral.400"
      fontSize="base"
      userSelect="none"
      aria-hidden="true"
    >
      …
    </Center>
  );
}

export function Pagination() {
  const { table } = useTable();
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  function handleProcessing() {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
    }, 800);
  }

  function nextPage() {
    if (isProcessing) return;
    handleProcessing();
    table.nextPage();
    table.toggleAllRowsSelected(false);
  }
  function previousPage() {
    if (isProcessing) return;
    handleProcessing();
    table.previousPage();
    table.toggleAllRowsSelected(false);
  }
  function setPageIndex(value: number) {
    if (isProcessing) return;
    handleProcessing();
    table.setPageIndex(value);
    table.toggleAllRowsSelected(false);
  }

  function getPaginationGroup() {
    if (pageIndex < 4) {
      return rangeOfNumbers(1, 5);
    }

    if (pageIndex + 1 + 2 < pageCount) {
      return rangeOfNumbers(pageIndex + 1 - 2, pageIndex + 1 + 2);
    }
    return rangeOfNumbers(pageIndex + 1 - 2, pageCount);
  }

  function renderPages() {
    if (getPaginationGroup().length === 0) {
      // Grupo vazio pode significar duas coisas: (a) não há dado nenhum ainda
      // (pageCount === -1, sentinela do TableProvider) — mantém o placeholder
      // decorativo de sempre; ou (b) a página persistida ficou fora do range
      // (ex.: excluiu o único registro da última página) mas EXISTE uma última
      // página válida (pageCount > 0) — nesse caso o controle vira um caminho
      // de recuperação clicável em vez de sumir e prender o usuário.
      const lastValidPage = pageCount > 0 ? pageCount - 1 : 0;
      const canRecover = lastValidPage >= 1;

      return (
        <PageButton
          label={canRecover ? lastValidPage : 1}
          ariaLabel={canRecover ? `Ir para a página ${lastValidPage}` : undefined}
          onClick={canRecover ? () => setPageIndex(lastValidPage) : undefined}
          isDisabled={!canRecover}
        />
      );
    }

    return getPaginationGroup().map((value) => {
      if (pageCount < value + 1) return null;
      return (
        <PageButton
          key={value}
          label={value}
          isActive={pageIndex === value}
          onClick={() => setPageIndex(value)}
        />
      );
    });
  }

  function lastPageWillBeRendered() {
    return pageCount > 4 && !getPaginationGroup().includes(pageCount);
  }

  function firstPageWillBeRendered() {
    return pageIndex >= 4 && getPaginationGroup().includes(pageIndex);
  }

  function renderFirstPage() {
    if (!firstPageWillBeRendered()) {
      return null;
    }

    return (
      <>
        <PageButton label={1} onClick={() => setPageIndex(1)} />
        <Ellipsis />
      </>
    );
  }

  function renderLastPage() {
    if (!lastPageWillBeRendered()) {
      return null;
    }

    return (
      <>
        <Ellipsis />
        <PageButton label={pageCount - 1} onClick={() => setPageIndex(pageCount - 1)} />
      </>
    );
  }

  return (
    <HStack gap={1} flex="1" flexDirection="row" justifyContent="flex-end" alignItems="center">
      <PageButton
        label="anterior"
        ariaLabel="Página anterior"
        onClick={previousPage}
        isDisabled={!table.getCanPreviousPage() || pageIndex === 1}
      >
        <Icon as={MdKeyboardArrowLeft} boxSize={5} />
      </PageButton>
      {renderFirstPage()}
      {renderPages()}
      {renderLastPage()}
      <PageButton
        label="próxima"
        ariaLabel="Próxima página"
        onClick={nextPage}
        isDisabled={!table.getCanNextPage() || pageCount === -1}
      >
        <Icon as={MdKeyboardArrowRight} boxSize={5} />
      </PageButton>
    </HStack>
  );
}
