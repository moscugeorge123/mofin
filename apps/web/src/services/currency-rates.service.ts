import { apiClient } from "../lib/api-client"

export interface CurrencyRates {
  USD_RON: number
  EUR_RON: number
  JPY_RON: number
  lastUpdated: string
}

export const currencyRatesApi = {
  get: async (): Promise<CurrencyRates> => {
    return apiClient.get<CurrencyRates>("/api/currency-rates")
  },
}
