import { PrismaClient, User } from "@prisma/client";
import { ServicesService } from "../services/service.service";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { WebSocket } from "ws";
import { webSocketClients } from "../server";

const prisma = new PrismaClient();

/**
 * The HookService class.
 * Contains methods for sending login notifications to services.
 * @class - HookService
 * @exports - HookService
 * @constructor - Creates a new HookService object.
 * @param servicesService - The ServicesService object.
 * @method logHook - Logs the hook request to the database.
 * @method generateSignature - Generates a signature using the payload and hook secret.
 * @method sendLoginNotification - Sends a login notification to services.
 *
 */
export class HookService {
  private servicesService: ServicesService;

  constructor(servicesService: ServicesService) {
    this.servicesService = servicesService;
  }

  /**
   * Logs the hook request to the database.
   * @param serviceId - The ID of the service.
   * @param url - The URL of the service.
   * @param status  - The status of the request.
   * @param statusCode - The status code of the request.
   * @param requestBody - The request body.
   * @param responseBody - The response body.
   * @param errorMessage - The error message.
   */

  private async logHook(
    serviceId: string,
    url: string,
    status: string,
    statusCode: number,
    requestBody: any,
    responseBody?: any,
    errorMessage?: string
  ) {
    // Log the hook request to the database
    await prisma.hookLog.create({
      data: {
        serviceId,
        url,
        status,
        statusCode,
        requestBody,
        responseBody,
        errorMessage,
      },
    });
  }

  /**
   * Generates a signature using the payload and hook secret.
   * @param payload - The payload to sign.
   * @param hookSecret - The hook secret to use for signing.
   * @returns The generated signature.
   * @throws {Error} - If an error occurs while generating the signature.
   */

  private generateSignature(payload: string, hookSecret: string): string {
    return crypto
      .createHmac("sha256", hookSecret)
      .update(payload)
      .digest("hex");
  }

  /**
   *  Sends a login notification to services.
   * @param user - The user object.
   * @param serviceName - The name of the service.
   * @param ip - The IP address of the user.
   * @param userAgent - The user agent of the user.
   * @returns A boolean indicating whether the notification was sent successfully.
   */

  public async sendLoginNotification(
    user: User,
    serviceName: string,
    ip: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      // Find service by name
      const service = await this.servicesService.findByNames(serviceName);

      // If service not found, throw an error
      if (!service) {
        throw new Error("Service not found.");
      }

      // Generate JWT token with user ID, service name, IP, user agent, and timestamp
      const { hookSecret, microServicesUrl } = service;

      // Generate JWT token with user ID, service name, IP, user agent, and timestamp
      const token = jwt.sign(
        {
          userId: user.id,
          service: serviceName,
          ip,
          userAgent,
        },
        hookSecret,
        { expiresIn: "5m" }
      );

      // Create payload with event, user, service, IP, user agent, and timestamp
      const payload = JSON.stringify({
        event: "user.login",
        user,
        service: serviceName,
        ip,
        userAgent,
      });

      // Generate signature using payload and hookSecret
      const signature = this.generateSignature(payload, hookSecret);

      // Get WebSocket client from memory using clientId
      const clientId = service.id;
      const client = webSocketClients.get(clientId);

      // If client is found, send login notification to WebSocket client
      if (client) {
        // Send login notification to WebSocket client
        if (
          client &&
          client.readyState === WebSocket.OPEN &&
          service.id === clientId
        ) {
          // Send login notification to WebSocket client
          client.send(JSON.stringify({ payload, signature, token }));
          console.log(
            `[INFO] Sent login notification to client with ${service.name} 🚀`
          );

          // Log the WebSocket request
          await this.logHook(service.id, "WebSocket", "success", 200, {
            user,
            service: serviceName,
            ip,
            userAgent,
          });
        } else {
          // Log the error
          console.log(
            `[ERROR] Client with ID: ${clientId} is not connected or WebSocket is closed.`
          );

          await this.logHook(
            service.id,
            "WebSocket",
            "failed",
            500,
            {
              user,
              service: serviceName,
              ip,
              userAgent,
            },
            null,
            "Client is not connected or WebSocket is closed."
          );

          return false;
        }
      }

      // Send login notification to microservices
      for (const url of microServicesUrl) {
        try {
          const response = await fetch(`${url}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-hook-token": token,
              "x-hook-signature": signature,
            },
            body: payload,
          });

          // Log the response status
          const status = response.ok ? "success" : "failed";
          const statusCode = response.status;

          // Log the hook request
          await this.logHook(service.id, url, status, statusCode, {
            user,
            service: serviceName,
            ip,
            userAgent,
          });

          // If response is not OK, log an error
          if (!response.ok) {
            console.error(
              `Failed to send notification to ${url}: HTTP status ${statusCode}`
            );
            return false;
          } else {
            console.log(`Login notification sent successfully to ${url}`);
          }
        } catch (error) {
          await this.logHook(
            service.id,
            url,
            "failed",
            500,
            { userId: user.id, serviceName, ip, userAgent },
            null,
            error instanceof Error ? error.message : String(error)
          );

          console.error(`Failed to send notification to ${url}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to send login notification:", error);
      return false;
    }
  }
}
