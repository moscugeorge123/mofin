# ChatGPT Receipt Service - Quick Reference

## 🚀 Quick Start

1. **Install package:**

   ```bash
   npm install openai
   ```

2. **Add API key to .env:**

   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```

3. **Get API key from:** https://platform.openai.com/api-keys

## 📡 API Endpoints

### Test Connection

```bash
GET /api/receipt-extraction/test-connection
Authorization: Bearer {token}
```

### Extract Receipt

```bash
POST /api/receipt-extraction/extract
Authorization: Bearer {token}
Content-Type: multipart/form-data
Body: receipt=<file>
```

## 💻 Code Usage

### Basic Usage

```typescript
import { chatGPTReceiptService } from './services/chatgpt-receipt.service';

const receiptData = await chatGPTReceiptService.extractReceiptDetails(
  fileBuffer,
  'image/jpeg',
);
```

### In Express Route

```typescript
router.post('/upload', upload.single('receipt'), async (req, res) => {
  const data = await chatGPTReceiptService.extractReceiptDetails(
    req.file.buffer,
    req.file.mimetype,
  );
  res.json(data);
});
```

## 📋 Response Format

```json
{
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
    }
  ]
}
```

## 🏷️ Quantity Types

- `KG` - Kilograms
- `G` - Grams
- `L` - Liters
- `ML` - Milliliters
- `PCS` - Pieces
- `BUC` - Bucata
- `UNIT` - Unit
- `BOX` - Box
- `PACK` - Pack

## ✅ Supported File Types

- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/webp` (.webp)
- `application/pdf` (.pdf)

**Max size:** 10MB

## 💰 Cost

~$0.01 - $0.05 per receipt extraction

## 🔧 Troubleshooting

### API Key Error

```
✗ OPENAI_API_KEY is not set
```

**Fix:** Add `OPENAI_API_KEY=sk-...` to `.env` file

### Connection Failed

```
✗ Failed to connect to OpenAI API
```

**Fix:**

1. Check API key validity
2. Verify account has credits
3. Check internet connection

### Invalid JSON Response

```
✗ Invalid JSON response from ChatGPT
```

**Fix:**

1. Check image quality
2. Ensure receipt is readable
3. Try with different image

## 📁 Files Created

```
src/
├── services/
│   ├── chatgpt-receipt.service.ts
│   └── chatgpt-receipt-example.ts
├── controllers/
│   └── receipt-extraction.controller.ts
└── routes/
    └── receipt-extraction.routes.ts
```

## 🧪 Testing

```bash
# Using cURL
curl -X POST http://localhost:3020/api/receipt-extraction/extract \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "receipt=@receipt.jpg"

# Using Node
npx ts-node src/services/chatgpt-receipt-example.ts
```

## 📚 Full Documentation

See [CHATGPT_RECEIPT_SERVICE.md](./CHATGPT_RECEIPT_SERVICE.md) for complete documentation.
