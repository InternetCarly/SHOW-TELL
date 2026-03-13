const { WebSocketServer } = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.join(__dirname);

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Simple static file server (serves index.html + send.html etc.)
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Default to index.html for the root
  if (pathname === "/") pathname = "/index.html";

  // Prevent directory traversal: normalize and require it stays in PUBLIC_DIR
  const filePath = path.join(PUBLIC_DIR, path.normalize(pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(400).end("Bad request");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found\n");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

// Attach WebSocket server to the HTTP server
const wss = new WebSocketServer({ server });

// Track clients by room and role
// Each room has: { displays: Set, senders: Set, images: [] }
const rooms = {};

function getRoom(name) {
  if (!rooms[name]) rooms[name] = { displays: new Set(), senders: new Set(), images: [] };
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
    // Send current images to new display
    if (r.images.length > 0) {
      const imagesData = JSON.stringify(r.images);
      ws.send(imagesData);
    }
  } else {
    r.senders.add(ws);
  }

  console.log(`[${room}] ${role} connected (${r.displays.size} displays, ${r.senders.size} senders)`);

  ws.on("message", (data) => {
    // Store image and broadcast all images from senders to all displays in the same room
    const msg = data.toString();
    r.images.push(msg);
    if (r.images.length > 50) {
      r.images.shift(); // remove oldest
    }
    console.log(`[${room}] stored image (${(msg.length / 1024).toFixed(1)} KB), total: ${r.images.length}`);
    const imagesData = JSON.stringify(r.images);
    for (const display of r.displays) {
      if (display.readyState === 1) display.send(imagesData);
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
  console.log(`✅ Serving static files from ${PUBLIC_DIR}`);
});
