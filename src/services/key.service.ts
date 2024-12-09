import { promises as fs } from 'fs';
import path from 'path';

export class KeyService {
  private keyDirectory: string;

  constructor(keyDirectory: string = './keys') {
    this.keyDirectory = path.resolve(process.cwd(), keyDirectory);
  }

  /**
   * Generate an RSA key pair (Access or Refresh) for a service.
   * @param serviceName - The name of the service.
   * @param type - The type of key ("Access" or "Refresh").
   */
  public async generateKeyPair(serviceName: string, type: 'Access' | 'Refresh'): Promise<void> {
    const { generateKeyPairSync } = await import('crypto');
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    });

    // Define file paths for the keys
    const publicKeyPath = path.join(this.keyDirectory, `${serviceName}Public${type}.pem`);
    const privateKeyPath = path.join(this.keyDirectory, `${serviceName}Private${type}.pem`);

    // Write keys to the filesystem
    await fs.mkdir(this.keyDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(publicKeyPath, publicKey),
      fs.writeFile(privateKeyPath, privateKey),
    ]);
  }

  /**
   * Delete all keys for a service (Access and Refresh).
   * @param serviceName - The name of the service.
   */
  public async deleteKeys(serviceName: string): Promise<void> {
    const keyTypes = ['Access', 'Refresh'];
    const files = keyTypes.flatMap((type) => [
      path.join(this.keyDirectory, `${serviceName}Public${type}.pem`),
      path.join(this.keyDirectory, `${serviceName}Private${type}.pem`),
    ]);

    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (err: any) {
        if (err.code !== 'ENOENT') {
          console.error(`Failed to delete key file: ${file}`, err);
        }
      }
    }
  }

  /**
   * Retrieve a public key for a service.
   * @param serviceName - The name of the service.
   * @param type - The type of key ("Access" or "Refresh").
   * @returns The public key as a string.
   * @throws If the key file does not exist or another error occurs.
   */
  public async getKey(serviceName: string, type: 'Access' | 'Refresh'): Promise<string> {
    // Only allow access to public keys
    const keyPath = path.join(this.keyDirectory, `${serviceName}Public${type}.pem`);
    try {
      return await fs.readFile(keyPath, 'utf-8');
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        throw new Error(`Public key for ${type} not found for service: ${serviceName}`);
      }
      console.error(`Failed to read key file: ${keyPath}`, err);
      throw new Error(`Unable to read public key for service: ${serviceName}`);
    }
  }
}
