import fs from 'fs';
import path from 'path';
import { chatGPTReceiptService } from './chatgpt-receipt.service';

/**
 * Example usage of ChatGPT Receipt Service
 * This demonstrates how to use the service to extract receipt details
 */

async function testReceiptExtraction() {
  try {
    console.log('🧪 Testing ChatGPT Receipt Service...\n');

    // Test 1: Check connection
    console.log('1. Testing connection to OpenAI API...');
    const connected = await chatGPTReceiptService.testConnection();
    if (connected) {
      console.log('✅ Successfully connected to OpenAI API\n');
    } else {
      console.log('❌ Failed to connect to OpenAI API\n');
      return;
    }

    // Test 2: Extract receipt from image file
    console.log('2. Extracting receipt details from image...');

    // Example with a local file (you'll need to replace with actual receipt path)
    const receiptPath = path.join(__dirname, '../../public/sample-receipt.jpg');

    // Check if file exists
    if (!fs.existsSync(receiptPath)) {
      console.log(`⚠️  Sample receipt not found at: ${receiptPath}`);
      console.log('Please add a receipt image to test the extraction.\n');
      return;
    }

    // Extract receipt details
    const receiptData =
      await chatGPTReceiptService.extractReceiptDetails(receiptPath);

    console.log('✅ Receipt extracted successfully!\n');
    console.log('📋 Receipt Details:');
    console.log(JSON.stringify(receiptData, null, 2));

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`Store: ${receiptData.store}`);
    console.log(`Location: ${receiptData.location}`);
    console.log(`Date: ${receiptData.date}`);
    console.log(`Total: ${receiptData.price} RON`);
    console.log(`Products: ${receiptData.products.length} items`);

    console.log('\n🛒 Products:');
    receiptData.products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     Price: ${product.price} RON`);
      console.log(`     Quantity: ${product.quantity} ${product.quantityType}`);
      if (product.discount) {
        console.log(`     Discount: ${product.discount} RON`);
      }
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testReceiptExtraction();
}

export { testReceiptExtraction };
