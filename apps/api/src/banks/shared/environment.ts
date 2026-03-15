export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  BANK_API_URL: string;
  BANK_API_KEY: string;
}
