import pdfParser from 'pdf-parse';
import { ExtractedTransaction } from '../models/extracted-transaction.model';

export function parseTransactionsBT(text: string): ExtractedTransaction[] {
  const lines = text.split('\n');
  const groups: string[][] = [];
  let groupIndex = 0;

  // simple date regex
  const dateregex = /^\d{2}\/\d{2}\/\d{4}$/;
  // transactions with spaces before (sent money)
  const sentTransactionRegex = /^(\d+(,\d+)?\.\d+)\s+$/;
  // transaction with spaces after (received money)
  const receivedTransactionRegex = /^\s+(\d+(,\d+)?\.\d+)$/;
  // POS or EPOS regex
  const POSTransactionRegex =
    /[ATM\/]?E?POS\s(\d{2}\/\d{2}\/\d{4})\s[a-zA-Z0-9]*\s?TID[:\s][a-zA-Z0-9]+\s([a-zA-Z0-9\*\.\-/\s]+)\s{2}([a-zA-Z0-9\s]*)/;

  let i = 0;
  while (i < lines.length) {
    // check for a line only with a date in it
    if (dateregex.test(lines[i])) {
      const date = lines[i];

      ++i;
      // check for a line with a price like with spaces before or after it
      while (!dateregex.test(lines[i]) && !lines[i].includes('RULAJ ZI')) {
        groups[groupIndex] = [date];
        let isSentTransaction;
        let isReceivedTransaction;

        do {
          if (dateregex.test(lines[i]) || lines[i].includes('RULAJ ZI')) break;

          if (lines[i] === 'Clasificare BT: Uz Intern') {
            while (
              lines[++i] !== undefined &&
              lines[i] !== 'DataDescriere  DebitCredit'
            );
            ++i;
            continue;
          }

          if (lines[i] === 'BANCA TRANSILVANIA') {
            while (
              lines[++i] !== undefined &&
              lines[i] !== 'DataDescriere  DebitCredit'
            );
            ++i;
            continue;
          }

          if (typeof lines[i] === 'string') {
            isSentTransaction = lines[i].match(sentTransactionRegex);
            isReceivedTransaction = lines[i].match(receivedTransactionRegex);
            groups[groupIndex].push(lines[i]);
          }
          ++i;
        } while (
          lines[i] !== undefined &&
          !(isSentTransaction || isReceivedTransaction)
        );

        groupIndex++;
      }
    }

    ++i;
  }

  const tr = groups.map((group, j) => {
    const transaction: ExtractedTransaction = group.reduce(
      (acc, line, index) => {
        if (index === 0) {
          acc['date'] = line.trim();
          return acc;
        }

        const matched = `${line}${line.includes('  ') ? '' : '  '}`.match(
          POSTransactionRegex,
        );

        if (matched) {
          acc['description'] = line.trim();
          acc['merchant'] = matched[2];
          acc['location'] = matched[3];
        }

        if (line.includes('Rata ')) {
          acc['description'] = (line + group[index + 1]).trim();
          const m =
            `${line + group[index + 1]}${(line + group[index + 1]).includes('  ') ? '' : '  '}`.match(
              POSTransactionRegex,
            );
          acc['merchant'] = m?.[2] ? `Rata: ${m?.[2]}` : undefined;
        }

        if (line.includes('Incasare')) {
          acc['description'] = line.trim();
        }

        if (line.includes('Transfer')) {
          acc['description'] = line.trim();
        }

        if (line.includes('ATM/POS')) {
          acc['description'] = line.trim();
        }
        return acc;
      },
      {} as any,
    );

    const isSentTransaction =
      group[group.length - 1].match(sentTransactionRegex);

    transaction['amount'] = Number(
      group[group.length - 1].trim().replaceAll(',', ''),
    );

    transaction['amount'] = isSentTransaction
      ? -transaction['amount']
      : transaction['amount'];

    return transaction;
  });

  return tr.filter((tr) => tr.amount);
}

export async function extractTransactionsBT(
  pdfBuffer: Buffer,
): Promise<ExtractedTransaction[]> {
  const data = await pdfParser(pdfBuffer);
  return parseTransactionsBT(data.text);
}
