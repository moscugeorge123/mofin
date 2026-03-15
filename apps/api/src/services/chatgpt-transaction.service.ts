import { config } from 'dotenv';
import fs from 'fs';
import OpenAI from 'openai';

config();

interface ExtractedTransaction {
  amount: {
    sum: number;
    currency: string;
  };
  notes?: string;
  state: 'sent' | 'received';
  location?: string;
  store?: string;
  creditDebitIndicator: 'Credit' | 'Debit';
  status: 'Booked' | 'Pending';
  date: string; // ISO format YYYY-MM-DD
}

interface TransactionExtractionResult {
  transactions: ExtractedTransaction[];
  accountInfo?: {
    accountName?: string;
    accountNumber?: string;
  };
}

export class ChatGPTTransactionService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('OPENAI_API_KEY is not set in environment variables');
      return;
    }

    console.log('Initializing OpenAI client for ChatGPTTransactionService');

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Extract transaction details from a PDF or CSV file using ChatGPT
   * @param filePath - Path to the file to process
   * @param mimeType - MIME type of the file
   * @returns Parsed transaction data
   */
  async extractTransactions(
    filePath: string,
    mimeType: string,
  ): Promise<TransactionExtractionResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }

      // For CSV files, read and include content directly in the prompt
      if (mimeType === 'text/csv' || filePath.endsWith('.csv')) {
        return await this.extractFromCSV(filePath);
      }

      // For PDF files, use file upload
      return await this.extractFromPDF(filePath);
    } catch (error: any) {
      console.error('Error extracting transactions:', error);
      throw new Error(`Failed to extract transactions: ${error.message}`);
    }
  }

  /**
   * Extract transactions from CSV file
   */
  private async extractFromCSV(
    filePath: string,
  ): Promise<TransactionExtractionResult> {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }

      const prompt = this.buildPrompt();

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial transaction parsing expert. Extract all transaction information accurately and return ONLY valid JSON without any markdown formatting or additional text.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nCSV Content:\n${csvContent}`,
          },
        ],
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      const extractedData = this.parseGPTResponse(content);
      this.validateTransactionData(extractedData);

      return extractedData;
    } catch (error: any) {
      console.error('Error extracting from CSV:', error);
      throw error;
    }
  }

  /**
   * Extract transactions from PDF file
   */
  private async extractFromPDF(
    filePath: string,
  ): Promise<TransactionExtractionResult> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client is not initialized');
      }

      const prompt = this.buildPrompt();

      // Upload file to OpenAI
      const file = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: 'assistants',
      });

      try {
        // Create assistant for document parsing
        const assistant = await this.openai.beta.assistants.create({
          name: 'Transaction Extractor',
          instructions:
            'You are a financial transaction parsing expert. Extract all transaction information accurately from the provided document and return ONLY valid JSON without any markdown formatting.',
          model: 'gpt-4o',
          tools: [{ type: 'file_search' }],
        });

        // Create thread with the file
        const thread = await this.openai.beta.threads.create({
          messages: [
            {
              role: 'user',
              content: prompt,
              attachments: [
                {
                  file_id: file.id,
                  tools: [{ type: 'file_search' }],
                },
              ],
            },
          ],
        });

        // Run the assistant
        const run = await this.openai.beta.threads.runs.createAndPoll(
          thread.id,
          {
            assistant_id: assistant.id,
          },
        );

        if (run.status !== 'completed') {
          throw new Error(`Assistant run failed with status: ${run.status}`);
        }

        // Get the response
        const messages = await this.openai.beta.threads.messages.list(
          thread.id,
        );
        const assistantMessage = messages.data.find(
          (msg) => msg.role === 'assistant',
        );

        if (!assistantMessage) {
          throw new Error('No response from assistant');
        }

        const content =
          assistantMessage.content[0]?.type === 'text'
            ? assistantMessage.content[0].text.value
            : '';

        if (!content) {
          throw new Error('Empty response from assistant');
        }

        const extractedData = this.parseGPTResponse(content);
        this.validateTransactionData(extractedData);

        return extractedData;
      } finally {
        // Clean up the file
        await this.openai.files.delete(file.id).catch(console.error);
      }
    } catch (error: any) {
      console.error('Error extracting from PDF:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for ChatGPT to extract transaction details
   */
  private buildPrompt(): string {
    return `
Analyze this bank statement or transaction document and extract ALL transactions into a structured JSON format.

IMPORTANT INSTRUCTIONS:
1. Return ONLY valid JSON, no markdown code blocks, no explanations
2. Extract EVERY transaction from the document
3. A single day can have MULTIPLE transactions - extract each one separately
4. Maintain the exact date for each transaction

