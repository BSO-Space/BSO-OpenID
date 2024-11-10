import { PrismaClient, User } from "@prisma/client";
import { ServicesService } from "../services/service.service";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const prisma = new PrismaClient();

export class HookService {
  private servicesService: ServicesService;

  constructor(servicesService: ServicesService) {
    this.servicesService = servicesService;
  }

  private async logHook(
    serviceId: string,
    url: string,
    status: string,
    statusCode: number,
    requestBody: any,
    responseBody?: any,
    errorMessage?: string
  ) {
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

  // ฟังก์ชันสร้าง signature โดยใช้ HMAC-SHA256
  private generateSignature(payload: string, hookSecret: string): string {
    return crypto
      .createHmac("sha256", hookSecret)
      .update(payload)
      .digest("hex");
  }

  public async sendLoginNotification(
    user: User,
    serviceName: string,
    ip: string,
    userAgent: string
  ): Promise<boolean> {
    try {
      const service = await this.servicesService.findByNames(serviceName);
      if (!service) {
        throw new Error("Service not found.");
      }

      const { hookSecret, microServicesUrl } = service;
      const timestamp = new Date().toISOString();

      // สร้าง JWT token พร้อม timestamp
      const token = jwt.sign(
        {
          userId: user.id,
          service: serviceName,
          ip,
          userAgent,
          timestamp,
        },
        hookSecret,
        { expiresIn: "5m" }
      );

      const payload = JSON.stringify({
        event: "user.login",
        user,
        service: serviceName,
        ip,
        userAgent,
        timestamp,
      });

      // สร้าง signature ของ payload
      const signature = this.generateSignature(payload, hookSecret);

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

          const status = response.ok ? "success" : "failed";
          const statusCode = response.status;

          // บันทึก log ของการส่ง hook
          await this.logHook(service.id, url, status, statusCode, {
            user,
            service: serviceName,
            ip,
            userAgent,
            timestamp,
          });

          if (!response.ok) {
            console.error(
              `Failed to send notification to ${url}: HTTP status ${statusCode}`
            );
            return false;
          } else {
            console.log(`Login notification sent successfully to ${url}`);
            return true;
          }
        } catch (error) {
          // บันทึก log ในกรณีเกิดข้อผิดพลาด
          await this.logHook(
            service.id,
            url,
            "failed",
            500,
            { userId: user.id, serviceName, ip, userAgent, timestamp },
            null,
            error instanceof Error ? error.message : String(error)
          );

          console.error(`Failed to send notification to ${url}:`, error);
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to send login notification:", error);
      return false;
    }
  }
}
