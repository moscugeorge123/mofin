import Tesseract from 'tesseract.js';
import { ReceiptModel } from '../database/models/receipt';

// Extract KAUFLAND receipt. Problems with products on 2 lines
export async function parseKauflandReceipt(
  imagePath: string,
): Promise<ReceiptModel[]> {
  return Tesseract.recognize(imagePath).then(({ data: { text } }) => {
    const lines = text.split('\n').filter((line) => line.length);
    const priceRegex =
      /((?<count>\d+)\s*\*\s*(?<singlePrice>-?\d+\.?,\d+))?\s*(?<price>-?\d+\.?,\d+)\s*(?<category>[ABCD]?)$/;
    const kgPrice =
      /^(?<count>-?\d+\.?,?\d+)\s*KG\s+(?<totalPrice>-?\d+\.?,\d+)/;
    const kgPriceInline =
      /(?<count>-?\d+\.?,?\d+)\s+KG\s+(?<totalPrice>-?\d+\.?,\d+)/;
    const multipleProducts =
      /^(?<count>\d+)\s*\*\s*(?<singlePrice>-?\d+\.?,\d+)\s*(?<totalPrice>-?\d+\.?,\d+)\s*(?<category>[ABCD])?$/;

    const result = lines.reduce((acc, line, index) => {
      const kgMatch = line.match(kgPrice);
      const kgInlineMatch = line.match(kgPriceInline);
      const multipleMatch = line.match(multipleProducts);
      const priceMatch = line.match(priceRegex);

      if (!priceMatch) return acc;

      const is2Lines = Boolean(kgMatch || multipleMatch);
      let { count, singlePrice, price, category } = priceMatch.groups || {};

      const priceNumber = Number(price?.trim().replace(',', '.') || 0);
      count = count?.trim()?.replace(',', '.') || '0';
      singlePrice = singlePrice?.trim()?.replace(',', '.') || '0';
      let pricePerKg = 0;

      if (kgInlineMatch) {
        count = kgInlineMatch?.groups?.count?.replace(',', '.') || '0';
        const totalPrice =
          kgInlineMatch?.groups?.totalPrice?.replace(',', '.') || '0';
        console.log(count, totalPrice);
        pricePerKg = count === '0' ? 0 : Number(totalPrice) / Number(count);
      }

      acc.push({
        description: is2Lines ? `${lines[index - 1]} ${line}` : line,
        price: priceNumber < 0 ? 0 : priceNumber,
        discount: priceNumber < 0 ? priceNumber : 0,
        count: Number(count) || 1,
        singlePrice:
          kgMatch || kgInlineMatch
            ? pricePerKg
            : Number(count)
              ? Number(singlePrice)
              : priceNumber,
        type: kgMatch || kgInlineMatch ? 'KG' : 'BUC',
      });

      return acc;
    }, [] as any[]);

    return result;
  });
}

// Extract LIDL receipts
export async function parseLidlReceipt(
  imagePath: string,
): Promise<ReceiptModel[]> {
  return Tesseract.recognize(imagePath).then(({ data: { text } }) => {
    const lines = text.split('\n');
    const priceRegex = /(\d+\.?,?\d+)\s+(KG|BUC)\s+x\s+(-?\d+\.?,\d+)\s*$/;
    const endOfProductRegex = /(-?\d+\.?,\d+)?\s+?([ABCD])$/;

    const result = lines.reduce((acc: any[], line: string) => {
      const lastIndex = acc.length ? acc.length - 1 : acc.length;
      const priceMatch = line.match(endOfProductRegex);
      const countMatch = line.match(priceRegex);

      if (priceMatch) {
        const last = acc[lastIndex];
        const [match, price, category] = priceMatch;
        if (category.includes('D')) {
          last.discount = Number(price?.replace(',', '.'));
          last.description = `${line.trim()} | ${last.description}`;
        } else {
          last.price = Number(price?.replace(',', '.'));
          last.description = `${line.replace(match, '').trim()} | ${last.description}`;
        }
      }

      if (countMatch) {
        const [, c, type, p] = countMatch;
        const count = Number(c.replace(',', '.'));
        const price = Number(p.replace(',', '.'));

        acc.push({
          description: `${line.trim()}`,
          price: 0,
          discount: 0,
          count,
          singlePrice: price,
          type,
        });
      }

      return acc;
    }, []);

    return result;
  });
}
