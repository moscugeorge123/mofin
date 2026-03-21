import crypto from 'crypto';
import fs from 'fs';

/**
 * Compute SHA-256 hash of a file
 * @param filePath - Path to the file
 * @returns Promise that resolves to the hex-encoded hash
 */
export async function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}
