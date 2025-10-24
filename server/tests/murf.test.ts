// tests/murf.test.ts
import WebSocket from "ws";
import { generateAndSendTTS } from "../src/murf";
import { config } from "../src/utils/config";

config.murfApiKey = process.env.MURF_API_KEY || "your-api-key";

const TEST_PORT = 8083;

const server = new WebSocket.Server({ port: TEST_PORT }, () => {
  console.log(`🧪 Test WebSocket server running at ws://localhost:${TEST_PORT}`);
});

server.on("connection", async (clientSocket) => {
  console.log("✅ Client connected for Murf HTTP test");

  clientSocket.on("message", (msg) => {
    console.log("📩 Received message from client:", msg.toString());
  });

  await generateAndSendTTS(clientSocket, "Testing HTTP based TTS from Murf", "en-US", "correction");

  setTimeout(() => {
    clientSocket.close();
    server.close(() => console.log("🧹 Test server closed"));
  }, 5000);
});

// Connect automatically
setTimeout(() => {
  const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
  client.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.audioUrl) {
      console.log("🎧 Received audio URL:", msg.audioUrl);
    } else {
      console.log("❌ No audio URL:", msg);
    }
  });
}, 500);
