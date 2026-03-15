# Transaction Page & API Integration

This document describes the React Query integration for the transactions feature.

## What Was Implemented

### 1. **React Query Setup**

- Installed `@tanstack/react-query`
- Configured `QueryClient` with default options in [\_\_root.tsx](apps/web/src/routes/__root.tsx)
- Set up `QueryClientProvider` to wrap the entire application

### 2. **API Client with Token Management**

Created [api-client.ts](apps/web/src/lib/api-client.ts) with:

- Centralized HTTP client using `fetch` API
- Automatic Bearer token injection for authenticated requests
- Token persistence in `localStorage`
- Methods: `get()`, `post()`, `put()`, `delete()`
- Error handling for failed requests

### 3. **Type Definitions**

Created [transaction.ts](apps/web/src/types/transaction.ts) with TypeScript interfaces:

- `Transaction` - Main transaction type matching the API model
- `TransactionAmount` - Amount with sum and currency
- `BankAccount`, `Tag`, `Category` - Related entities
- `TransactionsQueryParams` - Query filter parameters

### 4. **Transaction Service**

Created [transactions.service.ts](apps/web/src/services/transactions.service.ts) with API methods:

- `getAll()` - Fetch all transactions with optional filters
- `getById()` - Fetch single transaction
- `create()` - Create new transaction
- `update()` - Update existing transaction
- `delete()` - Delete transaction
- `addTag()`, `removeTag()` - Tag management

### 5. **React Query Hooks**

Created [use-transactions.ts](apps/web/src/hooks/use-transactions.ts) with:

- `useTransactions()` - Query hook for fetching transactions list
- `useTransaction(id)` - Query hook for single transaction
- `useCreateTransaction()` - Mutation hook for creating
- `useUpdateTransaction()` - Mutation hook for updating
- `useDeleteTransaction()` - Mutation hook for deleting
- `useAddTransactionTag()`, `useRemoveTransactionTag()` - Tag mutations
- Automatic cache invalidation on mutations

### 6. **Updated Transactions Page**

Modified [transactions.tsx](apps/web/src/routes/transactions.tsx):

- Replaced mock data with real API calls using `useTransactions()` hook
- Added loading state display
- Added error handling with user-friendly messages
- Added empty state for when no transactions exist
- Properly typed all data with TypeScript
- Handles populated and unpopulated category/tag fields

### 7. **Authentication Service**

Created [auth.service.ts](apps/web/src/services/auth.service.ts) for:

- `login()` - Authenticate and store token
- `logout()` - Clear token
- `getToken()` - Retrieve current token
- `isAuthenticated()` - Check auth status

## Configuration

### Environment Variables

Created [.env.example](apps/web/.env.example) with:

```env
VITE_API_URL=http://localhost:3001
```

**To use:**

1. Copy `.env.example` to `.env`
2. Update `VITE_API_URL` if the API runs on a different port

## How Token Management Works

1. **Login Flow:**
   - User calls `authService.login(email, password)`
   - Token is received and stored via `apiClient.setToken()`
   - Token is persisted to `localStorage`

2. **Authenticated Requests:**
   - All API calls automatically include `Authorization: Bearer {token}` header
   - Token is read from memory (or `localStorage` on page load)

3. **Logout:**
   - Call `authService.logout()` to clear token
   - Removes from both memory and `localStorage`

## Usage Examples

### Fetching Transactions

```tsx
import { useTransactions } from "../hooks/use-transactions"

function MyComponent() {
  const { data, isLoading, error } = useTransactions()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>{data.length} transactions</div>
}
```

### Filtering Transactions

```tsx
const { data } = useTransactions({
  accountId: "123",
  status: "Booked",
  startDate: "2026-01-01",
  endDate: "2026-12-31"
})
```

### Creating a Transaction

```tsx
const createMutation = useCreateTransaction()

const handleCreate = () => {
  createMutation.mutate({
    accountId: "123",
    amount: { sum: -50, currency: "USD" },
    store: "Coffee Shop",
    status: "Booked",
    creditDebitIndicator: "Debit",
    state: "sent",
  })
}
```

### Setting the Auth Token

```tsx
import { authService } from "../services/auth.service"

// After login
const response = await authService.login("user@example.com", "password")
// Token is automatically set and stored

// Check if authenticated
if (authService.isAuthenticated()) {
  // User is logged in
}
```

## API Endpoints Used

All endpoints require authentication (Bearer token):

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/:id/tags` - Add tag
- `DELETE /api/transactions/:id/tags` - Remove tag

## Next Steps

To fully integrate authentication:

1. Create a login page that uses `authService.login()`
2. Add a logout button that calls `authService.logout()`
3. Implement route protection for authenticated pages
4. Add token refresh logic if needed
5. Handle 401/403 errors to redirect to login

## Files Created/Modified

**Created:**

- `apps/web/src/lib/api-client.ts`
- `apps/web/src/types/transaction.ts`
- `apps/web/src/services/transactions.service.ts`
- `apps/web/src/services/auth.service.ts`
- `apps/web/src/hooks/use-transactions.ts`
- `apps/web/.env.example`

**Modified:**

- `apps/web/src/routes/__root.tsx` - Added QueryClientProvider
- `apps/web/src/routes/transactions.tsx` - Use React Query instead of mock data
- `apps/web/package.json` - Added @tanstack/react-query dependency
