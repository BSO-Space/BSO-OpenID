import jwt, { JwtPayload } from "jsonwebtoken";
import { Account, AuditLog, PrismaClient, User } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { envConfig } from "../config/env.config";
import logger from "../utils/logger.util";

class AuthService {
  private prisma: PrismaClient;
  private privateKey: Buffer;
  private publicKey: Buffer;

  constructor() {
    // Create a new Prisma client
    this.prisma = new PrismaClient();

    // Use process.cwd() to ensure the root directory is used
    this.privateKey = readFileSync(path.join(process.cwd(), "private.pem"));
    this.publicKey = readFileSync(path.join(process.cwd(), "public.pem"));
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
   * Log audit events for user actions.
   * @param userId - ID of the user who performed the action
   * @param action - The action type (e.g., "LOGIN", "ACCESS_SERVICE")
   * @param service - The service being accessed (optional)
   * @param ipAddress - The IP address of the request
   * @param userAgent - The user agent of the request
   */

  /**
   * Fetch the primary email of a GitHub user using the access token.
   * @param accessToken - The GitHub access token.
   * @returns The primary email of the user.
   * @throws Error if the email cannot be fetched.
   */
  public async fetchGitHubEmails(accessToken: string): Promise<string> {
    try {
      const response = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      });

      if (!response.ok) {
        logger.error(
          "Failed to fetch emails from GitHub:",
          response.statusText
        );
        throw new Error("Unable to fetch GitHub emails");
      }

      const emails = await response.json();

      // Find primary email or throw an error if none found
      const primaryEmail = emails.find((email: any) => email.primary)?.email;
      if (!primaryEmail) {
        throw new Error("Primary email not found for GitHub user");
      }

      return primaryEmail;
    } catch (error) {
      logger.error("Error fetching GitHub email:", error);
      throw new Error("Failed to retrieve primary email from GitHub");
    }
  }

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
