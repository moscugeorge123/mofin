import { config } from 'dotenv';
import fs from 'fs';
import OpenAI from 'openai';
import pdfParse from 'pdf-parse';

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
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial transaction parsing expert. Extract all transaction information accurately from the provided document.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nCSV Content:\n${csvContent}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'transaction_extraction',
            strict: true,
            schema: this.getTransactionSchema(),
          },
        },
      });

      const content = response.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      const extractedData = JSON.parse(content) as TransactionExtractionResult;
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

      // Read and parse PDF file to extract text
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      const pdfText = pdfData.text;

      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      const prompt = this.buildPrompt();

      // Use chat completions API with structured output
      const response = await this.openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a financial transaction parsing expert. Extract all transaction information accurately from the provided document.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nPDF Content:\n${pdfText}`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'transaction_extraction',
            strict: true,
            schema: this.getTransactionSchema(),
          },
        },
      });

      const content = response.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No response from ChatGPT');
      }

      const extractedData = JSON.parse(content) as TransactionExtractionResult;
      this.validateTransactionData(extractedData);

      return extractedData;
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
Analyze this bank statement or transaction document and extract ALL transactions into a structured format.

IMPORTANT INSTRUCTIONS:
1. Extract EVERY transaction from the document
2. A single day can have MULTIPLE transactions - extract each one separately
3. Maintain the exact date for each transaction

---- START BANCA TRANSILVANIA STATEMENT RULES ----
If the document is from Banca Transilvania the following rules apply:

Ignore all irrelevant information and extract only actual transactions.

A transaction typically begins with a date formatted as DD/MM/YYYY. Everything following that line belongs to that transaction until another date appears or until a section summary begins.

Ignore sections such as RULAJ ZI, SOLD FINAL ZI, SOLD FINAL CONT, TOTAL DISPONIBIL, SUME BLOCATE, bank headers, page numbers, and bank contact information.

Transactions may span multiple lines. Treat all consecutive lines belonging to a transaction as a single transaction block.

For each transaction:
- date: the transaction date in format DD/MM/YYYY
- type: classify the transaction using the following rules:
  - If the text contains "Plata la POS" or "Plata la POS non-BT cu card VISA" then type is card_payment
  - If the text contains "Transfer intern" then type is internal_transfer
  - If the text contains "P2P BTPay" then type is p2p_transfer
  - If the text contains "Incasare Instant" then type is incoming_transfer
  - If the text contains "Comis" or "Comision" then type is bank_fee
  - Otherwise use other
---- END BANCA TRANSILVANIA STATEMENT RULES ----

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
- If account details are not clearly visible, set accountInfo fields to null or omit them

EXAMPLES OF CREDIT/DEBIT:
- Bank deposit, salary, refund → creditDebitIndicator: "Credit", state: "received"
- Purchase, withdrawal, payment → creditDebitIndicator: "Debit", state: "sent"
`.trim();
  }

  /**
   * Get the JSON schema for transaction extraction
   * This schema is used with OpenAI's Responses API for structured outputs
   */
  private getTransactionSchema() {
    return {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              amount: {
                type: 'object',
                properties: {
                  sum: {
                    type: 'number',
                    description: 'Transaction amount as a positive number',
                  },
                  currency: {
                    type: 'string',
                    description: 'Currency code (e.g., USD, EUR, RON)',
                  },
                },
                required: ['sum', 'currency'],
                additionalProperties: false,
              },
              notes: {
                type: ['string', 'null'],
                description: 'Additional transaction description or reference',
              },
              state: {
                type: 'string',
                enum: ['sent', 'received'],
                description:
                  'Transaction direction: sent for outgoing, received for incoming',
              },
              location: {
                type: ['string', 'null'],
                description: 'Location or address if available',
              },
              store: {
                type: ['string', 'null'],
                description: 'Store or merchant name if available',
              },
              creditDebitIndicator: {
                type: 'string',
                enum: ['Credit', 'Debit'],
                description: 'Credit for money in, Debit for money out',
              },
              status: {
                type: 'string',
                enum: ['Booked', 'Pending'],
                description: 'Transaction status',
              },
              date: {
                type: 'string',
                pattern: '^\\d{4}-\\d{2}-\\d{2}$',
                description: 'Transaction date in YYYY-MM-DD format',
              },
            },
            required: [
              'amount',
              'notes',
              'state',
              'location',
              'store',
              'creditDebitIndicator',
              'status',
              'date',
            ],
            additionalProperties: false,
          },
        },
        accountInfo: {
          type: ['object', 'null'],
          properties: {
            accountName: {
              type: ['string', 'null'],
              description: 'Account name if available',
            },
            accountNumber: {
              type: ['string', 'null'],
              description: 'Account number (masked if needed)',
            },
          },
          required: ['accountName', 'accountNumber'],
          additionalProperties: false,
        },
      },
      required: ['transactions', 'accountInfo'],
      additionalProperties: false,
    };
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
