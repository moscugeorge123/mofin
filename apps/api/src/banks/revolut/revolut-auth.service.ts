import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import https from 'https';
import { revolutConfig } from './revolut.config';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export class RevolutAuthService {
  private axiosInstance: AxiosInstance;

  constructor() {
    // Load certificates from file system
    const cert = fs.readFileSync(revolutConfig.transportPemPath);
    const key = fs.readFileSync(revolutConfig.privateKeyPath);

    // Create HTTPS agent with client certificates
    const httpsAgent = new https.Agent({
      cert,
      key,
      rejectUnauthorized: true,
    });

    // Initialize axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: revolutConfig.baseUrl,
      httpsAgent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  /**
   * Get access token from Revolut Open Banking API
   * @returns Promise with token response
   */
  async getAccessToken(): Promise<TokenResponse> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('scope', 'accounts');
      params.append('client_id', revolutConfig.clientId);

      const response = await this.axiosInstance.post<TokenResponse>(
        revolutConfig.tokenPath,
        params.toString(),
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get access token: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get access token with automatic retry logic
   * @param retries Number of retry attempts
   * @returns Promise with token response
   */
  async getAccessTokenWithRetry(retries: number = 3): Promise<TokenResponse> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.getAccessToken();
      } catch (error) {
        lastError = error as Error;
        console.error(`Token request attempt ${attempt} failed:`, error);

        if (attempt < retries) {
          // Wait before retrying (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw new Error(
      `Failed to get access token after ${retries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Utility function to delay execution
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const revolutAuthService = new RevolutAuthService();
