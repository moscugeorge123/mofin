import { useQuery } from "@tanstack/react-query"
import { currencyRatesApi } from "../services/currency-rates.service"

export function useCurrencyRates() {
  return useQuery({
    queryKey: ["currency-rates"],
    queryFn: () => currencyRatesApi.get(),
    staleTime: 1000 * 60 * 60, // 1 hour – rates update once per day
  })
}
