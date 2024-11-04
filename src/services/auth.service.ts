import jwt, { JwtPayload } from "jsonwebtoken";
import { AuditLog, PrismaClient, User } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { envConfig } from "../config/env.config";

class AuthService {
  private prisma: PrismaClient;
  private privateKey: Buffer;
  private publicKey: Buffer;

  constructor() {
    // Create a new Prisma client
    this.prisma = new PrismaClient();

    // Read RSA keys from file
    this.privateKey = readFileSync(path.join(__dirname, "../../private.pem"));
    this.publicKey = readFileSync(path.join(__dirname, "../../public.pem"));
  }

  /**
   * Create an access token for the user
   * @param user The user to generate the token for
   * @returns The generated access token
   * @throws Error if the token cannot be generated
   */
  public generateAccessToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        name: user.username,
        iss: envConfig.APP_URL,
        iat: Math.floor(Date.now() / 1000),
      },
      this.privateKey,
      { algorithm: "RS256", expiresIn: "15m" }
    );
  }

  /**
   * Create a refresh token for the user
   * @param user The user to generate the token for
   * @returns The generated refresh token
   * @throws Error if the token cannot be generated
   */

  public generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        name: user.username,
        iss: envConfig.APP_URL,
        iat: Math.floor(Date.now() / 1000),
      },
      this.privateKey,
      { algorithm: "RS256", expiresIn: "7d" }
    );
  }

  /**
   * Verify an access token
   * @param token The token to verify
   * @returns The decoded payload if the token is valid, null otherwise
   */
  public verifyAccessToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ["RS256"],
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      console.error("Failed to verify access token:", error);
      return null;
    }
  }

  /**
   *  find or create user from profile
   * @param profile- user profile
   * @param provider- provider name
   * @returns
   */
  public async findOrCreateUserFromProfile(
    profile: any,
    provider: string
  ): Promise<User> {
    const { id, username, email, avatar } = profile;

    console.log("profile", profile);
    let user = await this.prisma.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: provider,
            providerAccountId: id,
          },
        },
      },
    });
    const userID = profile.id;
    const avatarHash = profile.avatar;

    const avatarUrl = avatarHash
      ? `https://cdn.discordapp.com/avatars/${userID}/${avatarHash}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(userID) % 5}.png`;

    if (!user) {
      // Example of creating a user in your database
      user = await this.prisma.user.create({
        data: {
          username: profile.username,
          email: profile.email || "",
          image: avatarUrl,
          accounts: {
            create: {
              provider: "discord",
              providerAccountId: userID,
            },
          },
        },
      });
    }
    return user;
  }

  /**
   * Log audit events for user actions.
   * @param userId - ID of the user who performed the action
   * @param action - The action type (e.g., "LOGIN", "ACCESS_SERVICE")
   * @param service - The service being accessed (optional)
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent of the request
   */

  public async logAudit(
    userId: string,
    action: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      },
    });
  }
}

export default AuthService;
