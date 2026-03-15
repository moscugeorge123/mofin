# ChatGPT Receipt Extraction Service

A Node.js service that uses OpenAI's GPT-4o Vision API to automatically extract structured data from receipt images and PDFs.

## Features

- 📸 Extract receipt details from images (JPEG, PNG, WEBP)
- 📄 Extract receipt details from PDF files
- 🤖 Powered by GPT-4o Vision (ChatGPT)
- ✅ Structured JSON output with validation
- 🛡️ Error handling and data validation
- 🔐 Authentication required for API endpoints

## Installation

### 1. Install Dependencies

```bash
npm install openai
```

### 2. Set up Environment Variables

Add your OpenAI API key to `.env`:

```env
OPENAI_API_KEY=sk-your-api-key-here
```

Get your API key from: https://platform.openai.com/api-keys

## API Endpoints

### Extract Receipt

**Endpoint:** `POST /api/receipt-extraction/extract`

**Authentication:** Required (Bearer token)

**Content-Type:** `multipart/form-data`

**Request:**

- Body: Form data with file field named `receipt`
- File types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- Max file size: 10MB

**Response:**

```json
{
  "success": true,
  "message": "Receipt extracted successfully",
  "data": {
    "price": 125.5,
    "store": "Kaufland",
    "location": "București, Strada Aviatorilor 23",
    "date": "2025-01-28",
    "products": [
      {
        "name": "Lapte 3.5%",
        "price": 12.99,
        "quantity": 2,
        "quantityType": "PCS",
        "discount": 1.5
      },
      {
        "name": "Paine alba",
        "price": 4.5,
        "quantity": 1,
        "quantityType": "BUC"
      }
    ]
  }
}
```

### Test Connection

**Endpoint:** `GET /api/receipt-extraction/test-connection`

**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "success": true,
  "message": "Successfully connected to OpenAI API"
}
```

## Usage Examples

### Using cURL

```bash
# Test connection
curl -X GET http://localhost:3020/api/receipt-extraction/test-connection \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Extract receipt
curl -X POST http://localhost:3020/api/receipt-extraction/extract \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "receipt=@/path/to/receipt.jpg"
```

### Using Postman

1. **Test Connection:**
   - Method: GET
   - URL: `http://localhost:3020/api/receipt-extraction/test-connection`
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

2. **Extract Receipt:**
   - Method: POST
   - URL: `http://localhost:3020/api/receipt-extraction/extract`
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`
   - Body:
     - Type: `form-data`
     - Key: `receipt` (set type to File)
     - Value: Select your receipt image/PDF

### Using JavaScript/TypeScript

```typescript
import { chatGPTReceiptService } from './services/chatgpt-receipt.service';
import fs from 'fs';

async function extractReceipt() {
  // Read file
  const fileBuffer = fs.readFileSync('./receipt.jpg');
  const mimeType = 'image/jpeg';

  // Extract details
  const receiptData = await chatGPTReceiptService.extractReceiptDetails(
    fileBuffer,
    mimeType,
  );

  console.log('Receipt Data:', receiptData);
  console.log(`Total: ${receiptData.price}`);
  console.log(`Store: ${receiptData.store}`);
  console.log(`Products: ${receiptData.products.length}`);
}

extractReceipt();
```

### In Express Routes

```typescript
import { upload } from './middlewares/multer';
import { chatGPTReceiptService } from './services/chatgpt-receipt.service';

