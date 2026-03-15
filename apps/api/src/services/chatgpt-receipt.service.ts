import { config } from 'dotenv';
import fs from 'fs';
import OpenAI from 'openai';

config();

interface ReceiptProduct {
  name: string;
  price: number;
  quantity: number;
  quantityType: string;
  discount?: number;
}

interface ReceiptData {
  price: number;
  store: string;
  location: string;
  date: string;
  products: ReceiptProduct[];
}

export class ChatGPTReceiptService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return;
      //   throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    console.log('Initializing OpenAI client for ChatGPTReceiptService');

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Extract receipt details from an image or PDF buffer using ChatGPT Vision
   * @param base64File - Buffer containing the receipt image or PDF
   * @param mimeType - MIME type of the file (e.g., 'image/jpeg', 'image/png', 'application/pdf')
   * @returns Parsed receipt data
   */
  async extractReceiptDetails(path: string): Promise<ReceiptData> {
    try {
      // Create the prompt for ChatGPT
      const prompt = this.buildPrompt();

      // Call OpenAI API with vision capabilities
      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }

      const file = await this.openai.files.create({
        file: fs.createReadStream(path),
        purpose: 'user_data',
      });

      const response = await this.openai.responses.create({
        model: 'gpt-4.1-mini', // Using GPT-4o which supports vision
        input: [
          {
            role: 'system',
            content:
              'You are a receipt parsing expert. Extract all information accurately and return ONLY valid JSON without any markdown formatting or additional text.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt,
              },
              {
                type: 'input_file',
                file_id: file.id,
              },
            ],
          },
        ],
        // max_tokens: 2000,
        temperature: 0.1, // Low temperature for more consistent outputs
      });

      // Extract the response
      const content = response.output_text?.trim();

      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      // Parse the JSON response
      const receiptData = this.parseGPTResponse(content);

      // Validate the response structure
      this.validateReceiptData(receiptData);

      await this.openai.files.delete(file.id);

      return receiptData;
    } catch (error: any) {
      console.error('Error extracting receipt details:', error);
      throw new Error(`Failed to extract receipt details: ${error.message}`);
    }
  }

  /**
   * Build the prompt for ChatGPT to extract receipt details
   */
  private buildPrompt(): string {
    return `
Analyze this receipt and extract ALL information into a structured JSON format.

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON, no markdown code blocks, no explanations
2. Extract the total price (final amount paid)
3. Extract store name
4. Extract store location/address
5. Extract transaction date in ISO format (YYYY-MM-DD)
6. Extract ALL products with their details

For each product extract:
- name: Product name exactly as shown
- price: Final price paid for this product (after any item discounts)
- quantity: Numeric quantity purchased
- quantityType: Unit of measurement - must be one of: 'KG', 'G', 'L', 'ML', 'PCS', 'BUC', 'UNIT', 'BOX', 'PACK'
- discount: (optional) Discount amount in currency units (not percentage). Only include if there was a discount.

QUANTITY TYPE MAPPING:
- Kilograms → 'KG'
- Grams → 'G'
- Liters → 'L'
- Milliliters → 'ML'
- Bucata (Romanian) → 'BUC'
- Unit → 'UNIT'
- Box → 'BOX'
- Pack → 'PACK'

CRITICAL RULES:
- If quantity is not specified, use 1 and 'BUC' as default
- Prices must be numbers (no currency symbols)
- Date must be in YYYY-MM-DD format
- Discount is the monetary amount, not percentage
- Return empty string "" for unknown fields, never null or undefined
- All numeric fields must be actual numbers, not strings

Expected JSON structure:
{
  "price": 0,
  "store": "",
  "location": "",
  "date": "",
  "products": [
    {
      "name": "",
      "price": 0,
      "quantity": 0,
      "quantityType": "",
      "discount": 0
    }
  ]
}

Return ONLY the JSON object, nothing else.
`.trim();
  }

  /**
   * Parse ChatGPT response and extract JSON
   */
  private parseGPTResponse(content: string): ReceiptData {
    try {
      // Remove markdown code blocks if present
      let jsonString = content.trim();

      // Remove ```json and ``` if present
      jsonString = jsonString.replace(/^```json?\s*/i, '');
      jsonString = jsonString.replace(/```\s*$/, '');
      jsonString = jsonString.trim();

      // Parse the JSON
      const parsed = JSON.parse(jsonString);

      return parsed as ReceiptData;
    } catch (error) {
      console.error('Failed to parse GPT response:', content);
      throw new Error('Invalid JSON response from ChatGPT');
    }
  }

  /**
   * Validate the structure of receipt data
   */
  private validateReceiptData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid receipt data structure');
    }

    // Check required fields
    const requiredFields = ['price', 'store', 'location', 'date', 'products'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate price
    if (typeof data.price !== 'number' || data.price < 0) {
      throw new Error('Invalid price value');
    }

    // Validate products array
    if (!Array.isArray(data.products)) {
      throw new Error('Products must be an array');
    }

    // Validate each product
    data.products.forEach((product: any, index: number) => {
      if (!product.name || typeof product.name !== 'string') {
        throw new Error(`Invalid product name at index ${index}`);
      }
      if (typeof product.price !== 'number' || product.price < 0) {
        throw new Error(`Invalid product price at index ${index}`);
      }
      if (typeof product.quantity !== 'number' || product.quantity <= 0) {
        throw new Error(`Invalid product quantity at index ${index}`);
      }
      if (!product.quantityType || typeof product.quantityType !== 'string') {
        throw new Error(`Invalid product quantityType at index ${index}`);
      }
      if (
        product.discount !== undefined &&
        (typeof product.discount !== 'number' || product.discount < 0)
      ) {
        throw new Error(`Invalid product discount at index ${index}`);
      }
    });

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }
  }

  /**
   * Test the service with a sample prompt (for debugging)
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Respond with just the word "OK" if you can read this.',
          },
        ],
        max_tokens: 10,
      });

      return response.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error: any) {
      console.error('Connection test failed:', error.message);
      return false;
    }
  }
}

// Export a singleton instance
export const chatGPTReceiptService = new ChatGPTReceiptService();
