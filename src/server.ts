import { WebSocketServer } from "ws";
import express from "express";
import http from "http";
import app from "./app";
const PORT = process.env.PORT || 3005;
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// Handle POST requests to /webhook
app.post("/webhook", express.json(), (req, res) => {
  const payload = JSON.stringify(req.body);

  // Broadcast the payload to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });

  res.sendStatus(200);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Production server running on http://localhost:${PORT}`);
});
