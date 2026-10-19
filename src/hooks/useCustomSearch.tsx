import { useSearchParams } from 'react-router-dom';

export function useCustomSearch(initialTabIndex = 0, initialSubTabIndex = 0) {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabIndexFromParams = Number(searchParams.get('tab')) ?? initialTabIndex;
  const subTabIndexFromParams =
    Number(searchParams.get('subTab')) ?? initialSubTabIndex;

  // useEffect(() => {
  //   if (
  //     tabIndexFromParams !== initialTabIndex ||
  //     subTabIndexFromParams !== initialSubTabIndex
  //   ) {
  //     setSearchParams(
  //       {
  //         tab: tabIndexFromParams.toString(),
  //         subTab: subTabIndexFromParams.toString(),
  //       },
  //       {
  //         replace: true,
  //       },
  //     );
  //   }
  // }, [initialTabIndex, initialSubTabIndex]);

  function handleTabsChange(index: number) {
    setSearchParams(
      { tab: index.toString() },
      {
        replace: true,
      },
    );
  }

  function handleSubTabsChange(index: number, tabIndex?: number) {
    const newParams = {
      tab: tabIndex?.toString()
        ? tabIndex.toString()
        : tabIndexFromParams.toString(),
      subTab: index.toString(),
    };

    setSearchParams(newParams, {
      replace: true,
    });
  }

  return {
    tabIndex: tabIndexFromParams,
    subTabIndex: subTabIndexFromParams,
    handleTabsChange,
    handleSubTabsChange,
  };
}
