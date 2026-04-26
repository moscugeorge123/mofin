import axios from 'axios';
import { CurrencyRatesModel } from '../database/models/currency-rates';

const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/RON';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface CurrencyRates {
  USD_RON: number;
  EUR_RON: number;
  JPY_RON: number;
  lastUpdated: string;
}

let currentRates: CurrencyRates | null = null;

export function getCurrencyRates(): CurrencyRates | null {
  return currentRates;
}

/**
 * Checks if the currency rates need to be refreshed (24 hours have passed)
 */
function shouldRefreshRates(lastUpdated: Date): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - lastUpdated.getTime();
  return timeDiff >= REFRESH_INTERVAL_MS;
}

/**
 * Fetches fresh currency rates from the API and saves them to the database
 */
async function fetchAndSaveRates(): Promise<void> {
  console.log('🔄 Fetching fresh currency rates from API...');

  const response = await axios.get<{
    result: string;
    time_last_update_utc: string;
    rates: Record<string, number>;
  }>(EXCHANGE_API_URL);

  const { rates, time_last_update_utc } = response.data;

  // The base is RON, so rates[X] = how much X you get per 1 RON.
  // To get X/RON (price of 1 X in RON), we invert: 1 / rates[X].
  const newRates = {
    USD_RON: parseFloat((1 / rates['USD']).toFixed(4)),
    EUR_RON: parseFloat((1 / rates['EUR']).toFixed(4)),
    JPY_RON: parseFloat((1 / rates['JPY']).toFixed(4)),
    lastUpdated: new Date(time_last_update_utc),
  };

  // Save to database (delete all existing rates and insert the new one)
  await CurrencyRatesModel.deleteMany({});
  await CurrencyRatesModel.create(newRates);

  // Update in-memory cache
  currentRates = {
    ...newRates,
    lastUpdated: time_last_update_utc,
  };

  console.log(
    `💱 Currency rates fetched and saved (${time_last_update_utc}): ` +
      `1 USD = ${newRates.USD_RON} RON | ` +
      `1 EUR = ${newRates.EUR_RON} RON | ` +
      `1 JPY = ${newRates.JPY_RON} RON`,
  );
}

/**
 * Main function to fetch currency rates
 * - Checks database for existing rates
 * - If no rates exist or 24 hours have passed, fetches new rates
 * - Otherwise, loads rates from database into memory
 */
export async function fetchCurrencyRates(): Promise<void> {
  try {
    // Try to get the latest rates from the database
    const latestRates = await CurrencyRatesModel.findOne().sort({
      lastUpdated: -1,
    });

    if (!latestRates) {
      // No rates in database, fetch fresh rates
      console.log(
        '📊 No currency rates found in database, fetching fresh rates...',
      );
      await fetchAndSaveRates();
      return;
    }

    // Check if rates are stale (older than 24 hours)
    if (shouldRefreshRates(latestRates.lastUpdated)) {
      console.log('⏰ Currency rates are older than 24 hours, refreshing...');
      await fetchAndSaveRates();
      return;
    }

    // Rates are fresh, use them from database
    currentRates = {
      USD_RON: latestRates.USD_RON,
      EUR_RON: latestRates.EUR_RON,
      JPY_RON: latestRates.JPY_RON,
      lastUpdated: latestRates.lastUpdated.toISOString(),
    };

    console.log(
      `💱 Currency rates loaded from database (${currentRates.lastUpdated}): ` +
        `1 USD = ${currentRates.USD_RON} RON | ` +
        `1 EUR = ${currentRates.EUR_RON} RON | ` +
        `1 JPY = ${currentRates.JPY_RON} RON`,
    );
  } catch (error) {
    console.error('❌ Error loading currency rates:', error);
    throw error;
  }
}
