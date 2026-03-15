# Revolut Open Banking Integration

This directory contains the implementation of Revolut's Open Banking API for account and transaction information retrieval.

## Services

### 1. `revolut-auth.service.ts`

Basic authentication service for getting client credentials tokens.

**Methods:**

- `getAccessToken()` - Get client credentials token
- `getAccessTokenWithRetry(retries)` - Get token with retry logic

### 2. `revolut-accounts.service.ts`

Complete implementation of the Revolut Open Banking account access flow.

**Key Methods:**

#### Authentication Flow

- `getClientCredentialsToken()` - Step 1: Get client credentials token
- `createAccountAccessConsent(accessToken, consentRequest)` - Step 2: Create account access consent
- `createJWTParameter(consentId, redirectUri, state, signingKey)` - Step 3: Create JWT URL parameter
- `generateAuthorizationUrl(jwtParameter, redirectUri, responseMode)` - Step 4: Generate authorization URL
- `exchangeCodeForToken(authorizationCode)` - Step 5: Exchange authorization code for access token
- `refreshAccessToken(refreshToken)` - Refresh an expired access token

#### Account & Transaction Operations

- `getAccounts(accessToken)` - Get list of user's accounts
- `getAccountById(accessToken, accountId)` - Get specific account details
- `getTransactions(accessToken, accountId, fromDate, toDate)` - Get account transactions
- `getAccountBalance(accessToken, accountId)` - Get account balance

#### Helper Methods

- `initiateAccountAccessFlow(permissions, redirectUri, ...)` - Complete flow: Steps 1-4
- `completeAuthorizationAndGetAccounts(authorizationCode)` - Complete flow: Steps 5-6

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Revolut Open Banking Configuration
REVOLUT_BASE_URL=https://sandbox-oba-auth.revolut.com
REVOLUT_TOKEN_PATH=/token
REVOLUT_TRANSPORT_PEM=./certs/transport.pem
REVOLUT_PRIVATE_KEY=./certs/private.key
REVOLUT_SIGNING_KEY=./certs/signing.key
REVOLUT_CLIENT_ID=your_client_id_here
REVOLUT_KID=your_key_id_here
```

### Certificate Setup

Place your Revolut certificates in the `certs/` directory:

1. `transport.pem` - Transport certificate for mTLS
2. `private.key` - Private key for transport certificate
3. `signing.key` - Private key for JWT signing (from signing.pem)

## Usage

### Complete Flow Example

```typescript
import { revolutAccountsService } from './banks/revolut';

async function getAccountData() {
  // Step 1-4: Initiate consent and get authorization URL
  const { consentId, authorizationUrl } =
    await revolutAccountsService.initiateAccountAccessFlow(
      ['ReadAccountsBasic', 'ReadAccountsDetail', 'ReadTransactionsBasic'],
      'https://your-app.com/callback',
      './certs/signing.key',
    );

  console.log('Redirect user to:', authorizationUrl);

  // User authorizes and you receive authorization code
  // const authCode = req.query.code; // From redirect callback

  // Step 5-6: Exchange code and get accounts
  const { tokenData, accounts } =
    await revolutAccountsService.completeAuthorizationAndGetAccounts(authCode);

  console.log('Accounts:', accounts);
  return accounts;
}
```

### Manual Step-by-Step

```typescript
// Step 1: Get client credentials token
const clientToken = await revolutAccountsService.getClientCredentialsToken();

// Step 2: Create consent
const consent = await revolutAccountsService.createAccountAccessConsent(
  clientToken,
  {
    permissions: ['ReadAccountsBasic', 'ReadAccountsDetail'],
    expirationDateTime: '2026-12-31T23:59:59+00:00',
  },
);

// Step 3: Create JWT
const jwt = revolutAccountsService.createJWTParameter(
  consent.Data.ConsentId,
  'https://your-app.com/callback',
  'state123',
  './certs/signing.key',
);

// Step 4: Generate authorization URL
const authUrl = revolutAccountsService.generateAuthorizationUrl(
  jwt,
  'https://your-app.com/callback',
  'fragment',
);

// Redirect user to authUrl...

// Step 5: Exchange authorization code
const tokenData = await revolutAccountsService.exchangeCodeForToken(authCode);

// Step 6: Get accounts
const accounts = await revolutAccountsService.getAccounts(
  tokenData.access_token,
);
```

### Working with Accounts and Transactions

```typescript
// Get all accounts
const accounts = await revolutAccountsService.getAccounts(accessToken);

// Get specific account
const account = await revolutAccountsService.getAccountById(
  accessToken,
  accountId,
);

// Get account balance
const balance = await revolutAccountsService.getAccountBalance(
  accessToken,
  accountId,
);

// Get transactions
const transactions = await revolutAccountsService.getTransactions(
  accessToken,
  accountId,
  '2025-01-01T00:00:00+00:00',
  '2026-01-31T23:59:59+00:00',
);
```

### Refresh Token Usage

```typescript
// When access token expires, refresh it
const newTokenData =
  await revolutAccountsService.refreshAccessToken(refreshToken);

// Use new access token
const accounts = await revolutAccountsService.getAccounts(
  newTokenData.access_token,
);
```

## Available Permissions

Common permissions for account access:

- `ReadAccountsBasic` - Basic account information
- `ReadAccountsDetail` - Detailed account information
- `ReadBalances` - Account balances
- `ReadTransactionsBasic` - Basic transaction information
- `ReadTransactionsDetail` - Detailed transaction information
- `ReadTransactionsCredits` - Credit transactions only
- `ReadTransactionsDebits` - Debit transactions only

## Flow Diagram

```
1. Get Client Credentials Token
   └─> Use for consent creation

2. Create Account Access Consent
   └─> Receive ConsentId

3. Create JWT Parameter
   └─> Sign with signing key

4. Generate Authorization URL
   └─> Redirect user to authorize

5. Exchange Authorization Code
   └─> Receive access token & refresh token

6. Access Account/Transaction Data
   └─> Use access token for API calls

7. Refresh Token (when needed)
   └─> Get new access token
```

## Important Notes

1. **Authorization Code**: Valid for only 2 minutes after generation
2. **Access Token**: Expires after 60 minutes (from Aug 4, 2025)
3. **Refresh Token**:
   - EU/EEA: Valid for 180 days
   - UK: Valid for 50 years
4. **Consent Expiration**: Data access ends when either token or consent expires
5. **Refreshing Tokens**: Invalidates the previous access token immediately

## Sandbox vs Production

The service automatically uses the configured base URL. For production:

```env
REVOLUT_BASE_URL=https://oba-auth.revolut.com
```

## Error Handling

All methods throw errors with descriptive messages. Wrap calls in try-catch:

```typescript
try {
  const accounts = await revolutAccountsService.getAccounts(accessToken);
} catch (error) {
  console.error('Failed to get accounts:', error.message);
  // Handle error appropriately
}
```

## References

- [Revolut Open Banking Documentation](https://developer.revolut.com/docs/guides/build-banking-apps/tutorials/get-account-and-transaction-information)
- [Open Banking API Reference](https://developer.revolut.com/docs/open-banking/open-banking-api)
