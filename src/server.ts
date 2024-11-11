import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { envConfig } from "./config/env.config";
import { ServicesService } from "./services/service.service";
import app from "./app";

const server = http.createServer(app);
const servicesService = new ServicesService();

// เก็บ WebSocket clients ใน memory
export let webSocketClients: Map<string, WebSocket> = new Map();

// สร้าง WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  let clientId: string | null = null;

  // Handle message from client to register ID and token
  ws.on("message", async (message: string) => {
    try {
      const data = JSON.parse(message);

      // Asynchronous call to find service by token
      const existingService = await servicesService.findByToken(data.token);

      if (existingService) {
        clientId = existingService.id;

        // Save WebSocket client in memory and Redis (only client data)
        if (clientId) {
          webSocketClients.set(clientId, ws);
          console.log(`${existingService.name} service connected🌈🎉`);
        }

        // Send Hello World message with the service name
        ws.send(`Hello World, ${existingService.name} 🎉👋`);
      } else {
        const responseMessage = {
          message: "Token not valid",
        };
        ws.send(JSON.stringify(responseMessage));
      }
    } catch (error) {
      console.error("Error parsing client message", error);
    }
  });

  // Handle WebSocket disconnection
  ws.on("close", async () => {
    if (clientId) {
      webSocketClients.delete(clientId);
      console.log(`Client with ID ${clientId} disconnected.`);
    }
  });
});

// Start the server
server.listen(envConfig.APP_PORT, () => {
  console.log(
    `Production server running on http://localhost:${envConfig.APP_PORT}`
  );
});
