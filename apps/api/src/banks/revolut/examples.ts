import { revolutAccountsService } from './revolut-accounts.service';

/**
 * Example: Complete flow to get account and transaction information
 */

async function example1_CompleteFlow() {
  console.log('=== Example 1: Complete Account Access Flow ===\n');

  try {
    // Step 1 & 2 & 3 & 4: Initiate the account access flow
    const { consentId, authorizationUrl } =
      await revolutAccountsService.initiateAccountAccessFlow(
        [
          'ReadAccountsBasic',
          'ReadAccountsDetail',
          'ReadTransactionsBasic',
          'ReadTransactionsDetail',
          'ReadBalances',
        ],
        'https://your-app.com/callback', // Your redirect URI
        './certs/signing.key', // Path to signing key
        '2026-12-31T23:59:59+00:00', // Optional: consent expiration
        '2025-01-01T00:00:00+00:00', // Optional: transaction from date
        '2026-12-31T23:59:59+00:00', // Optional: transaction to date
      );

    console.log('Consent ID:', consentId);
    console.log('Authorization URL:', authorizationUrl);
    console.log(
      '\nRedirect the user to this URL to authorize the consent...\n',
    );

    // User authorizes and you get the authorization code from the redirect
    // const authCode = 'oa_sand_sPoyVs-oMhyR36j5N-ZEVLfK9rQWPNssgIQqsOFZQ-c';

    // Step 5 & 6: Exchange code for token and get accounts
    // const result = await revolutAccountsService.completeAuthorizationAndGetAccounts(authCode);
    // console.log('Token Data:', result.tokenData);
    // console.log('Accounts:', result.accounts);
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Step-by-step manual flow
 */
async function example2_StepByStep() {
  console.log('=== Example 2: Step-by-Step Flow ===\n');

  try {
    // Step 1: Get client credentials token
    console.log('Step 1: Getting client credentials token...');
    const clientToken =
      await revolutAccountsService.getClientCredentialsToken();
    console.log('Client Token:', clientToken.substring(0, 20) + '...\n');

    // Step 2: Create account access consent
    console.log('Step 2: Creating account access consent...');
    const consent = await revolutAccountsService.createAccountAccessConsent(
      clientToken,
      {
        permissions: [
          'ReadAccountsBasic',
          'ReadAccountsDetail',
          'ReadTransactionsBasic',
          'ReadTransactionsDetail',
        ],
        expirationDateTime: '2026-12-31T23:59:59+00:00',
      },
    );
    console.log('Consent ID:', consent.Data.ConsentId);
    console.log('Consent Status:', consent.Data.Status, '\n');

    // Step 3: Create JWT parameter
    console.log('Step 3: Creating JWT parameter...');
    const jwtParameter = revolutAccountsService.createJWTParameter(
      consent.Data.ConsentId,
      'https://your-app.com/callback',
      'example_state',
      './certs/signing.key',
    );
    console.log('JWT Parameter created\n');

    // Step 4: Generate authorization URL
    console.log('Step 4: Generating authorization URL...');
    const authUrl = revolutAccountsService.generateAuthorizationUrl(
      jwtParameter,
      'https://your-app.com/callback',
      'fragment',
    );
    console.log('Authorization URL:', authUrl, '\n');

    // User visits the URL and authorizes...
    // You receive the authorization code in the redirect

    // Step 5: Exchange code for token (example)
    // const authCode = 'oa_sand_sPoyVs-oMhyR36j5N-ZEVLfK9rQWPNssgIQqsOFZQ-c';
    // console.log('Step 5: Exchanging authorization code for token...');
    // const tokenData = await revolutAccountsService.exchangeCodeForToken(authCode);
    // console.log('Access Token:', tokenData.access_token.substring(0, 20) + '...');
    // console.log('Token expires in:', tokenData.expires_in, 'seconds\n');

    // Step 6: Get accounts
    // console.log('Step 6: Getting accounts...');
    // const accounts = await revolutAccountsService.getAccounts(tokenData.access_token);
    // console.log('Number of accounts:', accounts.Data.Account.length);
    // accounts.Data.Account.forEach(account => {
    //   console.log(`- ${account.Nickname || account.AccountType}: ${account.Currency}`);
    // });
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Working with accounts and transactions
 */
async function example3_AccountsAndTransactions() {
  console.log('=== Example 3: Working with Accounts and Transactions ===\n');

  // Assume you already have an access token from the authorization flow
  const accessToken = 'your_access_token_here';

  try {
    // Get all accounts
    console.log('Getting all accounts...');
    const accounts = await revolutAccountsService.getAccounts(accessToken);

    for (const account of accounts.Data.Account) {
      console.log(`\nAccount: ${account.Nickname || account.AccountType}`);
      console.log(`  ID: ${account.AccountId}`);
      console.log(`  Currency: ${account.Currency}`);

      // Get account balance
      console.log('  Getting balance...');
      const balance = await revolutAccountsService.getAccountBalance(
        accessToken,
        account.AccountId,
      );
      console.log('  Balance:', JSON.stringify(balance.Data, null, 2));

      // Get transactions for this account
      console.log('  Getting transactions...');
      const transactions = await revolutAccountsService.getTransactions(
        accessToken,
        account.AccountId,
        '2025-01-01T00:00:00+00:00',
        '2026-01-31T23:59:59+00:00',
      );

      console.log(
        `  Number of transactions: ${transactions.Data.Transaction.length}`,
      );
      if (transactions.Data.Transaction.length > 0) {
        const firstTx = transactions.Data.Transaction[0];
        console.log('  First transaction:');
        console.log(`    ${firstTx.TransactionInformation || 'N/A'}`);
        console.log(
          `    ${firstTx.CreditDebitIndicator}: ${firstTx.Amount.Amount} ${firstTx.Amount.Currency}`,
        );
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Example: Using refresh tokens
 */
async function example4_RefreshToken() {
  console.log('=== Example 4: Refresh Access Token ===\n');

  // Assume you have a refresh token from previous authorization
  const refreshToken = 'your_refresh_token_here';

  try {
    console.log('Refreshing access token...');
    const newTokenData =
      await revolutAccountsService.refreshAccessToken(refreshToken);

    console.log(
      'New access token:',
      newTokenData.access_token.substring(0, 20) + '...',
    );
    console.log('Expires in:', newTokenData.expires_in, 'seconds');

    // Use the new access token for API calls
    const accounts = await revolutAccountsService.getAccounts(
      newTokenData.access_token,
    );
    console.log('Successfully fetched accounts with new token');
    console.log('Number of accounts:', accounts.Data.Account.length);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Uncomment to run examples
// example1_CompleteFlow();
// example2_StepByStep();
// example3_AccountsAndTransactions();
// example4_RefreshToken();

export {
  example1_CompleteFlow,
  example2_StepByStep,
  example3_AccountsAndTransactions,
  example4_RefreshToken,
};
