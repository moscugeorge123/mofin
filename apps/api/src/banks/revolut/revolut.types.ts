/**
 * Revolut Open Banking API Type Definitions
 */

// Authentication & Token Types
export interface AccessTokenResponse {
  access_token: string;
  access_token_id?: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  refresh_token_expires_at?: number;
}

export interface ClientCredentialsTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Consent Types
export interface ConsentRequest {
  permissions: string[];
  expirationDateTime?: string;
  transactionFromDateTime?: string;
  transactionToDateTime?: string;
}

export interface ConsentData {
  ConsentId: string;
  Status: 'AwaitingAuthorisation' | 'Authorised' | 'Rejected' | 'Revoked';
  StatusUpdateDateTime: string;
  CreationDateTime: string;
  Permissions: string[];
  ExpirationDateTime?: string;
  TransactionFromDateTime?: string;
  TransactionToDateTime?: string;
}

export interface ConsentResponse {
  Data: ConsentData;
  Risk: Record<string, unknown>;
  Links: {
    Self: string;
  };
  Meta: {
    TotalPages: number;
  };
}

// Account Types
export interface AccountIdentification {
  SchemeName: string;
  Identification: string;
  Name: string;
  SecondaryIdentification?: string;
}

export interface Account {
  AccountId: string;
  Currency: string;
  AccountType: 'Personal' | 'Business';
  AccountSubType: 'CurrentAccount' | 'Savings' | 'CreditCard';
  Nickname?: string;
  Account: AccountIdentification[];
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

export interface AccountDetailResponse {
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

// Balance Types
export interface Balance {
  AccountId: string;
  Amount: {
    Amount: string;
    Currency: string;
  };
  CreditDebitIndicator: 'Credit' | 'Debit';
  Type:
    | 'ClosingAvailable'
    | 'ClosingBooked'
    | 'Expected'
    | 'ForwardAvailable'
    | 'Information'
    | 'InterimAvailable'
    | 'InterimBooked'
    | 'OpeningAvailable'
    | 'OpeningBooked'
    | 'PreviouslyClosedBooked';
  DateTime: string;
  CreditLine?: Array<{
    Included: boolean;
    Amount: {
      Amount: string;
      Currency: string;
    };
    Type?: 'Available' | 'Credit' | 'Emergency' | 'Pre-Agreed' | 'Temporary';
  }>;
}

export interface BalancesResponse {
  Data: {
    Balance: Balance[];
  };
  Links: {
    Self: string;
  };
  Meta: {
    TotalPages: number;
  };
}

// Transaction Types
export interface TransactionAmount {
  Amount: string;
  Currency: string;
}

export interface BankTransactionCode {
  Code: string;
  SubCode: string;
}

export interface TransactionMerchant {
  MerchantName?: string;
  MerchantCategoryCode?: string;
}

export interface Transaction {
  AccountId: string;
  TransactionId: string;
  TransactionReference?: string;
  Amount: TransactionAmount;
  CreditDebitIndicator: 'Credit' | 'Debit';
  Status: 'Booked' | 'Pending';
  BookingDateTime: string;
  ValueDateTime?: string;
  TransactionInformation?: string;
  AddressLine?: string;
  BankTransactionCode?: BankTransactionCode;
  ProprietaryBankTransactionCode?: {
    Code: string;
    Issuer?: string;
  };
  Balance?: {
    Amount: TransactionAmount;
    CreditDebitIndicator: 'Credit' | 'Debit';
    Type: string;
  };
  MerchantDetails?: TransactionMerchant;
  CreditorAgent?: {
    SchemeName?: string;
    Identification?: string;
  };
  CreditorAccount?: {
    SchemeName: string;
    Identification: string;
    Name?: string;
  };
  DebtorAgent?: {
    SchemeName?: string;
    Identification?: string;
  };
  DebtorAccount?: {
    SchemeName: string;
    Identification: string;
    Name?: string;
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

// JWT Types
export interface JWTHeader {
  alg: 'PS256' | 'RS256';
  kid: string;
  typ?: 'JWT';
}

export interface JWTPayload {
  response_type: 'code id_token';
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
        essential?: boolean;
      };
      acr?: {
        essential?: boolean;
        values?: string[];
      };
    };
    userinfo?: {
      openbanking_intent_id?: {
        value: string;
        essential?: boolean;
      };
    };
  };
  nonce?: string;
  max_age?: number;
}

// Permission Types
export type AccountPermission =
  | 'ReadAccountsBasic'
  | 'ReadAccountsDetail'
  | 'ReadBalances'
  | 'ReadBeneficiariesBasic'
  | 'ReadBeneficiariesDetail'
  | 'ReadDirectDebits'
  | 'ReadStandingOrdersBasic'
  | 'ReadStandingOrdersDetail'
  | 'ReadTransactionsBasic'
  | 'ReadTransactionsDetail'
  | 'ReadTransactionsCredits'
  | 'ReadTransactionsDebits'
  | 'ReadProducts'
  | 'ReadOffers'
  | 'ReadParty'
  | 'ReadPartyPSU'
  | 'ReadScheduledPaymentsBasic'
  | 'ReadScheduledPaymentsDetail'
  | 'ReadStatementsBasic'
  | 'ReadStatementsDetail';

// Error Types
export interface RevolutAPIError {
  error: string;
  error_description?: string;
  error_code?: string;
}

// Config Types
export interface RevolutConfig {
  baseUrl: string;
  tokenPath: string;
  transportPemPath: string;
  privateKeyPath: string;
  signingKeyPath: string;
  clientId: string;
  kid?: string;
}

// Authorization Types
export interface AuthorizationUrlParams {
  response_type: 'code id_token';
  scope: string;
  redirect_uri: string;
  client_id: string;
  request: string;
  response_mode?: 'fragment' | 'query';
  nonce?: string;
  state?: string;
}

export interface AuthorizationCallbackParams {
  code: string;
  id_token: string;
  state?: string;
}
