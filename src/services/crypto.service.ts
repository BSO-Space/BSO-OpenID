import bcrypt from 'bcrypt';

export class CryptoService {
  /**
   * Hash a plain-text password.
   * @param password - The plain-text password to hash.
   * @returns The hashed password.
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a plain-text password with a hashed password.
   * @param password - The plain-text password.
   * @param hashedPassword - The hashed password.
   * @returns True if passwords match, false otherwise.
   */
  public async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
