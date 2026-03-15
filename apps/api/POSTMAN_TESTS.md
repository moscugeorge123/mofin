# Postman Test Collection - Accounting API

This Postman collection provides complete CRUD testing for the Accounting API with automated bulk data insertion.

## 📋 What's Included

### Entities with Bulk Insert

- **Tags**: 50 records
- **Categories**: 50 records with automation rules
- **Products**: 50 records with barcodes
- **Bank Accounts**: 50 records
- **Transactions**: 100 records
- **Receipts**: 50 records
- **Receipt Products**: 50 records

### Total Records: **400+ test records**

## 🚀 How to Use

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select `postman-collection.json`
4. The collection will appear in your Collections sidebar

### 2. Run the Full Test Suite

#### Option A: Using Collection Runner (Recommended)

1. Right-click on the collection "Accounting API - Complete Test Suite"
2. Select **Run collection**
3. In the runner window:
   - Make sure all folders are selected
   - Set **Delay** to 50-100ms between requests (to avoid overwhelming the server)
   - Click **Run Accounting API - Complete Test Suite**
4. Watch as 400+ records are created automatically!

#### Option B: Manual Execution

Execute folders in this order:

1. **Authentication** - Register and login
2. **Tags - Bulk Insert** - Creates 50 tags
3. **Categories - Bulk Insert** - Creates 50 categories
4. **Products - Bulk Insert** - Creates 50 products
5. **Bank Accounts - Bulk Insert** - Creates 50 bank accounts
6. **Transactions - Bulk Insert** - Creates 100 transactions
7. **Receipts - Bulk Insert** - Creates 50 receipts
8. **Receipt Products - Bulk Insert** - Creates 50 receipt products
9. **CRUD Tests** - Verify all data was created

## 🔑 Authentication

The collection automatically handles authentication:

- First request registers a new user
- Auth token is stored in collection variables
- All subsequent requests use the token automatically

## 📊 Test Data Characteristics

### Tags

- Diverse categories: food, transport, entertainment, shopping, bills, etc.
- Multiple colors for visual organization
- Auto-generated slugs

### Categories

- Real-world categories: Groceries, Restaurants, Utilities, Rent, etc.
- Automation rules based on store names
- Color coding and icons

### Products

- Common grocery items with variations
- Multiple brands: Generic, Premium, Organic, etc.
- Valid barcodes (789000000XXXX format)
- Store associations

### Bank Accounts

- Multiple account types: Personal, Business
- Various sub-types: CurrentAccount, Savings, CreditCard
- Multiple currencies: USD, EUR, GBP, JPY, CAD, AUD
- Realistic bank names

### Transactions

- 100 transactions spread over the last year
- Mix of income (received) and expenses (sent)
- Random amounts between $10 and $510
- Various stores and locations
- Both Booked and Pending statuses

### Receipts

- Linked to transactions
- Multiple stores and locations
- Prices between $20 and $220
- Distributed over last 6 months

### Receipt Products

- Individual line items from receipts
- Various quantity types: KG, G, L, ML, PCS, BUC, UNIT, BOX, PACK
- Random discounts (30% chance of 0-20% discount)
- Prices between $2 and $22

## 🧪 Test Assertions

Each request includes automated tests that verify:

- ✅ Correct HTTP status codes (201 for create, 200 for read)
- ✅ Response structure validation
- ✅ Required fields are present
- ✅ Minimum record counts are met
- ✅ Variables are properly set for subsequent requests

## 📈 Verification Tests

After bulk inserts, the **CRUD Tests** folder contains verification requests:

- Get All Tags (expects ≥50)
- Get All Categories (expects ≥50)
- Get All Products (expects ≥50)
- Get All Bank Accounts (expects ≥50)
- Get All Transactions (expects ≥100)
- Get All Receipts (expects ≥50)
- Get All Receipt Products (expects ≥50)

## 🔄 Re-running Tests

To create fresh data:

1. The collection uses timestamps and random values
2. Each run creates unique records
3. Tags use unique slugs based on iteration numbers
4. Bank accounts use incrementing IDs

## 🛠️ Customization

### Modify Record Counts

In each bulk insert folder's test script, change the iteration limit:

```javascript
if (currentIteration < 100) { // Change 100 to your desired count
```

### Modify Data Patterns

Edit the pre-request scripts to customize:

- Store names
- Product categories
- Price ranges
- Date ranges
- Currencies

## 📝 Collection Variables

The collection uses these variables automatically:

- `baseUrl`: API base URL (default: http://localhost:3020)
- `authToken`: JWT authentication token
- `userId`: Current user ID
- `accountId`: Last created account ID
- `transactionId`: Last created transaction ID
- `categoryId`: Last created category ID
- `tagId`: Last created tag ID
- `productId`: Last created product ID
- `receiptId`: Last created receipt ID

## 🎯 Expected Results

After running the complete collection:

- ✅ 1 User registered and authenticated
- ✅ 50 Tags created
- ✅ 50 Categories created
- ✅ 50 Products created
- ✅ 50 Bank Accounts created
- ✅ 100 Transactions created
- ✅ 50 Receipts created
- ✅ 50 Receipt Products created

**Total: 391 records + 1 user = 392 database documents**

## 🐛 Troubleshooting

### If requests fail:

1. Ensure the server is running on port 3020
2. Check MongoDB is connected
3. Clear collection variables and start fresh
4. Increase delay between requests in Collection Runner

### If bulk inserts don't complete:

1. Check the Postman console for errors
2. Verify iteration counters are resetting properly
3. Make sure `postman.setNextRequest()` is working

## 🔐 Security Note

This is a **test collection** for development purposes:

- Uses auto-generated test emails
- Default password: "Test123456"
- Don't use in production!

## 📦 Response Examples

All successful creates return 201 status with the created entity including MongoDB `_id`.
All GET requests return 200 status with an array of entities.

Enjoy testing! 🎉
