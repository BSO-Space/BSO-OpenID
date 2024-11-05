import jwt, { JwtPayload } from "jsonwebtoken";
import { Account, AuditLog, PrismaClient, User } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";
import { envConfig } from "../config/env.config";
import logger from "../utils/logger.util";

class AuthService {
  private prisma: PrismaClient;
  private privateAccessKey: Buffer;
  private publicAccessKey: Buffer;
  private privateRefreshKey: Buffer;
  private publicRefreshKey: Buffer;

  constructor() {
    // Create a new Prisma client
    this.prisma = new PrismaClient();

    // Read separate keys for access and refresh tokens
    this.privateAccessKey = readFileSync(
      path.join(process.cwd(), "privateAccess.pem")
    );
    this.publicAccessKey = readFileSync(
      path.join(process.cwd(), "publicAccess.pem")
    );
    this.privateRefreshKey = readFileSync(
      path.join(process.cwd(), "privateRefresh.pem")
    );
    this.publicRefreshKey = readFileSync(
      path.join(process.cwd(), "publicRefresh.pem")
    );
  }

  /**
   * Create an access token for the user
   * @param user The user to generate the token for
   * @returns The generated access token
   * @throws Error if the token cannot be generated
   */
  public generateAccessToken(user: User, service: string): string {
    return jwt.sign(
      {
        sub: user.id,
        name: user.username,
        iss: envConfig.APP_URL,
        iat: Math.floor(Date.now() / 1000),
        service: service,
      },
      this.privateAccessKey,
      { algorithm: "RS256", expiresIn: "1d" }
    );
  }

  /**
   * Create a refresh token for the user
   * @param user The user to generate the token for
   * @returns The generated refresh token
   * @throws Error if the token cannot be generated
   */
  public generateRefreshToken(user: User, service: string): string {
    return jwt.sign(
      {
        sub: user.id,
        name: user.username,
        iss: envConfig.APP_URL,
        iat: Math.floor(Date.now() / 1000),
        service: service,
      },
      this.privateRefreshKey,
      { algorithm: "RS256", expiresIn: "15d" }
    );
  }

  /**
   * Verify an access token
   * @param token The token to verify
   * @returns The decoded payload if the token is valid, null otherwise
   */
  public verifyAccessToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.publicAccessKey, {
        algorithms: ["RS256"],
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error("Failed to verify access token:", error);
      return null;
    }
  }

  /**
   * Verify a refresh token
   * @param token The token to verify
   * @returns The decoded payload if the token is valid, null otherwise
   */
  public verifyRefreshToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.publicRefreshKey, {
        algorithms: ["RS256"],
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error("Failed to verify refresh token:", error);
      return null;
    }
  }

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

  /**
   * Log audit events for user actions.
   * @param userId - ID of the user who performed the action
   * @param action - The action type (e.g., "LOGIN", "ACCESS_SERVICE")
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