For each transaction, extract:

REQUIRED FIELDS:
- amount.sum: Transaction amount as a positive number (no negative signs, no currency symbols)
- amount.currency: Currency code (e.g., "USD", "EUR", "RON", "GBP")
- creditDebitIndicator: "Credit" for money received/deposits, "Debit" for money spent/withdrawals
- state: "received" for money coming in (Credit), "sent" for money going out (Debit)
- status: "Booked" for completed transactions, "Pending" for pending ones (default to "Booked")
- date: Transaction date in ISO format YYYY-MM-DD

OPTIONAL FIELDS:
- store: Store or merchant name if available
- location: Location or address if available
- notes: Any additional transaction description or reference

CRITICAL RULES:
- Extract ALL transactions, even if there are multiple on the same day
- amount.sum must always be a positive number (e.g., 50.00, never -50.00)
- Use creditDebitIndicator to show direction: "Credit" = money in, "Debit" = money out
- state should match creditDebitIndicator: "received" for Credit, "sent" for Debit
- Date must be in YYYY-MM-DD format
- If currency is not specified, try to infer from document header or use "USD" as default
- Return empty object {} for accountInfo if account details are not clearly visible

Expected JSON structure:
{
  "transactions": [
    {
      "amount": {
        "sum": 150.50,
        "currency": "USD"
      },
      "notes": "Payment for services",
      "state": "sent",
      "location": "New York, NY",
      "store": "Amazon",
      "creditDebitIndicator": "Debit",
      "status": "Booked",
      "date": "2024-03-15"
    },
    {
      "amount": {
        "sum": 2500.00,
        "currency": "USD"
      },
      "notes": "Salary deposit",
      "state": "received",
      "creditDebitIndicator": "Credit",
      "status": "Booked",
      "date": "2024-03-01"
    }
  ],
  "accountInfo": {
    "accountName": "Checking Account",
    "accountNumber": "****1234"
  }
}

EXAMPLES OF CREDIT/DEBIT:
- Bank deposit, salary, refund → creditDebitIndicator: "Credit", state: "received"
- Purchase, withdrawal, payment → creditDebitIndicator: "Debit", state: "sent"

Return ONLY the JSON object, nothing else.
`.trim();
  }

  /**
   * Parse ChatGPT response and extract JSON
   */
  private parseGPTResponse(content: string): TransactionExtractionResult {
    try {
      // Remove markdown code blocks if present
      let jsonString = content.trim();

      // Remove ```json and ``` if present
      jsonString = jsonString.replace(/^```json?\s*/i, '');
      jsonString = jsonString.replace(/```\s*$/, '');
      jsonString = jsonString.trim();

      // Parse the JSON
      const parsed = JSON.parse(jsonString);

      return parsed as TransactionExtractionResult;
    } catch (error) {
      console.error('Failed to parse GPT response:', content);
      throw new Error('Invalid JSON response from ChatGPT');
    }
  }

  /**
   * Validate the structure of transaction data
   */
  private validateTransactionData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid transaction data structure');
    }

    if (!data.transactions || !Array.isArray(data.transactions)) {
      throw new Error('Missing or invalid transactions array');
    }

    if (data.transactions.length === 0) {
      throw new Error('No transactions found in the document');
    }

    // Validate each transaction
    data.transactions.forEach((transaction: any, index: number) => {
      // Validate amount
      if (!transaction.amount || typeof transaction.amount !== 'object') {
        throw new Error(`Invalid amount object at transaction ${index}`);
      }
      if (
        typeof transaction.amount.sum !== 'number' ||
        transaction.amount.sum < 0
      ) {
        throw new Error(`Invalid amount sum at transaction ${index}`);
      }
      if (
        !transaction.amount.currency ||
        typeof transaction.amount.currency !== 'string'
      ) {
        throw new Error(`Invalid currency at transaction ${index}`);
      }

      // Validate state
      if (!['sent', 'received'].includes(transaction.state)) {
        throw new Error(`Invalid state at transaction ${index}`);
      }

      // Validate creditDebitIndicator
      if (!['Credit', 'Debit'].includes(transaction.creditDebitIndicator)) {
        throw new Error(`Invalid creditDebitIndicator at transaction ${index}`);
      }

      // Validate status
      if (!['Booked', 'Pending'].includes(transaction.status)) {
        throw new Error(`Invalid status at transaction ${index}`);
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(transaction.date)) {
        throw new Error(
          `Date must be in YYYY-MM-DD format at transaction ${index}`,
        );
      }
    });
  }
}
