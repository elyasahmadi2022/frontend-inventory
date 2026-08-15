import { useCallback, useState } from "react";

/**
 * Keeps pagination in sync with filter/sort changes without resetting via useEffect.
 * When the filter signature changes, page falls back to 1 until the user picks a page again.
 */
export function useFilteredPage(filterSignature: string) {
  const [pageState, setPageState] = useState({
    signature: filterSignature,
    page: 1,
  });

  const page =
    pageState.signature === filterSignature ? pageState.page : 1;

  const setPage = useCallback(
    (next: number) => {
      setPageState({ signature: filterSignature, page: next });
    },
    [filterSignature],
  );

  return [page, setPage] as const;
}
