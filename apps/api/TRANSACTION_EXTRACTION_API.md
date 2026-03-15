# Transaction Extraction API

## Overview

This API endpoint allows users to upload PDF or CSV files containing bank statements or transaction data. The system uses ChatGPT to automatically extract transactions from the files and save them to the database.

## Endpoint

**POST** `/api/transactions/extract`

### Authentication

Requires JWT authentication token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Request

**Content-Type:** `multipart/form-data`

**Parameters:**

- `file` (required): The file to upload (PDF or CSV)
- `accountId` (required): The bank account ID where transactions should be linked

**Example using cURL:**

```bash
curl -X POST http://localhost:3000/api/transactions/extract \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/statement.pdf" \
  -F "accountId=YOUR_ACCOUNT_ID"
```

**Example using JavaScript/Fetch:**

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('accountId', 'your-account-id');

const response = await fetch('http://localhost:3000/api/transactions/extract', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const result = await response.json();
console.log(result);
```

### Response

**Success (201 Created):**

```json
{
  "message": "Transactions extracted and saved successfully",
  "file": {
    "id": "file_id_here",
    "originalName": "bank_statement.pdf",
    "status": "completed"
  },
  "transactions": [
    {
      "_id": "transaction_id_1",
      "userId": "user_id",
      "accountId": "account_id",
      "amount": {
        "sum": 150.5,
        "currency": "USD"
      },
      "notes": "Purchase at Store",
      "state": "sent",
      "location": "New York, NY",
      "store": "Amazon",
      "creditDebitIndicator": "Debit",
      "status": "Booked",
      "date": "2024-03-15T00:00:00.000Z",
      "tags": [],
      "createdAt": "2024-03-15T10:30:00.000Z",
      "updatedAt": "2024-03-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Error Responses:**

- **400 Bad Request** - No file uploaded or invalid file type
- **403 Forbidden** - No access to the specified account
- **500 Internal Server Error** - Failed to extract transactions

## How It Works

1. **File Upload**: User uploads a PDF or CSV file containing transaction data
2. **File Storage**: The file is saved to the `uploads/` directory with a unique filename
3. **Record Creation**: A `TransactionFile` record is created in the database with status "pending"
4. **ChatGPT Processing**:
   - For CSV files: Content is read and sent directly to ChatGPT
   - For PDF files: File is uploaded to OpenAI and processed using GPT-4o with file search
5. **Transaction Extraction**: ChatGPT analyzes the file and extracts all transactions in JSON format
6. **Database Insertion**: Each extracted transaction is saved to the `transactions` collection
7. **Status Update**: The `TransactionFile` record is updated with status "completed" and linked transaction IDs
8. **Response**: All inserted transactions are returned to the client

## Supported File Types

- **PDF**: Bank statements, account statements
- **CSV**: Transaction exports from banking systems

## Transaction Fields Extracted

The ChatGPT service extracts the following information from each transaction:

### Required Fields:

- `amount.sum` - Transaction amount (positive number)
- `amount.currency` - Currency code (USD, EUR, RON, etc.)
- `creditDebitIndicator` - "Credit" or "Debit"
- `state` - "received" (for credits) or "sent" (for debits)
- `status` - "Booked" or "Pending"
- `date` - Transaction date (YYYY-MM-DD format)

### Optional Fields:

- `store` - Merchant/store name
- `location` - Transaction location
- `notes` - Additional description or reference

## Data Models

### TransactionFile Model

Tracks uploaded files and their processing status:

```typescript
{
  userId: ObjectId,
  filePath: string,
  originalName: string,
  mimeType: string,
  fileSize: number,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  errorMessage?: string,
  transactions: [ObjectId],
  extractedData?: any,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Configuration

Ensure the following environment variable is set in your `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## Error Handling

If extraction fails:

- The `TransactionFile` record will have status "failed"
- The error message will be stored in the `errorMessage` field
- No transactions will be inserted
- The uploaded file will remain in the `uploads/` directory for debugging

## Notes

- Multiple transactions can be extracted from a single file
- A single day can have multiple transactions - each is extracted separately
- The system automatically determines whether a transaction is income or expense based on the credit/debit indicator
- All amounts are stored as positive numbers; the direction is indicated by `creditDebitIndicator`
