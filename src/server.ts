import { WebSocketServer, WebSocket } from "ws";
import express from "express";
import http from "http";
import { envConfig } from "./config/env.config";
import { ServicesService } from "./services/service.service";
import axios from "axios";
import app from "./app";

const server = http.createServer(app);
const servicesService = new ServicesService();

const payload = {
  event: "user.login",
  user: {
    id: "user123",
    username: "exampleUser",
    firstName: "John",
    lastName: "Doe",
    email: "example@example.com",
    image: "https://example.com/avatar.jpg",
    createdAt: "2024-01-01T12:00:00Z",
    updatedAt: "2024-01-02T15:30:00Z",
  },
  service: "ExampleService",
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  timestamp: "2024-11-10T12:34:56Z",
};

// Create a WebSocket server
const wss = new WebSocketServer({ server });

// Map to store WebSocket clients by ID and their corresponding service name
const clientsMap: Map<string, WebSocket> = new Map<string, WebSocket>(); // clientId -> WebSocket

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  let clientId: string | null = null;

  // Handle message from client to register ID and token
  ws.on("message", async (message: string) => {
    try {
      // Parse the message from the client
      const data = JSON.parse(message);

      // Asynchronous call to find service by token
      const existingService = await servicesService.findByToken(data.token);

      if (existingService) {
        // Use existingService.id as clientId
        clientId = existingService.id;
        if (clientId) {
          clientsMap.set(clientId, ws); // Store clientId with WebSocket instance
        }

        console.log(`${existingService.name} service connected.`);

        // Send Hello World message with the service name
        ws.send(`Hello World, ${existingService.name} 🎉👋`);

        // Send message to connected CLI clients (based on clientId)
        const client = clientsMap.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
          // Log the data being sent to CLI
          console.log(
            `Sending payload to CLI for client ID: ${clientId}, Service Name: ${existingService.name}`
          );
          client.send(JSON.stringify(payload));
        }
      } else {
        // If the token is invalid, send a response saying token is invalid
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
  ws.on("close", () => {
    if (clientId) {
      clientsMap.delete(clientId); // Remove client from map when disconnected
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
