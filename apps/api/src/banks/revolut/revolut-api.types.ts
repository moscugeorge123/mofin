// Interfaces for API responses
export interface ConsentResponse {
  Data: {
    ConsentId: string;
    Status: string;
    StatusUpdateDateTime: string;
    CreationDateTime: string;
    Permissions: string[];
    ExpirationDateTime?: string;
    TransactionFromDateTime?: string;
    TransactionToDateTime?: string;
  };
  Risk: Record<string, unknown>;
  Links: {
    Self: string;
  };
  Meta: {
    TotalPages: number;
  };
}

export interface AccessTokenResponse {
  access_token: string;
  access_token_id?: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  refresh_token_expires_at?: number;
}

export interface Account {
  AccountId: string;
  Currency: string;
  AccountType: string;
  AccountSubType: string;
  Nickname?: string;
  Account: Array<{
    SchemeName: string;
    Identification: string;
    Name: string;
    SecondaryIdentification?: string;
  }>;
}

export interface AccountsResponse {
  Data: {
    Account: Account[];
  };
  Links: {
    Self: string;
  };
  Meta: {
    TotalPages: number;
  };
}

export interface Transaction {
  AccountId: string;
  TransactionId: string;
  TransactionReference?: string;
  Amount: {
    Amount: string;
    Currency: string;
  };
  CreditDebitIndicator: 'Credit' | 'Debit';
  Status: string;
  BookingDateTime: string;
  ValueDateTime?: string;
  TransactionInformation?: string;
  BankTransactionCode?: {
    Code: string;
    SubCode: string;
  };
}

export interface TransactionsResponse {
  Data: {
    Transaction: Transaction[];
  };
  Links: {
    Self: string;
    First?: string;
    Last?: string;
    Next?: string;
    Prev?: string;
  };
  Meta: {
    TotalPages: number;
    FirstAvailableDateTime?: string;
    LastAvailableDateTime?: string;
  };
}

export interface ConsentRequest {
  permissions: string[];
  expirationDateTime?: string;
  transactionFromDateTime?: string;
  transactionToDateTime?: string;
}

export interface JWTPayload {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  aud: string;
  scope: string;
  state?: string;
  nbf: number;
  exp: number;
  claims: {
    id_token: {
      openbanking_intent_id: {
        value: string;
      };
    };
  };
}
