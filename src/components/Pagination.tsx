import { useState } from "react";

import { Center, HStack, Icon, IconButton } from "@chakra-ui/react";
import { FiMoreHorizontal } from "react-icons/fi";

import { useTable } from "@/hooks/useTable";

import rangeOfNumbers from "@/utils/rangeOfNumbers";

import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Button } from "./Button";

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
        <Button
          variant="outline"
          title={canRecover ? lastValidPage.toString() : '1'}
          aria-label={canRecover ? `Ir para a página ${lastValidPage}` : undefined}
          onClick={canRecover ? () => setPageIndex(lastValidPage) : undefined}
          backgroundColor="paginationBG"
          color="white"
          borderColor="green.600"
          boxSize="24px"
          fontSize="8px"
          fontWeight="semibold"
          border="0"
          borderRadius="md"
          cursor={canRecover ? 'pointer' : 'initial'}
          _hover={{
            backgroundColor: 'paginationSelectedBG',
            color: 'paginationSelectedColor',
          }}
        />
      );
    }

    return getPaginationGroup().map((value) => {
      if (pageCount < value + 1) return null;
      return (
        <Button
          key={value}
          variant="outline"
          title={value.toString()}
          padding="0"
          onClick={() => setPageIndex(value)}
          backgroundColor={pageIndex === value ? 'paginationSelectedBG' : undefined}
          color={pageIndex === value ? 'paginationSelectedColor' : 'paginationColor'}
          borderColor={pageIndex === value ? 'paginationSelectedBG' : 'semanticNeutral.100'}
          border="0"
          boxSize="24px"
          fontSize="8px"
          fontWeight="semibold"
          borderRadius="md"
          cursor={pageIndex === value ? 'initial' : 'pointer'}
          _hover={{
            backgroundColor: 'paginationSelectedBG',
            color: 'paginationSelectedColor',
          }}
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
        <Button
          title="1"
          onClick={() => setPageIndex(1)}
          variant="outline"
          boxSize="24px"
          padding="0"
          borderColor="paginationBG"
          fontSize="8px"
          color="paginationColor"
          backgroundColor="paginationBG"
          border="0"
          borderRadius="md"
          _hover={{
            backgroundColor: 'paginationSelectedBG',
            color: 'paginationSelectedColor',
          }}
        />
        <Center
          boxSize="24px"
          fontSize="8px"
          color="paginationColor"
          backgroundColor="paginationBG"
          borderRadius="md"
        >
          <Icon as={FiMoreHorizontal} />
        </Center>
      </>
    );
  }

  function renderLastPage() {
    if (!lastPageWillBeRendered()) {
      return null;
    }

    return (
      <>
        <Center
          boxSize="24px"
          color="paginationColor"
          backgroundColor="paginationBG"
          fontSize="xs"
          borderRadius="md"
        >
          <Icon as={FiMoreHorizontal} />
        </Center>
        <Button
          title={(pageCount - 1).toString()}
          onClick={() => setPageIndex(pageCount - 1)}
          variant="outline"
          padding="0"
          boxSize="24px"
          borderColor="border1"
          fontSize="xs"
          color="paginationColor"
          border="0"
          borderRadius="md"
          _hover={{
            backgroundColor: 'paginationSelectedBG',
            color: 'paginationSelectedColor',
          }}
        />
      </>
    );
  }

  return (
    <HStack gap={1} flex="1" flexDirection="row" justifyContent="flex-end" alignItems="center">
      <IconButton
        onClick={previousPage}
        disabled={!table.getCanPreviousPage() || pageIndex === 1}
        aria-label="Página anterior"
        border="0"
        variant="outline"
        boxSize="24px"
        borderColor="border1"
        fontSize="xs"
        color="paginationColor"
        borderRadius="md"
        _hover={{
          backgroundColor: 'paginationSelectedBG',
          color: 'paginationSelectedColor',
        }}
      >
        <Icon as={MdKeyboardArrowLeft} />
      </IconButton>
      {renderFirstPage()}
      {renderPages()}
      {renderLastPage()}
      <IconButton
        onClick={nextPage}
        disabled={!table.getCanNextPage() || pageCount === -1}
        aria-label="Próxima página"
        border="0"
        variant="outline"
        boxSize="24px"
        borderColor="border1"
        fontSize="xs"
        color="paginationColor"
        borderRadius="md"
        _hover={{
          backgroundColor: 'paginationSelectedBG',
          color: 'paginationSelectedColor',
        }}
      >
        <Icon as={MdKeyboardArrowRight} />
      </IconButton>
    </HStack>
  );
}