router.post('/upload-receipt', upload.single('receipt'), async (req, res) => {
  try {
    const receiptData = await chatGPTReceiptService.extractReceiptDetails(
      req.file.buffer,
      req.file.mimetype,
    );

    res.json({ success: true, data: receiptData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Data Structure

### Receipt Data

| Field      | Type   | Description                          |
| ---------- | ------ | ------------------------------------ |
| `price`    | number | Total amount paid                    |
| `store`    | string | Store name                           |
| `location` | string | Store location/address               |
| `date`     | string | Transaction date (YYYY-MM-DD format) |
| `products` | array  | Array of product objects             |

### Product Data

| Field          | Type   | Required | Description                      |
| -------------- | ------ | -------- | -------------------------------- |
| `name`         | string | Yes      | Product name                     |
| `price`        | number | Yes      | Price paid for this product      |
| `quantity`     | number | Yes      | Quantity purchased               |
| `quantityType` | string | Yes      | Unit of measurement              |
| `discount`     | number | No       | Discount amount (not percentage) |

### Quantity Types

The service recognizes and normalizes these quantity types:

- `KG` - Kilograms
- `G` - Grams
- `L` - Liters
- `ML` - Milliliters
- `PCS` - Pieces/Items
- `BUC` - Bucata (Romanian for piece)
- `UNIT` - Unit
- `BOX` - Box
- `PACK` - Pack

## Service Architecture

### Files Created

```
src/
├── services/
│   ├── chatgpt-receipt.service.ts       # Main service class
│   └── chatgpt-receipt-example.ts       # Usage examples
├── controllers/
│   └── receipt-extraction.controller.ts  # API controller
└── routes/
    └── receipt-extraction.routes.ts      # API routes
```

### Service Methods

#### `extractReceiptDetails(fileBuffer, mimeType)`

Main method to extract receipt details.

**Parameters:**

- `fileBuffer`: Buffer - The file buffer (image or PDF)
- `mimeType`: string - MIME type of the file

**Returns:** `Promise<ReceiptData>`

**Throws:** Error if extraction fails or validation fails

#### `testConnection()`

Tests the connection to OpenAI API.

**Returns:** `Promise<boolean>` - True if connected successfully

## Error Handling

The service includes comprehensive error handling:

### Validation Errors (400)

- No file uploaded
- Invalid file type
- File too large (> 10MB)
- Invalid JSON structure from ChatGPT
- Missing required fields
- Invalid data types

### Server Errors (500)

- OpenAI API connection issues
- ChatGPT response parsing failures
- Service initialization errors

## Configuration

### Environment Variables

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Adjust these in the service if needed
# OPENAI_MODEL=gpt-4o (default)
# OPENAI_MAX_TOKENS=2000 (default)
# OPENAI_TEMPERATURE=0.1 (default)
```

### Service Configuration

You can modify these parameters in `chatgpt-receipt.service.ts`:

```typescript
// In extractReceiptDetails method
const response = await this.openai.chat.completions.create({
  model: 'gpt-4o', // Change model if needed
  max_tokens: 2000, // Adjust for longer receipts
  temperature: 0.1, // Lower = more consistent
});
```

## Testing

### Run Example Script

```bash
# Make sure you have a sample receipt at public/sample-receipt.jpg
npx ts-node src/services/chatgpt-receipt-example.ts
```

### Test via API

1. Start the server: `npm start`
2. Test connection: `GET /api/receipt-extraction/test-connection`
3. Upload a receipt: `POST /api/receipt-extraction/extract`

## Cost Considerations

### OpenAI API Pricing (as of 2024)

GPT-4o Vision:

- Input: ~$2.50 per 1M tokens
- Output: ~$10 per 1M tokens
- Images: Additional cost based on resolution

**Estimated cost per receipt:** ~$0.01 - $0.05 depending on image size and complexity

### Optimization Tips

1. Compress images before sending (reduce file size)
2. Use lower resolution images when possible
3. Consider caching results for duplicate receipts
4. Implement rate limiting for API calls

## Troubleshooting

### "OPENAI_API_KEY is not set"

Make sure your `.env` file contains:

```env
OPENAI_API_KEY=sk-...
```

### "Invalid JSON response from ChatGPT"

The service attempts to clean markdown code blocks, but if issues persist:

1. Check the raw response in logs
2. Adjust the prompt in `buildPrompt()` method
3. Lower the `temperature` parameter for more consistent outputs

### "Failed to connect to OpenAI API"

1. Verify your API key is valid
2. Check your internet connection
3. Verify you have credits in your OpenAI account
4. Check OpenAI API status: https://status.openai.com/

### Poor Extraction Quality

1. Ensure image quality is good (not blurry)
2. Image should be well-lit and text should be readable
3. Try adjusting the prompt in `buildPrompt()` method
4. Consider using higher resolution images

## Integration with Existing Receipt Model

To save extracted data to your Receipt model:

```typescript
import Receipt from '../database/models/receipt';
import Product from '../database/models/product';
import ReceiptProduct from '../database/models/receipt-product';
import Transaction from '../database/models/transaction';

async function saveExtractedReceipt(
  receiptData: any,
  userId: string,
  transactionId?: string,
) {
  // Create or find products
  const productIds = [];

  for (const prod of receiptData.products) {
    let product = await Product.findOne({ name: prod.name });

    if (!product) {
      product = await Product.create({
        name: prod.name,
        createdBy: userId,
      });
    }

    productIds.push({
      productId: product._id,
      details: prod,
    });
  }

  // Create receipt
  const receipt = await Receipt.create({
    user: userId,
    transaction: transactionId,
    store: receiptData.store,
    location: receiptData.location,
    date: new Date(receiptData.date),
    totalAmount: receiptData.price,
  });

  // Create receipt-product links
  for (const { productId, details } of productIds) {
    await ReceiptProduct.create({
      receipt: receipt._id,
      product: productId,
      quantity: details.quantity,
      quantityType: details.quantityType,
      pricePerUnit: details.price / details.quantity,
      totalPrice: details.price,
      discount: details.discount || 0,
    });
  }

  return receipt;
}
```

## Advanced Usage

### Custom Prompts

Modify the `buildPrompt()` method to customize extraction behavior:

```typescript
private buildPrompt(): string {
  return `
    YOUR CUSTOM INSTRUCTIONS HERE

    Focus on extracting:
    - Store loyalty program information
    - Payment method
    - Cashier ID
    - etc.
  `;
}
```

### Multiple Languages

The service works with receipts in any language supported by GPT-4o:

- English
- Romanian
- Spanish
- French
- German
- And many more...

### Batch Processing

```typescript
async function processBatch(files: Buffer[]) {
  const results = [];

  for (const fileBuffer of files) {
    try {
      const data = await chatGPTReceiptService.extractReceiptDetails(
        fileBuffer,
        'image/jpeg',
      );
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}
```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review OpenAI API documentation: https://platform.openai.com/docs
3. Check service logs for detailed error messages

## License

This service is part of the accounting-be application.
