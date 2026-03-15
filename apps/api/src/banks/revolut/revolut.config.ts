import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

interface RevolutConfig {
  baseUrl: string;
  tokenPath: string;
  transportPemPath: string;
  privateKeyPath: string;
  signingKeyPath: string;
  clientId: string;
  kid?: string;
}

const revolutConfig: RevolutConfig = {
  baseUrl:
    process.env.REVOLUT_BASE_URL || 'https://sandbox-oba-auth.revolut.com',
  tokenPath: process.env.REVOLUT_TOKEN_PATH || '/token',
  transportPemPath:
    process.env.REVOLUT_TRANSPORT_PEM ||
    path.join(process.cwd(), 'certs', 'transport.pem'),
  privateKeyPath:
    process.env.REVOLUT_PRIVATE_KEY ||
    path.join(process.cwd(), 'certs', 'private.key'),
  signingKeyPath:
    process.env.REVOLUT_SIGNING_KEY ||
    path.join(process.cwd(), 'certs', 'signing.key'),
  clientId: process.env.REVOLUT_CLIENT_ID || '',
  kid: process.env.REVOLUT_KID,
};

// Validate required configuration
if (!revolutConfig.clientId) {
  throw new Error('REVOLUT_CLIENT_ID is required in environment variables');
}

export { revolutConfig };
