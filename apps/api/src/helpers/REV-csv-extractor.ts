import csvParser from 'csv-parser';
import { createReadStream } from 'fs';
import { TransactionModel } from '../database/models/transaction';

export interface RevolutCSVData {
  Type: string;
  Product: string;
  'Started Date': string;
  'Completed Date': string;
  Description: string;
  Amount: string;
  Fee: string;
  Currency: string;
  State: string;
  Balance: string;
}

export async function extractTransactionsREV(
  filePath: string,
  bankAccount: any,
) {
  return new Promise<TransactionModel[]>((resolve, reject) => {
    const transactions: RevolutCSVData[] = [];
    createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data: RevolutCSVData) => {
        transactions.push(data);
      })
      .on('end', () => {
        resolve(
          transactions
            .filter((rev) => rev.State === 'COMPLETED')
            .map<any>((rev) => {
              const [date, time] = rev['Completed Date'].split(' ');
              const [year, month, day] = date.split('-').map(Number);
              const [hour, minutes, seconds] = time.split(':').map(Number);
              const amount = Number(rev.Amount) || -Number(rev.Fee);

              return {
                amount,
                description: rev.Description,
                date: new Date(year, month - 1, day, hour, minutes, seconds),
                action: amount < 0 ? 'sent' : 'received',
                merchant: rev.Description,
                bankAccount,
              };
            }),
        );
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}
