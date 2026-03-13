const { WebSocketServer } = require("ws");
const http = require("http");

const PORT = process.env.PORT || 8080;

// Create an HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>WebSocket Server</title></head>
    <body>
      <h1>WebSocket server is running</h1>
      <p>Ready for connections on port ${PORT}</p>
    </body>
    </html>
  `);
});

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

// Track clients by room and role
// Each room has: { displays: Set, senders: Set }
const rooms = {};

function getRoom(name) {
  if (!rooms[name]) rooms[name] = { displays: new Set(), senders: new Set() };
  return rooms[name];
}

wss.on("connection", (ws, req) => {
  console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const room = url.searchParams.get("room") || "default";
  const role = url.searchParams.get("role") || "sender";

  const r = getRoom(room);
  if (role === "display") {
    r.displays.add(ws);
  } else {
    r.senders.add(ws);
  }

  console.log(`[${room}] ${role} connected (${r.displays.size} displays, ${r.senders.size} senders)`);

  ws.on("message", (data) => {
    // Broadcast image data from senders to all displays in the same room
    const msg = data.toString();
    console.log(`[${room}] relaying image (${(msg.length / 1024).toFixed(1)} KB)`);
    for (const display of r.displays) {
      if (display.readyState === 1) display.send(msg);
    }
  });

  ws.on("close", () => {
    r.displays.delete(ws);
    r.senders.delete(ws);
    console.log(`[${room}] ${role} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Relay server running on http://localhost:${PORT} (WebSocket ready)`);
});
