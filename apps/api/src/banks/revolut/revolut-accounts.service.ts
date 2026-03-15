import axios, { AxiosInstance } from 'axios';
import fs from 'fs';
import https from 'https';
import jwt from 'jsonwebtoken';
import { revolutConfig } from './revolut.config';
import {
  AccessTokenResponse,
  Account,
  AccountsResponse,
  ConsentRequest,
  ConsentResponse,
  JWTPayload,
  TransactionsResponse,
} from './revolut.types';

export class RevolutAccountsService {
  private axiosInstance: AxiosInstance;
  private financialId: string = '001580000103UAvAAM'; // Sandbox financial ID

  constructor() {
    // Load certificates from file system
    const cert = fs.readFileSync(revolutConfig.transportPemPath);
    const key = fs.readFileSync(revolutConfig.privateKeyPath);

    // Create HTTPS agent with client certificates
    const httpsAgent = new https.Agent({
      cert: cert,
      key: key,
      rejectUnauthorized: true,
    });

    // Initialize axios instance with base configuration
    this.axiosInstance = axios.create({
      baseURL: revolutConfig.baseUrl,
      httpsAgent: httpsAgent,
    });
  }

  /**
   * Step 1: Generate a client credentials token
   */
  async getClientCredentialsToken(): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('scope', 'accounts');
      params.append('client_id', revolutConfig.clientId);

      const response = await this.axiosInstance.post<AccessTokenResponse>(
        revolutConfig.tokenPath,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get client credentials token: ${error.response?.data?.error || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Step 2: Create an account access consent
   */
  async createAccountAccessConsent(
    accessToken: string,
    consentRequest: ConsentRequest,
  ): Promise<ConsentResponse> {
    try {
      const requestBody = {
        Data: {
          Permissions: consentRequest.permissions,
          ExpirationDateTime: consentRequest.expirationDateTime,
          TransactionFromDateTime: consentRequest.transactionFromDateTime,
          TransactionToDateTime: consentRequest.transactionToDateTime,
        },
        Risk: {},
      };

      const response = await this.axiosInstance.post<ConsentResponse>(
        '/account-access-consents',
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-fapi-financial-id': this.financialId,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to create account access consent: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Step 3: Create a JWT URL parameter
   * This requires the signing certificate's private key
   */
  createJWTParameter(
    consentId: string,
    redirectUri: string,
    state?: string,
    signingKey?: string,
  ): string {
    const now = Math.floor(Date.now() / 1000);

    const payload: JWTPayload = {
      response_type: 'code id_token',
      client_id: revolutConfig.clientId,
      redirect_uri: redirectUri,
      aud: revolutConfig.baseUrl,
      scope: 'accounts',
      state: state,
      nbf: now,
      exp: now + 3600, // Valid for 1 hour
      claims: {
        id_token: {
          openbanking_intent_id: {
            value: consentId,
          },
        },
      },
    };

    // If signing key is provided, sign the JWT
    if (signingKey) {
      const privateKey = fs.readFileSync(signingKey);
      return jwt.sign(payload, privateKey, {
        algorithm: 'PS256',
        header: {
          alg: 'PS256',
          kid: revolutConfig.kid || 'default',
        },
      });
    }

    // For testing purposes, return unsigned JWT
    // Note: This won't work in production
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  /**
   * Step 4: Generate authorization URL for user consent
   */
  generateAuthorizationUrl(
    jwtParameter: string,
    redirectUri: string,
    responseMode?: 'fragment' | 'query',
  ): string {
    const params = new URLSearchParams({
      response_type: 'code id_token',
      scope: 'accounts',
      redirect_uri: redirectUri,
      client_id: revolutConfig.clientId,
      request: jwtParameter,
    });

    if (responseMode) {
      params.append('response_mode', responseMode);
    }

    const authBaseUrl = revolutConfig.baseUrl.replace('oba-auth', 'oba');
    return `${authBaseUrl}/ui/index.html?${params.toString()}`;
  }

  /**
   * Step 5: Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    authorizationCode: string,
  ): Promise<AccessTokenResponse> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', revolutConfig.clientId);
      params.append('code', authorizationCode);

      const response = await this.axiosInstance.post<AccessTokenResponse>(
        revolutConfig.tokenPath,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to exchange code for token: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', revolutConfig.clientId);
      params.append('refresh_token', refreshToken);

      const response = await this.axiosInstance.post<AccessTokenResponse>(
        revolutConfig.tokenPath,
        params.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to refresh access token: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Step 6: Get the list of accounts
   */
  async getAccounts(accessToken: string): Promise<AccountsResponse> {
    try {
      const response = await this.axiosInstance.get<AccountsResponse>(
        '/accounts',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-fapi-financial-id': this.financialId,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get accounts: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get details of a specific account
   */
  async getAccountById(
    accessToken: string,
    accountId: string,
  ): Promise<{ Data: { Account: Account[] } }> {
    try {
      const response = await this.axiosInstance.get(`/accounts/${accountId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-fapi-financial-id': this.financialId,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get account details: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get transactions for a specific account
   */
  async getTransactions(
    accessToken: string,
    accountId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<TransactionsResponse> {
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('fromBookingDateTime', fromDate);
      if (toDate) params.append('toBookingDateTime', toDate);

      const response = await this.axiosInstance.get<TransactionsResponse>(
        `/accounts/${accountId}/transactions`,
        {
          params,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-fapi-financial-id': this.financialId,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get transactions: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get balance for a specific account
   */
  async getAccountBalance(
    accessToken: string,
    accountId: string,
  ): Promise<any> {
    try {
      const response = await this.axiosInstance.get(
        `/accounts/${accountId}/balances`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-fapi-financial-id': this.financialId,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to get account balance: ${JSON.stringify(error.response?.data) || error.message}`,
        );
      }
      throw error;
    }
  }

  /**
   * Complete flow helper: Create consent and return authorization URL
   */
  async initiateAccountAccessFlow(
    permissions: string[],
    redirectUri: string,
    signingKeyPath?: string,
    expirationDateTime?: string,
    transactionFromDateTime?: string,
    transactionToDateTime?: string,
  ): Promise<{ consentId: string; authorizationUrl: string }> {
    // Step 1: Get client credentials token
    const clientToken = await this.getClientCredentialsToken();

    // Step 2: Create consent
    const consentResponse = await this.createAccountAccessConsent(clientToken, {
      permissions,
      expirationDateTime,
      transactionFromDateTime,
      transactionToDateTime,
    });

    const consentId = consentResponse.Data.ConsentId;

    // Step 3: Create JWT parameter
    const jwtParameter = this.createJWTParameter(
      consentId,
      redirectUri,
      undefined,
      signingKeyPath,
    );

    // Step 4: Generate authorization URL
    const authorizationUrl = this.generateAuthorizationUrl(
      jwtParameter,
      redirectUri,
      'fragment',
    );

    return {
      consentId,
      authorizationUrl,
    };
  }

  /**
   * Complete flow helper: Exchange code and get accounts
   */
  async completeAuthorizationAndGetAccounts(
    authorizationCode: string,
  ): Promise<{
    tokenData: AccessTokenResponse;
    accounts: AccountsResponse;
  }> {
    // Step 5: Exchange code for token
    const tokenData = await this.exchangeCodeForToken(authorizationCode);

    // Step 6: Get accounts
    const accounts = await this.getAccounts(tokenData.access_token);

    return {
      tokenData,
      accounts,
    };
  }
}

// Export singleton instance
export const revolutAccountsService = new RevolutAccountsService();
