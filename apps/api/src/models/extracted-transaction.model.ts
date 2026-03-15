export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  merchant?: string;
  location?: string;
}
