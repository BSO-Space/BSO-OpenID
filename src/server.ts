import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { envConfig } from "./config/env.config";
import { ServicesService } from "./services/service.service";
import app from "./app";
import { randomUUID } from "crypto";
const server = http.createServer(app);
const servicesService = new ServicesService();
import { faker } from "@faker-js/faker";

// เก็บ WebSocket clients ใน memory
export let webSocketClients: Map<
  string,
  { serviceId: string; serviceName: string; ws: WebSocket }
> = new Map();
export let servicesCache: Map<string, Set<string>> = new Map(); // เก็บ UUID ของ client ที่เชื่อมต่อกับแต่ละ service

// สร้าง WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  let client = {
    service: "",
    serviceId: "",
    uuid: "",
    name: "",
  };

  const randomName = faker.person.firstName();
  const clientUUID = randomUUID();

  // // Handle message from client to register ID and token
  // ws.on("message", async (message: string) => {
  //   try {
  //     const data = JSON.parse(message);

  //     // Asynchronous call to find service by token
  //     const existingService = await servicesService.findByToken(data.token);

  //     if (existingService) {
  //       client = {
  //         serviceId: existingService.id,
  //         service: existingService.name,
  //         uuid: clientUUID,
  //         name: randomName,
  //       };

  //       // เก็บ WebSocket client ใน memory โดยใช้ clientUUID เป็น key
  //       webSocketClients.set(clientUUID, {
  //         serviceId: client.serviceId,
  //         serviceName: client.service,
  //         ws,
  //       });

  //       // เก็บ UUID ของ client ใน servicesCache โดยเชื่อมโยงกับ serviceId
  //       if (!servicesCache.has(client.serviceId)) {
  //         servicesCache.set(client.serviceId, new Set());
  //       }
  //       servicesCache.get(client.serviceId)?.add(clientUUID);

  //       console.log(
  //         `[INFO] ${existingService.name} service connected with ${client.name}. 🌈🎉`
  //       );

  //       // ส่งข้อความยืนยันการเชื่อมต่อ
  //       ws.send(`Hello World, ${existingService.name}. 🎉👋`);
  //     } else {
  //       const responseMessage = {
  //         message: "Service not found with the provided token",
  //       };
  //       ws.send(JSON.stringify(responseMessage));
  //     }
  //   } catch (error) {
  //     console.error("Error parsing client message", error);
  //     const responseMessage = {
  //       message: "Error processing your request",
  //     };
  //     ws.send(JSON.stringify(responseMessage));
  //   }
  // });

  // Handle WebSocket disconnection
  ws.on("close", async () => {
    if (client.uuid) {
      // ลบข้อมูล client จาก webSocketClients
      webSocketClients.delete(client.uuid);

      // ลบ UUID ของ client จาก servicesCache
      if (servicesCache.has(client.serviceId)) {
        const serviceClients = servicesCache.get(client.serviceId);
        serviceClients?.delete(client.uuid);
      }

      console.log(
        `[INFO] ${client.name} with ${client.service} disconnected.💔`
      );
    }
  });

  // Optionally handle WebSocket errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Start the server
server.listen(envConfig.APP_PORT, () => {
  console.log(
    `[INFO] BSO Space OpenID server running on http://localhost:${envConfig.APP_PORT}`
  );
});
