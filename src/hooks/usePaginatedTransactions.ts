import { useCallback, useState } from "react"
import { PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<Transaction[]> | null>(null)

  /**
   * Fetches all transactions from the fake backend. Fetches based on the following logic:
   * 1. If there is no data in the cache, it will fetch the first page.
   * 2. If there is data in the cache, it will fetch the next page.
   */
  const fetchAll = useCallback(async () => {

    // If we have reached the end of the data, exit
    if (paginatedTransactions?.nextPage === -1) {
      return
    }

    const response = await fetchWithCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      {
        page: paginatedTransactions === null ? 0 : paginatedTransactions.nextPage,
      }
    )

    setPaginatedTransactions((previousResponse) => {
      // If this is the first request, return the response as is
      if (response === null || previousResponse === null) {
        return response
      }
      // If we have reached the last page, set the next page to -1
      if (response.nextPage === null) {
        return {
          data: [...previousResponse.data, ...response.data],
          nextPage: -1
        }
      }
      // If we have not reached the last page, add the new data to the existing data
      return {
        data: [...previousResponse.data, ...response.data],
        nextPage: response.nextPage,
      }
    })
  }, [fetchWithCache, paginatedTransactions])

  const invalidateData = useCallback(() => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
